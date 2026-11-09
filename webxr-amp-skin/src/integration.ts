import { PlayerAPI, PlayerEvent } from 'bitmovin-player';
import { BitmovinWebXR } from '@bitmovin/player-integration-webxr';
import {
  createBufferingOverlay,
  createControlBar,
  gazeReticleStyle,
} from '@bitmovin/player-integration-webxr/ui';
import { AFrameScene } from './scene';

/** Where the view looks at the start, and again after a VR session. */
const HOME_VIEW = { yaw: 0, pitch: 0 };

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
    initialView: HOME_VIEW,
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
 *
 * `stage` gets the `vr-active` class during the session. index.html hides the
 * page's player UI with it, so it does not take clicks meant for the scene.
 */
export function showVrUiInSessions(
  stage: HTMLElement,
  scene: AFrameScene,
  player: PlayerAPI,
  xr: BitmovinWebXR,
): void {
  let vrUi: { destroy(): void }[] = [];

  scene.addEventListener('enter-vr', () => {
    stage.classList.add('vr-active');
    vrUi = [
      createControlBar(scene, { player, xr, rig: { camera: '#cam' } }),
      createBufferingOverlay(scene, { player, xr }),
    ];
  });

  scene.addEventListener('exit-vr', () => {
    stage.classList.remove('vr-active');
    vrUi.forEach((element) => element.destroy());
    vrUi = [];
    // The headset leaves the view wherever the viewer looked last.
    xr.setViewingDirection(HOME_VIEW);
  });

  // The error message shows on the page, which is not visible in a session.
  player.on(PlayerEvent.Error, () => {
    if (scene.is('vr-mode')) {
      scene.exitVR().catch(console.warn);
    }
  });
}
