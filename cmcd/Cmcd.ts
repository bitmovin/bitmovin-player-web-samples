/**
 * Enums, keys, classes for CMCD v1.0 support according to
 * https://cdn.cta.tech/cta/media/media/resources/standards/pdfs/cta-5004-final.pdf
 *
 * Limitation: JSON is not supported, only HTTP Headers and Query Args.
 */

export enum CmcdObjectTypeToken {
  AudioOnly = 'a',
  VideoOnly = 'v',
  MuxedVideoAudio = 'av',
  ManifestOrPlaylistTextFile = 'm',
  InitSegment = 'i',
  CaptionOrSubtitle = 'c',
  TimedTextTrack = 'tt',
  CryptographicKeyOrLicenseOrCertificate = 'k',
  Other = 'o',
}

export enum CmcdStreamingFormatToken {
  MpegDash = 'd',
  Hls = 'h',
  Smooth = 's',
  Other = 'o',
}

export enum CmcdStreamTypeToken {
  Vod = 'v',
  Live = 'l',
}

export interface CmcdHeaders {
  [CmcdHeaderType.Request]?: string;
  [CmcdHeaderType.Object]?: string;
  [CmcdHeaderType.Session]?: string;
  [CmcdHeaderType.Status]?: string;
}

export enum CmcdVersionNumbers {
  v1 = 1,
}

/**
 * Enum containing all CMCD keys as defined in
 * https://cdn.cta.tech/cta/media/media/resources/standards/pdfs/cta-5004-final.pdf
 */
enum CmcdKeysToken {
  EncodedBitrate = 'br',
  BufferLength = 'bl',
  BufferStarvation = 'bs',
  ContentId = 'cid',
  ObjectDuration = 'd',
  Deadline = 'dl',
  MeasuredThroughput = 'mtp',
  NextObjectRequest = 'nor',
  NextRangeRequest = 'nrr',
  ObjectType = 'ot',
  PlaybackRate = 'pr',
  RequestedMaximumThroughput = 'rtp',
  StreamingFormat = 'sf',
  SessionId = 'sid',
  StreamType = 'st',
  Startup = 'su',
  TopBitrate = 'tb',
  CmcdVersion = 'v',
}

enum CmcdHeaderType {
  Object = 'CMCD-Object',
  Request = 'CMCD-Request',
  Status = 'CMCD-Status',
  Session = 'CMCD-Session',
}

type IntegerKbps = number;
type IntegerMilliSecs = number;

function prepareCmcdData(data: CmcdBase[]): CmcdBase[] {
  // 9. Key-value pairs SHOULD be sequenced in alphabetical order of the key name in
  // order to reduce the fingerprinting surface exposed by the player.
  const sortedData = data.sort((a: CmcdBase, b: CmcdBase) => a.key.localeCompare(b.key));

  // remove empty strings, i.e. keys that should be omitted due to their value (ex: version=1)
  return sortedData.filter(obj => obj.keyValuePairToString());
}

export function cmcdDataToHeader(data: CmcdBase[]): CmcdHeaders {
  const preparedData = prepareCmcdData(data);

  // keys whose values vary with each request.
  const requestData = preparedData
    .filter(obj => obj.type === CmcdHeaderType.Request)
    .map(obj => obj.keyValuePairToString())
    .join(',');

  // keys whose values vary with the object being requested.
  const objectData = preparedData
    .filter(obj => obj.type === CmcdHeaderType.Object)
    .map(obj => obj.keyValuePairToString())
    .join(',');

  // keys whose values do not vary with every request or object.
  const statusData = preparedData
    .filter(obj => obj.type === CmcdHeaderType.Status)
    .map(obj => obj.keyValuePairToString())
    .join(',');

  // keys whose values are expected to be invariant over the life of the session.
  const sessionData = preparedData
    .filter(obj => obj.type === CmcdHeaderType.Session)
    .map(obj => obj.keyValuePairToString())
    .join(',');

  const headers: CmcdHeaders = {};
  if (requestData) {
    headers[CmcdHeaderType.Request] = requestData;
  }
  if (objectData) {
    headers[CmcdHeaderType.Object] = objectData;
  }
  if (statusData) {
    headers[CmcdHeaderType.Status] = statusData;
  }
  if (sessionData) {
    headers[CmcdHeaderType.Session] = sessionData;
  }

  // 10. [...]  Data payloads transmitted via headers MUST NOT be URLEncoded.
  return headers;
}

