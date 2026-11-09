import 'aframe';
// esbuild writes these to dist/index.css, in this order: the skin overrides the
// player UI's stylesheet.
import 'bitmovin-player-ui/dist/css/bitmovinplayer-ui.css';
import '../skin/player.css';
// Colours of the control bar shown in VR. The bar is WebGL and reads only the
// custom properties this file declares.
import '@bitmovin/player-integration-webxr/ui/themes/bitmovinplayer-ui-webxr-glass-dark.css';
// Before the skin: it gives the skin the player UI it reads.
import './skin';
import '../skin/player-ui.js';
import { Player, PlayerConfig, SourceConfig } from 'bitmovin-player';
import { UIConfig } from 'bitmovin-player-ui';
import { createCompass } from '@bitmovin/player-integration-webxr/ui';
import { setCustomIcons } from './custom-icons';
import { askForDeviceOrientationOnClick, createIntegration, showVrUiInSessions } from './integration';
import { createPlayerUi } from './player-ui';
import { SkinOptions } from './skin';
import { getElement, setUpScene } from './scene';

const playerConfig: PlayerConfig = {
  key: 'YOUR-PLAYER-LICENSE-KEY',
  // The UI is built in player-ui.ts, with the skin.
  ui: false,
};

// 360° monoscopic stream. The VR control bar shows the title, description,
// poster and metadata in its header and info panel.
const source: SourceConfig = {
  title: 'Patrouille Suisse',
  description: '360° · monoscopic',
  hls: 'https://demo.bitmovin.com/public/vr-demo/content/patrouille_suisse.m3u8',
  // Shown until the first frame, on the page and in VR.
  poster: 'images/patrouille-suisse.jpg',
  metadata: {
    genre: 'aviation',
    tvRating: 'TV-G',
  },
};

// The share menu in the control bar. Nothing is sent before the viewer picks
// an entry. `url` defaults to the page address.
const share: SkinOptions['share'] = {
  providers: ['facebook', 'email', 'copy'],
};

// The error overlay shows these texts in place of the player's own.
const uiConfig: UIConfig = {
  errorMessages: {
    // PLAYBACK_VIDEO_DECODING_ERROR, for example 8K on an older phone.
    1301: 'This device likely cannot play this video. Please select another one.',
  },
};

async function main(): Promise<void> {
  // 1. The A-Frame scene the video is drawn in, and the box that holds it.
  const scene = setUpScene();
  const stage = getElement('stage');

  // 2. The player and its UI on the page.
  const player = new Player(getElement('playerContainer'), playerConfig);
  createPlayerUi(player, {
    stage,
    scene,
    share,
    uiConfig,
    volumeNotice: getElement('volumeNotice'),
  });

  // 3. Optional custom icons for the VR controls. Before any VR UI is built.
  await setCustomIcons();

  // 4. The WebXR integration. Before the first player.load().
  const xr = await createIntegration(player, scene);
  askForDeviceOrientationOnClick(xr);

  // 5. A dial in the upper right of the picture: where the viewer looks,
  //    relative to the video's front. It hides itself in a VR session.
  createCompass(scene, { xr });

  // 6. The control bar and buffering indicator inside VR sessions.
  showVrUiInSessions(stage, scene, player, xr);

  // 7. Play.
  await player.load(source);
}

main().catch((error) => console.error('Failed to start:', error));
