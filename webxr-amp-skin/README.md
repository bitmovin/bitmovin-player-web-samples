# WebXR Sample with AMP-style Skin

Plays a 360° video with the Bitmovin Player and the
[`@bitmovin/player-integration-webxr`](https://www.npmjs.com/package/@bitmovin/player-integration-webxr) package,
with the player UI in an AMP-style skin. The video is drawn onto a sphere in an [A-Frame](https://aframe.io/) scene.

For the same page with the default Bitmovin Player UI, see the [WebXR sample](../webxr/).

- On the page, drag the video to look around. On a phone or tablet, tilt the device after the first tap.
- The control bar is the skin's: 10-second jumps, time, volume, share, captions, settings and fullscreen.
  Picture-in-picture, Cast and AirPlay are hidden: they would show the flat 360° image, not the view.
- A click on the picture does not play or pause, because each drag ends in a click. Only the big play button does.
  On a touch device, a tap on the picture shows or hides the controls.
- Fullscreen includes the scene. On iPhone, which has no fullscreen for elements, the video box fills the viewport.
- A compass in the top right corner shows where you look, relative to the front of the video.
- Where the browser supports immersive VR, for example on Meta Quest or Apple Vision Pro,
  a VR button shows before the fullscreen button. In VR, the integration's control bar shows in the scene.
  It shows the source's title, description, poster and metadata.

## Files

- `skin/player-ui.js` and `skin/player.css`: the skin. A plain script that registers `createPlayerUI()` on `window`.
  `src/skin.ts` gives it the player UI module and types its options.
- `src/index.ts`: player config, source and the steps of `main()`.
- `src/player-ui.ts`: the skin with a VR button, fullscreen of the video box and tap-to-hide.
- `src/integration.ts`: the WebXR integration and the UI in VR sessions.
- `src/fullscreen.ts`, `src/scene.ts`, `src/custom-icons.ts`: details.

## Get started

1) Install [npm](https://www.npmjs.com/get-npm)
2) Install packages with `npm install`
3) Enter your player license key in `src/index.ts` (replace `YOUR-PLAYER-LICENSE-KEY` with it)
4) Build the sample using `npm run build`
5) Open `index.html` via a webserver from the repository root, for example `npx http-server` there,
   and go to `/webxr-amp-skin/`. The page loads images from `../images/`.

WebXR needs a secure context. `localhost` is one, but to open the page on a headset over the network, serve it via HTTPS.