export function cmcdDataToUrlParameter(data: CmcdBase[]): string {
  const preparedData = prepareCmcdData(data).map(obj => obj.keyValuePairToString());

  // 3. Successive key/value pairs MUST be delimited by a comma Unicode 0x2C.
  const cmcdString = preparedData.join(',');

  // 10. If the data payload is transmitted as a query argument, then the entire payload
  // string MUST be URLEncoded per [5].
  return `CMCD=${encodeURI(cmcdString)}`;
}

export function cmcdDataToJson(data: CmcdBase[]): string {
  console.error('CMCD JSON format not supported yet', data);
  throw new Error('ERROR: CMCD JSON format is not supported yet');
}

/*
 * CMCD keys and details are defined in
 * https://cdn.cta.tech/cta/media/media/resources/standards/pdfs/cta-5004-final.pdf
 */
export abstract class CmcdBase {
  public readonly value: unknown;
  public abstract readonly key: CmcdKeysToken;
  public abstract readonly type: CmcdHeaderType;

  constructor(value: unknown) {
    this.value = value;
  }

  /**
   * 2. The key and value MUST be separated by an equals sign Unicode 0x3D.
   *
   * @returns
   */
  keyValuePairToString(): string {
    if (typeof this.value === 'string') {
      // 7. Any value of type String MUST be enclosed by opening and closing double
      // quotes Unicode 0x22. Double quotes and backslashes MUST be escaped using a
      // backslash "\" Unicode 0x5C character. Any value of type Token does not require
      // quoting.
      return `${this.key}=${escapeCmcdString(this.value)}`;
    }
    if (typeof this.value === 'boolean') {
      // 2. If the value type is BOOLEAN and the value is TRUE, then the equals sign and the value MUST be omitted
      return this.value === true ? `${this.key}` : `${this.key}=${this.value}`;
    }
    return `${this.key}=${this.value}`;
  }
}

/**
 * The encoded bitrate of the audio or video object
 * being requested. This may not be known precisely
 * by the player; however, it MAY be estimated based
 * upon playlist/manifest declarations. If the playlist
 * declares both peak and average bitrate values, the
 * peak value should be transmitted.
 */
export class CmcdEncodedBitrate extends CmcdBase {
  public readonly key = CmcdKeysToken.EncodedBitrate;
  public readonly type = CmcdHeaderType.Object;

  constructor(value: IntegerKbps) {
    super(value);
  }
}

/**
 * The buffer length associated with the media object
 * being requested. This value MUST be rounded to
 * the nearest 100 ms. This key SHOULD only be sent
 * with an object type of ‘a’, ‘v’ or ‘av’.
 */
export class CmcdBufferLength extends CmcdBase {
  public readonly key = CmcdKeysToken.BufferLength;
  public readonly type = CmcdHeaderType.Request;

  constructor(value: IntegerMilliSecs) {
    super(value);
  }
}

/**
 * Key is included without a value if the buffer was
 * starved at some point between the prior request
 * and this object request, resulting in the player
 * being in a rebuffering state and the video or audio
 * playback being stalled. This key MUST NOT be sent
 * if the buffer was not starved since the prior
 * request.
 * If the object type ‘ot’ key is sent along with this
 * key, then the ‘bs’ key refers to the buffer
 * associated with the particular object type. If no
 * object type is communicated, then the buffer state
 * applies to the current session.
 */
export class CmcdBufferStarvation extends CmcdBase {
  public readonly key = CmcdKeysToken.BufferStarvation;
  public readonly type = CmcdHeaderType.Status;

  constructor(value: boolean) {
    super(value);
  }
}

/**
 * A unique string identifying the current content.
 * Maximum length is 64 characters. This value is
 * consistent across multiple different sessions and
 * devices and is defined and updated at the
 * discretion of the service provider.
 */
export class CmcdContentId extends CmcdBase {
  public readonly key = CmcdKeysToken.ContentId;
  public readonly type = CmcdHeaderType.Session;

  constructor(value: string) {
    super(value);
  }
}

/**
 * The playback duration in milliseconds of the object
 * being requested. If a partial segment is being
 * requested, then this value MUST indicate the
 * playback duration of that part and not that of its
 * parent segment. This value can be an
 * approximation of the estimated duration if the
 * explicit value is not known.
 */
export class CmcdObjectDuration extends CmcdBase {
  public readonly key = CmcdKeysToken.ObjectDuration;
  public readonly type = CmcdHeaderType.Object;

