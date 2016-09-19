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

function CustomSubtitleDisplay(figure) {
  var subtitleArea;
  var defaultCellResolution = {
    rows    : 15,
    columns : 40
  };
  var defaultRegionName = 'bitdashDefault';
  var defaultStyle =
    'text-align:center;' +
    'left:5%;' +
    'top:5%;' +
    'width:90%;' +
    'height:90%;' +
    'font-family:sans-serif;' +
    'text-shadow: 1px 1px 1px black, 1px -1px 1px black, -1px 1px 1px black,-1px -1px 1px black;' +
    'color:white;' +
    'position:absolute;';
  var noRegionBackgroundCSSClass = 'bitdash-subs-r-no-bg';

  var availableRegions = {};

  var updateFontSize = function() {};

  var addClass = function (element, cssClass) {
    if (!element || !cssClass) {
      return;
    }

    var cl = element.getAttribute('class');

    var isNotPresent = true;
    if (cl && cl.length > 0) {
      var classes = cl.split(' ');
      isNotPresent = classes.indexOf(cssClass) < 0;
    }

    if (cl && cl.length > 0 && isNotPresent) {
      cssClass = cl + ' ' + cssClass;
    }
    if (isNotPresent) {
      element.setAttribute('class', cssClass);
    }
  };

  var removeClass = function (element, cssClass) {
    if (!element || !cssClass) {
      return;
    }
    var cl = element.getAttribute('class');
    if (cl && cl.indexOf(cssClass) > -1) {
      cl = cl.replace(new RegExp('(?:^|\\s)' + cssClass + '(?!\\S)'), '').trim();
      element.setAttribute('class', cl);
    }
  };

  var createHTMLElement = function (type, attributes, content) {
    var el = document.createElement(type);
    var prop;

    if (attributes) {
      for (prop in attributes) {
        if (attributes.hasOwnProperty(prop)) {
          el.setAttribute(prop, attributes[prop]);
        }
      }
    }

    if (content) {
      el.innerHTML = content;
    }

    return el;
  };

  var getRegion = function(name, style) {
    name = name || defaultRegionName;

    if (availableRegions.hasOwnProperty(name)) {
      return availableRegions[name];
    }

    var cellResolution = defaultCellResolution;

    var tmp = style.match(/cellResolutionRows:([\d]+);/);
    if (tmp && tmp.length >= 2) {
      tmp = parseInt(tmp[1]);
      if (!isNaN(tmp)) {
        cellResolution.rows = tmp;
      }
    }
    tmp = style.match(/cellResolutionColumns:([\d]+);/);
    if (tmp && tmp.length >= 2) {
      tmp = parseInt(tmp[1]);
      if (!isNaN(tmp)) {
        cellResolution.columns = tmp;
      }
    }

    var alwaysShowBackground = false;

    if (style.indexOf('showBackground:always') > -1) {
      alwaysShowBackground = true;
    }

    var regionDiv = document.createElement('div');
    regionDiv.style.cssText  = style;
    regionDiv.style.position = 'absolute';
    regionDiv.style.left     = '5%';
    regionDiv.style.top      = '5%';
    regionDiv.style.width    = '90%';
    regionDiv.style.height   = '90%';
    regionDiv.style.textAlign = 'center';

    updateFontSize = function() {
      var fontSize = Math.round(figure.clientHeight / cellResolution.rows) + 'px';
      regionDiv.style.fontSize   = fontSize;
      regionDiv.style.lineHeight = fontSize;
    };

    updateFontSize();

    if (!alwaysShowBackground) {
      addClass(regionDiv, noRegionBackgroundCSSClass);
    }

    var elem = document.createElement('ul');
    elem.style.bottom     = '0';
    elem.style.listStyle  = 'none';
    elem.style.position   = 'absolute';
    elem.style.listStyle  = 'none';
    elem.style.margin     = '0 0 10px 0';
    elem.style.padding    = '0';
    elem.style.width      = '100%';

    regionDiv.appendChild(elem);

    availableRegions[name] = {
      element: elem,
      region: regionDiv,
      bgAlwaysOn: alwaysShowBackground
    };
    subtitleArea.appendChild(regionDiv);

    return availableRegions[name];
  };

  var show = function(event) {
    var region = getRegion(event.regionName, event.regionStyle);

    var elem = document.createElement('li');
    elem.innerHTML = event.text;

    removeClass(region.region, noRegionBackgroundCSSClass);

    region.element.appendChild(elem);
  };

  var hide = function(event) {
    event.regionName = event.regionName || defaultRegionName;

    var elem = document.createElement('li');
    elem.innerHTML = event.text;

    if (!availableRegions.hasOwnProperty(event.regionName)) {
      return;
    }

    var regionList = availableRegions[event.regionName];

    var children = regionList.element.childNodes;
    var len      = children.length;
    var found    = false;
    var child;

    for (var i = 0; i < len; i++) {
      child = children[i];

      if (child && child.innerHTML === elem.innerHTML) {
        regionList.element.removeChild(child);
        found = true;
      }
    }

    if (!regionList.bgAlwaysOn && regionList.element.childNodes.length < 1) {
      addClass(regionList.region, noRegionBackgroundCSSClass);
    }
  };

  var addDefaultRegion = function() {
    getRegion(defaultRegionName, defaultStyle);
  };

  var clear = function() {
    if (subtitleArea) {
      subtitleArea.innerHTML = '';
      availableRegions       = {};
      addDefaultRegion();
    }
  };

  var destroy = function() {
    if (subtitleArea && subtitleArea.parentNode) {
      subtitleArea.parentNode.removeChild(subtitleArea);
      subtitleArea = null;
    }
  };

  var init = function() {
    subtitleArea = createHTMLElement('div');

    subtitleArea.setAttribute('id', 'subtitles');
    subtitleArea.style.position = 'absolute';
    subtitleArea.style.bottom = '0';
    subtitleArea.style.width = '100%';
    subtitleArea.style.height = '100%';
    subtitleArea.style.margin = '0';
    subtitleArea.style.padding = '0';
    subtitleArea.style.pointerEvents = 'none';

    addDefaultRegion();

    var renderingElement = figure.getElementsByTagName('video')[0] || figure.getElementsByTagName('object')[0];
    if (renderingElement && renderingElement.nextSibling) {
      figure.insertBefore(subtitleArea, renderingElement.nextSibling);
    } else {
      figure.appendChild(subtitleArea);
    }
  };
  init();

  return {
    showCue: show,
    hideCue: hide,
    clear: clear,
    destroy: destroy,
    updateFontSize: updateFontSize
  }
}