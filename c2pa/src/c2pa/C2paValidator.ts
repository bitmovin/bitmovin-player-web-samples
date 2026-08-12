import {
  type InitSegmentValidation,
  type MerkleSegmentState,
  type SequenceState,
  type SequenceValidationResult,
  type C2paManifest,
  validateC2paInitSegment,
  validateC2paMerkleSegment,
  validateC2paSegment,
} from '@svta/cml-c2pa';
import {
  HttpRequestType,
  type HttpResponse,
  type HttpResponseBody,
  type SegmentPlaybackEvent,
  type SegmentRequestFinishedEvent,
} from 'bitmovin-player';

export type C2paValidationMode = 'Live VSI' | 'VOD Merkle' | 'Init only';

export type C2paPlaybackState = {
  manifest: C2paManifest | null;
  isValid: boolean;
  errorCodes: readonly string[];
  mode: C2paValidationMode;
  sequenceNumber?: number;
  sequenceResult?: SequenceValidationResult;
};

type TrackState = {
  initValidation?: InitSegmentValidation;
  noC2pa?: boolean;
  merkleState?: MerkleSegmentState;
  sequenceState?: SequenceState;
};

export class C2paValidator {
  private initSegmentMap: Map<string, Uint8Array> = new Map();
  private dataSegmentMap: Map<string, Uint8Array> = new Map();
  private resultMap: Map<string, C2paPlaybackState> = new Map();
  private trackStateMap: Map<string, TrackState> = new Map();
  private readonly onC2paStateChange?: (state: C2paPlaybackState | undefined) => void;

  constructor(onC2paStateChange?: (state: C2paPlaybackState | undefined) => void) {
    this.onC2paStateChange = onC2paStateChange;
  }

  preprocessHttpResponse: <T extends HttpResponseBody>(
    type: HttpRequestType,
    response: HttpResponse<T>,
  ) => Promise<HttpResponse<T>> = async (type, response) => {
    if (type === HttpRequestType.MEDIA_VIDEO || type === HttpRequestType.MEDIA_AUDIO) {
      if (!response.body || !(response.body instanceof ArrayBuffer)) {
        return response;
      }

      this.dataSegmentMap.set(response.url, new Uint8Array(response.body.slice(0)));
    }

    return response;
  };

  public async onSegmentRequestFinished(event: SegmentRequestFinishedEvent) {
    const existingSegment = this.dataSegmentMap.get(event.url);
    if (existingSegment && event.isInit) {
      this.initSegmentMap.set(event.mimeType, existingSegment);
      this.dataSegmentMap.delete(event.url);
    }
  }

  public async onSegmentPlayback(event: SegmentPlaybackEvent) {
    try {
      // Note, for SSAI stream, the same segment URL may lead to different data, so this wouldn't work. To distinguish this case from a normal seek case, either more distinguishing info from the segments are needed, or we need to synchronize this with the normal segments lifecycle
      const existingResult = this.resultMap.get(event.url);
      if (existingResult) {
        this.onC2paStateChange?.(existingResult);
        console.log(`Reusing existing validation result:`, existingResult);
        return;
      }

      const trackState = await this.getTrackState(event.mimeType);
      if (!trackState || trackState.noC2pa || !trackState.initValidation) {
        return;
      }

      const segmentBytes = this.dataSegmentMap.get(event.url);
      if (!segmentBytes) {
        console.warn(`Missing data segment for playback event of ${event.url}`);
        return;
      }

      const state = await this.validateSegment(segmentBytes, trackState);
      if (!state) {
        // Segment carries no C2PA data
        return;
      }

      this.resultMap.set(event.url, state);

      // Clear the data segment after processing to save memory. Only keep the validation result
      this.dataSegmentMap.delete(event.url);

      this.onC2paStateChange?.(state);

      console.log(`Validated C2PA segment:`, state);
    } catch (error) {
      console.error('C2PA validation failed:', error);

      this.onC2paStateChange?.(undefined);
    }
  }

  private async getTrackState(mimeType: string): Promise<TrackState | undefined> {
    const existingState = this.trackStateMap.get(mimeType);
    if (existingState) {
      return existingState;
    }

    const initSegment = this.initSegmentMap.get(mimeType);
    if (!initSegment) {
      console.warn(`Missing init segment for ${mimeType}`);
      return undefined;
    }

    const trackState: TrackState = {};
    try {
      trackState.initValidation = await validateC2paInitSegment(initSegment);
      console.log(`C2PA init segment validation for ${mimeType}:`, trackState.initValidation);
    } catch (error) {
      // validateC2paInitSegment throws when the init segment contains no C2PA box
      console.log(`No C2PA data found in init segment for ${mimeType}:`, error);
      trackState.noC2pa = true;
    }

    this.trackStateMap.set(mimeType, trackState);
    return trackState;
  }

  private async validateSegment(
    segmentBytes: Uint8Array,
    trackState: TrackState,
  ): Promise<C2paPlaybackState | null> {
    const initValidation = trackState.initValidation!;

    if (initValidation.merkleMaps.length > 0) {
      // VOD Merkle mode (C2PA §15.12.2)
      const { result, nextState } = await validateC2paMerkleSegment(
        segmentBytes,
        initValidation.merkleMaps,
        trackState.merkleState,
      );
      trackState.merkleState = nextState;

      return {
        manifest: initValidation.manifest,
        isValid: initValidation.isValid && result.isValid,
        errorCodes: [...initValidation.errorCodes, ...result.errorCodes],
        mode: 'VOD Merkle',
      };
    }

    if (initValidation.sessionKeys.length > 0) {
      // Live VSI/EMSG mode (C2PA §19.4)
      const validation = await validateC2paSegment(
        segmentBytes,
        initValidation.sessionKeys,
        trackState.sequenceState,
      );
      if (!validation) {
        return null;
      }
      trackState.sequenceState = validation.nextSequenceState;

      return {
        manifest: initValidation.manifest,
        isValid: initValidation.isValid && validation.result.isValid,
        errorCodes: [...initValidation.errorCodes, ...validation.result.errorCodes],
        mode: 'Live VSI',
        sequenceNumber: validation.result.sequenceNumber,
        sequenceResult: validation.result.sequenceResult,
      };
    }

    // The init segment carries a C2PA manifest, but no segment-level validation
    // method supported by @svta/cml-c2pa applies (e.g. legacy c2pa.hash.bmff.v2
    // assets). Surface the init segment validation result instead.
    return {
      manifest: initValidation.manifest,
      isValid: initValidation.isValid,
      errorCodes: initValidation.errorCodes,
      mode: 'Init only',
    };
  }

  /**
   * Clears segment continuity state. Must be called after a seek, as sequence
   * numbers and merkle locations are no longer contiguous.
   */
  public resetSequenceState() {
    for (const trackState of this.trackStateMap.values()) {
      trackState.merkleState = undefined;
      trackState.sequenceState = undefined;
    }
  }

  public reset() {
    this.initSegmentMap.clear();
    this.dataSegmentMap.clear();
    this.resultMap.clear();
    this.trackStateMap.clear();
  }
}
