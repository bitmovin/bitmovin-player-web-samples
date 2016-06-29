# Bitmovin Adaptive Streaming Player for MPEG-DASH & HLS
This showcases are build around the Bitmovin Adaptive Streaming Player, demonstrating usage and capabilities of the HTML5 based HLS and MPEG-DASH player, as well as the Flash based Fallabck.

## Demos
* [**adaptation**](adaptation/)
    * [preferredStartupQuality](adaptation/preferredStartupQuality.js): Set a minimum startup quality for a specified amount of time before using the built-in adaptation logic again.
    * [regionOfInterest](adaptation/regionOfInterest.html): Multiple players with low quality and the active player (where the mouse is over) switches to better quality.
    * [rateBasedSwitching](adaptation/rateBasedSwitching.js): Measuring the speed of downloads and select the quality accordingly.
* [**events**](events/)
    * [onDownloadFinished](events/onDownloadFinished.html): Report download errors for live streams using the onDownloadFinished player event.
* [**streamRecovery**](streamRecovery/)
    * [liveStreamRecovery](streamRecovery/liveStreamRecovery.js): Automatically restart live streams if too many download errors happened e.g. to get over missing segments.
* [**subtitles**](subtitles/)
    * [customSubtitleDisplay](subtitles/customSubtitleDisplay.js): Render subtitles using the onCueEnter and onCueExit player events.

![bitdash MPEG-DASH Demo](https://raw.githubusercontent.com/bitmovin/bitdash-MPEG-DASH-demo/master/screenshot.png "bitdash MPEG-DASH Demo Page")

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
