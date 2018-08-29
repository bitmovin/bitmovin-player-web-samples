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

var BitrateGraphs = function(player) {
  this.player = player;

  this.dataset = [
    ['segmentNumber', 'Estimated throughput', 'Downloaded quality', 'Buffer Length (x10 seconds)', 'Played quality'],
    [0, 0, 0, 0, 0]
  ];
  this.MAX_BITRATE = Infinity;
  this.segmentNumber = 0;
};

BitrateGraphs.prototype.init = function() {
  var _this = this;
  google.charts.load('current', { 'packages': ['corechart'] });
  google.charts.setOnLoadCallback(this.drawLineChart.bind(_this));

  this.player.on('downloadfinished', function(data) {
    if (data.downloadType === 'media/video' && data.mimeType.indexOf('video') >= 0 && data.size > 1000) {
      _this.newValue({ throughput: Math.round(((data.size * 8) / data.downloadTime) / 1000) });
    }
  });

  this.player.on('segmentplayback', function(data) {
    _this.SEGMENT_DURATION = data.duration;
  });

  this.player.on('timechanged', function(data) {
    var time = parseFloat(data.time);
    var line = parseInt(time / _this.SEGMENT_DURATION) + 1 || 0;
    _this.dataset[line + 1][4] = _this.dataset[line + 1][2];
    _this.dataset[line + 1][3] = _this.player.getVideoBufferLength() / 10;
    _this.drawLineChart();
  });
  this.player.on('seek', function(data) {
    if (data.position > data.seekTarget) {
      _this.dataset = [
        ['segmentNumber', 'Estimated throughput', 'Downloaded quality', 'Buffer Length (x10 seconds)', 'Played quality'],
        [0, 0, 0, 0, 0]
      ];
      _this.drawLineChart();
    }
  });
};

BitrateGraphs.prototype.drawLineChart = function() {
  this.MAX_BITRATE = parseInt(document.getElementById('maxBitrate').value) * 1000 || Infinity;
  var data = google.visualization.arrayToDataTable(this.dataset);
  var options = {
    title: 'Bitrate',
    curveType: 'none',
    legend: {
      position: 'top'
    },
    vAxis: {
      minValue: 0,
      maxValue: this.MAX_BITRATE / 1000,
      'Bitrates (Mbps)': { label: 'Bitrates (Mbps)' },
      'Buffer Length (x0.1s)': { label: 'Buffer Length(x0.1s)' }
    },
    hAxis: {
      title: "Segment Number"
    }
  };
  this.chart = new google.visualization.LineChart(document.getElementById('curve_chart'));
  this.chart.draw(data, options);
};

BitrateGraphs.prototype.newValue = function(metrics) {
  this.MAX_BITRATE = parseInt(document.getElementById('maxBitrate').value) * 1000 || Infinity;
  var throughput = metrics.throughput;
  throughput = Math.min(throughput, this.MAX_BITRATE);
  var chosenQuality = this.player.getDownloadedVideoData().bitrate;
  this.dataset.push([++this.segmentNumber, throughput / 1000, parseInt(chosenQuality) / 1000000, null, null]);
  this.drawLineChart();
};