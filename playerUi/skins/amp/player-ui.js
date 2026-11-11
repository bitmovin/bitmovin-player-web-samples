/*!
 * Bitmovin Player skin, Copyright (c) 2026 Bitmovin. MIT License, see LICENSE.
 * Custom Bitmovin player UI: control bar layout and settings panels.
 * UMD. CommonJS and bundlers: `require` / `import { createPlayerUI, createPlayerModal }`; needs the `bitmovin-player-ui` package.
 * Plain script: bitmovinplayer.js and bitmovinplayer-ui.js must be loaded first (they define `bitmovin`); sets the globals
 * `createPlayerUI` and `createPlayerModal`. */
// @ts-check
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(root, require('bitmovin-player-ui'));
  } else {
    const api = factory(root, root.bitmovin.playerui);
    root.createPlayerUI = api.createPlayerUI;
    root.createPlayerModal = api.createPlayerModal;
  }
})(typeof self !== 'undefined' ? self : /** @type {Window & typeof globalThis} */ (globalThis), /**
 * @param {Window & typeof globalThis} global
 * @param {typeof import('bitmovin-player-ui')} pui
 */ function (global, pui) {
  'use strict';
  // Player enums (PlayerEvent, ViewMode) come from `player.exports`, not the global `bitmovin.player`: the global
  // is missing when the player is loaded as a module. `exports` is deprecated, but it works in both setups.

  /**
   * Types for `npm run check` only; nothing at runtime.
   *
   * @typedef {import('bitmovin-player').PlayerAPI} PlayerAPI
   * @typedef {import('bitmovin-player').PlayerConfig} PlayerConfig
   * @typedef {import('bitmovin-player').SourceConfig} SourceConfig
   * @typedef {import('bitmovin-player').SubtitleEvent} SubtitleEvent
   * @typedef {import('bitmovin-player').SeekEvent} SeekEvent
   * @typedef {import('bitmovin-player-ui').UIInstanceManager} UIInstanceManager
   * @typedef {import('bitmovin-player-ui').LocalizationConfig} LocalizationConfig
   * @typedef {import('bitmovin-player-ui').LabelConfig} LabelConfig
   * @typedef {import('bitmovin-player-ui').ListSelectorConfig} ListSelectorConfig
   *
   * @typedef {object} ShareData
   * @property {string} url
   * @property {string} title
   *
   * @typedef {object} ShareOptions
   * @property {string | (() => string)} [url] A function is called on each share. Default: location.href
   * @property {string} [title] Default: document.title
   * @property {string[]} [providers] Default: all of SHARE_PROVIDERS
   * @property {(provider: string, data: ShareData) => boolean | void} [onShare] Return false to skip the default action
   *
   * @typedef {object} EndSlateOptions
   * @property {string} [image] Default: the source poster
   * @property {string} [title]
   * @property {() => void} [onClose] Adds a Close button
   *
   * @typedef {object} PlayerUIOptions
   * @property {LocalizationConfig} [localization]
   * @property {ShareOptions | false} [share]
   * @property {EndSlateOptions | false} [endSlate]
   * @property {boolean} [autoplay]
   * @property {boolean} [autoplaySetting]
   * @property {boolean} [ads]
   * @property {boolean} [keyboardShortcuts]
   * @property {boolean} [announcements]
   * @property {boolean} [tooltips]
   * @property {import('bitmovin-player-ui').Component<import('bitmovin-player-ui').ComponentConfig>[]} [buttons]
   * @property {FullscreenOptions} [fullscreen]
   * @property {HTMLElement} [interactionSource]
   * @property {boolean} [clickToPlay]
   * @property {import('bitmovin-player-ui').UIConfig} [uiConfig]
   *
   * @typedef {object} FullscreenOptions
   * @property {() => void} toggle Called by the button and the F key
   * @property {(listener: (on: boolean) => void) => void} onChange Call the listener on each change
   *
   * @typedef {object} PlayerModalConfig
   * @property {Partial<PlayerConfig>} [playerConfig] Needs `key`
   * @property {typeof import('bitmovin-player').Player} [playerClass] Default: the global `bitmovin.player.Player`
   * @property {PlayerUIOptions} [ui]
   * @property {string} [label]
   * @property {() => void} [onClose]
   */

  /**
   * Text goes through Bitmovin's i18n. Where Bitmovin's UI has a string, the skin uses its key, so the text is
   * translated wherever Bitmovin's is (de, es, fr, nl, pt); the English values below change only the wording to
   * AMP's. Text only the skin has uses `skin.*` keys in English; other languages fall back to English.
   * Add or change text with `options.localization`, which takes the same object as the Bitmovin UI config:
   *
   *   createPlayerUI(player, { localization: { language: 'auto', vocabularies: { de: { 'skin.share': 'Teilen' } } } });
   */
  const VOCABULARY_EN = {
    'settings.audio.track': 'Audio',
    'settings.video.quality': 'Quality',
    'settings.subtitles': 'Captions',
    'settings.subtitles.options': 'Style',
    'normal': 'Normal',
    'ads.remainingTime': 'This ad will end in {remainingTime} seconds',
    'skin.share': 'Share',
    'skin.share.facebook': 'Facebook',
    'skin.share.x': 'Twitter/X',
    'skin.share.email': 'Email',
    'skin.share.copy': 'Copy link',
    'skin.share.copied': 'Link copied!',
    'skin.unmute': 'Unmute',
    'skin.autoplay': 'Autoplay',
    'skin.announce.playing': 'Playing',
    'skin.announce.paused': 'Paused',
    'skin.announce.buffering': 'Buffering',
    'skin.announce.finished': 'Playback finished',
    'skin.announce.muted': 'Muted',
    'skin.announce.unmuted': 'Unmuted',
    'skin.announce.volume': 'Volume {value} percent',
    'skin.announce.captionsOn': 'Captions on',
    'skin.announce.captionsOff': 'Captions off',
  };

  /**
   * Returns a localizer: a function that gives the text in the current language.
   * @param {string} key
   * @param {Record<string, string | number>} [values]
   */
  const t = (key, values) => pui.i18n.getLocalizer(key, values);

  /** @param {LocalizationConfig} [localization] */
  function setLocalization(localization = {}) {
    const vocabularies = localization.vocabularies || {};
    pui.i18n.setConfig({ ...localization, vocabularies: { ...vocabularies, en: { ...VOCABULARY_EN, ...vocabularies.en } } });
  }

  // Speeds offered in the settings menu (Bitmovin's default is 0.25, 0.5, 1, 1.5, 2)
  // Speeds and labels as in AMP: 0.25, 0.5, Normal, 1.25, 1.5, 2 (Bitmovin's default adds an "x" to each)
  const PLAYBACK_SPEEDS = [0.25, 0.5, 1, 1.25, 1.5, 2];

  class SpeedSelectBox extends pui.PlaybackSpeedSelectBox {
    /** @param {ListSelectorConfig} [config] */
    constructor(config) {
      super(config);
      this.defaultPlaybackSpeeds = PLAYBACK_SPEEDS;
    }

    addDefaultItems() {
      PLAYBACK_SPEEDS.forEach(speed => this.addItem(String(speed), speed === 1 ? t('normal') : String(speed)));
    }
  }

  /**
   * Share menu: Facebook, X, email and copy link. The defaults only build the provider URLs; the
   * integrator owns the real sharing calls and can take over with `options.share.onShare`. Copy link keeps the
   * menu open and reads "Link copied!" for 3 s once the link is on the clipboard.
   *
   *   createPlayerUI(player, { share: {
   *     url: 'https://example.com/video/1',       // or a function, called on each share; default: location.href
   *     title: 'My video',                         // default: document.title
   *     providers: ['facebook', 'x', 'email', 'copy'],
   *     onShare: (provider, data) => { ...; return false; },  // return false to skip the default action
   *   } });
   *   createPlayerUI(player, { share: false });    // no share button
   * @type {Record<string, { open?: (d: ShareData) => string, mailto?: (d: ShareData) => string, copy?: boolean }>}
   */
  const SHARE_PROVIDERS = {
    facebook: { open: d => 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(d.url) },
    x: { open: d => 'https://twitter.com/intent/tweet?url=' + encodeURIComponent(d.url) + '&text=' + encodeURIComponent(d.title) },
    email: { mailto: d => 'mailto:?subject=' + encodeURIComponent(d.title) + '&body=' + encodeURIComponent(d.url) },
    copy: { copy: true },
  };

  /** @extends {pui.Button<import('bitmovin-player-ui').ButtonConfig>} */
  class ShareOption extends pui.Button {
    /** @param {string} provider */
    constructor(provider) {
      super({ cssClass: 'ui-shareoption', cssClasses: ['shareoption-' + provider], text: t('skin.share.' + provider) });
      this.provider = provider;
    }
  }

  /** How long "Link copied!" shows before the row reads "Copy link" again. */
  const COPIED_FOR_MS = 3000;

  /**
   * Puts text on the clipboard. The Clipboard API is missing outside a secure context (a page on plain http)
   * and refuses in an iframe without `clipboard-write`; the older execCommand route still works there.
   * `host` takes the scratch field: inside the player, so the selection holds while the player is fullscreen.
   */
  /** @param {string} text @param {HTMLElement} host @returns {Promise<void>} */
  function copyText(text, host) {
    const clipboard = navigator.clipboard;
    if (!clipboard) return legacyCopy(text, host);
    return clipboard.writeText(text).catch(() => legacyCopy(text, host));
  }

  /** @param {string} text @param {HTMLElement} host @returns {Promise<void>} */
  function legacyCopy(text, host) {
    if (typeof document.execCommand !== 'function') return Promise.reject(new Error('no execCommand'));
    const field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.position = 'absolute';
    field.style.opacity = '0';
    host.appendChild(field);
    field.select();
    const copied = document.execCommand('copy');
    field.remove();
    return copied ? Promise.resolve() : Promise.reject(new Error('execCommand(\'copy\') refused'));
  }

  /** @param {ShareOptions} config */
  function createShare(config) {
    const providers = (config.providers || Object.keys(SHARE_PROVIDERS)).filter(p => SHARE_PROVIDERS[p]);
    const panel = new pui.SettingsPanel({ hidden: true, hideDelay: -1, components: [], cssClasses: ['share-panel'] });
    const options = providers.map(p => new ShareOption(p));
    panel.addComponent(new pui.SettingsPanelPage({ components: options }));

    const button = new pui.Button({ cssClass: 'ui-sharebutton', text: t('skin.share') });
    button.onClick.subscribe(() => (panel.isHidden() ? panel.show() : panel.hide()));

    // Copy link: the menu stays open and the row reads "Link copied!" for a while, the only sign the copy worked
    let copiedTimer = 0;
    const resetCopied = () => {
      clearTimeout(copiedTimer);
      options.filter(o => SHARE_PROVIDERS[o.provider].copy).forEach(o => o.setAriaLabel(t('skin.share.' + o.provider)));
    };
    panel.onHide.subscribe(resetCopied);

    options.forEach(option => option.onClick.subscribe(() => {
      const url = typeof config.url === 'function' ? config.url() : config.url;
      const data = { url: url || location.href, title: config.title || document.title };
      const def = SHARE_PROVIDERS[option.provider];
      if (!def.copy) panel.hide();
      if (config.onShare && config.onShare(option.provider, data) === false) {
        panel.hide();
        return;
      }
      if (def.copy) {
        copyText(data.url, panel.getDomElement().get(0)).then(() => {
          if (panel.isHidden()) return;
          option.setAriaLabel(t('skin.share.copied'));
          clearTimeout(copiedTimer);
          copiedTimer = setTimeout(resetCopied, COPIED_FOR_MS);
        }, error => console.warn('[skin] could not copy the link:', error));
      } else if (def.mailto) {
        location.href = def.mailto(data);
      } else if (def.open) {
        window.open(def.open(data), '_blank', 'noopener');
      }
    }));

    return { button, panel };
  }

  /**
   * End slate: when playback finishes, shows the poster (options.endSlate.image, else the source poster) with a
   * Replay button and, if options.endSlate.onClose is set, a Close button. It hides again on play or when a
   * new source is loaded.
   *
   *   createPlayerUI(player, { endSlate: { image: 'slate.jpg', title: 'Thanks for watching', onClose: () => {...} } });
   *   createPlayerUI(player, { endSlate: false });   // no end slate
   * @extends {pui.Container<import('bitmovin-player-ui').ContainerConfig>}
   */
  class EndSlate extends pui.Container {
    /** @param {EndSlateOptions} options */
    constructor(options) {
      const replay = new pui.Button({ cssClass: 'ui-endslate-replay', text: t('replay') });
      const components = [];
      if (options.title) components.push(new pui.Label({ cssClass: 'ui-endslate-title', text: options.title }));
      components.push(replay);
      const close = options.onClose ? new pui.Button({ cssClass: 'ui-endslate-close', text: t('close') }) : null;
      if (close) components.push(close);
      super({ cssClass: 'ui-endslate', hidden: true, components });
      this.options = options;
      this.replay = replay;
      this.close = close;
    }

    /** @param {PlayerAPI} player @param {UIInstanceManager} uimanager */
    configure(player, uimanager) {
      super.configure(player, uimanager);
      const { PlaybackFinished, Play, SourceLoaded, SourceUnloaded } = player.exports.PlayerEvent;
      const dom = this.getDomElement();

      player.on(PlaybackFinished, () => {
        const source = player.getSource();
        const image = this.options.image || (source && source.poster);
        dom.css('background-image', image ? 'url("' + image + '")' : '');
        this.show();
      });
      [Play, SourceLoaded, SourceUnloaded].forEach(ev => player.on(ev, () => this.hide()));

      this.replay.onClick.subscribe(() => {
        this.hide();
        player.seek(0);
        player.play();
      });
      // called through this.options, so the callback keeps the options as `this`
      if (this.close) this.close.onClick.subscribe(() => { if (this.options.onClose) this.options.onClose(); });
    }
  }

  /**
   * Top-right "unmute" pill, shown only while the player is muted (like AMP's unmute layer).
   * @extends {pui.Button<import('bitmovin-player-ui').ButtonConfig>}
   */
  class UnmuteButton extends pui.Button {
    constructor() {
      super({ cssClass: 'ui-unmutebutton', text: t('skin.unmute'), hidden: true });
    }

    /** @param {PlayerAPI} player @param {UIInstanceManager} uimanager */
    configure(player, uimanager) {
      super.configure(player, uimanager);
      const { Muted, Unmuted, SourceLoaded, Ready } = player.exports.PlayerEvent;
      const update = () => (player.isMuted() ? this.show() : this.hide());
      [Muted, Unmuted, SourceLoaded, Ready].forEach(ev => player.on(ev, update));
      this.onClick.subscribe(() => player.unmute());
      update();
    }
  }

  /** How long, in ms, to wait for iOS to revert a volume write: it accepts the write, then restores the old value. */
  const VOLUME_REVERT_WAIT_MS = 250;
  /** @type {Promise<boolean> | null} */
  let volumeProbe = null;

  /** Whether the page can set media volume. Probed once, on a detached element, so the player sees no events. */
  function canSetVolume() {
    if (!volumeProbe) {
      volumeProbe = new Promise(resolve => {
        const media = document.createElement('video');
        const before = media.volume;
        media.volume = before === 0.5 ? 0.25 : 0.5;
        if (media.volume === before) resolve(false);
        else setTimeout(() => resolve(media.volume !== before), VOLUME_REVERT_WAIT_MS);
      });
    }
    return volumeProbe;
  }

  function isAndroid() {
    const data = /** @type {{ userAgentData?: { platform?: string } }} */ (/** @type {unknown} */ (navigator)).userAgentData;
    return /Android/.test(navigator.userAgent) || (data != null && data.platform === 'Android');
  }

  /**
   * Volume slider, in both layouts: shown where the page can set volume and the device is not Android, as in AMP.
   * Bitmovin's own checks are off: `hideOnMobile` looks for "Mobi" in the user agent, which Android tablets do not
   * send, and its volume check misses the iOS builds that revert a write a moment later.
   */
  class SettableVolumeSlider extends pui.VolumeSlider {
    constructor() {
      super({ hideOnMobile: false, hideIfVolumeControlProhibited: false });
    }

    /** @param {PlayerAPI} player @param {UIInstanceManager} uimanager */
    configure(player, uimanager) {
      super.configure(player, uimanager);
      if (isAndroid()) {
        this.hide();
        return;
      }
      canSetVolume().then(settable => { if (!settable) this.hide(); });
    }
  }

  /** User-agent token of Meta Quest Browser. */
  const QUEST_BROWSER = /OculusBrowser/;

  /**
   * Touch layout (player.css, under `.bmp-amp-touch` on the player container): while the primary pointer is coarse,
   * following changes of input. Always in Meta Quest Browser, as in AMP: it reports the controllers as a fine pointer
   * and hand tracking as a coarse one, so the layout would change with the hands.
   * @param {PlayerAPI} player
   */
  function watchTouchLayout(player) {
    const container = player.getContainer();
    if (QUEST_BROWSER.test(navigator.userAgent)) {
      container.classList.add('bmp-amp-touch');
      return;
    }
    if (!global.matchMedia) return;
    const coarse = global.matchMedia('(pointer: coarse)');
    const update = () => container.classList.toggle('bmp-amp-touch', coarse.matches);
    update();
    coarse.addEventListener('change', update);
    player.on(player.exports.PlayerEvent.Destroy, () => coarse.removeEventListener('change', update));
  }

  /**
   * Big play button overlay. With a mouse, a click anywhere on the video toggles playback. In the touch layout
   * (player.css shrinks the button to its circle), as in AMP: a tap on the video shows the controls (Bitmovin
   * does this while they are hidden) or hides them; only a tap on the circle plays or pauses.
   */
  class PlaybackOverlay extends pui.PlaybackToggleOverlay {
    /** @param {PlayerAPI} player @param {UIInstanceManager} uimanager */
    configure(player, uimanager) {
      super.configure(player, uimanager);
      this.getDomElement().on('click', e => {
        const target = /** @type {Element} */ (e.target);
        if (target.closest('.bmpui-ui-hugeplaybacktogglebutton') || !target.closest('.bmp-amp-touch')) return;
        const ui = uimanager.getUI();
        // not while paused (hidePlayerStateExceptions): the controls stay drawn there, see createUI.
        // hidingPrevented is private in Bitmovin's types, but a public field at runtime
        const { hidingPrevented } = /** @type {{ hidingPrevented?: () => boolean }} */ (/** @type {unknown} */ (ui));
        if (hidingPrevented && hidingPrevented()) return;
        if (ui.hideUi) ui.hideUi();
      });
    }
  }

  /** How long the seek track stays as a line along the bottom edge after the controls hide (AMP's autoHide). */
  const IDLE_AFTER_MS = 3000;

  /**
   * UIContainer with AMP's two-step hide. With a mouse, the button row slides away when the controls hide and the
   * seek track stays as a thin line along the bottom edge; IDLE_AFTER_MS later the line goes too
   * (`bmpui-controls-idle`, player.css). The touch layout hides everything at once, as AMP does.
   *
   * While a menu (Settings or Share) is open, the controls do not hide: not on the timer and not on mouse leave.
   * Bitmovin's own `deferUiHideWhileSettingsOpen` is off, because it loses track when one menu replaces the other.
   */
  class SkinUIContainer extends pui.UIContainer {
    /** @param {import('bitmovin-player-ui').UIContainerConfig} config */
    constructor(config) {
      super({ deferUiHideWhileSettingsOpen: false, ...config });
    }

    /** @param {PlayerAPI} player @param {UIInstanceManager} uimanager */
    configure(player, uimanager) {
      super.configure(player, uimanager);
      /** @type {import('bitmovin-player-ui').SettingsPanel<any>[]} */
      const menus = [];
      /** @param {import('bitmovin-player-ui').Container<any>} container */
      const findMenus = container => container.getComponents().forEach(c => {
        if (c instanceof pui.SettingsPanel) menus.push(c);
        else if (c instanceof pui.Container) findMenus(c);
      });
      findMenus(this);
      const menuOpen = () => menus.some(m => m.isShown());
      // timer: a canceled preview keeps the controls up and restarts the timer
      uimanager.onPreviewControlsHide.subscribe((_, args) => { if (menuOpen()) args.cancel = true; });
      // mouse leave and other forced hides skip the preview
      const hideUi = this.hideUi;
      this.hideUi = force => { if (!menuOpen()) hideUi(force); };

      const element = this.getDomElement();
      /** @type {ReturnType<typeof setTimeout> | undefined} */
      let timer;
      uimanager.onControlsHide.subscribe(() => {
        clearTimeout(timer);
        timer = setTimeout(() => element.addClass('bmpui-controls-idle'), IDLE_AFTER_MS);
      });
      uimanager.onControlsShow.subscribe(() => {
        clearTimeout(timer);
        element.removeClass('bmpui-controls-idle');
      });
    }
  }

  /**
   * Seek bar and time label that move to a seek's target at once. Bitmovin's follow the playback time, which
   * stays at the old position until the seek completes, so a 10 s jump showed only after the new data loaded.
   * The target holds until Seeked; then the player's time takes over again. Not in live, where a jump is a
   * time shift and the label is hidden.
   */
  class SeekTargetSeekBar extends pui.SeekBar {
    /** @param {PlayerAPI} player @param {UIInstanceManager} uimanager */
    configure(player, uimanager) {
      super.configure(player, uimanager);
      // Bitmovin's own Seek handler runs first and marks the bar as seeking, so its playback-time updates
      // leave this position alone until Seeked
      player.on(player.exports.PlayerEvent.Seek, event => {
        const duration = player.getDuration();
        if (player.isLive() || !(duration > 0)) return;
        this.setPlaybackPosition((100 / duration) * /** @type {SeekEvent} */ (event).seekTarget);
      });
      // Bitmovin stops the smooth position updates when the controls hide, but the seek track stays as a line
      // until the UI is idle. Keep the updates running while playback runs, so the line moves and the bar does
      // not jump when it shows again. Bitmovin's handler runs first, so this restarts the updater after it
      // clears it. The updater is private in the typings, so read it through `any`.
      // It also runs after the line hides: on show, Bitmovin restarts a stopped updater from its old position,
      // and the bar jumps back before it catches up.
      uimanager.onControlsHide.subscribe(() => {
        const updater = /** @type {any} */ (this).smoothPlaybackPositionUpdater;
        if (updater && player.isPlaying() && !player.isLive() && !updater.isActive()) updater.start();
      });
    }
  }

  /** @extends {pui.PlaybackTimeLabel} */
  class SeekTargetTimeLabel extends pui.PlaybackTimeLabel {
    /** @param {import('bitmovin-player-ui').PlaybackTimeLabelConfig} config */
    constructor(config) {
      super(config);
      /** @type {number | null} the target of the seek in progress */
      this.seekTarget = null;
    }

    /** @param {PlayerAPI} player @param {UIInstanceManager} uimanager */
    configure(player, uimanager) {
      super.configure(player, uimanager);
      const { Seek, Seeked, SourceUnloaded } = player.exports.PlayerEvent;
      player.on(Seek, event => {
        if (player.isLive()) return;
        const target = /** @type {SeekEvent} */ (event).seekTarget;
        this.seekTarget = target;
        this.setTime(target, player.getDuration());
      });
      const done = () => {
        this.seekTarget = null;
        this.setTime(pui.PlayerUtils.getCurrentTimeRelativeToSeekableRange(player), player.getDuration());
      };
      player.on(Seeked, done);
      player.on(SourceUnloaded, () => { this.seekTarget = null; });
    }

    /** While a seek is in progress, the target stands in for the playback time. @param {number} playbackSeconds @param {number} durationSeconds */
    setTime(playbackSeconds, durationSeconds) {
      super.setTime(this.seekTarget === null ? playbackSeconds : this.seekTarget, durationSeconds);
    }
  }

  /**
   * Autoplay switch, as in AMP's Settings menu. Flipping it never starts or stops the current video: it decides
   * whether the next source starts by itself (the next player.load(), or the next visit). The viewer's choice
   * is saved in localStorage; until they choose, `options.autoplay` and then the player config's
   * playback.autoplay decide.
   *
   * The choice applies to the whole site: there is one storage key per origin, so it applies to every player on
   * every page of that origin, and once set it overrides `options.autoplay`. Integrators can disable the switch
   * with `autoplaySetting: false`.
   *
   * Bitmovin reads playback.autoplay only when the player is created, so the skin applies the choice itself
   * on every source load: it starts playback when the choice is on (retrying muted if the browser blocks
   * sound). Leave playback.autoplay off in the player config; if it is on, Bitmovin starts every source and
   * the skin can only pause it again when the viewer has turned autoplay off.
   */
  const AUTOPLAY_STORAGE_KEY = 'bmp-amp-skin-autoplay';

  function savedAutoplay() {
    try {
      const value = global.localStorage.getItem(AUTOPLAY_STORAGE_KEY);
      return value === null ? null : value === 'true';
    } catch (e) {
      return null; // storage blocked (private mode, sandboxed frame)
    }
  }

  /** @param {boolean} on */
  function saveAutoplay(on) {
    try { global.localStorage.setItem(AUTOPLAY_STORAGE_KEY, String(on)); } catch (e) { /* not saved */ }
  }

  /** @param {PlayerAPI} player */
  function configAutoplay(player) {
    const config = player.getConfig ? player.getConfig() : undefined;
    return !!(config && config.playback && config.playback.autoplay);
  }

  /** @param {PlayerAPI} player @param {PlayerUIOptions} options */
  function autoplayEnabled(player, options) {
    const saved = savedAutoplay();
    if (saved !== null) return saved;
    if (typeof options.autoplay === 'boolean') return options.autoplay;
    return configAutoplay(player);
  }

  /** @extends {pui.ToggleButton<import('bitmovin-player-ui').ToggleButtonConfig>} */
  class AutoplayToggleButton extends pui.ToggleButton {
    /** @param {PlayerUIOptions} options */
    constructor(options) {
      super({ cssClass: 'ui-autoplaytogglebutton', text: t('skin.autoplay') });
      this.options = options;
    }

    /** @param {PlayerAPI} player @param {UIInstanceManager} uimanager */
    configure(player, uimanager) {
      super.configure(player, uimanager);
      if (autoplayEnabled(player, this.options)) this.on();
      this.onClick.subscribe(() => this.toggle());
      this.onToggle.subscribe(() => saveAutoplay(this.isOn()));
    }
  }

  /** @param {PlayerAPI} player @param {PlayerUIOptions} options */
  function enableAutoplay(player, options) {
    const { SourceLoaded, Playing } = player.exports.PlayerEvent;
    const builtIn = configAutoplay(player);
    player.on(SourceLoaded, () => {
      const wanted = autoplayEnabled(player, options);
      if (wanted && !builtIn) {
        // after the load() promise callbacks, so a page can still schedule a pre-roll first
        setTimeout(() => {
          if (player.isPlaying()) return;
          player.play().catch(() => {
            player.mute();
            player.play().catch(() => { /* still blocked: the play button shows */ });
          });
        });
      } else if (!wanted && builtIn) {
        // The player config has autoplay on but the viewer turned it off. Bitmovin still starts this source
        // by itself (it calls play right after SourceLoaded and again when Ready), so pause once it is
        // actually playing; a later start by the viewer is left alone.
        const stop = () => { player.off(Playing, stop); player.pause(); };
        player.on(Playing, stop);
        setTimeout(() => player.off(Playing, stop), 5000);
      }
    });
  }

  /**
   * Fullscreen button. By default Bitmovin's, which puts the player container in fullscreen. With
   * `options.fullscreen`, the page decides what goes fullscreen (for example a box that holds the player and
   * other layers); the button and the F key call `toggle`, and `onChange` reports each change, Escape included:
   *
   *   createPlayerUI(player, { fullscreen: {
   *     toggle: () => { ... },
   *     onChange: listener => { ... },   // call listener(true) on enter, listener(false) on exit
   *   } });
   */
  /** @param {PlayerUIOptions} options */
  function createFullscreenButton(options) {
    const fullscreen = options.fullscreen;
    if (!fullscreen) return new pui.FullscreenToggleButton();
    const button = new pui.ToggleButton({ cssClass: 'ui-fullscreentogglebutton', ariaLabel: t('fullscreen') });
    button.onClick.subscribe(() => fullscreen.toggle());
    fullscreen.onChange(on => (on ? button.on() : button.off()));
    return button;
  }

  /**
   * UIContainer config shared by every layout.
   *
   * `options.interactionSource`: the element whose mouse and touch activity shows the controls. Default: the
   * UI itself. Set it when other layers lie over or beside the video and take the pointer.
   *
   * `options.clickToPlay: false`: only the big play button plays or pauses; the rest of the video lets the
   * pointer through to what is under it. For content with gestures of its own, such as dragging to look around.
   */
  /**
   * @template {import('bitmovin-player-ui').UIContainerConfig} T
   * @param {PlayerUIOptions} options @param {T} config @returns {T}
   */
  function containerConfig(options, config) {
    const cssClasses = (config.cssClasses || []).concat(options.clickToPlay === false ? ['no-click-to-play'] : []);
    return {
      ...config,
      cssClasses,
      ...(options.interactionSource ? { userInteractionEventSource: options.interactionSource } : {}),
    };
  }

  /** @param {PlayerAPI} player @param {PlayerUIOptions} options */
  function createUI(player, options) {
    const subtitleOverlay = new pui.SubtitleOverlay();

    // Captions: the CC button only switches them on and off (like AMP); track and style are picked in Settings
    const settingsPanel = new pui.SettingsPanel({ hidden: true, hideDelay: -1, components: [] });
    const subtitleStylePage = new pui.SubtitleSettingsPanelPage({
      settingsPanel,
      overlay: subtitleOverlay,
      useDynamicSettingsPanelItem: true,
    });
    const subtitleStyleButton = new pui.SettingsPanelPageOpenButton({
      targetPage: subtitleStylePage,
      container: settingsPanel,
      text: t('settings.subtitles.options'),
    });
    settingsPanel.addComponent(new pui.SettingsPanelPage({ components: [
      new pui.DynamicSettingsPanelItem({
        label: t('settings.audio.track'), settingComponent: new pui.AudioTrackSelectBox(), container: settingsPanel }),
      new pui.DynamicSettingsPanelItem({
        label: t('speed'), settingComponent: new SpeedSelectBox(), container: settingsPanel }),
      new pui.DynamicSettingsPanelItem({
        label: t('settings.video.quality'), settingComponent: new pui.VideoQualitySelectBox(), container: settingsPanel }),
      new pui.DynamicSettingsPanelItem({
        label: t('settings.subtitles'),
        settingComponent: new pui.SubtitleSelectBox(),
        backNavigationRightComponent: subtitleStyleButton,
        container: settingsPanel,
      }),
      ...(options.autoplaySetting === false ? [] : [new pui.ToggleSettingsPanelItem({
        label: t('skin.autoplay'), settingComponent: new AutoplayToggleButton(options) })]),
    ] }));
    settingsPanel.addComponent(subtitleStylePage);

    const time = new SeekTargetTimeLabel({
      timeLabelMode: pui.PlaybackTimeLabelMode.CurrentAndTotalTime,
      hideInLivePlayback: true,
      cssClasses: ['time-label'],
    });

    const share = options.share === false ? null : createShare(options.share || {});
    const endSlate = options.endSlate === false ? null : new EndSlate(options.endSlate || {});
    // one menu at a time: opening Share closes Settings, and the other way round
    if (share) {
      const sharePanel = share.panel;
      settingsPanel.onShow.subscribe(() => sharePanel.hide());
      sharePanel.onShow.subscribe(() => settingsPanel.hide());
    }

    const controlBar = new pui.ControlBar({ components: [
      // progress bar on top, full width
      new pui.Container({ cssClasses: ['controlbar-top'], components: [ new SeekTargetSeekBar({ label: new pui.SeekBarLabel() }) ] }),
      // order: play, -10s, +10s, time, mute, volume ... share, cc, settings, cast, airplay, pip, fullscreen
      new pui.Container({ cssClasses: ['controlbar-bottom'], components: [
        new pui.PlaybackToggleButton(),
        new pui.QuickSeekButton({ seekSeconds: -10, cssClass: 'ui-jumpbackbutton' }),
        new pui.QuickSeekButton({ seekSeconds: 10, cssClass: 'ui-jumpforwardbutton' }),
        time,
        new pui.VolumeToggleButton(),
        new SettableVolumeSlider(),
        new pui.Spacer(),
        ...(share ? [share.button] : []),
        new pui.CaptionToggleButton(),
        new pui.SettingsToggleButton({ settingsPanel }),
        new pui.CastToggleButton(), // only shown when a Cast device is available (needs `remotecontrol` in the player config)
        // only created where the browser supports them: AirPlay is Safari-only (and then shown when a device is available)
        ...(global.WebKitPlaybackTargetAvailabilityEvent ? [new pui.AirPlayToggleButton()] : []),
        ...(document.pictureInPictureEnabled || document.webkitPictureInPictureEnabled ? [new pui.PictureInPictureToggleButton()] : []),
        // the page's own buttons (options.buttons), styled like the rest
        ...(options.buttons || []),
        createFullscreenButton(options),
      ] }),
    ] });

    // hideDelay: AMP hides the controls after 3 s without mouse activity (its autoHide default).
    // hidePlayerStateExceptions: the controls stay up before playback, while paused and at the end. player.css
    // draws them there in any case; without this, Bitmovin would count them as hidden and, on a touch device,
    // swallow the first tap on a control that is on screen.
    const PlayerState = pui.PlayerUtils && pui.PlayerUtils.PlayerState;
    return new SkinUIContainer(containerConfig(options, {
      hideDelay: 3000,
      hidePlayerStateExceptions: PlayerState
        ? [PlayerState.Idle, PlayerState.Prepared, PlayerState.Paused, PlayerState.Finished]
        : undefined,
      components: [
      subtitleOverlay,
      new pui.BufferingOverlay({ showDelayMs: 0 }), // AMP shows its spinner as soon as playback waits
      new PlaybackOverlay(),
      // touch only (player.css): the 10 s jumps left and right of the big play button, as in AMP's mobile view
      new pui.Container({ cssClasses: ['touch-jumps'], components: [
        new pui.QuickSeekButton({ seekSeconds: -10, cssClass: 'ui-jumpbackbutton' }),
        new pui.QuickSeekButton({ seekSeconds: 10, cssClass: 'ui-jumpforwardbutton' }),
      ] }),
      ...(endSlate ? [endSlate] : []),
      new UnmuteButton(),
      controlBar,
      new pui.DismissClickOverlay({ target: settingsPanel }),
      ...(share ? [new pui.DismissClickOverlay({ target: share.panel }), share.panel] : []),
      settingsPanel,
      new pui.ErrorMessageOverlay(),
    ] }));
  }

  /**
   * Keyboard shortcuts while focus is inside the player (disable with `keyboardShortcuts: false`):
   *   Space / K  play or pause          Left / Right  seek 5 s back / forward     J / L  seek 10 s back / forward
   *   Up / Down  volume +10% / -10%     M  mute or unmute                         F  fullscreen on or off
   *   C  captions on (first track) or off     Home / End  jump to the start / the end
   * Space is left to the focused control when that control is a button, so it is not handled twice.
   * @param {PlayerAPI} player
   * @param {PlayerUIOptions} options
   */
  function enableKeyboardShortcuts(player, options) {
    const container = player.getContainer();
    const ViewMode = player.exports.ViewMode;

    /** @param {number} seconds */
    const seekBy = seconds => {
      const target = player.getCurrentTime() + seconds;
      player.seek(Math.max(0, Math.min(target, player.getDuration() || target)));
    };
    /** @param {number} delta */
    const volumeBy = delta => {
      player.unmute();
      player.setVolume(Math.max(0, Math.min(100, Math.round(player.getVolume() / 10) * 10 + delta)));
    };
    const toggleCaptions = () => {
      const tracks = player.subtitles ? player.subtitles.list() : [];
      if (!tracks.length) return;
      const active = tracks.find(t => t.enabled);
      if (active) player.subtitles.disable(active.id);
      else player.subtitles.enable(tracks[0].id, true);
    };

    container.addEventListener('keydown', e => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const tag = /** @type {Element} */ (e.target).tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      let handled = true;
      switch (key) {
        case ' ':
          if (tag === 'BUTTON') return;
          player.isPlaying() ? player.pause() : player.play();
          break;
        case 'k': player.isPlaying() ? player.pause() : player.play(); break;
        case 'ArrowLeft': seekBy(-5); break;
        case 'ArrowRight': seekBy(5); break;
        case 'j': seekBy(-10); break;
        case 'l': seekBy(10); break;
        case 'Home': player.seek(0); break;
        case 'End': player.seek(player.getDuration()); break;
        case 'ArrowUp': volumeBy(10); break;
        case 'ArrowDown': volumeBy(-10); break;
        case 'm': player.isMuted() ? player.unmute() : player.mute(); break;
        case 'f':
          if (options.fullscreen) options.fullscreen.toggle();
          else player.getViewMode() === ViewMode.Fullscreen ? player.setViewMode(ViewMode.Inline) : player.setViewMode(ViewMode.Fullscreen);
          break;
        case 'c': toggleCaptions(); break;
        default: handled = false;
      }
      if (handled) e.preventDefault();
    });
  }

  /**
   * Screen reader announcements: a visually hidden polite live region that reports state changes
   * (playing, paused, buffering, mute, volume, captions, end of playback). Time is not announced;
   * the seek bar already exposes it through aria-valuetext. Disable with `announcements: false`.
   * @param {PlayerAPI} player
   */
  function enableAnnouncements(player) {
    const container = player.getContainer();
    const region = document.createElement('div');
    region.className = 'bmp-live-region';
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');
    container.appendChild(region);

    /** @param {string} key @param {Record<string, string | number>} [values] @param {string} [suffix] */
    const announce = (key, values, suffix = '') => {
      const message = t('skin.announce.' + key, values)() + suffix;
      region.textContent = '';
      // set the text in a later task so repeated messages are announced again
      setTimeout(() => { region.textContent = message; }, 50);
    };

    const E = player.exports.PlayerEvent;
    /** @type {ReturnType<typeof setTimeout> | undefined} */
    let volumeTimer;
    player.on(E.Playing, () => announce('playing'));
    player.on(E.Paused, () => announce('paused'));
    player.on(E.StallStarted, () => announce('buffering'));
    player.on(E.PlaybackFinished, () => announce('finished'));
    player.on(E.Muted, () => announce('muted'));
    player.on(E.Unmuted, () => announce('unmuted'));
    player.on(E.VolumeChanged, () => {
      clearTimeout(volumeTimer);
      volumeTimer = setTimeout(() => { if (!player.isMuted()) announce('volume', { value: Math.round(player.getVolume()) }); }, 300);
    });
    player.on(E.SubtitleEnabled, e => {
      const subtitle = /** @type {SubtitleEvent} */ (e).subtitle;
      announce('captionsOn', undefined, subtitle && subtitle.label ? ', ' + subtitle.label : '');
    });
    player.on(E.SubtitleDisabled, () => announce('captionsOff'));
  }

  /**
   * UI shown while a linear ad is playing: a reduced control bar (play/pause, mute, volume, fullscreen) and an
   * "Ad 1 of 1" counter with a countdown message. There is no big play button on top of the video during ads.
   * `interactive` adds a skip button for skippable ads and a click-through overlay (a click anywhere opens the
   * advertiser's page and pauses the ad). Only ads that ask the UI for these get them (Bitmovin's own ad player);
   * Google IMA draws its own skip button and click-through, and an overlay would catch its clicks.
   * Turn the ads layout off with `ads: false`.
   * @param {boolean} interactive
   * @param {PlayerUIOptions} options
   */
  function createAdsUI(interactive, options) {
    const PlayerState = pui.PlayerUtils && pui.PlayerUtils.PlayerState;

    const topBar = new pui.Container({
      cssClasses: ['ads-topbar'],
      components: [new pui.AdCounterLabel(), new pui.AdMessageLabel(/** @type {LabelConfig} */ ({ text: t('ads.remainingTime') }))],
    });

    const controlBar = new pui.ControlBar({ components: [
      new pui.Container({ cssClasses: ['controlbar-top'], components: [ new pui.SeekBar() ] }),
      new pui.Container({ cssClasses: ['controlbar-bottom'], components: [
        new pui.PlaybackToggleButton(),
        new pui.VolumeToggleButton(),
        new SettableVolumeSlider(),
        new pui.Spacer(),
        createFullscreenButton(options),
      ] }),
    ] });

    return new SkinUIContainer(containerConfig(options, {
      cssClasses: ['ui-ads'],
      hidePlayerStateExceptions: PlayerState ? [PlayerState.Prepared, PlayerState.Paused, PlayerState.Finished] : undefined,
      components: [
        new pui.BufferingOverlay({ showDelayMs: 0 }), // AMP shows its spinner as soon as playback waits
        ...(interactive ? [new pui.AdClickOverlay()] : []),
        topBar,
        // shows itself only for skippable ads: "Skip ad in 5", then "Skip"
        ...(interactive ? [new pui.AdSkipButton()] : []),
        controlBar,
        new pui.ErrorMessageOverlay(),
      ],
    }));
  }

  /**
   * Hover descriptions: shows each control's accessible name (aria-label) as a native tooltip. The label is
   * copied on hover, so it follows state changes such as Play / Pause. Disable with `tooltips: false`.
   * @param {PlayerAPI} player
   */
  function enableTooltips(player) {
    player.getContainer().addEventListener('mouseover', e => {
      const el = /** @type {Element} */ (e.target).closest('[aria-label]');
      if (el && el.getAttribute('title') !== el.getAttribute('aria-label')) el.setAttribute('title', el.getAttribute('aria-label') || '');
    });
  }

  /**
   * Builds the UI and attaches it to the player. Returns the UIManager. See the notes above for `options`.
   *
   * Further options for pages that put the player into a layout of their own:
   *   buttons             components to add to the control bar, before the fullscreen button
   *   fullscreen          what goes fullscreen; see createFullscreenButton
   *   interactionSource   the element whose activity shows the controls; see containerConfig
   *   clickToPlay         false: a click on the video does not play or pause; see containerConfig
   *   uiConfig            Bitmovin UIConfig for the UIManager, for example `errorMessages`
   * @param {PlayerAPI} player
   * @param {PlayerUIOptions} [options]
   */
  function createPlayerUI(player, options = {}) {
    // all skin styles in player.css are scoped to this class, so the container can have any id
    player.getContainer().classList.add('bmp-amp-skin');
    watchTouchLayout(player);
    // before the components are built: some render their text when they are created
    setLocalization(options.localization);
    const mainUI = createUI(player, options);
    // the ads layout while a linear ad plays, the main layout otherwise. adRequiresUi: the ad player wants the UI
    // to draw skip and click-through (true for Bitmovin's own ad player, false for Google IMA)
    const manager = options.ads === false ? new pui.UIManager(player, mainUI, options.uiConfig) : new pui.UIManager(player, [
      { ui: createAdsUI(true, options), condition: context => context.isAd && context.adRequiresUi },
      { ui: createAdsUI(false, options), condition: context => context.isAd },
      { ui: mainUI, condition: context => !context.isAd },
    ], options.uiConfig);
    if (options.keyboardShortcuts !== false) enableKeyboardShortcuts(player, options);
    if (options.announcements !== false) enableAnnouncements(player);
    if (options.tooltips !== false) enableTooltips(player);
    if (options.autoplaySetting !== false) enableAutoplay(player, options);
    return manager;
  }

  /**
   * Full-screen modal: a floating overlay with its own player. The close button (and Escape, and the
   * end slate's Close button) stops playback at once, releases the player and removes the overlay.
   *
   *   const modal = createPlayerModal({
   *     playerConfig: { key: 'YOUR_KEY_HERE' },   // passed to the Player (ui is always disabled)
   *     playerClass: Player,                       // optional; default: the global bitmovin.player.Player
   *     ui: { share: {...} },                      // options for createPlayerUI
   *     label: 'Episode 1',                        // accessible name of the dialog
   *     onClose: () => {},                         // called after the overlay is gone
   *   });
   *   modal.open({ hls: 'https://example.com/stream.m3u8' });   // returns a promise (load + play)
   *   modal.close();
   * @param {PlayerModalConfig} [config]
   */
  function createPlayerModal(config = {}) {
    /** @type {HTMLDivElement | null} */
    let overlay = null;
    /** @type {PlayerAPI | null} */
    let player = null;
    /** @type {HTMLElement | null} */
    let opener = null;

    /** @param {KeyboardEvent} e */
    function onKeydown(e) {
      if (e.key === 'Escape') close();
    }

    function close() {
      if (!overlay || !player) return;
      const closingPlayer = player;
      const closingOverlay = overlay;
      overlay = null;
      player = null;
      document.removeEventListener('keydown', onKeydown);
      try { closingPlayer.unload(); } catch (e) { /* nothing is loaded yet */ }
      closingPlayer.destroy();
      closingOverlay.remove();
      if (opener && opener.focus) opener.focus();
      if (config.onClose) config.onClose();
    }

    /** @param {SourceConfig} source */
    function open(source) {
      if (overlay) close();
      opener = /** @type {HTMLElement | null} */ (document.activeElement);

      const dialog = document.createElement('div');
      overlay = dialog;
      dialog.className = 'bmp-modal';
      dialog.setAttribute('role', 'dialog');
      dialog.setAttribute('aria-modal', 'true');

      const closeButton = document.createElement('button');
      closeButton.className = 'bmp-modal-close';
      closeButton.type = 'button';
      closeButton.textContent = '\u00d7';
      closeButton.addEventListener('click', close);

      const box = document.createElement('div');
      box.className = 'bmp-modal-player';
      dialog.append(closeButton, box);
      document.body.appendChild(dialog);

      // `key` is required; the Player reports it when missing
      const PlayerClass = config.playerClass || global.bitmovin.player.Player;
      const current = new PlayerClass(box, /** @type {PlayerConfig} */ ({ ...config.playerConfig, ui: false }));
      player = current;
      const ui = config.ui || {};
      createPlayerUI(current, {
        ...ui,
        endSlate: ui.endSlate === false ? false : { ...ui.endSlate, onClose: close },
      });
      // after createPlayerUI, which sets the language
      dialog.setAttribute('aria-label', config.label || t('player')());
      closeButton.setAttribute('aria-label', t('close')());
      document.addEventListener('keydown', onKeydown);
      closeButton.focus();

      return current.load(source).then(() => current.play().catch(() => { /* autoplay blocked: the play button shows */ }));
    }

    return { open, close, get player() { return player; }, get isOpen() { return overlay !== null; } };
  }

  return { createPlayerUI, createPlayerModal };
});
