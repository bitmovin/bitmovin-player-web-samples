import ConvivaAnalyticsModule from '@bitmovin/player-integration-conviva';
import { PlayerConfig, PlayerEvent, SourceConfig } from 'bitmovin-player';
import { BitmovinPlayer } from 'bitmovin-player-react';
import { Fragment } from 'react';

const defaultPlayerSource: SourceConfig = {
  hls: 'https://cdn.bitmovin.com/content/assets/streams-sample-video/sintel/m3u8/index.m3u8',
};

const {ConvivaAnalytics} = ConvivaAnalyticsModule;

const playerConfig: PlayerConfig = {
  key: '<playerKey>',
  playback: {
    muted: true,
    autoplay: true,
  },
  advertising: {
    adBreaks: [
      {
        tag: {
          url: 'https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/single_preroll_skippable&sz=640x480&ciu_szs=300x250%2C728x90&gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&impl=s&correlator=',
          type: 'vast',
        },
        id: 'ad-pre-skippable',
        position: 'pre',
      } as any,
      {
        tag: {
          url: 'https://pubads.g.doubleclick.net/gampad/ads?sz=640x480&iu=/32573358/skippable_ad_unit&impl=s&gdfp_req=1&env=vp&output=xml_vast2&unviewed_position_start=1&url=http%3A%2F%2Freleasetest.dash-player.com%2Fads%2F&description_url=[description_url]&correlator=[random]',
          type: 'vast',
        },
        id: 'ad-30-skippable',
        position: '30%',
      } as any,
      {
        tag: {
          url: 'https://pubads.g.doubleclick.net/gampad/ads?sz=640x480&iu=/32573358/2nd_test_ad_unit&ciu_szs=300x100&impl=s&gdfp_req=1&env=vp&output=vast&unviewed_position_start=1&url=[referrer_url]&description_url=[description_url]&correlator=[random]',
          type: 'vast',
        },
        id: 'ad-post-skippable',
        position: 'post',
      } as any
    ]
  }
};

export function App() {
  return (
    <Fragment>
      <h1>Bitmovin Player Conviva Integration Sample</h1>
      <div
        style={{
          position: 'relative',
          maxWidth: '800px',
        }}
      >
        <BitmovinPlayer
          source={defaultPlayerSource}
          config={playerConfig}
          playerRef={player => {
            if (!player) {
              return;
            }

            const convivaAnalytics = new ConvivaAnalytics(player as any, '<convivaKey>', {
              debugLoggingEnabled: true,

              // It's used for testing and should not be used in production.
              gatewayUrl: 'https://conviva-learningcenter.testonly.conviva.com'
            });

            // Initialize metadata. It also can be used to update some data during playback.
            convivaAnalytics.updateContentMetadata({
              viewerId: 'bitmovin-player-web-conviva-integration-viewer',
              applicationName: 'Bitmovin Player Web Conviva Analytics Integration',
              assetName: 'Sintel',
              custom: {
                assetId: 'assetId',
                directors: 'Colin Levy',
                year: '2010',
                playerVendor: 'bitmovin',
                playerVersion: player.version,

                // Reserved Conviva tags can be placed here.
                'c3.cm.contentType': 'VOD',
                'c3.cm.channel': 'Test Channel',
                'c3.cm.brand': 'Test Brand',
                'c3.cm.affiliate': 'Test Affiliate',
                'c3.cm.categoryType': 'Test Category',
                'c3.cm.name': 'Test CM Name',
                'c3.cm.id': 'test-cm-id',
                'c3.cm.seriesName': 'Test Series Name',
                'c3.cm.seasonNumber': 'Test Season Number',
                'c3.cm.showTitle': 'Test Show Title',
                'c3.cm.episodeNumber': 'Test Episode Number',
                'c3.cm.genre': 'Test Primary Genre',
                'c3.cm.genreList': 'Test Genre List Item 1, Test Genre List Item 2',
              }
            });

            player.on(PlayerEvent.Destroy, () => {
              convivaAnalytics.release();
            });
          }}
        />
      </div>
    </Fragment>
  );
}
