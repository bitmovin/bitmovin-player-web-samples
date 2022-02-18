const playerConfig = {
  // this license key is only for the tutorial examples
  key: "29ba4a30-8b5e-4336-a7dd-c94ff3b25f30",
  // This won't configure any ads but it will make the PlayerAdvertisingAPI available
  advertising: {}
};
// By default Bitmovin Player uses IMA Advertising Module so this activates Bitmovin Advertising Module to give you more control
bitmovin.player.Player.addModule(window.bitmovin.player['advertising-bitmovin'].default);

const player = new bitmovin.player.Player(document.getElementById('player'), playerConfig);

player.load(getSource()).then( () =>
  player.ads.schedule({
    tag: {
      url: 'https://pubads.g.doubleclick.net/gampad/ads?sz=640x480&iu=/124319096/external/single_ad_samples&ciu_szs=300x250&impl=s&gdfp_req=1&env=vp&output=vast&unviewed_position_start=1&cust_params=deployment%3Ddevsite%26sample_ct%3Dskippablelinear&correlator=',
      type: 'vast'
    },
    id: 'Ad',
    position: "15",
  })
).catch( (err) => console.log("[!]", err) )

function getSource()
{
  return ({
    "dash": "https://bitmovin-a.akamaihd.net/content/MI201109210084_1/mpds/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.mpd",
    "hls": "https://bitmovin-a.akamaihd.net/content/MI201109210084_1/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8",
    "smooth": "https://test.playready.microsoft.com/smoothstreaming/SSWSS720H264/SuperSpeedway_720.ism/manifest",
    "progressive": "https://bitmovin-a.akamaihd.net/content/MI201109210084_1/MI201109210084_mpeg-4_hd_high_1080p25_10mbits.mp4",
    "poster": "https://bitmovin-a.akamaihd.net/content/MI201109210084_1/poster.jpg"
  });
}
