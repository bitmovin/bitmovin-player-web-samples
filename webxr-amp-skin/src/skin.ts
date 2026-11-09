import * as playerUi from 'bitmovin-player-ui';
import type { Component, ComponentConfig, UIConfig, UIManager } from 'bitmovin-player-ui';
import type { PlayerAPI } from 'bitmovin-player';

/**
 * The skin in skin/ is a plain script. It reads the player UI from the global
 * `bitmovin.playerui` when it runs, so set that first. ES modules run in import
 * order: index.ts imports this file before skin/player-ui.js.
 */
const globals = window as unknown as { bitmovin?: Record<string, unknown> };
globals.bitmovin = { ...globals.bitmovin, playerui: playerUi };

/** The options of the skin's `createPlayerUI` that this sample uses. */
export interface SkinOptions {
  /** Added to the control bar, before the fullscreen button. */
  buttons?: Component<ComponentConfig>[];
  /** What the fullscreen button and the F key toggle. Default: the player container. */
  fullscreen?: {
    toggle(): void;
    onChange(listener: (on: boolean) => void): void;
  };
  /** The element whose mouse and touch activity shows the controls. */
  interactionSource?: HTMLElement;
  /** false: only the big play button plays or pauses. */
  clickToPlay?: boolean;
  /** The share menu, or false for no share button. */
  share?: { providers?: string[]; url?: string | (() => string); title?: string } | false;
  uiConfig?: UIConfig;
}

/** The skin's entry point, from skin/player-ui.js. */
export function createPlayerUI(player: PlayerAPI, options: SkinOptions): UIManager {
  const create = (window as unknown as { createPlayerUI?: typeof createPlayerUI }).createPlayerUI;
  if (!create) {
    throw new Error('skin/player-ui.js did not load.');
  }
  return create(player, options);
}
