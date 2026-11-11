/**
 * Fullscreen of the stage, the box that holds the scene's canvas and the player
 * UI. The player's own fullscreen grows only its container, and the canvas
 * would keep its size.
 *
 * Uses the Fullscreen API where the browser has it for elements. iPhone has it
 * only for a video element, which would show the raw frame instead of the
 * scene. There, and where the API is disabled (for example in an iframe without
 * `allow="fullscreen"`), CSS pins the stage over the viewport instead.
 *
 * `onChange` also gets changes the button does not make, such as Escape.
 */
export function bindStageFullscreen(stage: HTMLElement): {
  toggle(): void;
  onChange(listener: (on: boolean) => void): void;
} {
  const listeners: ((on: boolean) => void)[] = [];
  const notify = (on: boolean) => listeners.forEach((listener) => listener(on));
  const native = typeof stage.requestFullscreen === 'function' && document.fullscreenEnabled;

  document.addEventListener('fullscreenchange', () => notify(document.fullscreenElement === stage));

  const setMaximized = (on: boolean) => {
    stage.classList.toggle('maximized', on);
    // Stops the page from scrolling behind the stage.
    document.documentElement.classList.toggle('stage-maximized', on);
    notify(on);
  };

  return {
    toggle() {
      if (!native) {
        setMaximized(!stage.classList.contains('maximized'));
      } else if (document.fullscreenElement === stage) {
        document.exitFullscreen().catch(console.warn);
      } else {
        stage.requestFullscreen().catch(console.warn);
      }
    },
    onChange(listener) {
      listeners.push(listener);
    },
  };
}
