/****************************************************************************
 * Copyright (C) 2017, Bitmovin, Inc., All Rights Reserved
 *
 * This source code and its use and distribution, is subject to the terms
 * and conditions of the applicable license agreement.
 ****************************************************************************/

/**
 * Default implementation of the KeyMap to Control the player
 */
class DefaultPlayerKeymap implements PlayerKeyMap {
    toggle_play = <KeyToFunctionBinding>{
        keyBinding: 'space', callback: (player: SupportedPlayerTypes) => {
            if (player.isPlaying()) {
                player.pause();
            } else {
                player.play();
            }
        }
    };
    toggle_mute = <KeyToFunctionBinding>{
        keyBinding: 'm', callback: (player: SupportedPlayerTypes) => {
            if (player.isMuted()) {
                player.unmute();
            } else {
                player.mute();
            }
        }
    };
    enter_fullscreen = <KeyToFunctionBinding>{
        keyBinding: 'f', callback: (player: SupportedPlayerTypes) => {
            if (!player.isFullscreen()) {
                player.enterFullscreen();
            }
        }
    };
    exit_fullscreen = <KeyToFunctionBinding>{
        keyBinding: 'esc', callback: (player: SupportedPlayerTypes) => {
            if (player.isFullscreen()) {
                player.exitFullscreen();
            }
        }
    };
    seek_plus5_sec = <KeyToFunctionBinding>{
        keyBinding: 'right', callback: (player: SupportedPlayerTypes) => {
            player.seek(Math.min(player.getDuration(), player.getCurrentTime() + 5));
        }
    };
    seek_plus10_sec = <KeyToFunctionBinding>{
        keyBinding: 'ctrl+right / command+right', callback: (player: SupportedPlayerTypes) => {
            player.seek(Math.min(player.getDuration(), player.getCurrentTime() + 10));
        }
    };
    seek_minus5_sec = <KeyToFunctionBinding>{
        keyBinding: 'left', callback: (player: SupportedPlayerTypes) => {
            player.seek(Math.max(0, player.getCurrentTime() - 5));
        }
    };
    seek_minus10_sec = <KeyToFunctionBinding>{
        keyBinding: 'ctrl+left / command+left', callback: (player: SupportedPlayerTypes) => {
            player.seek(Math.max(0, player.getCurrentTime() - 10));
        }
    };
    volume_plus5 = <KeyToFunctionBinding> {
        keyBinding: 'up', callback: (player: SupportedPlayerTypes) => {
            player.setVolume(Math.min(100, player.getVolume() + 5));
        }
    };
    volume_plus10 = <KeyToFunctionBinding> {
        keyBinding: 'ctrl+up / command+up', callback: (player: SupportedPlayerTypes) => {
            player.setVolume(Math.min(100, player.getVolume() + 10));
        }
    };
    volume_minus5 = <KeyToFunctionBinding> {
        keyBinding: 'down', callback: (player: SupportedPlayerTypes) => {
            player.setVolume(Math.max(0, player.getVolume() - 5));
        }
    };
    volume_minus10 = <KeyToFunctionBinding> {
        keyBinding: 'ctrl+down / command+down', callback: (player: SupportedPlayerTypes) => {
            player.setVolume(Math.max(0, player.getVolume() - 10));
        }
    };

    getAllBindings(): KeyToFunctionBinding[] {
        let retVal = [];

        // collect all objects of this keymap
        // Do not use a static approach here as everything can be overwritten / extended
        for (let attr in this) {
            if (typeof this[attr] === 'object') {
                retVal.push(this[attr]);
            }
        }

        return retVal;
    }

    getAllBindingsForKey(keyRepresentation: string): KeyToFunctionBinding[] {
        let retVal = [];
        let allBindings = this.getAllBindings();
        // split the key command by + and check all parts seperatly so we have the same behavior with ctrl+alt as with alt+ctrl
        let allNeededKeys = keyRepresentation.split(KeyboardEventMapper.KeyCommandSeparator);
        allBindings.forEach((element: KeyToFunctionBinding) => {
            element.keyBinding.split(KeyboardEventMapper.KeyBindingSeparator).forEach((singleBinding: string) => {
                let containsAllParts = true;
                // make sure that the same amount of keys is needed and then make sure that all keys are contained
                let singleBindingParts = singleBinding.split(KeyboardEventMapper.KeyCommandSeparator);
                if (allNeededKeys.length === singleBindingParts.length) {
                    allNeededKeys.forEach((keyCommandPart: string) => {
                        if (singleBindingParts.indexOf(keyCommandPart) < 0) {
                            containsAllParts = false;
                        }
                    });
                    if (containsAllParts) {
                        retVal.push(element);
                    }
                }
            })
        });
        return retVal;
    }
}

