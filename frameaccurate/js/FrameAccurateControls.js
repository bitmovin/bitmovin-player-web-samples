/**
 * Class to Wrap the bitmovin player and take care of SMPTE <-> time conversions
 */
var SmtpeController = /** @class */ (function () {
    function SmtpeController(player, assetDescription) {
        var _this = this;
        /**
         * In Firefox we have the fun behaviour, that play + pause leads to an incorrect video.currentTime (off by 1 frame
         * most of the time). To reproduce try play + pause at some point in the video. Then save the current Time, seek
         * somewhere else and then back to the previous current time ... you will see a different Frame.
         * In order to avoid this mess, when we encounter play + pause we seek to the calculated SMPTE, quite the dirty hack
         * but necessary.
         */
        this.playPauseHandler = function (event) {
            if (event.type === 'onPlaying') {
                _this.hasBeenPlaying = true;
            }
            else if (_this.hasBeenPlaying) {
                _this.hasBeenPlaying = false;
                _this.seekToSMPTE(_this.getCurrentSmpte());
            }
        };
        this.player = player;
        this.assetDescription = assetDescription;
        player.addEventHandler('onPaused', this.playPauseHandler);
        player.addEventHandler('onPlaying', this.playPauseHandler);
        this.load(assetDescription);
    }
    /**
     * Calls load on the player with asset.sourceConfig and updates the internal asset description
     */
    SmtpeController.prototype.load = function (asset) {
        var _this = this;
        return this.player.load(asset.sourceConfig).then(function () {
            _this.assetDescription = asset;
            _this.hasBeenPlaying = false;
        }).catch(function (error) {
            console.error('Could not load asset: ' + JSON.stringify(asset.sourceConfig));
            throw error;
        });
    };
    /**
     * Converts the given SMTPE timestamp to a time and calls seek on the wrapped player to the calculated time
     * @param {string} smpteString a string in the form of HH:MM:SS:FF
     * @throws {string} an error if the given SMPTE was invalid
     */
    SmtpeController.prototype.seekToSMPTE = function (smpteString) {
        try {
            var smpte = new SmpteTimestamp(smpteString, this.assetDescription);
            var debugSmpte = smpte.toString();
            var targetTime = smpte.toAdjustedTime();
            console.debug('Seeking to SMTPE: ' + debugSmpte + ', calculated Time: ' + targetTime);
            this.player.seek(targetTime);
        }
        catch (error) {
            console.error('Error during converting smtpe to time: ' + error);
            throw error;
        }
    };
    /**
     * Queries the time of the wrapped player and converts it to the SMPTE format
     */
    SmtpeController.prototype.getCurrentSmpte = function () {
        var currentTime = this.player.getCurrentTime();
        return SmpteTimestamp.fromTimeWithAdjustments(currentTime, this.assetDescription).toString();
    };
    /**
     * Advances `stepSize` frames in the current video
     * @param {number} stepSize number of frames to step, if negative will step to previous frames
     */
    SmtpeController.prototype.step = function (stepSize) {
        var smpte = new SmpteTimestamp(this.getCurrentSmpte(), this.assetDescription);
        if (smpte.minutes % 10 !== 0 && smpte.seconds === 0) {
            //  in the case of being around the dropped frame at step start we have to ignore the frameHoles
            smpte.addFrame(stepSize, false);
        }
        else {
            smpte.addFrame(stepSize, true);
        }
        this.seekToSMPTE(smpte.toString());
    };
    return SmtpeController;
}());
/**
 * Information about the current asset needed for SMPTE adjustments
 */
