import { PlayerAPI } from 'bitmovin-player';
import { Button, ButtonConfig, i18n, UIConfig, UIManager } from 'bitmovin-player-ui';
import { probeVolumeControl, watchImmersiveSupport } from '@bitmovin/player-integration-webxr/ui';
import { bindStageFullscreen } from './fullscreen';
import { AFrameScene } from './scene';
import { createPlayerUI, SkinOptions } from './skin';

/** How far, in CSS pixels, a touch on the picture can move and still be a tap. */
const TAP_SLOP = 10;

/** How long, in milliseconds, a touch on the picture can last and still be a tap. */
const TAP_DURATION = 500;

export interface PlayerUiParts {
  /** The box to put in fullscreen. It holds the canvas and the player UI. */
  stage: HTMLElement;
  scene: AFrameScene;
  share: SkinOptions['share'];
  uiConfig: UIConfig;
  /** Shown where the page cannot set the volume. */
  volumeNotice: HTMLElement;
}

/**
 * The player UI on the page: the AMP-style skin, with a VR button before the
 * fullscreen button.
 *
 * Changes to the skin's defaults, because the picture is a view, not a frame:
 *
 * - `clickToPlay: false`: every drag to look around ends in a click, so a
 *   click on the picture must not play or pause. Only the big play button does.
 * - `interactionSource: stage`: the canvas takes the pointer and is not inside
 *   the player container. Activity on the stage shows the controls.
 * - `fullscreen`: of the stage, so the canvas comes along.
 */
export function createPlayerUi(player: PlayerAPI, parts: PlayerUiParts): UIManager {
  const uiManager = createPlayerUI(player, {
    buttons: [createVrButton(parts.scene)],
    fullscreen: bindStageFullscreen(parts.stage),
    interactionSource: parts.stage,
    clickToPlay: false,
    share: parts.share,
    uiConfig: parts.uiConfig,
  });

  hideControlsOnTap(parts.scene, uiManager);

  // iOS and iPadOS leave the volume to the hardware buttons. The skin has no
  // volume slider on touch devices, so only the note is left.
  probeVolumeControl().then((canSet) => {
    parts.volumeNotice.hidden = canSet;
  });

  return uiManager;
}

/**
 * Starts a WebXR session. Not the UI's VRToggleButton: that one drives the
 * player's own VR renderer.
 *
 * Shown only where the browser supports immersive VR, such as on Meta Quest or
 * Apple Vision Pro. Elsewhere enterVR() falls back to a fullscreen view, or
 * throws on iOS.
 */
function createVrButton(scene: AFrameScene): Button<ButtonConfig> {
  const button = new Button({
    cssClass: 'ui-vrtogglebutton',
    ariaLabel: i18n.getLocalizer('vr'),
    hidden: true,
  });
  button.onClick.subscribe(() => {
    // A-Frame owns the WebXR session, so ask the scene, not the player.
    scene.enterVR().catch(console.warn);
  });
  watchImmersiveSupport((supported) => (supported ? button.show() : button.hide()));
  return button;
}

/**
 * On a touch device, a tap on the picture hides the controls. The skin does
 * this on its playback overlay, but with `clickToPlay: false` the overlay lets
 * the touch through to the canvas. A touch that moves little and ends quickly
 * is a tap; all other touches look around.
 *
 * Only when the controls were shown at touch start: else the UI shows them on
 * touchend. The hide waits for that touchend too, else the UI shows them again.
 */
function hideControlsOnTap(scene: AFrameScene, uiManager: UIManager): void {
  const canvas = scene.canvas;
  if (!canvas) {
    console.warn('The scene has no canvas: a tap on the picture does not hide the controls.');
    return;
  }

  let press: { id: number; x: number; y: number; at: number; shown: boolean } | null = null;
  let pressed = 0;
  let hidePending = false;

  canvas.addEventListener('pointerdown', (event) => {
    pressed++;
    press =
      pressed === 1 && event.pointerType === 'touch'
        ? {
            id: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            at: event.timeStamp,
            shown: controlsShown(uiManager),
          }
        : null;
  });

  window.addEventListener('pointerup', (event) => {
    pressed = Math.max(0, pressed - 1);
    if (!press || event.pointerId !== press.id) {
      return;
    }
    const tap = press;
    press = null;
    const moved = Math.hypot(event.clientX - tap.x, event.clientY - tap.y);
    if (moved > TAP_SLOP || event.timeStamp - tap.at > TAP_DURATION) {
      return;
    }
    if (tap.shown && !scene.is('vr-mode')) {
      hidePending = true;
    }
  });

  window.addEventListener('pointercancel', (event) => {
    pressed = Math.max(0, pressed - 1);
    if (press && event.pointerId === press.id) {
      press = null;
    }
  });

  // On the window, so it runs after the UI's own touchend listener on the stage.
  window.addEventListener('touchend', () => {
    if (!hidePending) {
      return;
    }
    hidePending = false;
    // `hidingPrevented` is private in the UI's types. True where the skin keeps
    // the controls shown, for example while paused.
    const ui = uiManager.activeUi?.getUI() as unknown as
      | { hideUi(): void; hidingPrevented?: () => boolean }
      | undefined;
    if (ui && !ui.hidingPrevented?.()) {
      ui.hideUi();
    }
  });
}

function controlsShown(uiManager: UIManager): boolean {
  const element = uiManager.activeUi?.getUI().getDomElement().get(0);
  return Boolean(element?.classList.contains('bmpui-controls-shown'));
}
