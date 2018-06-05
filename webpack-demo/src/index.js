var bitmovinplayer = require('bitmovin-player');
var playerui       = require('bitmovin-player-ui');
require('bitmovin-player-ui/dist/css/bitmovinplayer-ui.min.css');

if (location.protocol === 'file:') {
  document.getElementById('webserver-warning').style.display = 'block';
}

var conf = {
  key: 'YOUR KEY HERE',
  source: {
    dash: 'https://bitdash-a.akamaihd.net/content/MI201109210084_1/mpds/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.mpd',
    hls: 'https://bitdash-a.akamaihd.net/content/MI201109210084_1/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8',
    progressive: 'https://bitdash-a.akamaihd.net/content/MI201109210084_1/MI201109210084_mpeg-4_hd_high_1080p25_10mbits.mp4',
    poster: 'https://bitdash-a.akamaihd.net/content/MI201109210084_1/poster.jpg'
  },
  style: {
    width: '100%',
    aspectratio: '16:9',
    ux: false
  }
};

var player = bitmovinplayer('player');

player.setup(conf).then(function (value) {
  playerui.UIManager.Factory.buildDefaultUI(player);
  console.log('Successfully created Bitmovin Player instance'); // Success!
}, function(reason) {
  console.log('Error while creating Bitmovin Player instance'); // Error!
});