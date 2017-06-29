# Bitmovin Adaptive Streaming Player for MPEG-DASH & HLS
This showcases are build around the Bitmovin Adaptive Streaming Player, demonstrating usage and capabilities of the HTML5 based HLS and MPEG-DASH player, as well as the Flash based fallback.

![bitdash MPEG-DASH Demo](images/background.png?style=centerme "Bitmovin HTML5 Player Demo Page")

## Demos
* [**adaptation**](adaptation/)
    * [preferredStartupQuality](adaptation/preferredStartupQuality.js): Set a minimum startup quality for a specified amount of time before using the built-in adaptation logic again.
    * [regionOfInterest](adaptation/regionOfInterest.html): Multiple players with low quality and the active player (where the mouse is over) switches to better quality.
    * [rateBasedSwitching](adaptation/rateBasedSwitching.js): Measuring the speed of downloads and select the quality accordingly.
* [**errorHandling**](errorhandling/)
    * [handleDownloadErrors](errorhandling/handleDownloadErrors.html): Implement a custom retry logic when a files fail to be downloaded.
    * [showPosterOnError](errorhandling/showPosterOnError.html): Display a still image whenever an error occurs.
    * [switchQualityOnHttpStatusCode](errorhandling/switchQualityOnHttpStatusCode.html): Tweak the ABR behavior based on HTTP errors.
* [**events**](events/)
    * [onDownloadFinished](events/onDownloadFinished.html): Report download errors for live streams using the onDownloadFinished player event.
    * [eventConstants](events/eventConstants.html): Use event constants for registering event handlers at the player.
    * [onSegmentRequestFinished](events/onSegmentRequestFinished.html): Use onSegmentRequestFinished event to analyse which segment has been downloaded and implement custom workflows according to the HTTP status code.
* [**keyboard**](keyboard/)
   * [keyboardSupport](keyboard/keyboardSupport.html): Make Bitmovin HTML5 Player controllable with the keyboard
   * [keyboardCustom](keyboard/keyboardCustom.html): Make Bitmovin HTML5 Player controllable with some custom keyboard shortcuts
* [**playlist**](playlist/)
    * [simplePlaylist](playlist/simplePlaylist.html): Build a playlist with Bitmovin HTML5 Player API.
* [**streamRecovery**](streamRecovery/)
    * [liveStreamRecovery](streamRecovery/liveStreamRecovery.js): Automatically restart live streams if too many download errors happened e.g. to get over missing segments.
* [**subtitles**](subtitles/)
    * [customSubtitleDisplay](subtitles/customSubtitleDisplay.js): Render subtitles using the onCueEnter and onCueExit player events.

## Howto Install

1. Sign up for free at [https://app.bitmovin.com/register](https://app.bitmovin.com/register)
2. Get your personal key from the player overview page
3. Checkout the sample provided in this repository
4. Add the player key to the player configuration in the example you want to use
5. Enjoy best adaptive streaming performance!

## Generate Content The Easy Way

To generate MPEG-DASH & HLS content on your own, please have a look at the encoding section at  [https://app.bitmovin.com/](https://app.bitmovin.com/) and give it a free try!

## Additional Demos and Documentation

Additional demos can be found in our demo area at [https://bitmovin.com/demo/](https://bitmovin.com/demo/). For more information on our rich API and player configuration, we refer to [https://bitmovin.com/player/](https://bitmovin.com/player/).

www.bitmovin.com<br>
