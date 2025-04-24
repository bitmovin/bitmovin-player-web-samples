import {
  Player,
  PlayerConfig,
  SourceConfig,
  util,
} from 'bitmovin-player/modules/bitmovinplayer-core';
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
import SubtitlesVttModule from 'bitmovin-player/modules/bitmovinplayer-subtitles-vtt';
import StyleModule from 'bitmovin-player/modules/bitmovinplayer-style';

//Import the UI components from the player UI npm package:
import {
  UIContainer,
  UIManager,
  SubtitleOverlay,
  SettingsPanel,
  SubtitleSettingsPanelPage,
} from 'bitmovin-player-ui';

import 'bitmovin-player-ui/dist/css/bitmovinplayer-ui.css';

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
Player.addModule(SubtitlesVttModule);
Player.addModule(StyleModule);

const config: PlayerConfig = new util.PlayerConfigBuilder('YOUR-KEY-HERE')
  .optimizeForPlatform()
  .mergeWith({ ui: false, playback: { muted: true, autoplay: true } })
  .build();
console.log('player config:', config);

const playerContainer = document.getElementById('player-container');
if (!playerContainer) {
  throw new Error('Player container not found');
}
const player = new Player(playerContainer, config);

const source: SourceConfig = {
  title: 'Sintel',
  dash: 'https://cdn.bitmovin.com/content/assets/sintel/sintel.mpd',
  hls: 'https://cdn.bitmovin.com/content/assets/sintel/hls/playlist.m3u8',
  poster: 'https://cdn.bitmovin.com/content/assets/sintel/poster.png',
};

player.load(source).then(() => {
  // To demonstrate that the SubtitleOverlay is actually working, we just select
  // the first subtitle track
  player.subtitles.enable(player.subtitles.list()[0].id, true);

  const uiManager = createSubtitleOverlay();

  // Subtitles can be customized using the SubtitleSettingsManager.
  // Supported values for `fontSize` can be found here (the `key` properties):
  // https://github.com/bitmovin/bitmovin-player-ui/blob/a8c1d1e7d5eda4154841bbc457848520a2d870bf/src/ts/components/subtitlesettings/fontsizeselectbox.ts#L23-L30
  uiManager.getSubtitleSettingsManager().fontSize.value = '150';

  console.log('Successfully created player instance');
});

function createSubtitleOverlay() {
  const subtitleOverlay = new SubtitleOverlay();
  const settingsPanel = new SettingsPanel({
    components: [],
    hidden: true,
  });

  // Subtitle styling only works if a `SubtitleSettingsPanelPage` (with the corresponding Subtitle Settings elements)
  // are in the UI tree.
  const subtitleSettingsPanelPage =
    new SubtitleSettingsPanelPage({
      settingsPanel: settingsPanel,
      overlay: subtitleOverlay,
    });
  settingsPanel.addComponent(subtitleSettingsPanelPage);

  // Create a custom UI structure with only the SubtitleOverlay (and the hidden SettingsPanel to enable UI customizations)
  const subtitleUI = new UIContainer({
    components: [
      subtitleOverlay,
      settingsPanel,
    ],
  });

  // Launch the UI
  return new UIManager(player, subtitleUI);
}
