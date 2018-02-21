# SMTPE Controller

## What is the SMTPE Controller
The SMPTE Controller is a wrapper for the Bitmovin Player which takes care of the conversion between a SMPTE Timecode and the actual video time

## How to use the SMPTE Controller
### 1. include the javascript file:
`<script type="text/javascript" src="js/FrameAccurateControls.js"></script>`

### 2. Create the asset description object for your current asset:
`new AssetDescription(assetName, sourceObject, frameRate, adjustmentFactor, framesDropppedEachMinute);`
the parameters for this object are as follows:
- assetName: a string which identifies your asset, not used internally but useful for external access
- sourceObject: A source Config object for the bitmovin player (e.g: `{progressive: 'urlToMyVideo.mp4'}`)
- frameRate: The frameRate of the video which is loaded
- adjustmentFactor: _OPTIONAL_: If the framerate is not an integer value, this value is taken to calculate the difference between the SMPTE and the actual time (e.g.: 24 / 23.97 ~= 1.001). If omitted, will default to `Math.ceil(framerate)/framerate`
- framesDroppedEachMinute: _OPTIONAL_ If the video has frameHoles at every minute (excluding every 10minutes) specify the number here (29.97 has 2 frames dropped). If omitted, will default to 2 for a framerate of 29.97 or 29.98 and will default to 0 otherwise

### 3. Setup the controller with the given asset description:
`new SmtpeController(playerInstance, assetDescription)`

### 4. Use the provided functionality:
The SMPTE Controller offers the following "public" functions:
#### `seekToSMPTE` 
Takes a SMTPE string or number as an input, converts it to a time and seeks to that time 
#### `getCurrentSmpte`
Queries the current time of the player and converts it to an SMPTE representation in string form
#### `step`
Takes an integer input and steps that number of frames forward for positive input and backward for negative input
#### `load`
Takes a asset description and loads the new source while updating the internal asset description for the calculations

## Utility
Additionally there is the class `SmpteTimestamp` which can come in handy for adding / subtracting Frames from a given SMPTE.
You can set it up by providing a
- String in the format of `'HH:MM:SS:FF'` or 
- Number which will be interpreted fram back to front (matching the HH:MM:SS:FF pattern)
- and an `AssetDescription` to handle the internal conversions 

Example Usage: 
```
    const smpte = new SmpteTimestamp('00:30:00:01', assetDescription);
    smpte.addFrame(5); // there is an optional boolean parameter which allows supression of missing frames in the calculation 
    player.seek(smpte.toAdjustedTime());
```
 