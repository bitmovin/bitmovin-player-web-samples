import {
  ICON_OVERRIDE_NAMES,
  type IconOverrides,
  setIconOverrides,
} from '@bitmovin/player-integration-webxr/ui';

/**
 * Custom icons for the VR controls (optional). Put one SVG per icon in an
 * `icons/` folder next to index.html, named after the icon, for example
 * `icons/play.svg`. Icons without a file keep their default. Only `<path>`
 * elements are drawn, in the theme's icon colour. Must run before the control
 * bar is built; `scale` enlarges all replaced icons.
 */
export async function setCustomIcons(): Promise<void> {
  const icons: IconOverrides = {};
  // await Promise.all(ICON_OVERRIDE_NAMES.map(async (name) => {
  //   const response = await fetch(`icons/${name}.svg`);
  //   if (response.ok) {
  //     icons[name] = await response.text();
  //   }
  // }));
  
  setIconOverrides(icons, { scale: 1 });
}
