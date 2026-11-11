import 'aframe';
// esbuild writes these to dist/index.css.
import 'bitmovin-player-ui/dist/css/bitmovinplayer-ui.css';
// Colours of the control bar shown in VR. The bar is WebGL and reads only the
// custom properties this file declares.
import '@bitmovin/player-integration-webxr/ui/themes/bitmovinplayer-ui-webxr-glass-dark.css';
import { Player, PlayerConfig, SourceConfig } from 'bitmovin-player';
import { createCompass, watchImmersiveSupport } from '@bitmovin/player-integration-webxr/ui';
import { setCustomIcons } from './custom-icons';
import { askForDeviceOrientationOnClick, createIntegration, showVrUiInSessions } from './integration';
import { createPlayerUi } from './player-ui';
import { getElement, setUpScene } from './scene';

const playerConfig: PlayerConfig = {
  key: 'YOUR-PLAYER-LICENSE-KEY',
  // The UI is built in player-ui.ts, from the default layouts.
  ui: false,
};

// 360° monoscopic stream.
const source: SourceConfig = {
  title: 'Patrouille Suisse',
  description: '360° · monoscopic',
  hls: 'https://demo.bitmovin.com/public/vr-demo/content/patrouille_suisse.m3u8',
};

async function main(): Promise<void> {
  // 1. The A-Frame scene the video is drawn in, and the box that holds it.
  const scene = setUpScene();
  const stage = getElement('stage');

  // 2. The player and its UI on the page.
  const player = new Player(getElement('playerContainer'), playerConfig);
  const playerUi = createPlayerUi(player, scene, stage);

  // 3. Optional custom icons for the VR controls. Before any VR UI is built.
  await setCustomIcons();

  // 4. The WebXR integration. Before the first player.load().
  const xr = await createIntegration(player, scene);
  askForDeviceOrientationOnClick(xr);

  // 5. A dial in the upper right of the picture: where the viewer looks,
  //    relative to the video's front. It hides itself in a VR session.
  createCompass(scene, { xr });

  // 6. Show the VR button only where the browser supports immersive VR, such
  //    as on Meta Quest or Apple Vision Pro. Elsewhere enterVR() falls back to
  //    a fullscreen view, or throws on iOS.
  watchImmersiveSupport((supported) => playerUi.setVrSupported(supported));

  // 7. The control bar and buffering indicator inside VR sessions.
  showVrUiInSessions(scene, player, xr);

  // 8. Play.
  await player.load(source);
}

main().catch((error) => console.error('Failed to start:', error));
