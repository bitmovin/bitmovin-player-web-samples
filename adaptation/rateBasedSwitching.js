/****************************************************************************
 *
 * This is free and unencumbered software released into the public domain.
 *
 * Anyone is free to copy, modify, publish, use, compile, sell, or
 * distribute this software, either in source code form or as a compiled
 * binary, for any purpose, commercial or non-commercial, and by any
 * means.
 *
 * In jurisdictions that recognize copyright laws, the author or authors
 * of this software dedicate any and all copyright interest in the
 * software to the public domain. We make this dedication for the benefit
 * of the public at large and to the detriment of our heirs and
 * successors. We intend this dedication to be an overt act of
 * relinquishment in perpetuity of all present and future rights to this
 * software under copyright law.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR
 * OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
 * ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 *
 * For more information, please refer to <http://unlicense.org>
 *
 ****************************************************************************/

var RateBasedSwitching = function (player, bufferSize, segmentLength) {
    var downloadRates = [];
    var maxBufferLevel = null;

    function onDownloadFinished(event) {
        if (event.downloadType === 'media/video' && event.url.indexOf('video') > -1) {
            downloadRates.unshift((event.size * 8) / event.downloadTime);
            while (downloadRates.length > bufferSize) {
                downloadRates.pop();
            }
        }
    }

    function resetBuffer() {
        downloadRates = [];
    }

    function getMeanBitrate() {
        var mean = 0;
        var count = 0;
        var depth = Math.min(Math.max(1, parseInt(Math.min(player.getVideoBufferLength() / (maxBufferLevel - segmentLength), 1) * bufferSize)), downloadRates.length);

        for (var idx = 0; idx < depth; idx++) {
            var currentValue = downloadRates[idx] * (1 - (idx * (1 / bufferSize)));
            if (currentValue < 0) break;
            mean += currentValue;
            count++;
        }

        return count > 0 ? (mean / count) : 0;
    }

    function onVideoAdaptation() {
        var availableVideoQualities = player.getAvailableVideoQualities();
        var maxVideoRepresentation = {bitrate: 0};
        var minVideoRepresentation = {bitrate: Infinity};
        var meanBitrate = getMeanBitrate();

        for (var idx = 0; idx < availableVideoQualities.length; idx++) {
            if (maxVideoRepresentation.bitrate < availableVideoQualities[idx].bitrate && availableVideoQualities[idx].bitrate < meanBitrate) {
                maxVideoRepresentation = availableVideoQualities[idx];
            }
            if (availableVideoQualities[idx].bitrate < minVideoRepresentation.bitrate) {
                minVideoRepresentation = availableVideoQualities[idx];
            }
        }

        if (maxVideoRepresentation.id) {
            return maxVideoRepresentation.id;
        } else {
            return minVideoRepresentation.id;
        }
    }

    (function () {

        if (!player) {
            return;
        }

        if (player.getConfig().hasOwnProperty('tweaks') && player.getConfig().tweaks.hasOwnProperty('max_buffer_level')) {
            maxBufferLevel = player.getConfig().tweaks.max_buffer_level;
        } else {
            maxBufferLevel = 20;
        }

        var init = function () {
            player.on('downloadfinished', onDownloadFinished);
            player.on('stallstared', resetBuffer);
            player.on('videoadaptation', onVideoAdaptation);
        };

        if (player.getSource()) {
            init();
        } else {
            player.on('sourceloaded', init);
        }

    })();

};
