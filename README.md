# Bitmovin Adaptive Streaming Player for MPEG-DASH & HLS
This showcases are build around the Bitmovin Adaptive Streaming Player, demonstrating usage and capabilities of the HTML5 based HLS and MPEG-DASH player, as well as the Flash based fallback.

![Bitmovin Player Demo](images/background.png?style=centerme "Bitmovin HTML5 Player Demo Page")

## Demos
* [**adaptation**](adaptation/)
    * [preferredStartupQuality](adaptation/preferredStartupQuality.js): Set a minimum startup quality for a specified amount of time before using the built-in adaptation logic again.
    * [regionOfInterest](adaptation/regionOfInterest.html): Multiple players with low quality and the active player (where the mouse is over) switches to better quality.
    * [rateBasedSwitching](adaptation/rateBasedSwitching.js): Measuring the speed of downloads and select the quality accordingly.
* [**errorHandling**](errorhandling/)
    * [handleDownloadErrors](errorhandling/handleDownloadErrors.html): Custom retry logic for the case that files cannot be downloaded.
    * [showPosterOnError](errorhandling/showPosterOnError.html): Display a still image whenever an error occurs.
    * [switchQualityOnHttpStatusCode](errorhandling/switchQualityOnHttpStatusCode.html): Tweak the ABR behavior based on HTTP errors.
* [**events**](events/)
    * [ON_DOWNLOAD_FINISHED](events/onDownloadFinished.html): Report download errors for live streams using the ON_DOWNLOAD_FINISHED player event.
    * [eventConstants](events/eventConstants.html): Use event constants for registering event handlers at the player.
    * [ON_SEGMENT_REQUEST_FINISHED](events/onSegmentRequestFinished.html): Use ON_SEGMENT_REQUEST_FINISHED event to analyze which segment has been downloaded and implement custom workflows according to the HTTP status code.
* [**keyboard**](keyboard/)
   * [keyboardSupport](keyboard/keyboardSupport.html): Keyboard shortcuts for the Bitmovin Player.
   * [keyboardCustom](keyboard/keyboardCustom.html): Custom keyboard shortcuts for the Bitmovin Player.
* [**playerUI**](playerUi/)
    * [customErrorMessage](playerUi/customErrorMessage.html): Set custom error messages within the Bitmovin Player
    * [labeling](playerUi/labeling.html): Set custom UI, Quality and Subtitles labels
* [**playlist**](playlist/)
    * [simplePlaylist](playlist/simplePlaylist.html): Build a playlist with the Bitmovin HTML5 Player API.
* [**streamRecovery**](streamRecovery/)
    * [liveStreamRecovery](streamRecovery/liveStreamRecovery.js): Automatically restart live streams if too many download errors happened e.g. to get over missing segments.
* [**ssai**](ssai/)
    * [dfp](dfp/): Use Google DoubleClick for Server-side ad insertion (SSAI)
* [**subtitles**](subtitles/)
    * [customSubtitleDisplay](subtitles/customSubtitleDisplay.js): Render subtitles using the ON_CUE_ENTER and ON_CUE_EXIT player events.

## Howto Install

1. Sign up for free at [https://dashboard.bitmovin.com/signup](https://dashboard.bitmovin.com/signup)
2. Get your personal key from the [player licenses page](https://dashboard.bitmovin.com/player/licenses/)
3. Checkout the sample provided in this repository
4. Add the player key to the player configuration in the example you want to use
5. Enjoy best adaptive streaming performance!

## Generate Content The Easy Way

To generate MPEG-DASH & HLS content on your own, please have a look at the encoding section at  [https://dashboard.bitmovin.com/](https://dashboard.bitmovin.com/) and give it a free try!

## Additional Demos and Documentation

Additional demos can be found in our demo area at [https://bitmovin.com/demo/](https://bitmovin.com/demo/). For more information on our rich API and player configuration, we refer to [https://developer.bitmovin.com/hc/en-us/categories/115000139893-Player](https://developer.bitmovin.com/hc/en-us/categories/115000139893-Player).

www.bitmovin.com<br>
