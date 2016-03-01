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
  var wrapper;
  var subtitleContainer;
  var subtitleList;
  var cues;

  var showCue = function(data) {
    cues[data.text] = document.createElement('li');
    cues[data.text].innerHTML = data.text;
    subtitleList.appendChild(cues[data.text]);
  };

  var hideCue = function(data) {
    if (cues.hasOwnProperty(data.text) && cues[data.text].parentNode) {
      cues[data.text].parentNode.removeChild(cues[data.text]);
    }
    delete cues[data.text];
  };

  var clear = function() {
    for (var cue in cues) {
      if (cues.hasOwnProperty(cue) && cues[cue].parentNode) {
        cues[cue].parentNode.removeChild(cues[cue]);
      }
    }
    cues = { };
  };

  var init = function() {
    wrapper = document.createElement('div');
    subtitleContainer = document.createElement('div');
    subtitleList = document.createElement('ul');

    wrapper.setAttribute('id', 'subtitles');
    wrapper.style.position = 'absolute';
    wrapper.style.bottom = '0';
    wrapper.style.width = '100%';
    wrapper.style.height = '100%';
    wrapper.style.margin = '0';
    wrapper.style.padding = '0';
    wrapper.style.pointerEvents = 'none';

    subtitleContainer.style.textAlign = 'center';
    subtitleContainer.style.left = '5%';
    subtitleContainer.style.top = '5%';
    subtitleContainer.style.width = '90%';
    subtitleContainer.style.height = '90%';
    subtitleContainer.style.fontFamily = 'comic-sans%';
    subtitleContainer.style.textShadow = 'black 1px 1px 1px, black 1px -1px 1px, black -1px 1px 1px, black -1px -1px 1px%';
    subtitleContainer.style.color = 'white';
    subtitleContainer.style.position = 'absolute';
    subtitleContainer.style.fontSize = '35px';
    subtitleContainer.style.lineHeight = '35px';
    subtitleContainer.style.margin = '0';
    subtitleContainer.style.padding = '0';

    subtitleList.style.bottom = '0';
    subtitleList.style.listStyle = 'none';
    subtitleList.style.position = 'absolute';
    subtitleList.style.margin = '0px 0px 10px';
    subtitleList.style.padding = '0';
    subtitleList.style.width = '100%';

    subtitleContainer.appendChild(subtitleList);
    wrapper.appendChild(subtitleContainer);
    figure.appendChild(wrapper);

    cues = { };
  };

  init();

  return {
    showCue: showCue,
    hideCue: hideCue,
    clear: clear
  }
}