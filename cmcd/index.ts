import { Player, PlayerConfig, SourceConfig } from "bitmovin-player";
import { UIFactory } from "bitmovin-player-ui";
import { CmcdConfig, CmcdPlugin } from "./CmcdPlugin";

const playerConfig: PlayerConfig = {
  key: '7e9c8483-ea84-423e-b675-19cf31dec43a',
  playback: {
    autoplay: true,
    muted: true,
  },
  ui: false,
};

const cmcdConfig: CmcdConfig = {
  useQueryArgs: true,
  sessionId: '6e2fb550-c457-11e9-bb97-0800200c9a66',
  contentId: '1111-111111-1111="asdf"11-11111',
};

const cmcdPlugin = new CmcdPlugin(cmcdConfig);
playerConfig.network = {
  preprocessHttpRequest: cmcdPlugin.preprocessHttpRequest,
  preprocessHttpResponse: cmcdPlugin.preprocessHttpResponse,
}
playerConfig.adaptation = {
  desktop: {
    onVideoAdaptation: cmcdPlugin.onVideoAdaptation,
    onAudioAdaptation: cmcdPlugin.onAudioAdaptation,
  },
  mobile: {
    onVideoAdaptation: cmcdPlugin.onVideoAdaptation,
    onAudioAdaptation: cmcdPlugin.onAudioAdaptation,
  },
}

const sourceConfig: SourceConfig = {
  title: 'Art of Motion',
  hls: 'https://cdn.bitmovin.com/content/assets/streams-sample-video/tos/m3u8/index.m3u8',
};

const htmlContainer = document.getElementById('playerContainer');
if (!htmlContainer) {
  throw new Error('No HTMLElement with ID `player` found.');
}
const player = new Player(htmlContainer, playerConfig);
const uimanager = UIFactory.buildDefaultUI(player);

cmcdPlugin.setPlayer(player);

player.load(sourceConfig).then(() => {

});
