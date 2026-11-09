# AMP-style skin for the Bitmovin Player UI

A control-bar skin for the Bitmovin Web Player 8 that reproduces the look of the Akamai AMP player.

## Launch

Needs Node 18 or newer (`.nvmrc`).

```bash
npm install
npm run dev     # http://localhost:8000/index.html
npm run build   # minified files in dist/
npm run check   # type check player-ui.js
```

`player-ui.js` stays plain JavaScript. `npm run check` checks it with TypeScript against the Bitmovin Player and UI type packages, from the JSDoc types in the file and `types/globals.d.ts`. When you update the Player or UI version, update the type packages to match.

## Use

Copy `player.css` and `player-ui.js`.

```html
<script src="https://cdn.bitmovin.com/player/web/8/bitmovinplayer.js"></script>
<script src="https://cdn.bitmovin.com/player/web/8/bitmovinplayer-ui.js"></script>
<link rel="stylesheet" href="https://cdn.bitmovin.com/player/web/8/bitmovinplayer-ui.css">
<link rel="stylesheet" href="player.css">

<div id="video"></div>
<script src="player-ui.js"></script>
<script>
  const player = new bitmovin.player.Player(document.getElementById('video'), { key: 'YOUR-PLAYER-LICENSE-KEY', ui: false });
  createPlayerUI(player);
  player.load({ hls: 'https://example.com/stream.m3u8' });
</script>
```

### With a bundler or `require`

`player-ui.js` is a UMD module. With CommonJS or a bundler (webpack, Vite, esbuild), it loads `bitmovin-player-ui` itself and sets no globals. Install `bitmovin-player` and `bitmovin-player-ui`, then import the skin and its CSS:

```js
import { Player } from 'bitmovin-player';
import { createPlayerUI, createPlayerModal } from './player-ui.js';
import 'bitmovin-player-ui/dist/css/bitmovinplayer-ui.css';
import './player.css';

const player = new Player(document.getElementById('video'), { key: 'YOUR-PLAYER-LICENSE-KEY', ui: false });
createPlayerUI(player);

// The modal makes its own player. Without a global `bitmovin`, give it the Player class:
const modal = createPlayerModal({ playerClass: Player, playerConfig: { key: 'YOUR-PLAYER-LICENSE-KEY' } });
```

Native browser modules (`<script type="module">` without a bundler) are not supported. Use the plain script.

## Text and languages

The skin uses Bitmovin's UI translations (de, es, fr, nl, pt) where Bitmovin has the text. Text that only the skin has (`skin.*` keys, see `VOCABULARY_EN` in `player-ui.js`) is in English. To set the language or add text, pass a Bitmovin UI localization config:

```js
createPlayerUI(player, { localization: { language: 'auto', vocabularies: { de: { 'skin.share': 'Teilen' } } } });
```

## Autoplay setting

The Settings menu has an Autoplay switch. The viewer's choice is saved in `localStorage` under one key for the whole origin. It applies to every player on every page of the site, and it overrides `options.autoplay` from then on. To remove the switch, use `createPlayerUI(player, { autoplaySetting: false })`.

## Pages with their own layout

Some pages put the player into a layout of their own, for example a box with a WebGL canvas under the player. These options fit the skin into such a layout:

| Option              | What it does                                                                                       |
| ------------------- | -------------------------------------------------------------------------------------------------- |
| `buttons`           | Bitmovin UI components to add to the control bar, before the fullscreen button.                    |
| `fullscreen`        | `{ toggle, onChange }`: the page decides what goes fullscreen. The button and the F key call `toggle`. `onChange(listener)` must call `listener(true)` or `listener(false)` on each change. |
| `interactionSource` | The element whose mouse and touch activity shows the controls. Default: the UI itself.            |
| `clickToPlay`       | `false`: a click on the video does not play or pause, and the pointer goes through to what is under it. Only the big play button plays. |
| `uiConfig`          | A Bitmovin `UIConfig` for the `UIManager`, for example `errorMessages`.                            |
| `share.url`         | A string, or a function that returns the link on each share.                                       |

```js
createPlayerUI(player, {
  buttons: [myVrButton],
  fullscreen: { toggle: toggleStageFullscreen, onChange: listener => fullscreenListeners.push(listener) },
  interactionSource: document.getElementById('stage'),
  clickToPlay: false,
  uiConfig: { errorMessages: { 1301: 'This device cannot play this video.' } },
});
```
