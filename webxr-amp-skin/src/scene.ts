/** The `<a-scene>` element, as far as this page uses it. A-Frame ships no TypeScript types. */
export interface AFrameScene extends HTMLElement {
  readonly canvas?: HTMLCanvasElement;
  enterVR(): Promise<void>;
  exitVR(): Promise<void>;
  is(state: string): boolean;
}

export function getElement(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`index.html is missing #${id}.`);
  }
  return element;
}

/** The A-Frame scene from index.html, without A-Frame's own VR button. */
export function setUpScene(): AFrameScene {
  const scene = getElement('scene') as AFrameScene;

  // The player's control bar gets the VR button instead, see player-ui.ts.
  // Set here, not in index.html: the scene overwrites the attribute with its default on start.
  scene.setAttribute('xr-mode-ui', 'enabled: false');

  return scene;
}
