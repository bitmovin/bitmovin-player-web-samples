import { LogLevel, Player, PlayerConfig, SourceConfig } from 'bitmovin-player/modules/bitmovinplayer-core';
import PolyfillModule from 'bitmovin-player/modules/bitmovinplayer-polyfill';
import EngineBitmovinModule from 'bitmovin-player/modules/bitmovinplayer-engine-bitmovin';
import MseRendererModule from 'bitmovin-player/modules/bitmovinplayer-mserenderer';
import HlsModule from 'bitmovin-player/modules/bitmovinplayer-hls';
import XmlModule from 'bitmovin-player/modules/bitmovinplayer-xml';
import DashModule from 'bitmovin-player/modules/bitmovinplayer-dash';
import AbrModule from 'bitmovin-player/modules/bitmovinplayer-abr';
import ContainerTSModule from 'bitmovin-player/modules/bitmovinplayer-container-ts';
import ContainerMp4Module from 'bitmovin-player/modules/bitmovinplayer-container-mp4';
import SubtitlesModule from 'bitmovin-player/modules/bitmovinplayer-subtitles';
import SubtitlesCEA608Module from 'bitmovin-player/modules/bitmovinplayer-subtitles-cea608';
import StyleModule from 'bitmovin-player/modules/bitmovinplayer-style';

import { UIFactory } from 'bitmovin-player-ui';
import 'bitmovin-player-ui/dist/css/bitmovinplayer-ui.css'

Player.addModule(EngineBitmovinModule);
Player.addModule(PolyfillModule);
Player.addModule(MseRendererModule);
Player.addModule(HlsModule);
Player.addModule(XmlModule);
Player.addModule(DashModule);
Player.addModule(AbrModule);
Player.addModule(ContainerTSModule);
Player.addModule(ContainerMp4Module);
Player.addModule(SubtitlesModule);
Player.addModule(SubtitlesCEA608Module);
Player.addModule(StyleModule);

const conf: PlayerConfig = {
  key: "YOUR-KEY-HERE",
  logs: {
    level: LogLevel.DEBUG
  },
  ui: false,
};

const player = new Player(document.getElementById("player"), conf);

const uiManager = UIFactory.buildUI(player);

const source: SourceConfig = {
  title: "Art of Motion",
  dash: "https://bitmovin-a.akamaihd.net/content/MI201109210084_1/mpds/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.mpd",
  hls: "https://bitmovin-a.akamaihd.net/content/MI201109210084_1/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8",
};


player.load(source);
