import { PlayerAPI } from 'bitmovin-player';
import { BitmovinWebXR } from '@bitmovin/player-integration-webxr';
import {
  createBufferingOverlay,
  createControlBar,
  gazeReticleStyle,
} from '@bitmovin/player-integration-webxr/ui';
import { AFrameScene } from './scene';

/**
 * Must run before the first player.load(): the integration hands the player
 * its own video element and draws it onto the projection surface.
 */
export function createIntegration(player: PlayerAPI, scene: AFrameScene): Promise<BitmovinWebXR> {
  return BitmovinWebXR.create(player, scene, {
    // 360° monoscopic video.
    projection: { horizontalDeg: 360, verticalDeg: 180 },
    stereo: { layout: 'mono' },
    background: { mode: 'color', color: '#05070d' },
    // On the page the player UI draws the subtitles; in VR the integration does.
    captions: { enabled: 'immersive' },
    // Colours of the gaze reticle, from the theme stylesheet.
    input: { gazeReticle: gazeReticleStyle() },
  });
}

/**
 * Tilting a phone or tablet looks around only after the user allows the
 * orientation sensors. Browsers ask only from a click.
 */
export function askForDeviceOrientationOnClick(xr: BitmovinWebXR): void {
  const ask = () => {
    xr.requestDeviceOrientation().then((result) => {
      if (result === 'needs-gesture') {
        window.addEventListener('click', ask, { capture: true, once: true });
      }
    }, console.warn);
  };
  window.addEventListener('click', ask, { capture: true, once: true });
}

/**
 * The page's DOM UI is not visible in a VR session. Show a control bar and a
 * buffering indicator in the scene instead, for as long as the session lasts.
 */
export function showVrUiInSessions(scene: AFrameScene, player: PlayerAPI, xr: BitmovinWebXR): void {
  let vrUi: { destroy(): void }[] = [];

  scene.addEventListener('enter-vr', () => {
    vrUi = [
      createControlBar(scene, { player, xr, rig: { camera: '#cam' } }),
      createBufferingOverlay(scene, { player, xr }),
    ];
  });

  scene.addEventListener('exit-vr', () => {
    vrUi.forEach((element) => element.destroy());
    vrUi = [];
  });
}
