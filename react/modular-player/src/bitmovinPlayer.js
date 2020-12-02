import React from 'react';
import {Player} from 'bitmovin-player/modules/bitmovinplayer-core';
import EngineBitmovinModule from 'bitmovin-player/modules/bitmovinplayer-engine-bitmovin';
import MseRendererModule from 'bitmovin-player/modules/bitmovinplayer-mserenderer';
import HlsModule from 'bitmovin-player/modules/bitmovinplayer-hls';
import DashModule from 'bitmovin-player/modules/bitmovinplayer-dash';
import AbrModule from 'bitmovin-player/modules/bitmovinplayer-abr';
import XmlModule from 'bitmovin-player/modules/bitmovinplayer-xml';
import ContainerTSModule from 'bitmovin-player/modules/bitmovinplayer-container-ts';
import ContainerMp4Module from 'bitmovin-player/modules/bitmovinplayer-container-mp4';
import SubtitlesModule from 'bitmovin-player/modules/bitmovinplayer-subtitles';
import SubtitlesCEA608Module from 'bitmovin-player/modules/bitmovinplayer-subtitles-cea608';
import PolyfillModule from 'bitmovin-player/modules/bitmovinplayer-polyfill';
import StyleModule from 'bitmovin-player/modules/bitmovinplayer-style';

import {UIFactory} from 'bitmovin-player/bitmovinplayer-ui';
import 'bitmovin-player/bitmovinplayer-ui.css';

class BitmovinPlayer extends React.Component {

    state = {
        player: null,
    };

    playerConfig = {
        key: 'YOUR KEY HERE'
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
        Player.addModule(EngineBitmovinModule);
        Player.addModule(MseRendererModule);
        Player.addModule(HlsModule);
        Player.addModule(XmlModule);
        Player.addModule(DashModule);
        Player.addModule(AbrModule);
        Player.addModule(ContainerTSModule);
        Player.addModule(ContainerMp4Module);
        Player.addModule(SubtitlesModule);
        Player.addModule(SubtitlesCEA608Module);
        Player.addModule(PolyfillModule);
        Player.addModule(StyleModule);

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
