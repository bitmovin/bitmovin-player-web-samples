/****************************************************************************
 * Copyright (C) 2017, Bitmovin, Inc., All Rights Reserved
 *
 * This source code and its use and distribution, is subject to the terms
 * and conditions of the applicable license agreement.
 ****************************************************************************/
var bitmovin = window.bitmovin;
/**
 * Default implementation of the KeyMap to Control the player
 */
var DefaultPlayerKeymap = /** @class */ (function () {
    function DefaultPlayerKeymap() {
        this.toggle_play = {
            keyBinding: 'space', callback: function (player) {
                if (player.isPlaying()) {
                    player.pause();
                }
                else {
                    player.play();
                }
            }
        };
        this.toggle_mute = {
            keyBinding: 'm', callback: function (player) {
                if (player.isMuted()) {
                    player.unmute();
                }
                else {
                    player.mute();
                }
            }
        };
        this.enter_fullscreen = {
            keyBinding: 'f', callback: function (player) {
                if (player.getViewMode() !== bitmovin.player.ViewMode.Fullscreen) {
                    player.setViewMode(bitmovin.player.ViewMode.Fullscreen);
                }
            }
        };
        this.exit_fullscreen = {
            keyBinding: 'esc', callback: function (player) {
                if (player.getViewMode() === bitmovin.player.ViewMode.Fullscreen) {
                    player.setViewMode(bitmovin.player.ViewMode.Inline);
                }
            }
        };
        this.seek_plus5_sec = {
            keyBinding: 'right', callback: function (player) {
                player.seek(Math.min(player.getDuration(), player.getCurrentTime() + 5));
            }
        };
        this.seek_plus10_sec = {
            keyBinding: 'ctrl+right / command+right', callback: function (player) {
                player.seek(Math.min(player.getDuration(), player.getCurrentTime() + 10));
            }
        };
        this.seek_minus5_sec = {
            keyBinding: 'left', callback: function (player) {
                player.seek(Math.max(0, player.getCurrentTime() - 5));
            }
        };
        this.seek_minus10_sec = {
            keyBinding: 'ctrl+left / command+left', callback: function (player) {
                player.seek(Math.max(0, player.getCurrentTime() - 10));
            }
        };
        this.volume_plus5 = {
            keyBinding: 'up', callback: function (player) {
                player.setVolume(Math.min(100, player.getVolume() + 5));
            }
        };
        this.volume_plus10 = {
            keyBinding: 'ctrl+up / command+up', callback: function (player) {
                player.setVolume(Math.min(100, player.getVolume() + 10));
            }
        };
        this.volume_minus5 = {
            keyBinding: 'down', callback: function (player) {
                player.setVolume(Math.max(0, player.getVolume() - 5));
            }
        };
        this.volume_minus10 = {
            keyBinding: 'ctrl+down / command+down', callback: function (player) {
                player.setVolume(Math.max(0, player.getVolume() - 10));
            }
        };
    }
    DefaultPlayerKeymap.prototype.getAllBindings = function () {
        var retVal = [];
        // collect all objects of this keymap
        // Do not use a static approach here as everything can be overwritten / extended
        for (var attr in this) {
            if (typeof this[attr] === 'object') {
                retVal.push(this[attr]);
            }
        }
        return retVal;
    };
    DefaultPlayerKeymap.prototype.getAllBindingsForKey = function (keyRepresentation) {
        var retVal = [];
        var allBindings = this.getAllBindings();
        // split the key command by + and check all parts seperatly so we have the same behavior with ctrl+alt as with alt+ctrl
        var allNeededKeys = keyRepresentation.split(KeyboardEventMapper.KeyCommandSeparator);
        allBindings.forEach(function (element) {
            element.keyBinding.split(KeyboardEventMapper.KeyBindingSeparator).forEach(function (singleBinding) {
                var containsAllParts = true;
                // make sure that the same amount of keys is needed and then make sure that all keys are contained
                var singleBindingParts = singleBinding.split(KeyboardEventMapper.KeyCommandSeparator);
                if (allNeededKeys.length === singleBindingParts.length) {
                    allNeededKeys.forEach(function (keyCommandPart) {
                        if (singleBindingParts.indexOf(keyCommandPart) < 0) {
                            containsAllParts = false;
                        }
                    });
                    if (containsAllParts) {
                        retVal.push(element);
                    }
                }
            });
        });
        return retVal;
    };
    return DefaultPlayerKeymap;
}());
/**
 * Class to control a given player instance via the keyboard
 */
