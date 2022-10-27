import React from 'react';
import {Player} from 'bitmovin-player';
import {UIFactory} from 'bitmovin-player/bitmovinplayer-ui';
import 'bitmovin-player/bitmovinplayer-ui.css';

class BitmovinPlayer extends React.Component {

  state = {
    player: null,
  };

  playerConfig = {
    key: 'YOUR KEY HERE',
    ui: false
  };

  playerSource = {
    dash: 'https://bitdash-a.akamaihd.net/content/MI201109210084_1/mpds/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.mpd',
    hls: 'https://bitdash-a.akamaihd.net/content/MI201109210084_1/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8',
    poster: 'https://bitdash-a.akamaihd.net/content/MI201109210084_1/poster.jpg'
  };

  constructor(props) {
    super(props);
    this.playerDiv = React.createRef();
  }

  componentDidMount() {
    this.setupPlayer();
  }

  componentWillUnmount() {
    this.destroyPlayer();
  }

  setupPlayer() {
    const player = new Player(this.playerDiv.current, this.playerConfig);
    UIFactory.buildDefaultUI(player);
    player.load(this.playerSource).then(() => {
      this.setState({
        ...this.state,
        player
      });
      console.log('Successfully loaded source');
    }, () => {
      console.log('Error while loading source');
    });
  }

  destroyPlayer() {
    if (this.state.player != null) {
      this.state.player.destroy();
      this.setState({
        ...this.state,
        player: null
      });
    }
  }

  render() {
    return <div id='player' ref={this.playerDiv}/>;
  }
}

export default BitmovinPlayer;
