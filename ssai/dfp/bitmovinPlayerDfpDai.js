/****************************************************************************
 * Bitmovin HTML5 Adaptive Streaming Player.
 * Copyright (C) 2014-2017, Bitmovin Inc., All Rights Reserved
 *
 * This source code and its use and distribution, is subject to the terms
 * and conditions of the applicable license agreement.
 ****************************************************************************/
const bitmovin = window.bitmovin;
(function() {
  var player;
  var fallbackContent;

  function bitmovinPlayerDfpDai(bmPlayer, assetKey, fallbackAsset) {
    player = bmPlayer;
    fallbackContent = fallbackAsset;

    console.log(player.getVideoElement());
    var streamManager = new google.ima.dai.api.StreamManager(player.getVideoElement());
    streamManager.setClickElement(player.getContainer());
    streamManager.addEventListener(
      [google.ima.dai.api.StreamEvent.Type.LOADED,
        google.ima.dai.api.StreamEvent.Type.ERROR,
        google.ima.dai.api.StreamEvent.Type.AD_BREAK_STARTED,
        google.ima.dai.api.StreamEvent.Type.AD_BREAK_ENDED],
      onStreamEvent,
      false);

    player.on(bitmovin.player.PlayerEvent.Metadata, function(data) {
      if (streamManager && data && data.metadataType === 'ID3') {
        streamManager.onTimedMetadata(data.metadata);
      }
    });

    var streamRequest = new google.ima.dai.api.LiveStreamRequest();
    streamRequest.assetKey = assetKey;
    streamRequest.apiKey = '';
    streamManager.requestStream(streamRequest);
  }

  function loadSource(url) {
    console.log('Loading: ' + url);
    player.load({hls: url}).then(function() {
      player.play();
    });
  }

  function onStreamEvent(e) {
    switch (e.type) {
      case google.ima.dai.api.StreamEvent.Type.LOADED:
        console.log('Stream loaded');
        loadSource(e.getStreamData().url);
        break;
      case google.ima.dai.api.StreamEvent.Type.ERROR:
        console.error('Error loading stream, playing backup stream.' + e);
        if (fallbackContent) {
          loadSource(fallbackContent);
        } else {
          console.log('Could not get a stream for assetKey');
        }
        break;
      case google.ima.dai.api.StreamEvent.Type.AD_BREAK_STARTED:
        document.querySelector('.bmpui-ui-uicontainer').style.display = 'none';
        console.log('Ad Break Started');
        break;
      case google.ima.dai.api.StreamEvent.Type.AD_BREAK_ENDED:
        document.querySelector('.bmpui-ui-uicontainer').style.display = 'block';
        console.log('Ad Break Ended');
        break;
      default:
        break;
    }
  }

  window.bitmovinPlayerDfpDai = bitmovinPlayerDfpDai;
})();
