import { AudioAdaptationData, AudioQuality, BufferType, HttpRequest, HttpRequestType, HttpResponse, HttpResponseBody, MediaType, PlayerAPI, PlayerEvent, VideoAdaptationData, VideoQuality } from 'bitmovin-player';
import type {
  CmcdBase,
} from './Cmcd';
import {
  CmcdBufferLength,
  CmcdBufferStarvation,
  CmcdContentId,
  cmcdDataToHeader,
  cmcdDataToUrlParameter,
  CmcdDeadline,
  CmcdEncodedBitrate,
  CmcdMeasuredThroughput,
  CmcdNextObjectRequest,
  CmcdNextRangeRequest,
  CmcdObjectDuration,
  CmcdObjectType,
  CmcdObjectTypeToken,
  CmcdPlaybackRate,
  CmcdRequestedMaximumThroughput,
  CmcdSessionId,
  CmcdStartup,
  CmcdStreamingFormat,
  CmcdStreamingFormatToken,
  CmcdStreamType,
  CmcdStreamTypeToken,
  CmcdTopBitrate,
  CmcdVersion,
  CmcdVersionNumbers,
} from './Cmcd';

export interface CmcdConfig {
  sessionId: string;
  contentId: string;
  useQueryArgs?: boolean;
}

export class CmcdPlugin {
  private sessionId: string;
  private contentId: string;
  private useQueryArgs: boolean;
  private player?: PlayerAPI;
  private stalledSinceLastRequest: boolean;
  private currentVideoQuality: VideoQuality | null;
  private currentAudioQuality: AudioQuality | null;
  private isSeekingOrTimeshiftingOrStartup: boolean;
  private lastMeasuredThroughputAudio: number;
  private lastMeasuredThroughputVideo: number;

  constructor(config: CmcdConfig) {
    this.useQueryArgs = config.useQueryArgs || false;
    this.sessionId = config.sessionId;
    this.contentId = config.contentId;
    this.stalledSinceLastRequest = false;
    this.currentVideoQuality = null;
    this.currentAudioQuality = null;
    this.isSeekingOrTimeshiftingOrStartup = true;
    this.lastMeasuredThroughputAudio = 0;
    this.lastMeasuredThroughputVideo = 0;
  }

  public setPlayer(player: PlayerAPI) {
    this.player = player;
    this.player.on(PlayerEvent.StallStarted, () => {
      this.stalledSinceLastRequest = true
      this.isSeekingOrTimeshiftingOrStartup = true;
    });
    this.player.on(PlayerEvent.StallEnded, () => this.isSeekingOrTimeshiftingOrStartup = false);
    this.player.on(PlayerEvent.Seek, () => this.isSeekingOrTimeshiftingOrStartup = true);
    this.player.on(PlayerEvent.Seeked, () => this.isSeekingOrTimeshiftingOrStartup = false);
    this.player.on(PlayerEvent.TimeShift, () => this.isSeekingOrTimeshiftingOrStartup = true);
    this.player.on(PlayerEvent.TimeShifted, () => this.isSeekingOrTimeshiftingOrStartup = false);
  }

  public onVideoAdaptation = (data: VideoAdaptationData) => {
    this.currentVideoQuality = data.representations.filter(rep => rep.id === data.suggested)[0];
    return data.suggested;
  }

  public onAudioAdaptation = (data: AudioAdaptationData) => {
    this.currentAudioQuality = data.representations.filter(rep => rep.id === data.suggested)[0].bandwidth / 1000;
    return data.suggested;
  }

  public preprocessHttpRequest = (type: HttpRequestType, request: HttpRequest) => {
    const data = this.gatherCmcdData(type);

    if (this.useQueryArgs) {
      const cmcdStr = cmcdDataToUrlParameter(data);
      const separator = request.url.includes('?') ? '&' : '?';
      request.url = `${request.url}${separator}${cmcdStr}`;
    } else {
      const cmcdHeaders = cmcdDataToHeader(data);

      request.headers = {
        ...request.headers,
        ...cmcdHeaders,
      }
    }

    return Promise.resolve(request);
  }

  public preprocessHttpResponse = (type: HttpRequestType, response: HttpResponse<HttpResponseBody>) => {
    const time = response.elapsedTime;
    const bytes = response.length;

    if (!time || ! bytes) {
      return Promise.resolve(response);
    }

    const kbps = bytes / time / 1000;

    if (type === HttpRequestType.MEDIA_AUDIO) {
      this.lastMeasuredThroughputAudio = Math.round(kbps * 100) / 100;
    }
    if (type === HttpRequestType.MEDIA_VIDEO) {
      this.lastMeasuredThroughputVideo = Math.round(kbps * 100) / 100;
    }
    return Promise.resolve(response);
  }

