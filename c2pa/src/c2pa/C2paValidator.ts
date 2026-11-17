import {
  C2paStatusCode,
  type InitSegmentValidation,
  LiveVideoStatusCode,
  type ManifestBoxValidationResult,
  type ManifestBoxValidationState,
  type MerkleSegmentState,
  type SequenceState,
  type SequenceValidationResult,
  type C2paManifest,
  validateC2paInitSegment,
  validateC2paManifestBoxSegment,
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

export type C2paValidationMode = 'Live VSI' | 'Live Manifest Box' | 'VOD Merkle' | 'Init only';

export type C2paPlaybackState = {
  manifest: C2paManifest | null;
  isValid: boolean;
  errorCodes: readonly string[];
  mode: C2paValidationMode;
  sequenceNumber?: number;
  sequenceResult?: SequenceValidationResult;
  streamId?: string;
};

const SESSION_KEYS_ASSERTION_LABEL = 'c2pa.session-keys';

// Continuity state of the per-segment C2PA Manifest Box method (C2PA §19.3).
// Each representation carries its own manifest chain, so the chain restarts
// whenever the representation changes. The stream ID and sequence number of a
// representation are kept across such a restart, so that an older segment of
// that representation is rejected when playback returns to it.
type ManifestBoxState = {
  representationId?: string;
  lastManifestId: string | null;
  validationStates: Map<string, ManifestBoxValidationState>;
};

/**
 * Checks the parts of a segment manifest that the library does not enforce:
 * it accepts a manifest without claim, without signature or without BMFF hash
 * assertion, and it reads the first assertion of a label while it verifies the
 * hash of the last one.
 */
function isManifestComplete(result: ManifestBoxValidationResult): boolean {
  const labels = result.manifest?.assertions.map(assertion => assertion.label) ?? [];

  return (
    result.manifest?.instanceId != null &&
    result.issuer !== null &&
    result.bmffHashHex !== null &&
    new Set(labels).size === labels.length
  );
}

type TrackState = {
  initValidation?: InitSegmentValidation;
  noC2pa?: boolean;
  merkleState?: MerkleSegmentState;
  sequenceState?: SequenceState;
  manifestBoxState?: ManifestBoxState;
};

export class C2paValidator {
  private initSegmentMap: Map<string, Uint8Array> = new Map();
  private dataSegmentMap: Map<string, Uint8Array> = new Map();
  private resultMap: Map<string, C2paPlaybackState> = new Map();
  private trackStateMap: Map<string, TrackState> = new Map();
  private validationChainMap: Map<string, Promise<void>> = new Map();
  // Incremented whenever continuity state is invalidated; in-flight validations
  // started under an older generation discard their results instead of
  // committing stale continuity state
  private generation = 0;
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

  public onSegmentPlayback(event: SegmentPlaybackEvent): Promise<void> {
    // Serialize validations per track: continuity state (sequence numbers,
    // merkle locations) is read before and written after an await, so
    // overlapping validations for the same track would clobber each other
    const chain = this.validationChainMap.get(event.mimeType) ?? Promise.resolve();
    const next = chain.then(() => this.processSegmentPlayback(event));
    this.validationChainMap.set(event.mimeType, next);
    return next;
  }

  private async processSegmentPlayback(event: SegmentPlaybackEvent) {
    const generation = this.generation;
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

      const state = await this.validateSegment(segmentBytes, trackState, generation, event.representationId);
      if (!state) {
        // Segment carries no C2PA data, or the result is stale after a seek/reset
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
    generation: number,
    representationId: string,
  ): Promise<C2paPlaybackState | null> {
    const initValidation = trackState.initValidation!;

    if (initValidation.merkleMaps.length > 0) {
      // VOD Merkle mode (C2PA §15.12.2)
      const { result, nextState } = await validateC2paMerkleSegment(
        segmentBytes,
        initValidation.merkleMaps,
        trackState.merkleState,
      );
      if (generation !== this.generation) {
        // Continuity state was reset while validating; discard the stale result
        return null;
      }
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
      if (generation !== this.generation) {
        // Continuity state was reset while validating; discard the stale result
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

    const manifestBoxResult = await this.validateManifestBoxSegment(
      segmentBytes,
      trackState,
      generation,
      representationId,
    );
    if (manifestBoxResult !== undefined) {
      return manifestBoxResult;
    }

    // The init segment carries a C2PA manifest, but no segment-level validation
    // method supported by @svta/cml-c2pa applies (e.g. legacy c2pa.hash.bmff.v2
    // assets). Surface the init segment validation result instead. This result
    // is invalid only because the library reports an init segment without
    // session keys and merkle maps as an invalid session key.
    return {
      manifest: initValidation.manifest,
      isValid: initValidation.isValid,
      errorCodes: initValidation.errorCodes,
      mode: 'Init only',
    };
  }

  /**
   * Validates a segment with the per-segment C2PA Manifest Box method (C2PA
   * §19.3). Returns `undefined` if the track does not use this method, and
   * `null` if the result is stale.
   */
  private async validateManifestBoxSegment(
    segmentBytes: Uint8Array,
    trackState: TrackState,
    generation: number,
    representationId: string,
  ): Promise<C2paPlaybackState | null | undefined> {
    const initValidation = trackState.initValidation!;
    const previous = trackState.manifestBoxState;
    const isSameChain = previous?.representationId === representationId;

    const { result, nextManifestId, nextState } = await validateC2paManifestBoxSegment(
      segmentBytes,
      isSameChain ? previous.lastManifestId : null,
      previous?.validationStates.get(representationId),
    );
    if (generation !== this.generation) {
      // Continuity state was reset while validating; discard the stale result
      return null;
    }

    // An init segment without session keys and merkle maps is expected in this
    // method, but the library reports it as an invalid session key
    const hasSessionKeys = initValidation.manifest?.assertions.some(
      assertion => assertion.label === SESSION_KEYS_ASSERTION_LABEL,
    );
    const initErrorCodes = hasSessionKeys
      ? initValidation.errorCodes
      : initValidation.errorCodes.filter(code => code !== LiveVideoStatusCode.SESSIONKEY_INVALID);

    const hasLiveVideoAssertion =
      result.continuityMethod !== null || result.streamId !== null || result.sequenceNumber !== null;
    if (!previous && !(result.manifest && hasLiveVideoAssertion)) {
      // No segment of this track carried a live video segment manifest so far
      return undefined;
    }

    if (!result.manifest) {
      // Every segment must carry a C2PA Manifest Box (C2PA §19.7.1)
      return {
        manifest: initValidation.manifest,
        isValid: false,
        errorCodes: [...new Set([...initErrorCodes, LiveVideoStatusCode.SEGMENT_INVALID])],
        mode: 'Live Manifest Box',
      };
    }

    // Only an authentic manifest may advance the stream ID and sequence number,
    // otherwise one forged segment makes all later segments fail. Authentic
    // means signed by the certificate in the manifest: the library has no trust
    // list, so a self-signed forged manifest still passes this check.
    const isComplete = isManifestComplete(result);
    const integrityCodes: readonly string[] = Object.values(C2paStatusCode);
    const isAuthentic = isComplete && !result.errorCodes.some(code => integrityCodes.includes(code));

    const validationStates = previous?.validationStates ?? new Map<string, ManifestBoxValidationState>();
    if (isAuthentic) {
      validationStates.set(representationId, nextState);
    }
    trackState.manifestBoxState = {
      representationId,
      lastManifestId: nextManifestId,
      validationStates,
    };

    const errorCodes = new Set<string>([...initErrorCodes, ...result.errorCodes]);
    if (!isComplete) {
      errorCodes.add(LiveVideoStatusCode.MANIFEST_INVALID);
    }

    return {
      manifest: result.manifest,
      isValid: errorCodes.size === 0,
      errorCodes: [...errorCodes],
      mode: 'Live Manifest Box',
      sequenceNumber: result.sequenceNumber ?? undefined,
      streamId: result.streamId ?? undefined,
    };
  }

  /**
   * Clears segment continuity state. Must be called after a seek, as sequence
   * numbers and merkle locations are no longer contiguous.
   */
  public resetSequenceState() {
    this.generation++;
    for (const trackState of this.trackStateMap.values()) {
      trackState.merkleState = undefined;
      trackState.sequenceState = undefined;
      if (trackState.manifestBoxState) {
        // Keep the state object: it marks the track as using the manifest box method
        trackState.manifestBoxState = { lastManifestId: null, validationStates: new Map() };
      }
    }
  }

  public reset() {
    this.generation++;
    this.initSegmentMap.clear();
    this.dataSegmentMap.clear();
    this.resultMap.clear();
    this.trackStateMap.clear();
    this.validationChainMap.clear();
  }
}
