import { Player, PlayerConfig, SourceConfig } from "bitmovin-player";
import { UIFactory } from "bitmovin-player-ui";

const playerConfig: PlayerConfig = {
  key: '7e9c8483-ea84-423e-b675-19cf31dec43a',
  playback: {
    autoplay: true,
    muted: true,
  },
  ui: false,
};

const sourceConfig: SourceConfig = {
  title: 'Art of Motion',
  hls: 'https://cdn.bitmovin.com/content/assets/streams-sample-video/tos/m3u8/index.m3u8',
};

const htmlContainer = document.getElementById('playerContainer');
const player = new Player(htmlContainer, playerConfig);
const uimanager = UIFactory.buildDefaultUI(player);

player.load(sourceConfig).then(() => {

});