  private gatherCmcdData(type: HttpRequestType): CmcdBase[] {
    if (!this.player) {
      throw new Error('Bitmovin Player not provided!');
    }

    let data: CmcdBase[] = [];
    data.push(new CmcdVersion(CmcdVersionNumbers.v1));
    data.push(new CmcdStreamType(this.player.isLive() ? CmcdStreamTypeToken.Live : CmcdStreamTypeToken.Vod));
    data.push(new CmcdPlaybackRate(this.player.getPlaybackSpeed()));
    data.push(this.getObjectType(type));
    data.push(this.getStreamingType());

    if (this.contentId) {
      data.push(new CmcdContentId(this.contentId));
    }

    if (this.sessionId) {
      data.push(new CmcdSessionId(this.sessionId));
    }

    if (this.isSeekingOrTimeshiftingOrStartup) {
      data.push(new CmcdStartup(true));
    }

    if (this.stalledSinceLastRequest || this.player.isStalled()) {
      data.push(new CmcdBufferStarvation(true));
      this.stalledSinceLastRequest = false;
    }

    if (type === HttpRequestType.MEDIA_AUDIO) {
      data = data.concat(this.getAudioSegmentRequestSpecificData());
    } else if (type === HttpRequestType.MEDIA_VIDEO) {
      data = data.concat(this.getVideoSegmentRequestSpecificData());
    }

    return data;
  }

  private getStreamingType() {
    if (this.player?.manifest?.dash) {
      return new CmcdStreamingFormat(CmcdStreamingFormatToken.MpegDash);
    } else if (this.player?.manifest?.hls) {
      return new CmcdStreamingFormat(CmcdStreamingFormatToken.Hls);
    } else {
      return new CmcdStreamingFormat(CmcdStreamingFormatToken.Other);
    }
  }

  private getObjectType(type: HttpRequestType) {
    let data;

    switch (type) {
      case HttpRequestType.MEDIA_AUDIO:
        data = new CmcdObjectType(CmcdObjectTypeToken.AudioOnly);
        break;
      case HttpRequestType.MEDIA_VIDEO:
        data = new CmcdObjectType(CmcdObjectTypeToken.VideoOnly);
        break;
      case HttpRequestType.DRM_CERTIFICATE_FAIRPLAY:
      case HttpRequestType.DRM_LICENSE_CLEARKEY:
      case HttpRequestType.DRM_LICENSE_FAIRPLAY:
      case HttpRequestType.DRM_LICENSE_PLAYREADY:
      case HttpRequestType.DRM_LICENSE_WIDEVINE:
      case HttpRequestType.KEY_HLS_AES:
        data = new CmcdObjectType(CmcdObjectTypeToken.CryptographicKeyOrLicenseOrCertificate);
        break;
      case HttpRequestType.MANIFEST_ADS:
      case HttpRequestType.MANIFEST_DASH:
      case HttpRequestType.MANIFEST_HLS_MASTER:
      case HttpRequestType.MANIFEST_HLS_VARIANT:
      case HttpRequestType.MANIFEST_SMOOTH:
        data = new CmcdObjectType(CmcdObjectTypeToken.ManifestOrPlaylistTextFile);
        break;
      case HttpRequestType.MEDIA_SEGMENTINDEX:
        data = new CmcdObjectType(CmcdObjectTypeToken.InitSegment);
        break;
      case HttpRequestType.MEDIA_SUBTITLES:
        data = new CmcdObjectType(CmcdObjectTypeToken.CaptionOrSubtitle);
        break;
      default:
        data = new CmcdObjectType(CmcdObjectTypeToken.Other);
        break;
    }

    return data;
  }

  private getAudioSegmentRequestSpecificData() {
    const data = [];

    if (this.currentAudioQuality && this.currentAudioQuality.bitrate) {
      data.push(new CmcdEncodedBitrate(Math.round(this.currentAudioQuality.bitrate / 1000)));
    }

    if (this.lastMeasuredThroughputAudio) {
      data.push(new CmcdMeasuredThroughput(this.lastMeasuredThroughputAudio));
    }

    if (!this.player) {
      return data;
    }

    const audioBuffer = this.player.buffer.getLevel(BufferType.ForwardDuration, MediaType.Audio);
    if (audioBuffer.targetLevel > 0) {
      data.push(new CmcdBufferLength(audioBuffer.level * 1000));

      const deadline = audioBuffer.level / this.player?.getPlaybackSpeed();
      data.push(new CmcdDeadline(deadline * 1000));
    }

    const audioTopBitrate = this.player.getAvailableAudioQualities().reduce((prev, current) => {
      return Math.max(prev, current.bitrate);
    }, 0) / 1000;
    if (audioTopBitrate > 0) {
      data.push(new CmcdTopBitrate(audioTopBitrate));
    }

    return data;
  }

  private getVideoSegmentRequestSpecificData() {
    const data = [];

    if (this.currentVideoQuality && this.currentVideoQuality?.bitrate) {
      data.push(new CmcdEncodedBitrate(Math.round(this.currentVideoQuality.bitrate / 1000)));
    }

    if (this.lastMeasuredThroughputVideo) {
      data.push(new CmcdMeasuredThroughput(this.lastMeasuredThroughputVideo));
    }

    if (!this.player) {
      return data;
    }

    const videoBuffer = this.player.buffer.getLevel(BufferType.ForwardDuration, MediaType.Video);
    if (videoBuffer.targetLevel > 0) {
      data.push(new CmcdBufferLength(videoBuffer.level * 1000));

      const deadline = videoBuffer.level / this.player?.getPlaybackSpeed();
      data.push(new CmcdDeadline(deadline * 1000));
    }

    const videoTopBitrate = this.player.getAvailableVideoQualities().reduce((prev, current) => {
      return Math.max(prev, current.bitrate);
    }, 0) / 1000;
    if (videoTopBitrate > 0) {
      data.push(new CmcdTopBitrate(videoTopBitrate));
    }

    return data
  }
}
