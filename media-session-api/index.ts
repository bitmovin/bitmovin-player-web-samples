import { LogLevel, Player, PlayerConfig, SourceConfig, PlayerEvent } from 'bitmovin-player/modules/bitmovinplayer-core';
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

const assets = [
  {
    sourceConfig: {
      title: 'Art of Motion',
      dash: 'https://bitmovin-a.akamaihd.net/content/MI201109210084_1/mpds/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.mpd',
      hls: 'https://bitmovin-a.akamaihd.net/content/MI201109210084_1/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8',
    },
    mediaSessionMetadata: {
      title: 'Art of Motion, Greece',
      artist: 'Red Bull',
      album: 'Red Bull Art of Motion',
      artwork: [
        { src: 'resources/art-of-motion-96.jpeg',  sizes: '96x96',   type: 'image/jpg' },
        { src: 'resources/art-of-motion-128.jpeg', sizes: '128x128', type: 'image/jpg' },
        { src: 'resources/art-of-motion-192.jpeg', sizes: '192x192', type: 'image/jpg' },
        { src: 'resources/art-of-motion-256.jpeg', sizes: '256x256', type: 'image/jpg' },
        { src: 'resources/art-of-motion-512.jpeg', sizes: '512x512', type: 'image/jpg' },
      ]
    }
  }
];
let currentAssetIndex = 0;

const conf: PlayerConfig = {
  key: 'YOUR-KEY-HERE',
  logs: {
    level: LogLevel.DEBUG
  },
  ui: false,
};

const player = new Player(document.getElementById('player'), conf);
const uiManager = UIFactory.buildDefaultUI(player);

player.on(PlayerEvent.Playing, () => {
  if (!('mediaSession' in navigator)) {
    return;
  }

  setMediaSessionMetadata();
  setupMediaSessionActionHandlers();
  updatePositionState();
});

player.on(PlayerEvent.Paused, () => {
  if (!('mediaSession' in navigator)) {
    return;
  }
  navigator.mediaSession.playbackState = 'paused'
});

player.on(PlayerEvent.Play, () => {
  if (!('mediaSession' in navigator)) {
    return;
  }
  navigator.mediaSession.playbackState = 'playing'
});

player.on(PlayerEvent.SourceUnloaded, () => {
  if (!('mediaSession' in navigator)) {
    return;
  }
  // Reset position state when media is reset.
  navigator.mediaSession.setPositionState(null);
});

player.on(PlayerEvent.Destroy, () => {
  if (!('mediaSession' in navigator)) {
    return;
  }
  // Reset position state when media is reset.
  navigator.mediaSession.setPositionState(null);
});

player.on(PlayerEvent.PlaybackSpeedChanged, () => {
  updatePositionState();
});

player.load(assets[currentAssetIndex].sourceConfig);

function setMediaSessionMetadata() {
  navigator.mediaSession.metadata = new MediaMetadata(assets[currentAssetIndex].mediaSessionMetadata);
}

function setupMediaSessionActionHandlers() {
  const defaultSkipTime = 10;

  const actionHandlers: {action: MediaSessionAction, handler: MediaSessionActionHandler}[] = [
    {
      action: 'seekbackward', 
      handler: (details) => {
        const skipTime = details.seekOffset || defaultSkipTime;
        player.seek(Math.max(player.getCurrentTime() - skipTime, 0));
        updatePositionState();
      },
    }, {
      action: 'seekforward', 
      handler: (details) => {
        const skipTime = details.seekOffset || defaultSkipTime;
        player.seek(Math.min(player.getCurrentTime() + skipTime, player.getDuration()))
        updatePositionState();
      },
    }, {
      action: 'seekto', 
      handler: (details) => {
        player.seek(details.seekTime);
        updatePositionState();
      },
    }, {
      action: 'play', 
      handler: () => player.play(),
    }, {
      action: 'pause', 
      handler: () => player.pause(),
    }, {
      action: 'stop',
      handler: () => player.unload()
    }
  ];

  for (const {action, handler} of actionHandlers) {
    try {
      navigator.mediaSession.setActionHandler(action, handler);
    } catch (error) {
      console.log(`The media session action '${action}' is not supported yet.`, error);
    }
  }
}

function updatePositionState() {
  if ('setPositionState' in navigator.mediaSession) {
    navigator.mediaSession.setPositionState({
      duration: player.getDuration(),
      playbackRate: player.getPlaybackSpeed(),
      position: player.getCurrentTime(),
    });
  }
}