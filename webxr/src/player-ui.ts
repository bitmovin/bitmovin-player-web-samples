import { PlayerAPI } from 'bitmovin-player';
import {
  Button,
  ButtonConfig,
  Container,
  ContainerConfig,
  FullscreenToggleButton,
  i18n,
  UIContainer,
  UIFactory,
  UIManager,
  UIVariantIdentifier,
} from 'bitmovin-player-ui';
import { AFrameScene } from './scene';

const SMALL_SCREEN_SWITCH_WIDTH = 800;

export interface PlayerUi {
  uiManager: UIManager;
  /** Show or hide the VR button in every layout. */
  setVrSupported(supported: boolean): void;
}

/**
 * The player UI on the page: the default layouts, with a VR button before the
 * fullscreen button.
 *
 * The default UI has no button that starts a WebXR session: its VRToggleButton
 * drives the player's own VR renderer. These are the variants of
 * UIFactory.buildUI(), without the ad and TV ones.
 */
export function createPlayerUi(player: PlayerAPI, scene: AFrameScene): PlayerUi {
  let vrSupported = false;
  const vrButtons: Button<ButtonConfig>[] = [];

  const withVrButton = (ui: UIContainer): UIContainer => {
    const button = createVrButton(scene, !vrSupported);
    vrButtons.push(button);
    insertBeforeFullscreenButton(ui, button);
    return ui;
  };

  const uiManager = new UIManager(player, [
    {
      ui: UIFactory.defaultLayouts.emptyState,
      condition: (context) => !context.isSourceLoaded,
      identifier: UIVariantIdentifier.empty,
    },
    {
      ui: () => withVrButton(UIFactory.defaultLayouts.smallScreen()),
      condition: (context) => context.documentWidth < SMALL_SCREEN_SWITCH_WIDTH,
      identifier: UIVariantIdentifier.smallScreen,
    },
    {
      ui: () => withVrButton(UIFactory.defaultLayouts.main()),
      identifier: UIVariantIdentifier.main,
    },
  ]);

  showControlsOnPointerMove(scene, uiManager);

  return {
    uiManager,
    setVrSupported(supported) {
      vrSupported = supported;
      vrButtons.forEach((button) => (supported ? button.show() : button.hide()));
    },
  };
}

function createVrButton(scene: AFrameScene, hidden: boolean): Button<ButtonConfig> {
  const button = new Button({
    cssClass: 'ui-vrtogglebutton',
    ariaLabel: i18n.getLocalizer('vr'),
    hidden,
  });
  button.onClick.subscribe(() => {
    // A-Frame owns the WebXR session, so ask the scene, not the player.
    scene.enterVR().catch(console.warn);
  });
  return button;
}

/** Must run before the UI manager builds the layout. */
function insertBeforeFullscreenButton(ui: UIContainer, button: Button<ButtonConfig>): void {
  const found = findFullscreenButton(ui);
  if (!found) {
    return;
  }
  // Containers can only append or prepend. Before the UI is built,
  // getComponents() returns the list the container builds from.
  const components = found.row.getComponents();
  components.splice(components.indexOf(found.fullscreenButton), 0, button);
}

/** The first fullscreen button in the UI tree, and the container that holds it. */
function findFullscreenButton(
  container: Container<ContainerConfig>,
): { row: Container<ContainerConfig>; fullscreenButton: FullscreenToggleButton } | null {
  for (const child of container.getComponents()) {
    if (child instanceof FullscreenToggleButton) {
      return { row: container, fullscreenButton: child };
    }
    if (child instanceof Container) {
      const found = findFullscreenButton(child);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

/** The scene's canvas takes the pointer, so the UI does not see the movement itself. */
function showControlsOnPointerMove(scene: AFrameScene, uiManager: UIManager): void {
  scene.addEventListener('pointermove', () => {
    uiManager.activeUi?.getUI().showUi();
  });
}
