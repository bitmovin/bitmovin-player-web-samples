const assets = [
  /**
   * Add your own assets here
   */
  {
    name: '24 FPS, 1 frame off, some duplicate frames',
    source: {
      // progressive: './artofmotion_24fps_framenumbers.mp4'
      progressive: '//bitdash-a.akamaihd.net/content/art-of-motion-frame-numbers/artofmotion_24fps_framenumbers.mp4'
    },
    frameRate: 24,
    // the following params are calculated but may be overwritten
    // adjustmentFactor: 1,
    // framesDroppedEachMinute: 0
  },
  {
    name: '60 FPS, 1 frame off, many duplicate frames',
    source: {
      // progressive: './artofmotion_24fps_framenumbers.mp4'
      progressive: '//bitdash-a.akamaihd.net/content/art-of-motion-frame-numbers/artofmotion_60fps_framenumbers.mp4'
    },
    frameRate: 60,
    // the following params are calculated but may be overwritten
    // adjustmentFactor: 1,
    // framesDroppedEachMinute: 0
  },

];

let player               = null;
let stepSizeInput        = null;
let stepBackButton       = null;
let stepForwardButton    = null;
let seekButton           = null;
let smtpeSeekTime        = null;
let testAssetSelection   = null;
let testAssetDescription = null;

let smtpeController = null;

let conf = {
  key: '89f6ed6c-ab0e-46c2-ac47-5665e60c3c41',
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

    let opt;
    assets.forEach(function(asset){
      opt = document.createElement('option');
      opt.label = asset.name;
      opt.value = asset.name;
      opt.innerText = asset.name;
      testAssetSelection.appendChild(opt);
    });
    // select last asset by default
    (opt || {}).selected = 'selected';

    testAssetSelection.onchange = handleAssetSelection;
    handleAssetSelection();

    function handleAssetSelection() {
      let asset = assets.find(function(elem){
        return elem.name === testAssetSelection.value;
      }) || assets[assets.length - 1];
      frameRate = asset.frameRate;
      frameDuration = 1 / frameRate;
      adjustmentFactor = asset.adjustmentFactor;
      // testAssetDescription.innerHTML = asset.description;
      framesDroppedEachMinute = asset.framesDroppedEachMinute || 0;

      // player && player.load(asset.source);
      smtpeController && smtpeController.load(convertAsset(assets.indexOf(asset)));
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

    // validate SMTPE timecode
    let isValidSMPTETimeCode = new RegExp(/(^(?:(?:[0-1][0-9]|[0-2][0-3]):)(?:[0-5][0-9]:){2}(?:[0-6][0-9])$)/);
    if(!isValidSMPTETimeCode.test(smtpeSeekTime.value)) {
      // invalid format, show error and do nothing
      console.error(smtpeSeekTime.value + ' does not match a SMPTE timecode HH:MM:SS:FF');
      errorField.innerHTML = 'Please enter a valid SMPTE timecode';
      errorField.style.display = 'block';
      return;
    }
    if(Number(smtpeSeekTime.value.split(':')[3]) >= frameRate) {
      // frame portion of the input is higher than the FPS
      errorField.innerHTML = 'Frame Number in SMPTE is higher than FPS: ' + frameRate;
      errorField.style.display = 'block';
      return;
    }

    smtpeController.seekToSMPTE(smtpeSeekTime.value);
  }

  function convertAsset(assetIdx) {
      const toConvert = assets[assetIdx];
      // name, sourceConfig, framesPerSecond, adjustmentFactor, framesDroppedAtFullMinute
      return new AssetDescription(toConvert.name, toConvert.source, toConvert.frameRate, toConvert.adjustmentFactor, toConvert.framesDroppedEachMinute);
  }

  bitmovin.player("player").setup(conf).then(function (response) {
    smtpeController = new FrameAccurateControls(response, convertAsset(0));
    player = response;
    console.log('player loaded');
    handleAssetSelection();

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