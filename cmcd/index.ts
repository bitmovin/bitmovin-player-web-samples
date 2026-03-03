import { Player, PlayerConfig, SourceConfig } from "bitmovin-player";
import { UIFactory } from "bitmovin-player-ui";
import { CmcdConfig, CmcdIntegration, CustomKey } from "@bitmovin/player-web-integration-cmcd";
import { v4 as uuidv4 } from 'uuid';

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
  sessionId: uuidv4(),
  contentId: '1111-111111-111111-11111',
  customKeys: [
    new CustomKey('com.example-player_name', 'bitmovin-player'),
  ]
};

const cmcdIntegration = new CmcdIntegration(cmcdConfig);
playerConfig.network = {
  preprocessHttpRequest: cmcdIntegration.preprocessHttpRequest,
  preprocessHttpResponse: cmcdIntegration.preprocessHttpResponse as any,
}
playerConfig.adaptation = {
  desktop: {
    onVideoAdaptation: cmcdIntegration.onVideoAdaptation,
    onAudioAdaptation: cmcdIntegration.onAudioAdaptation,
  },
  mobile: {
    onVideoAdaptation: cmcdIntegration.onVideoAdaptation,
    onAudioAdaptation: cmcdIntegration.onAudioAdaptation,
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
const uimanager = UIFactory.buildUI(player);

cmcdIntegration.setPlayer(player);
cmcdIntegration.setSessionId((player as any).analytics.getCurrentImpressionId());

player.load(sourceConfig);
