import 'bitmovin-player-ui/dist/css/bitmovinplayer-ui.css';

import * as Conviva from '@convivainc/conviva-js-coresdk';
import React from 'react';
import ReactDOM from 'react-dom/client';

import { App } from './App.js';

// Or add `<script type="text/javascript" src="<PATH>/conviva-core-sdk.js"></script>` to your HTML file.
(window as typeof window & { Conviva: typeof Conviva }).Conviva = Conviva;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
