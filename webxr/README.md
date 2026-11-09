# WebXR Sample

Plays a 360° video with the Bitmovin Player and the
[`@bitmovin/player-integration-webxr`](https://www.npmjs.com/package/@bitmovin/player-integration-webxr) package.
The video is drawn onto a sphere in an [A-Frame](https://aframe.io/) scene.

- On the page, drag the video to look around. On a phone or tablet, tilt the device after the first tap.
- The control bar is the default Bitmovin Player UI. Its fullscreen button includes the scene.
- A compass in the top right corner shows where you look, relative to the front of the video.
- Where the browser supports immersive VR, for example on Meta Quest or Apple Vision Pro,
  a VR button shows before the fullscreen button. In VR, the integration's control bar shows in the scene.

## Get started

1) Install [npm](https://www.npmjs.com/get-npm)
2) Install packages with `npm install`
3) Enter your player license key in `src/index.ts` (replace `YOUR-PLAYER-LICENSE-KEY` with it)
4) Build the sample using `npm run build`
5) Open `index.html` via a webserver, for example `npx http-server` in this directory

WebXR needs a secure context. `localhost` is one, but to open the page on a headset over the network, serve it via HTTPS.