/**
 * Definition of a Keyboard -> PlayerControl binding.
 * the player Method signals what should happen on the player, but the actual behaviour is completely controlled by
 * the callback.
 * If you wish to overwrite the default behavior you can overwrite the default listeners in the config. Any Binding defined
 * there will overwrite the default config.
 */
interface KeyToFunctionBinding {
    /**
     * the actual functionality of the binding, gets the player as a parameter
     */
    callback: Function;
    /**
     * The keycode to listen to. Multiple bindings can listen to the same key.
     */
    keyBinding: string;
}

/**
 * Definition of all player functions which are bound to a keystroke by default.
 * It is possible to configure any number of unknown KeyToFunctionBindings via the player configuration
 */
interface PlayerKeyMap {
    toggle_play: KeyToFunctionBinding;
    toggle_mute: KeyToFunctionBinding;
    enter_fullscreen: KeyToFunctionBinding;
    exit_fullscreen: KeyToFunctionBinding;
    seek_plus5_sec: KeyToFunctionBinding;
    seek_plus10_sec: KeyToFunctionBinding;
    seek_minus5_sec: KeyToFunctionBinding;
    seek_minus10_sec: KeyToFunctionBinding;
    volume_plus5: KeyToFunctionBinding;
    volume_plus10: KeyToFunctionBinding;
    volume_minus5: KeyToFunctionBinding;
    volume_minus10: KeyToFunctionBinding;

    /**
     * Retrieves a collection of all bindings of this KeyMap
     */
    getAllBindings(): KeyToFunctionBinding[];

    /**
     * Filters all bindings of this KeyMap to find the bindings which have a matching keyBinding
     * @param keyRepresentation the string representation of the desired keyStroke
     */
    getAllBindingsForKey(keyRepresentation: string): KeyToFunctionBinding[];
}

/**
 * All Player types which are supported by this class
 */
type SupportedPlayerTypes = any;

/**
 * Class to control a given player instance via the keyboard
 */
class PlayerKeyboardControl {

    private keyMap: PlayerKeyMap;
    private isEnabled: boolean;
    private player: SupportedPlayerTypes;
    private shouldPreventScrolling: boolean;
    

    constructor(wrappedPlayer: SupportedPlayerTypes, preventPageScroll = true, config?: any) {
        this.player = wrappedPlayer;
        this.shouldPreventScrolling = preventPageScroll;
        let paramKeyMap = {};
        if (config) {
            paramKeyMap = config;
        }

        this.keyMap = PlayerKeyboardControl.mergeConfigWithDefault(paramKeyMap);
        // default to enabled
        // this also registers the event listeners
        this.enable(true);

        // destroy this together with the player
        this.player.on('destroy', () => {
            this.destroy();
        });
    }

    public enable(shouldBeEnabled: boolean = true) {
        this.isEnabled = shouldBeEnabled;
        // depending if we are enabled register or remove the keyListener
        // we cannot use the keypress event as that event does not work with modifiers
        // only add the keyUp listener as we do not expect users holding buttons to control the player
        if (this.isEnabled) {
            // in order to stop the browser from scrolling we have to add an additional onKeyDown listener
            // because the browser would scroll on that one already
            if(this.shouldPreventScrolling) {
                document.addEventListener('keydown', this.preventScrolling, false);
            }
            document.addEventListener('keyup', this.handleKeyEvent, false);
        } else {
            // document.addEventListener('keypress', this.handleKeyEvent, false);
            document.removeEventListener('keydown', this.preventScrolling, false);
            document.removeEventListener('keyup', this.handleKeyEvent, false);
        }
    }

    public disable(shouldBeDisabled: boolean = true) {
        this.enable(!shouldBeDisabled);
    }

    /**
     * Use this method to prevent the browser from scrolling via keyboard
     * @param preventScrolling true if keyboard scrolling should be prevented, false if nots
     */
    public setPreventScrolling(preventScrolling: boolean): void {
        this.shouldPreventScrolling = preventScrolling;

        // set up or remove the listener if necessary
        if (this.isEnabled) {
            if (preventScrolling) {
                document.addEventListener('keydown', this.preventScrolling, false);
            } else {
                document.removeEventListener('keydown', this.preventScrolling, false);
            }
        }
    }

