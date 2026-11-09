// Lets index.ts import stylesheets; esbuild bundles them.
declare module '*.css';

// The skin is a plain script that registers globals; see skin.ts.
declare module '*/skin/player-ui.js';
