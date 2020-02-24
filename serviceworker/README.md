## ServiceWorker sample app

This folder contains a sample page to test `ServiceWorker` support for Native HLS player.

## Steps to run app

- Run a simple http server, e.g, https://www.npmjs.com/package/http-server
- Open `index.html` in browser

## Points to note

- ServiceWorker only works for `localhost` and `https` protocol. So using `http` will not work
- ServiceWorker enables support for event tracking for Native HLS playback i.e, Hls on Safari, without having duplicate manifest requests.