var PlayerKeyboardControl = /** @class */ (function () {
    function PlayerKeyboardControl(wrappedPlayer, preventPageScroll, config) {
        if (preventPageScroll === void 0) { preventPageScroll = true; }
        var _this = this;
        this.preventScrolling = function (event) {
            var keyCode = event.which || event.keyCode;
            // prevent scrolling with arrow keys, space, pageUp and pageDown
            if (KeyboardEventMapper.isScrollKey(keyCode)) {
                // maybe we should check here if we actually have a keybinding for the keyCode and only prevent
                // the scrolling if we actually handle the event
                event.preventDefault();
            }
        };
        this.handleKeyEvent = function (event) {
            if (_this.isEnabled) {
                var keyStringRepresentation = KeyboardEventMapper.convertKeyboardEventToString(event);
                var bindings = _this.keyMap.getAllBindingsForKey(keyStringRepresentation);
                bindings.forEach(function (singleBinding) {
                    singleBinding.callback(_this.player);
                });
            }
        };
        this.player = wrappedPlayer;
        this.shouldPreventScrolling = preventPageScroll;
        var paramKeyMap = {};
        if (config) {
            paramKeyMap = config;
        }
        this.keyMap = PlayerKeyboardControl.mergeConfigWithDefault(paramKeyMap);
        // default to enabled
        // this also registers the event listeners
        this.enable(true);
        // destroy this together with the player
        this.player.on(bitmovin.player.PlayerEvent.Destroy, function () {
            _this.destroy();
        });
    }
    PlayerKeyboardControl.prototype.enable = function (shouldBeEnabled) {
        if (shouldBeEnabled === void 0) { shouldBeEnabled = true; }
        this.isEnabled = shouldBeEnabled;
        // depending if we are enabled register or remove the keyListener
        // we cannot use the keypress event as that event does not work with modifiers
        // only add the keyUp listener as we do not expect users holding buttons to control the player
        if (this.isEnabled) {
            // in order to stop the browser from scrolling we have to add an additional onKeyDown listener
            // because the browser would scroll on that one already
            if (this.shouldPreventScrolling) {
                document.addEventListener('keydown', this.preventScrolling, false);
            }
            document.addEventListener('keyup', this.handleKeyEvent, false);
        }
        else {
            // document.addEventListener('keypress', this.handleKeyEvent, false);
            document.removeEventListener('keydown', this.preventScrolling, false);
            document.removeEventListener('keyup', this.handleKeyEvent, false);
        }
    };
    PlayerKeyboardControl.prototype.disable = function (shouldBeDisabled) {
        if (shouldBeDisabled === void 0) { shouldBeDisabled = true; }
        this.enable(!shouldBeDisabled);
    };
    /**
     * Use this method to prevent the browser from scrolling via keyboard
     * @param preventScrolling true if keyboard scrolling should be prevented, false if nots
     */
    PlayerKeyboardControl.prototype.setPreventScrolling = function (preventScrolling) {
        this.shouldPreventScrolling = preventScrolling;
        // set up or remove the listener if necessary
        if (this.isEnabled) {
            if (preventScrolling) {
                document.addEventListener('keydown', this.preventScrolling, false);
            }
            else {
                document.removeEventListener('keydown', this.preventScrolling, false);
            }
        }
    };
    PlayerKeyboardControl.prototype.destroy = function () {
        // removes the listener
        this.disable(true);
    };
    PlayerKeyboardControl.mergeConfigWithDefault = function (paramKeyMap) {
        var retVal = new DefaultPlayerKeymap();
        // allow overwrites to the default player keymap as well as new listeners
        for (var attr in paramKeyMap) {
            if (attr && paramKeyMap[attr]) {
                var toCheck = paramKeyMap[attr];
                // avoid wrong configs and check for elements being real keyListeners
                if (toCheck['keyBinding'] && toCheck['callback']) {
                    retVal[attr] = paramKeyMap[attr];
                }
                else {
                    console.log('Invalid Key Listener at params[' + attr + ']');
                }
            }
        }
        return retVal;
    };
    return PlayerKeyboardControl;
}());
/**
 * Class to handle mappings from KeyboardEvent.keyCode to a string representation
 */
