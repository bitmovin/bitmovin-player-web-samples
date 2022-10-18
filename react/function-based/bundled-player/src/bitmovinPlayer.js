import React from 'react';
import { Player } from 'bitmovin-player';
import { UIFactory } from 'bitmovin-player/bitmovinplayer-ui';
import 'bitmovin-player/bitmovinplayer-ui.css';

function BitmovinPlayer() {

  const [player, setPlayer] = useState(null);

  const playerConfig = {
    key: 'YOUR KEY HERE'
  };

  const playerSource = {
    dash: 'https://bitdash-a.akamaihd.net/content/MI201109210084_1/mpds/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.mpd',
    hls: 'https://bitdash-a.akamaihd.net/content/MI201109210084_1/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8',
    poster: 'https://bitdash-a.akamaihd.net/content/MI201109210084_1/poster.jpg'
  };
  const playerDiv = React.createRef();


  useEffect(() => {
    function setupPlayer() {
      const playerInstance = new Player(playerDiv.current, playerConfig);
      UIFactory.buildDefaultUI(playerInstance);
      playerInstance.load(playerSource).then(() => {
        setPlayer(playerInstance)
        console.log('Successfully loaded source');
      }, () => {
        console.log('Error while loading source');
      });
    }

    setupPlayer();

    return () => {
      function destroyPlayer() {
        if (player != null) {
          player.destroy();
          setPlayer(null);
        }
      }
      destroyPlayer();
    }
  }, [])

  return <div id='player' ref={playerDiv}/>;
}

export default BitmovinPlayer;
