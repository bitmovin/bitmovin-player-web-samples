const assets = [
  /**
   * Add your own assets here
   */
  {
    name: '24 FPS',
    source: {
      progressive: '//bitdash-a.akamaihd.net/content/art-of-motion-frame-numbers/artofmotion_24fps_framenumbers.mp4'
    },
    frameRate: 24,
  },
];

let player = null;
let playerContainer = null;
let stepSizeInput = null;
let stepBackButton = null;
let stepForwardButton = null;
let seekButton = null;
let smtpeSeekTime = null;
let testAssetSelection = null;
let testAssetDescription = null;

let smtpeController = null;

let conf = {
  key: 'YOUR KEY HERE',
  // the player normally has a safe-space at the end of a stream in which we can not seek, this tweak disables this handling
  // and lets us step around the last seconds of the video
  tweaks: {
    seek_to_end_offset: 0,
  },
};

let currentTimeDisplay = document.getElementById('playerTime');
window.setInterval(function(){
  let currentTime = smtpeController.getCurrentSmpte();
  // let currentTime = toSmtpeTimeCode(player && player.getCurrentTime() || 0, false, true, true);
  // only update on change so you can copy paste it
  if (currentTimeDisplay.innerHTML !== String(currentTime)) {
    currentTimeDisplay.innerHTML = currentTime;
  }
}, 250);

function step(stepSize) {
  smtpeController.step(stepSize);
}

(function init() {
    stepSizeInput = document.getElementById('step_size_input');
    stepBackButton = document.getElementById('step_back_button');
    stepForwardButton = document.getElementById('step_forward_button');
    seekButton = document.getElementById('seek_button');
    smtpeSeekTime = document.getElementById('smtpe_input');
    testAssetSelection = document.getElementById('test-assets');
    testAssetDescription = document.getElementById('test-asset-description');
    playerContainer = document.getElementById('player');

    playerContainer.addEventListener('wheel', handleScroll);
    playerContainer.addEventListener('DOMMouseScroll', handleScroll);

    function handleScroll(ev) {
      // only react to vertical scrolls
      if (ev.deltaY === 0 || !smtpeController) {
        return;
      }
      // as IE does not support Math.sign and we always want a number, use this approach
      const direction = ev.deltaY > 0 ? 1 : -1;
      smtpeController.step(direction * stepSizeInput.value);
      // prevent scrolling the page when we step through the video
      ev.preventDefault();
    }

    stepBackButton.onclick = function() {
      let stepSize = parseInt(stepSizeInput.value) || 1;
      smtpeController.step(-stepSize);
    };

    stepForwardButton.onclick = function() {
      let stepSize = parseInt(stepSizeInput.value) || 1;
      smtpeController.step(stepSize);
    };

    stepSizeInput.onchange = function() {
      if (isNaN(parseInt(stepSizeInput.value))) {
        stepSizeInput.value = 1;
      } else {
        stepSizeInput.value = Math.max(stepSizeInput.value, 1);
      }
      document.getElementById('frame_string').innerHTML = stepSizeInput.value > 1 ? 'frames' : 'frame';
      // update keymap fields
      let keyMapFields = document.querySelectorAll('.stepSize');
      for(let i = 0; i < keyMapFields.length; i++) {
        keyMapFields.item(i).innerHTML = stepSizeInput.value;
      }
      keyMapFields = document.querySelectorAll('.stepSize_x_5');
      for(let i = 0; i < keyMapFields.length; i++) {
        keyMapFields.item(i).innerHTML = String(stepSizeInput.value * 5);
      }
    };

    seekButton.onclick = handleSeekToFrameNumber;
    smtpeSeekTime.onkeypress = function(ev){
      // if enter is hit in the smtpe frame input, treat is the same as a click on the seek button
      if(ev.keyCode === 13) {
        handleSeekToFrameNumber();
      }
    };
    document.addEventListener('keydown', handleKeyboardControls);

    function handleKeyboardControls(ev) {
      if (document.activeElement === smtpeSeekTime || document.activeElement === stepSizeInput) {
        // if we are in our input fields, dont seek the video
        return;
      }
      if (ev.keyCode === 37 || ev.keyCode === 39) {
        // arrow keys, seek +/- 1frame
        let stepSize = parseInt(stepSizeInput.value) || 1;
        stepSize = ev.keyCode === 37 ? -stepSize : stepSize;
        if (ev.ctrlKey === true) {
          // seek 5 frame with control pressed
          stepSize *= 5;
        }
        smtpeController.step(stepSize);
      } else if(ev.keyCode === 32) {
        // space - toggle play/pause
        if (player.isPlaying()) {
          player.pause();
        } else {
          player.play();
        }
      }
    }

  function handleSeekToFrameNumber() {
    // reset errors
    let errorField = document.querySelector('.smpte-error');
    errorField.style.display = 'none';

    try {
      smtpeController.seekToSMPTE(smtpeSeekTime.value);
    }
    catch(err) {
      errorField.innerHTML = err;
      errorField.style.display = 'block';
    }
  }

  function convertAsset(assetIdx) {
      const toConvert = assets[assetIdx];
      // name, sourceConfig, framesPerSecond, adjustmentFactor, framesDroppedAtFullMinute
      return new AssetDescription(toConvert.name, toConvert.source, toConvert.frameRate, toConvert.adjustmentFactor,
        toConvert.framesDroppedEachMinute);
  }

  bitmovin.player("player").setup(conf).then(function (response) {
    smtpeController = new SmtpeController(response, convertAsset(0));
    smtpeController.load(convertAsset(0));
    player = response;
    console.log('player loaded');

    player.addEventHandler('onFullscreenEnter', function() {
      document.getElementById('seekingWrapper').className = 'overlay';
      document.getElementById('player').appendChild(document.getElementById('seekingWrapper'));
    });

    player.addEventHandler('onFullscreenExit', function() {
      let seekingWrapper = document.getElementById('seekingWrapper');
      document.getElementById('player').removeChild(seekingWrapper);
      seekingWrapper.removeAttribute('class');
      document.getElementById('bottom-container').insertBefore(seekingWrapper, document.getElementById('bottom-container').firstChild);
    });
  }, function (reason) {
    console.error(reason);
  });
})();