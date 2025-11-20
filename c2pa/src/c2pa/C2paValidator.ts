import { type C2paSdk, type ValidationState, createC2pa, type ManifestStore } from '@contentauth/c2pa-web';

import wasmSrc from '@contentauth/c2pa-web/resources/c2pa.wasm?url';
import {
  HttpRequestType,
  type HttpResponse,
  type HttpResponseBody,
  type SegmentPlaybackEvent,
  type SegmentRequestFinishedEvent,
} from 'bitmovin-player';

export class C2paValidator {
  private readonly c2paFetch: Promise<Response>;
  private c2paSdk: C2paSdk | undefined;
  private initSegmentMap: Map<string, Blob> = new Map();
  private dataSegmentMap: Map<string, Blob> = new Map();
  private manifestMap: Map<string, ManifestStore> = new Map();
  private readonly onManifestChange?: (manifest: ManifestStore | undefined) => void;

  constructor(onManifestChange?: (manifest: ManifestStore | undefined) => void) {
    this.onManifestChange = onManifestChange;
    this.c2paFetch = fetch(wasmSrc);
  }

  public async init(): Promise<void> {
    if (this.c2paSdk) {
      // Already initialized
      return;
    }

    const response = await this.c2paFetch;
    const wasmBinary = await response.arrayBuffer();

    this.c2paSdk = await createC2pa({ wasmSrc: wasmBinary });
    console.log('C2PA SDK initialized');
  }

  public async validateProgressive(url: string): Promise<ValidationState | undefined> {
    const response = await fetch(url);
    const blob = await response.blob();

    const reader = await this.c2paSdk!.reader.fromBlob(blob.type, blob);

    const manifestStore = await reader.manifestStore();

    console.log(manifestStore);

    return manifestStore.validation_state ?? undefined;
  }

  preprocessHttpResponse: <T extends HttpResponseBody>(
    type: HttpRequestType,
    response: HttpResponse<T>,
  ) => Promise<HttpResponse<T>> = async (type, response) => {
    if (type === HttpRequestType.MEDIA_VIDEO || type === HttpRequestType.MEDIA_AUDIO) {
      if (!response.body || !(response.body instanceof ArrayBuffer)) {
        return response;
      }

      const mimeType = type === HttpRequestType.MEDIA_VIDEO ? 'video/mp4' : 'audio/mp4';
      const blob = new Blob([response.body], { type: mimeType });
      this.dataSegmentMap.set(response.url, blob);
    }

    return response;
  };

  public async onSegmentRequestFinished(event: SegmentRequestFinishedEvent) {
    const existingBlob = this.dataSegmentMap.get(event.url);
    if (existingBlob && event.isInit) {
      this.initSegmentMap.set(event.mimeType, existingBlob);
      this.dataSegmentMap.delete(event.url);
    }
  }

  public async onSegmentPlayback(event: SegmentPlaybackEvent) {
    const initSegmentBlob = this.initSegmentMap.get(event.mimeType);
    const dataSegmentBlob = this.dataSegmentMap.get(event.url);

    try {
      // Note, for SSAI stream, the same segment URL may lead to different data, so this wouldn't work. To distinguish this case from a normal seek case, either more distinguishing info from the segments are needed, or we need to synchronize this with the normal segments lifecycle
      const existingManifest = this.manifestMap.get(event.url);
      if (!existingManifest) {
        if (!initSegmentBlob || !dataSegmentBlob) {
          console.warn(
            `Missing init or data segment for playback event of ${event.url}`,
            initSegmentBlob,
            dataSegmentBlob,
          );
          return;
        }
        console.log(`Extracting C2PA manifest for ${event.url}`);
        const reader = await this.c2paSdk!.reader.fromBlobFragment(
          dataSegmentBlob.type,
          initSegmentBlob,
          dataSegmentBlob,
        );

        const manifest = await reader.manifestStore();

        this.manifestMap.set(event.url, manifest);

        // Clear the data segment after processing to save memory. Only save the manifest obtained
        this.dataSegmentMap.delete(event.url);

        this.onManifestChange?.(manifest);

        console.log(`Extracted C2PA manifest:`, manifest);
      } else {
        this.onManifestChange?.(existingManifest);
        console.log(`Reusing existing manifest:`, existingManifest);
      }
    } catch (error) {
      console.error('C2PA manifest extraction failed:', error);

      this.onManifestChange?.(undefined);
    }
  }

  public reset() {
    this.initSegmentMap.clear();
    this.dataSegmentMap.clear();
    this.manifestMap.clear();
  }
}