var AssetDescription = /** @class */ (function () {
    /**
     *
     * @param {string} name the name of the asset
     * @param {SourceConfig} sourceConfig the source for the player to load
     * @param {number} framesPerSecond number of frames in a second
     * @param {number} adjustmentFactor should be 1 for integer frame numbers, otherwise Math.ceil(fps)/fps. Needed for
     * adjustment of the player time
     * @param {number} framesDroppedAtFullMinute default: 0, in 29.98fps videos 2 frames are dopped each minute
     */
    function AssetDescription(name, sourceConfig, framesPerSecond, adjustmentFactor, framesDroppedAtFullMinute) {
        this.name = name;
        this.sourceConfig = sourceConfig;
        this.framesPerSecond = framesPerSecond;
        this.adjustmentFactor = adjustmentFactor;
        this.framesDroppedAtFullMinute = framesDroppedAtFullMinute;
        if (adjustmentFactor == null) {
            this.adjustmentFactor = Math.ceil(framesPerSecond) / framesPerSecond;
        }
        if (framesDroppedAtFullMinute == null) {
            if (framesPerSecond === 29.97 || framesPerSecond === 29.98) {
                this.framesDroppedAtFullMinute = 2;
            }
            else {
                this.framesDroppedAtFullMinute = 0;
            }
        }
        this.frameDuration = 1 / this.framesPerSecond;
        // needed to not seek to the end of the previous frame but rather to the middle of the desired one
        this.offsetToMidFrame = (this.frameDuration / 2) / this.adjustmentFactor;
    }
    return AssetDescription;
}());
var SmpteTimestamp = /** @class */ (function () {
    function SmpteTimestamp(smtpeTimestamp, assetDescription) {
        this.assetDescription = assetDescription;
        if (smtpeTimestamp && isFinite(smtpeTimestamp)) {
            var smpteValue = smtpeTimestamp;
            this.frame = smpteValue % 100;
            smpteValue = Math.floor(smpteValue / 100);
            this.seconds = smpteValue % 100;
            smpteValue = Math.floor(smpteValue / 100);
            this.minutes = smpteValue % 100;
            this.hours = Math.floor(smpteValue / 100);
        }
        else if (smtpeTimestamp && SmpteTimestamp.validateTimeStamp(smtpeTimestamp, assetDescription.framesPerSecond)) {
            var parts = smtpeTimestamp.split(':');
            this.hours = Number(parts[0]);
            this.minutes = Number(parts[1]);
            this.seconds = Number(parts[2]);
            this.frame = Number(parts[3]);
        }
        else {
            this.hours = 0;
            this.minutes = 0;
            this.seconds = 0;
            this.frame = 0;
        }
    }
    SmpteTimestamp.validateTimeStamp = function (smtpeTimestamp, framesPerSecond) {
        // validate SMTPE timecode
        var isValidSMPTETimeCode = new RegExp(/(^(?:(?:[0-1][0-9]|[0-2][0-3]):)(?:[0-5][0-9]:){2}(?:[0-6][0-9])$)/);
        if (!isValidSMPTETimeCode.test(smtpeTimestamp)) {
            // invalid format
            throw smtpeTimestamp + ' does not match a SMPTE timecode HH:MM:SS:FF';
        }
        if (Number(smtpeTimestamp.split(':')[3]) >= framesPerSecond) {
            // frame portion of the input is higher than the FPS
            throw 'Frame Number in SMPTE is higher than FPS: ' + smtpeTimestamp;
        }
        return true;
    };
    SmpteTimestamp.padNum = function (num) {
        if (num < 10) {
            return '0' + num;
        }
        else {
            return String(num);
        }
    };
    SmpteTimestamp.prototype.toString = function () {
        return SmpteTimestamp.padNum(this.hours) + ':' + SmpteTimestamp.padNum(this.minutes) + ':' +
            SmpteTimestamp.padNum(this.seconds) + ':' + SmpteTimestamp.padNum(this.frame);
    };
    SmpteTimestamp.prototype.toTime = function () {
        var timeInSeconds = this.hours * 3600 + this.minutes * 60 + this.seconds;
        // convert frame number to time and add it
        timeInSeconds += this.frame * this.assetDescription.frameDuration;
        return timeInSeconds;
    };
    SmpteTimestamp.prototype.toAdjustedTime = function () {
        // take dropped frames around every full minute (except for every 10minutes) into account
        if (this.assetDescription.framesDroppedAtFullMinute > 0) {
            var totalMinutes = this.hours * 60 + this.minutes;
            var framesToAdd = totalMinutes - Math.floor(totalMinutes / 10);
            framesToAdd *= this.assetDescription.framesDroppedAtFullMinute;
            this.addFrame(-framesToAdd, false);
        }
        var targetTime = this.toTime() * this.assetDescription.adjustmentFactor;
        targetTime += this.assetDescription.offsetToMidFrame;
        targetTime = Math.floor(targetTime * 1000) / 1000;
        return targetTime;
    };
    SmpteTimestamp.fromString = function (smtpeTimestamp, assetDescription) {
        return new SmpteTimestamp(smtpeTimestamp, assetDescription);
    };
    SmpteTimestamp.fromTime = function (timestamp, assetDesc) {
        // to get to the start of the actual frame... use this
        var tmp = timestamp;
        var retVal = new SmpteTimestamp(null, assetDesc);
        retVal.hours = Math.floor(tmp / 3600);
        tmp -= retVal.hours * 3600;
        retVal.minutes = Math.floor(tmp / 60);
        tmp -= retVal.minutes * 60;
        retVal.seconds = Math.floor(tmp);
        tmp -= retVal.seconds;
        retVal.frame = Math.floor(tmp / assetDesc.frameDuration);
        return retVal;
    };
    SmpteTimestamp.fromTimeWithAdjustments = function (timestamp, assetDesc) {
        var time = timestamp / assetDesc.adjustmentFactor;
        var smtpe = SmpteTimestamp.fromTime(time, assetDesc);
        if (assetDesc.framesDroppedAtFullMinute > 0) {
            var numMinutesWithDroppedFrames = smtpe.minutes + (smtpe.hours * 60);
            // no frames dropped at every 10 minutes
            numMinutesWithDroppedFrames -= Math.floor(numMinutesWithDroppedFrames / 10);
            var framesToAdd = numMinutesWithDroppedFrames * assetDesc.framesDroppedAtFullMinute;
            var minutesBefore = smtpe.minutes;
            smtpe.addFrame(framesToAdd, false);
            if (smtpe.minutes % 10 !== 0 && minutesBefore !== smtpe.minutes) {
                smtpe.addFrame(assetDesc.framesDroppedAtFullMinute, false);
            }
        }
        return smtpe;
    };
    SmpteTimestamp.prototype.addFrame = function (framesToAdd, fixFrameHoles) {
        if (fixFrameHoles === void 0) { fixFrameHoles = true; }
        this.frame += framesToAdd;
        var overflow;
        _a = SmpteTimestamp.fitIntoRange(this.frame, Math.ceil(this.assetDescription.framesPerSecond)), this.frame = _a[0], overflow = _a[1];
        if (overflow !== 0) {
            this.addSeconds(overflow);
        }
        // make sure we dont step into a frame hole
        if (fixFrameHoles && this.assetDescription.framesDroppedAtFullMinute > 0 && this.minutes % 10 !== 0) {
            if (framesToAdd > 0 && this.seconds === 0) {
                this.addFrame(this.assetDescription.framesDroppedAtFullMinute, false);
            }
        }
        var _a;
    };
    SmpteTimestamp.prototype.addSeconds = function (secondsToAdd) {
        this.seconds += secondsToAdd;
        var overflow;
        _a = SmpteTimestamp.fitIntoRange(this.seconds, 60), this.seconds = _a[0], overflow = _a[1];
        if (overflow !== 0) {
            this.addMinute(overflow);
        }
        var _a;
    };
    SmpteTimestamp.prototype.addMinute = function (minutesToAdd) {
        this.minutes += minutesToAdd;
        var overflow;
        _a = SmpteTimestamp.fitIntoRange(this.minutes, 60), this.minutes = _a[0], overflow = _a[1];
        if (overflow !== 0) {
            this.addHour(overflow);
        }
        var _a;
    };
    SmpteTimestamp.prototype.addHour = function (hoursToAdd) {
        this.hours += hoursToAdd;
        if (this.hours < 0) {
            console.log('Cannot go further back');
            this.hours = 0;
            this.minutes = 0;
            this.seconds = 0;
            this.frame = 0;
        }
    };
    SmpteTimestamp.fitIntoRange = function (toFit, range) {
        var overflow = 0;
        if (toFit < 0) {
            while (toFit < 0) {
                overflow--;
                toFit += range;
            }
        }
        else if (toFit >= range) {
            while (toFit >= range) {
                overflow++;
                toFit -= range;
            }
        }
        return [toFit, overflow];
    };
    return SmpteTimestamp;
}());