var KeyboardEventMapper = /** @class */ (function () {
    function KeyboardEventMapper() {
    }
    /**
     * Converts a Keyboard Event to something like shit+alt+g depending on the character code of the event and the modifiers
     * @param event the event to be converted into a string
     * @returns {string} the representation of the all keys which were pressed
     */
    KeyboardEventMapper.convertKeyboardEventToString = function (event) {
        var retVal = '';
        var needsConcat = false;
        if (event.shiftKey) {
            retVal += 'shift';
            needsConcat = true;
        }
        if (event.altKey) {
            if (needsConcat) {
                retVal += KeyboardEventMapper.KeyCommandSeparator;
            }
            else {
                needsConcat = true;
            }
            retVal += 'alt';
        }
        if (event.ctrlKey || event.metaKey) {
            if (needsConcat) {
                retVal += KeyboardEventMapper.KeyCommandSeparator;
            }
            else {
                needsConcat = true;
            }
            retVal += 'ctrl';
        }
        var convertedCode = KeyboardEventMapper.convertKeyCodeToString(event);
        if (convertedCode) {
            if (needsConcat) {
                retVal += KeyboardEventMapper.KeyCommandSeparator;
            }
            retVal += convertedCode;
        }
        else {
            console.log('No conversion for the code: ' + event.keyCode);
        }
        return retVal;
    };
    /**
     * Tries to convert a given keyCode to a string representation of the key
     * @param event the event which contains the keyCode
     * @returns {string} the string representation of the keyCode (eg.: 'left', 'esc', 'space', 'a', '1' ...)
     */
    KeyboardEventMapper.convertKeyCodeToString = function (event) {
        var code = event.which || event.keyCode;
        var retVal;
        if (KeyboardEventMapper.isModifierKey(code)) {
            retVal = KeyboardEventMapper.ModifyerKeys[code];
        }
        else if (KeyboardEventMapper.isControlKey(code)) {
            retVal = KeyboardEventMapper.ControlKeys[code];
        }
        else if (KeyboardEventMapper.isNumblockKey(code)) {
            retVal = KeyboardEventMapper.NumblockKeys[code];
        }
        else if (KeyboardEventMapper.isFKey(code)) {
            retVal = KeyboardEventMapper.F_Keys[code];
        }
        else {
            // try and convert a unicode character
            retVal = String.fromCharCode(code).toLowerCase();
        }
        return retVal;
    };
    KeyboardEventMapper.isModifierKey = function (keyCode) {
        return KeyboardEventMapper.ModifyerKeys.hasOwnProperty('' + keyCode);
    };
    KeyboardEventMapper.isControlKey = function (keyCode) {
        return KeyboardEventMapper.ControlKeys.hasOwnProperty('' + keyCode);
    };
    KeyboardEventMapper.isNumblockKey = function (keyCode) {
        return KeyboardEventMapper.NumblockKeys.hasOwnProperty('' + keyCode);
    };
    KeyboardEventMapper.isFKey = function (keyCode) {
        return KeyboardEventMapper.F_Keys.hasOwnProperty('' + keyCode);
    };
    KeyboardEventMapper.isScrollKey = function (keyCode) {
        return KeyboardEventMapper.ScrollingKeys.hasOwnProperty('' + keyCode);
    };
    KeyboardEventMapper.KeyBindingSeparator = ' / ';
    KeyboardEventMapper.KeyCommandSeparator = '+';
    /**
     * keys which will represented as a modifier
     */
    KeyboardEventMapper.ModifyerKeys = {
        16: 'shift',
        17: 'ctrl',
        18: 'alt',
        20: 'capslock',
        91: 'meta',
        93: 'meta',
        224: 'meta'
    };
    /**
     * Special keys on the keyboard which are not modifiers
     */
    KeyboardEventMapper.ControlKeys = {
        8: 'backspace',
        9: 'tab',
        13: 'enter',
        19: 'pause',
        27: 'esc',
        32: 'space',
        33: 'pageup',
        34: 'pagedown',
        35: 'end',
        36: 'home',
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down',
        44: 'print',
        45: 'ins',
        46: 'del',
        145: 'scrolllock',
        186: ';',
        187: '=',
        188: ',',
        189: '-',
        190: '.',
        191: '/',
        192: '`',
        219: '[',
        220: '\\',
        221: ']',
        222: '\''
    };
    /**
     * Keys wich normally move the page
     */
    KeyboardEventMapper.ScrollingKeys = {
        32: 'space',
        33: 'pageup',
        34: 'pagedown',
        35: 'end',
        36: 'home',
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down',
    };
    /**
     * All number on the numblock an the keys surrounding it
     */
    KeyboardEventMapper.NumblockKeys = {
        96: '0',
        97: '1',
        98: '2',
        99: '3',
        100: '4',
        101: '5',
        102: '6',
        103: '7',
        104: '8',
        105: '9',
        106: '*',
        107: '+',
        109: '-',
        110: '.',
        111: '/',
        144: 'numlock'
    };
    /**
     * F1 - F19
     */
    KeyboardEventMapper.F_Keys = {
        112: 'F1',
        113: 'F2',
        114: 'F3',
        115: 'F4',
        116: 'F5',
        117: 'F6',
        118: 'F7',
        119: 'F8',
        120: 'F9',
        121: 'F10',
        122: 'F11',
        123: 'F12',
        124: 'F13',
        125: 'F14',
        126: 'F15',
        127: 'F16',
        128: 'F17',
        129: 'F18',
        130: 'F19',
    };
    return KeyboardEventMapper;
}());
