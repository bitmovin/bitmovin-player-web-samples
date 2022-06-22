import { LogLevel, Player, PlayerConfig, PlayerEvent } from 'bitmovin-player/modules/bitmovinplayer-core';
import PolyfillModule from 'bitmovin-player/modules/bitmovinplayer-polyfill';
import StyleModule from 'bitmovin-player/modules/bitmovinplayer-style';
import XmlModule from 'bitmovin-player/modules/bitmovinplayer-xml';
import AdvertisingCoreModule from 'bitmovin-player/modules/bitmovinplayer-advertising-core';
import AdvertisingBitmovinModule from 'bitmovin-player/modules/bitmovinplayer-advertising-bitmovin';
import EngineBitmovinModule from 'bitmovin-player/modules/bitmovinplayer-engine-bitmovin';
import MseRendererModule from 'bitmovin-player/modules/bitmovinplayer-mserenderer';
import HlsModule from 'bitmovin-player/modules/bitmovinplayer-hls';
import AbrModule from 'bitmovin-player/modules/bitmovinplayer-abr';
import ContainerTsModule from 'bitmovin-player/modules/bitmovinplayer-container-ts';
import EngineNativeModule from 'bitmovin-player/modules/bitmovinplayer-engine-native';

import { UIFactory } from 'bitmovin-player-ui';
import 'bitmovin-player-ui/dist/css/bitmovinplayer-ui.css'
import { BitmovinYospacePlayer, YospaceAssetType, YospaceConfiguration, YospaceSourceConfig } from '@bitmovin/player-integration-yospace';

// Adding relevant Bitmovin Player Modules
Player.addModule(PolyfillModule);
Player.addModule(StyleModule);
Player.addModule(XmlModule);
Player.addModule(AdvertisingCoreModule);
Player.addModule(AdvertisingBitmovinModule);
Player.addModule(EngineBitmovinModule);
Player.addModule(MseRendererModule);
Player.addModule(HlsModule);
Player.addModule(AbrModule);
Player.addModule(ContainerTsModule);
Player.addModule(EngineNativeModule);

// Bitmovin Player configuration as usual
const conf: PlayerConfig = {
  key: "YOUR-KEY-HERE",
  logs: {
    level: LogLevel.DEBUG
  },
  ui: false,
};

// Optional configuration specific to Yospace
const ysConf: YospaceConfiguration = {
  debug: true,
  disableServiceWorker: true,
}

// Pass the imported `Player` object which got all the needed modules to the `BitmovinYospacePlayer`
const player = new BitmovinYospacePlayer(Player, document.getElementById("player"), conf, ysConf);

const uiManager = UIFactory.buildDefaultUI(player);

const source: YospaceSourceConfig = {
  title: 'VOD Stream',
  hls: 'https://csm-e-sdk-validation.bln1.yospace.com/csm/access/207411697/c2FtcGxlL21hc3Rlci5tM3U4?yo.av=3',
  assetType: YospaceAssetType.VOD,
};

player.load(source);

player.on(PlayerEvent.SourceLoaded, () => {
  // Show ad breaks as markers in the UI scrubbar
  player.ads.list().forEach((adBreak) => uiManager.addTimelineMarker({ time: adBreak.scheduleTime, title: 'Ad Break' }));
});

(window as any).player = player;