/* eslint-disable @typescript-eslint/no-empty-interface */
/**
 * This file defines all of the existing interfaces from Lightning Core and SDK that
 * may be added to (aka. augmented) by your Application.
 *
 * @module
 */
import '@lightningjs/sdk'

declare module '@lightningjs/sdk' {
  /**
   * Lightning Core Augmentations
   */
  namespace Lightning {
    namespace Component {
      /**
       * These handlers augmented here will be _added_ to the existing default key handlers
       * Be sure to name and type them appropriately. There should be 4 forms of each:
       * - `_capture{KeyName}`
       * - `_capture{KeyName}Release`
       * - `_handle{KeyName}`
       * - `_handle{KeyName}Release`
       */
      interface DefaultKeyHandlers {
        // Examples:
        // _captureHome?(e: KeyboardEvent): boolean | void;
        // _captureHomeRelease?(e: KeyboardEvent): boolean | void;
        // _handleHome?(e: KeyboardEvent): boolean | void;
        // _handleHomeRelease?(e: KeyboardEvent): boolean | void;
      }

      /**
       * If any handlers are augmented here, the will _replace_ the default key handlers
       * declared in {@link DefaultKeyHandlers}.
       *
       * Use this if you have a radically different set of keys you'd like to orient your app around.
       */
      interface CustomKeyHandlers {
        // Examples:
        // _captureHome?(e: KeyboardEvent): boolean | void;
        // _captureHomeRelease?(e: KeyboardEvent): boolean | void;
        // _handleHome?(e: KeyboardEvent): boolean | void;
        // _handleHomeRelease?(e: KeyboardEvent): boolean | void;
      }

      /**
       * Fire Ancestor Definitions
       */
      interface FireAncestorsMap {
        // Examples:
        // $itemCreated(): void;
        // $firstItemCreated(): void;
        // $selectItem(arg: {item: ContentItem}): void;
      }
    }

    namespace Application {
      /**
       * Application Event Definitions (emitted from/onto the Lightning.Application instance)
       *
       * @remarks
       * These appear in
       */
      interface EventMap {
        // Examples:
        // titleLoaded(): void;
        // ratingColor(color: number): void;
        // setBackground(evt: { src: string }): void;
        // contentHeight(height: number): void;
        // backgroundLoaded(): void;
        // readyForBackground(): void;
        // itemAnimationEnded(): void;
        // setItem(evt: { item: ContentItem, direction?: -1 | 0 | 1 }): void;
        // contentHidden(): void;
      }
    }
  }

  /**
   * Lightning SDK Router Augmentations
   */
  namespace Router {
    /**
     * App-specifc Widgets Definitions
     *
     * @remarks
     * These appear in:
     * ```ts
     * anyRouterPage.widgets.menu;
     * Router.focusWidget('Menu');
     * ```
     */
    interface CustomWidgets {
      // Examples:
      // Menu: typeof Menu;
      // Overlay: typeof OverlayComponent;
    }
  }

  /**
   * Lightning SDK Application Augmentations
   */
  namespace Application {
    /**
     * AppData (Application SDK) definitions
     */
    export interface AppData {
      // Examples:
      // myAppDataParam1: string;
      // myAppDataParam2: number;
    }
  }
}
