import { Player } from 'bitmovin-player';
import { UIFactory } from 'bitmovin-player-ui';
require('bitmovin-player-ui/dist/css/bitmovinplayer-ui.css');

const conf = {
  key: 'YOUR KEY HERE',
  ui: false
};
const source = {
  dash: 'https://cdn.bitmovin.com/content/assets/art-of-motion-dash-hls-progressive/mpds/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.mpd',
  hls: 'https://cdn.bitmovin.com/content/assets/art-of-motion-dash-hls-progressive/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8',
  progressive: 'https://cdn.bitmovin.com/content/assets/art-of-motion-dash-hls-progressive/MI201109210084_mpeg-4_hd_high_1080p25_10mbits.mp4',
  poster: 'https://cdn.bitmovin.com/content/assets/art-of-motion-dash-hls-progressive/poster.jpg'
};

const player = new Player(document.getElementById('player'), conf);

UIFactory.buildUI(player);
player.load(source).then(function () {
    console.log('Successfully loaded source');
}, function () {
    console.log('Error while loading source');
});