  constructor(value: IntegerMilliSecs) {
    super(value);
  }
}

/**
 * Deadline from the request time until the first
 * sample of this Segment/Object needs to be
 * available in order to not create a buffer underrun
 * or any other playback problems. This value MUST
 * be rounded to the nearest 100ms. For a playback
 * rate of 1, this may be equivalent to the player’s
 * remaining buffer length.
 */
export class CmcdDeadline extends CmcdBase {
  public readonly key = CmcdKeysToken.Deadline;
  public readonly type = CmcdHeaderType.Request;

  constructor(value: IntegerMilliSecs) {
    super(value);
  }
}

/**
 * The throughput between client and server, as
 * measured by the client and MUST be rounded to
 * the nearest 100 kbps. This value, however derived,
 * SHOULD be the value that the client is using to
 * make its next Adaptive Bitrate switching decision.
 * If the client is connected to multiple servers
 * concurrently, it must take care to report only the
 * throughput measured against the receiving server.
 * If the client has multiple concurrent connections to
 * the server, then the intent is that this value
 * communicates the aggregate throughput the client
 * sees across all those connections.
 */
export class CmcdMeasuredThroughput extends CmcdBase {
  public readonly key = CmcdKeysToken.MeasuredThroughput;
  public readonly type = CmcdHeaderType.Request;

  constructor(value: IntegerKbps) {
    super(value);
  }
}

/**
 * Relative path of the next object to be requested.
 * This can be used to trigger pre-fetching by the
 * CDN. This MUST be a path relative to the current
 * request. This string MUST be URLEncoded [5]. The
 * client SHOULD NOT depend upon any pre-fetch
 * action being taken - it is merely a request for such
 * a pre-fetch to take place.
 */
export class CmcdNextObjectRequest extends CmcdBase {
  public readonly key = CmcdKeysToken.NextObjectRequest;
  public readonly type = CmcdHeaderType.Request;

  constructor(value: string) {
    super(value);
  }
}

/**
 * If the next request will be a partial object request,
 * then this string denotes the byte range to be
 * requested. If the ‘nor’ field is not set, then the
 * object is assumed to match the object currently
 * being requested. The client SHOULD NOT depend
 * upon any pre-fetch action being taken – it is
 * merely a request for such a pre-fetch to take place.
 * Formatting is similar to the HTTP Range header,
 * except that the unit MUST be ‘byte’, the ‘Range:’
 * prefix is NOT required and specifying multiple
 * ranges is NOT allowed. Valid combinations are:
 * - "<range-start>-"
 * - "<range-start>-<range-end>"
 * - "-<suffix-length>"
 */
export class CmcdNextRangeRequest extends CmcdBase {
  public readonly key = CmcdKeysToken.NextRangeRequest;
  public readonly type = CmcdHeaderType.Request;

  constructor(value: string) {
    super(value);
  }
}

/**
 * The media type of the current object being
 * requested:
 * - m = text file, such as a manifest or playlist
 * - a = audio only
 * - v = video only
 * - av = muxed audio and video
 * - i = init segment
 * - c = caption or subtitle
 * - tt = ISOBMFF timed text track
 * - k = cryptographic key, license or certificate.
 * - o = other
 *
 * If the object type being requested is unknown,
 * then this key MUST NOT be used.
 */
export class CmcdObjectType extends CmcdBase {
  public readonly key = CmcdKeysToken.ObjectType;
  public readonly type = CmcdHeaderType.Object;

  constructor(value: CmcdObjectTypeToken) {
    super(value);
  }

  override keyValuePairToString() {
    // otherwise this would be handled as String, but Tokens are different in CMCD
    return `${this.key}=${this.value}`;
  }
}

/**
 * 1 if real-time, 2 if double speed, 0 if not playing.
 * SHOULD only be sent if not equal to 1.
 */
export class CmcdPlaybackRate extends CmcdBase {
  public readonly key = CmcdKeysToken.PlaybackRate;
  public readonly type = CmcdHeaderType.Session;

  constructor(value: number) {
    super(value);
  }

  override keyValuePairToString() {
    if (this.value === 1) {
      return ``;
    }
    return `${this.key}=${this.value}`;
  }
}

