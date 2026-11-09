// Globals that bitmovinplayer.js and bitmovinplayer-ui.js define when loaded as plain scripts
import type * as BitmovinPlayer from 'bitmovin-player';
import type * as BitmovinPlayerUI from 'bitmovin-player-ui';

declare global {
  interface Window {
    bitmovin: {
      player: typeof BitmovinPlayer;
      playerui: typeof BitmovinPlayerUI;
    };
    createPlayerUI: unknown;
    createPlayerModal: unknown;
    /** Safari only */
    WebKitPlaybackTargetAvailabilityEvent?: unknown;
  }
  interface Document {
    /** Older Safari */
    webkitPictureInPictureEnabled?: boolean;
  }
}
