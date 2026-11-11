import type { PlayerAPI } from 'bitmovin-player';
import type { Component, ComponentConfig, UIConfig, UIManager } from 'bitmovin-player-ui';
// @ts-expect-error The skin is plain JavaScript without type declarations.
import * as skin from '../../playerUi/skins/amp/player-ui.js';

/**
 * The AMP-style skin from playerUi/skins/amp. Its `require('bitmovin-player-ui')`
 * resolves to this sample's copy, see the `--alias` in package.json.
 */

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

export const createPlayerUI: (player: PlayerAPI, options: SkinOptions) => UIManager = skin.createPlayerUI;