/**
 * The requested maximum throughput that the
 * client considers sufficient for delivery of the asset.
 * Values MUST be rounded to the nearest 100kbps.
 * For example, a client would indicate that the
 * current segment, encoded at 2Mbps, is to be
 * delivered at no more than 10Mbps, by using
 * rtp=10000.
 * Note: This can benefit clients by preventing buffer
 * saturation through over-delivery and can also
 * deliver a community benefit through fair-share
 * delivery. The concept is that each client receives
 * the throughput necessary for great performance,
 * but no more. The CDN may not support the rtp
 * feature.
 */
export class CmcdRequestedMaximumThroughput extends CmcdBase {
  public readonly key = CmcdKeysToken.RequestedMaximumThroughput;
  public readonly type = CmcdHeaderType.Status;

  constructor(value: number) {
    super(value);
  }
}

/**
 * The streaming format that defines the current
 * request.
 * - d = MPEG DASH
 * - h = HTTP Live Streaming (HLS)
 * - s = Smooth Streaming
 * - o = other
 *
 * If the streaming format being requested is
 * unknown, then this key MUST NOT be used.
 */
export class CmcdStreamingFormat extends CmcdBase {
  public readonly key = CmcdKeysToken.StreamingFormat;
  public readonly type = CmcdHeaderType.Session;

  constructor(value: CmcdStreamingFormatToken) {
    super(value);
  }

  override keyValuePairToString() {
    // otherwise this would be handled as String, but Tokens are different in CMCD
    return `${this.key}=${this.value}`;
  }
}

/**
 * A GUID identifying the current playback session. A
 * playback session typically ties together segments
 * belonging to a single media asset. Maximum length
 * is 64 characters. It is RECOMMENDED to conform
 * to the UUID specification [7].
 */
export class CmcdSessionId extends CmcdBase {
  public readonly key = CmcdKeysToken.SessionId;
  public readonly type = CmcdHeaderType.Session;

  constructor(value: string) {
    super(value);
  }
}

/**
 * - v = all segments are available – e.g., VOD
 * - l = segments become available over time – e.g.,
 * LIVE
 */
export class CmcdStreamType extends CmcdBase {
  public readonly key = CmcdKeysToken.StreamType;
  public readonly type = CmcdHeaderType.Session;

  constructor(value: CmcdStreamTypeToken) {
    super(value);
  }

  override keyValuePairToString() {
    // otherwise this would be handled as String, but Tokens are different in CMCD
    return `${this.key}=${this.value}`;
  }
}

/**
 * Key is included without a value if the object is
 * needed urgently due to startup, seeking or
 * recovery after a buffer-empty event. The media
 * SHOULD not be rendering when this request is
 * made. This key MUST not be sent if it is FALSE.
 */
export class CmcdStartup extends CmcdBase {
  public readonly key = CmcdKeysToken.Startup;
  public readonly type = CmcdHeaderType.Request;

  constructor(value: boolean) {
    super(value);
  }

  override keyValuePairToString() {
    // 2. If the value type is BOOLEAN and the value is TRUE, then the equals sign and the value MUST be omitted
    return this.value === true ? `${this.key}` : ``;
  }
}

/**
 * The highest bitrate rendition in the manifest or
 * playlist that the client is allowed to play, given
 * current codec, licensing and sizing constraints.
 */
export class CmcdTopBitrate extends CmcdBase {
  public readonly key = CmcdKeysToken.TopBitrate;
  public readonly type = CmcdHeaderType.Object;

  constructor(value: IntegerKbps) {
    super(value);
  }
}

/**
 * The version of this specification used for
 * interpreting the defined key names and values. If
 * this key is omitted, the client and server MUST
 * interpret the values as being defined by version 1.
 * Client SHOULD omit this field if the version is 1.
 */
export class CmcdVersion extends CmcdBase {
  public readonly key = CmcdKeysToken.CmcdVersion;
  public readonly type = CmcdHeaderType.Session;

  constructor(value: CmcdVersionNumbers) {
    super(value);
  }

  override keyValuePairToString() {
    return this.value === CmcdVersionNumbers.v1 ? `` : `${this.key}=${this.value}`;
  }
}

/**
 * 7. Any value of type String MUST be enclosed by opening and closing double
 * quotes Unicode 0x22. Double quotes and backslashes MUST be escaped using a
 * backslash "\" Unicode 0x5C character. Any value of type Token does not require
 * quoting.
 *
 * @param str
 * @returns
 */
function escapeCmcdString(str: string) {
  const doubleQuotesRegex = /"/g;
  const backslashRegex = /\\/g;

  return `"${str.replace(backslashRegex, '\\').replace(doubleQuotesRegex, '\\"')}"`;
}
