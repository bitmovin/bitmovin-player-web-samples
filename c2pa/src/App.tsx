import { BitmovinPlayer } from 'bitmovin-player-react';
import 'bitmovin-player-ui/dist/css/bitmovinplayer-ui.css';
import './App.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  type PlayerAPI,
  type PlayerConfig,
  PlayerEvent,
  type SegmentPlaybackEvent,
  type SegmentRequestFinishedEvent,
  type SourceConfig,
} from 'bitmovin-player';
import { C2paValidator } from './c2pa/C2paValidator';
import crIcon from './assets/cr-icon.svg';
import crValidIcon from './assets/cr-valid.svg';
import crInvalidIcon from './assets/cr-invalid.svg';
import { type ManifestStore } from '@contentauth/c2pa-web';
import { ContentCredentialsMenu } from './components/ContentCredentialsMenu';

const validSource = {
  dash: 'https://cc-assets.netlify.app/video/fmp4-samples/boat.mpd',
};

const partiallyValidSource = {
  dash: 'https://cc-assets.netlify.app/video/fmp4-samples/newscast_man.mpd', // INVALID
};

const noC2paSource = {
  dash: 'https://cdn.bitmovin.com/content/assets/art-of-motion-dash-hls-progressive/mpds/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.mpd',
};

function getIconSrc(currentManifest: ManifestStore | undefined) {
  const validationState = currentManifest?.validation_state;
  if (!validationState) {
    return crIcon; // Default icon when no manifest is available
  }

  return validationState === 'Valid' || validationState === 'Trusted' ? crValidIcon : crInvalidIcon;
}

function App() {
  const player = useRef<PlayerAPI>(null);
  const [currentManifest, setCurrentManifest] = useState<ManifestStore | undefined>(undefined);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [playerSource, setPlayerSource] = useState<SourceConfig>(validSource);
  const c2paValidator = useMemo(
    () =>
      new C2paValidator(manifest => {
        console.log('Manifest updated:', manifest);
        setCurrentManifest(manifest);
      }),
    [],
  );

  useEffect(() => {
    if (player.current) {
      (window as any).player = player.current; // eslint-disable-line @typescript-eslint/no-explicit-any
      player.current.on(PlayerEvent.SourceLoaded, async () => {
        console.log('Source loaded');

        await c2paValidator.init();

        const source = player.current?.getSource();

        if (!source || !source.progressive) {
          return;
        }

        // Validate C2PA data for the loaded video
        try {
          const validationState = await c2paValidator.validateProgressive(source.progressive as string);
          console.log('C2PA validation result:', validationState);
        } catch (error) {
          console.error('C2PA validation failed:', error);
        }
      });

      player.current.on(PlayerEvent.SegmentPlayback, event => {
        c2paValidator.onSegmentPlayback(event as SegmentPlaybackEvent);
      });
      player.current.on(PlayerEvent.SegmentRequestFinished, event => {
        c2paValidator.onSegmentRequestFinished(event as SegmentRequestFinishedEvent);
      });
    }
  }, []);

  const playerConfig: PlayerConfig = useMemo(
    () => ({
      key: 'YOUR-KEY-HERE',
      playback: {
        muted: true,
        autoplay: true,
      },
      ui: {
        playbackSpeedSelectionEnabled: true,
      },
      network: {
        preprocessHttpResponse: c2paValidator.preprocessHttpResponse,
      },
      tweaks: {
        disable_parallel_segment_loading: true,
      },
    }),
    [c2paValidator],
  );

  const handleSourceChange = (source: SourceConfig) => {
    c2paValidator.reset();
    setCurrentManifest(undefined);
    setPlayerSource(source);
  };

  const handleCrIconClick = () => {
    setIsMenuOpen(true);
  };

  const iconSrc = getIconSrc(currentManifest);
  const isDisabled = !currentManifest;

  return (
    <div className="app">
      <div className="app-header">
        <h1 className="app-title">C2PA Content Credentials Demo | Bitmovin</h1>
        <div className="header-links">
          <a href="https://github.com/bitmovin/bitmovin-player-web-samples/tree/main/c2pa" className="source-link" target="_blank" rel="noopener noreferrer">
            View on GitHub<span className="external-icon" aria-hidden="true">↗</span>
          </a>
          <a href="https://bitmovin.com/blog" className="source-link" target="_blank" rel="noopener noreferrer">
            Read the Blog Article<span className="external-icon" aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
      <div className="video-container">
        <BitmovinPlayer config={playerConfig} source={playerSource} playerRef={player} />
        <button
          className={`cr-icon-button ${isDisabled ? 'disabled' : ''}`}
          onClick={handleCrIconClick}
          disabled={isDisabled}
          title={isDisabled ? 'No content credential information available' : 'View content credentials'}
        >
          <img src={iconSrc} alt="CR" className="cr-icon" />
        </button>
      </div>
      <div className="source-buttons">
        <button onClick={() => handleSourceChange(validSource)}>Valid Source</button>
        <button onClick={() => handleSourceChange(partiallyValidSource)}>Partially Valid Source</button>
        <button onClick={() => handleSourceChange(noC2paSource)}>No C2PA Source</button>
      </div>
      {isMenuOpen && <ContentCredentialsMenu manifest={currentManifest} onClose={() => setIsMenuOpen(false)} />}
    </div>
  );
}

export default App;
