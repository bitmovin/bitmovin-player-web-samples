const conf = {
  key: 'YOUR KEY HERE',
  cast: {
    enable: true
  },
  playback: {
    muted: true,
    autoplay: true,
  },
  logs: {
    level: 'debug'
  },
  style: {
    visibility: {
      // This is required to enable intersttiials viewability tracking.
      // When enabled, the player will track the viewability of interstitials and trigger events accordingly.
      enableTracking: true,
    },
  },
  events: {
    adbreakstarted: console.log,
    adstarted: function(event) {
      console.log('Ad started:', event);

      var clickThroughUrl = event.ad.clickThroughUrl;
      var clickThroughUrlOpened = event.ad.clickThroughUrlOpened;
      if (clickThroughUrl) {
        console.log('ClickThrough URL:', clickThroughUrl);
        // Invoke the clickThroughUrlOpened callback to track the clickThrough URL opening
        clickThroughUrlOpened();
      }
    },
    adquartile: console.log,
    adfinished: console.log,
    adbreakfinished: console.log,
    adclicked: console.log,
    aderror: console.error,
  },
  hls: {
    interstitials: {
      // Preset for standard custom attribute mapping. Setting to 'AD-CREATIVE-SIGNALING' will map
      // custom attributes according to SVTA specification
      customAttributesMappingPreset: 'AD-CREATIVE-SIGNALING',

      // Function for custom attribute mapping. Will be called with the mapping data and the mapping registry
      // When the cllback is set, the preset will be ignored
      // Check out the documentation for more details
      // customAttributesMapping: function(mappingData, mappingRegistry) {
      //   // Map the custom attributes in the provided registry
      // },

      // shouldLoadInterstitial: function(interstitial) {
      //   // Can be used to filter ASSET-LIST interstitials based on a condition
      //   // When returned false, the ASSET-LIST interstitial will not be loaded
      //   console.log('Evaluating whether to load interstitial with id:', interstitial.id);
      //   return interstitial.id === 'some-id';
      // },

      // shouldPlayInterstitial: function(interstitial) {
      //   // Can be used to filter interstitials based on a condition
      //   // When returned false, the interstitial will not be played
      //   console.log('Evaluating whether to play interstitial with id:', interstitial.id);
      //   return interstitial.id !== 'some-other-id';
      // },

      // shouldPlayJumpedOverInterstitials: function(interstitials) {
      //   // Can be used to play interstitials that were jumped over, using seeking/timeshifting
      //   // The returned interstitials list will be played
      //   // In this example, only interstitials with duration > 10 seconds will be played
      //   console.log('Evaluating jumped over interstitials:', interstitials);
      //   return interstitials.filter(interstitial => interstitial.duration > 10);
      // }
    }
  },
  tweaks: {
    // Enable handling of HLS interstitials.
    // Requires `AdvertisingCore` module to be included when modular player is used
    enable_sgai_handling: true,
    // Required to enable interstitials in Safari
    native_hls_parsing: true,
  },
};

var source = {
  hls: 'https://enter-your-own-interstitials-stream.m3u8',
};

var player = new bitmovin.player.Player(document.getElementById('player'), conf);

player.load(source);
