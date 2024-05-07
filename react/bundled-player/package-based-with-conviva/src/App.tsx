import { ConvivaAnalytics } from '@bitmovin/player-integration-conviva';
import { PlayerConfig, PlayerEvent, SourceConfig } from 'bitmovin-player';
import { BitmovinPlayer } from 'bitmovin-player-react';
import { Fragment, useMemo } from 'react';
import { Constants as ConvivaConstants } from '@convivainc/conviva-js-coresdk';

const defaultPlayerSource: SourceConfig = {
  hls: 'https://cdn.bitmovin.com/content/assets/streams-sample-video/sintel/m3u8/index.m3u8',
};

export function App() {
  const playerConfig: PlayerConfig = useMemo(
    () => ({
      key: '<key>',
      playback: {
        muted: true,
        autoplay: true,
      },
    }),
    [],
  );

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
          playerRef={player => {
            if (!player) {
              return;
            }

            const convivaAnalytics = new ConvivaAnalytics(player, 'CUSTOMER_KEY', {
              debugLoggingEnabled: true, // optional
              gatewayUrl: 'https://youraccount-test.testonly.conviva.com', // optional, TOUCHSTONE_SERVICE_URL for testing
              deviceCategory: ConvivaConstants.DeviceCategory.WEB, // optional, deprecated (Use deviceMetadata.category) (default: WEB)
              deviceMetadata: {
                // optional (default: let Conviva backend infer these fields from User Agent sring)
                category: ConvivaConstants.DeviceCategory.WEB, // optional (default: WEB)
                brand: 'Device brand', // optional
                manufacturer: 'Device Manufacturer', // optional
                model: 'Device Model', // optional
                type: ConvivaConstants.DeviceType.DESKTOP, // optional
                version: 'Device version', // optional
                osName: 'Operating system name', // optional
                osVersion: 'Operating system version', // optional
              },
            });

            player.on(PlayerEvent.Destroy, () => {
              convivaAnalytics.release();
            });
          }}
          source={defaultPlayerSource}
          config={playerConfig}
        />
      </div>
    </Fragment>
  );
}
