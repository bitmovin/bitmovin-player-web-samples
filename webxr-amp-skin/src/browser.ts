/** UA tokens of headset browsers. Some also name Android or "Mobile". */
const HEADSET_BROWSER = /OculusBrowser|Quest|PicoBrowser|Wolvic/;

/** UA tokens of phone and tablet browsers. */
const MOBILE_BROWSER = /Android|iPhone|iPad|iPod|Mobile/;

/** `navigator.userAgentData`, where the browser has it. Not in TypeScript's DOM types. */
interface UserAgentData {
  mobile?: boolean;
  platform?: string;
}

/**
 * Whether this is a phone or tablet browser, not a headset browser.
 *
 * Headset tokens in the UA string decide first. Then either source can say
 * mobile: `navigator.userAgentData` (`mobile`, or platform "Android" for
 * tablets) or the UA string. iPadOS Safari tells it is a Mac, but reports no
 * immersive VR support, so the VR button stays hidden there too.
 */
export function isMobileBrowser(): boolean {
  const ua = navigator.userAgent;
  if (HEADSET_BROWSER.test(ua)) {
    return false;
  }
  const data = (navigator as Navigator & { userAgentData?: UserAgentData }).userAgentData;
  if (data?.mobile === true || data?.platform === 'Android') {
    return true;
  }
  return MOBILE_BROWSER.test(ua);
}