    public destroy() {
        // removes the listener
        this.disable(true);
    }

    protected static mergeConfigWithDefault(paramKeyMap: object): PlayerKeyMap {
        let retVal = new DefaultPlayerKeymap();
        // allow overwrites to the default player keymap as well as new listeners
        for (let attr in paramKeyMap) {
            if (attr && paramKeyMap[attr]) {
                let toCheck = paramKeyMap[attr];
                // avoid wrong configs and check for elements being real keyListeners
                if (toCheck['keyBinding'] && toCheck['callback']) {
                    retVal[attr] = paramKeyMap[attr];
                } else {
                    console.log('Invalid Key Listener at params[' + attr + ']');
                }
            }
        }
        return retVal;
    }

    public preventScrolling = (event: KeyboardEvent) => {
        const keyCode = event.which || event.keyCode;
        // prevent scrolling with arrow keys, space, pageUp and pageDown
        if (KeyboardEventMapper.isScrollKey(keyCode)) {
            // maybe we should check here if we actually have a keybinding for the keyCode and only prevent
            // the scrolling if we actually handle the event
            event.preventDefault();
        }
    };

    public handleKeyEvent = (event: KeyboardEvent) => {
        if (this.isEnabled) {
            let keyStringRepresentation = KeyboardEventMapper.convertKeyboardEventToString(event);

            let bindings = this.keyMap.getAllBindingsForKey(keyStringRepresentation);
            bindings.forEach((singleBinding: KeyToFunctionBinding) => {
                singleBinding.callback(this.player);
            });
        }
    };
}


/**
 * Class to handle mappings from KeyboardEvent.keyCode to a string representation
 */
class KeyboardEventMapper {

    public static KeyBindingSeparator = ' / ';
    public static KeyCommandSeparator = '+';

    /**
     * keys which will represented as a modifier
     */
    public static ModifyerKeys = {
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
    public static ControlKeys = {
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
    public static ScrollingKeys = {
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
    public static NumblockKeys = {
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
    public static F_Keys = {
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

    /**
     * Converts a Keyboard Event to something like shit+alt+g depending on the character code of the event and the modifiers
     * @param event the event to be converted into a string
     * @returns {string} the representation of the all keys which were pressed
     */
    public static convertKeyboardEventToString(event: KeyboardEvent): string {
        let retVal = '';
        let needsConcat: boolean = false;

        if (event.shiftKey) {
            retVal += 'shift';
            needsConcat = true;
        }
        if (event.altKey) {
            if (needsConcat) {
                retVal += KeyboardEventMapper.KeyCommandSeparator;
            } else {
                needsConcat = true;
            }
            retVal += 'alt'
        }
        if (event.ctrlKey || event.metaKey) {
            if (needsConcat) {
                retVal += KeyboardEventMapper.KeyCommandSeparator;
            } else {
                needsConcat = true;
            }
            retVal += 'ctrl'
        }

        let convertedCode = KeyboardEventMapper.convertKeyCodeToString(event);
        if (convertedCode) {
            if (needsConcat) {
                retVal += KeyboardEventMapper.KeyCommandSeparator;
            }
            retVal += convertedCode;
        } else {
            console.log('No conversion for the code: ' + event.keyCode);
        }

        return retVal;
    }

    /**
     * Tries to convert a given keyCode to a string representation of the key
     * @param event the event which contains the keyCode
     * @returns {string} the string representation of the keyCode (eg.: 'left', 'esc', 'space', 'a', '1' ...)
     */
    public static convertKeyCodeToString(event: KeyboardEvent): string {

        let code = event.which || event.keyCode;

        let retVal: string;
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
    }

    public static isModifierKey(keyCode: number): boolean {
        return KeyboardEventMapper.ModifyerKeys.hasOwnProperty('' + keyCode);
    }

    public static isControlKey(keyCode: number): boolean {
        return KeyboardEventMapper.ControlKeys.hasOwnProperty('' + keyCode);
    }

    public static isNumblockKey(keyCode: number): boolean {
        return KeyboardEventMapper.NumblockKeys.hasOwnProperty('' + keyCode);
    }

    public static isFKey(keyCode: number): boolean {
        return KeyboardEventMapper.F_Keys.hasOwnProperty('' + keyCode);
    }

    public static isScrollKey(keyCode: number): boolean {
        return KeyboardEventMapper.ScrollingKeys.hasOwnProperty('' + keyCode)
    }
}