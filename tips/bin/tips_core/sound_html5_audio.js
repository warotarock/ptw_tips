var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var PTWTipsSound_HTML5_Audio;
(function (PTWTipsSound_HTML5_Audio) {
    var SoundPlayingUnit = (function (_super) {
        __extends(SoundPlayingUnit, _super);
        function SoundPlayingUnit() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.device = null;
            _this.audio = null;
            _this.state = PTWTipsSound.SoundPlayingState.ready;
            return _this;
        }
        // Override methods
        SoundPlayingUnit.prototype.getState = function () {
            if (this.audio.ended) {
                return PTWTipsSound.SoundPlayingState.done;
            }
            return this.state;
        };
        SoundPlayingUnit.prototype.pause = function () {
            this.audio.pause();
            this.state = PTWTipsSound.SoundPlayingState.paused;
        };
        SoundPlayingUnit.prototype.play = function () {
            this.audio.play();
            this.state = PTWTipsSound.SoundPlayingState.playing;
        };
        SoundPlayingUnit.prototype.stop = function () {
            this.audio.pause();
            this.audio.currentTime = 0;
            this.state = PTWTipsSound.SoundPlayingState.stopped;
        };
        SoundPlayingUnit.prototype.getPosition = function () {
            return this.audio.currentTime;
        };
        SoundPlayingUnit.prototype.setPosition = function (milliSeconds) {
            this.audio.currentTime = milliSeconds;
        };
        SoundPlayingUnit.prototype.getVolume = function () {
            return this.audio.volume;
        };
        SoundPlayingUnit.prototype.setVolume = function (valume) {
            this.audio.volume = valume * this.device.volume;
        };
        // own methods
        SoundPlayingUnit.prototype.initialize = function (device) {
            this.device = device;
        };
        SoundPlayingUnit.prototype.release = function () {
            this.stop();
            this.device = null;
            this.audio = null;
            this.state = PTWTipsSound.SoundPlayingState.none;
        };
        return SoundPlayingUnit;
    }(PTWTipsSound.SoundPlayingUnit));
    PTWTipsSound_HTML5_Audio.SoundPlayingUnit = SoundPlayingUnit;
    var SoundSource = (function (_super) {
        __extends(SoundSource, _super);
        function SoundSource() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.device = null;
            _this.masterAudio = null;
            _this.playingUnits = new List();
            return _this;
        }
        // Override methods
        SoundSource.prototype.load = function (fileName) {
            this.device.loadSound(this, fileName);
        };
        SoundSource.prototype.release = function () {
            for (var _i = 0, _a = this.playingUnits; _i < _a.length; _i++) {
                var playingUnit = _a[_i];
                playingUnit.release();
            }
            this.masterAudio = null;
            this.playingUnits = null;
            this.isLoaded = false;
        };
        SoundSource.prototype.getDulation = function () {
            return this.masterAudio.duration;
        };
        SoundSource.prototype.getPlayingUnitCount = function () {
            return this.playingUnits.length;
        };
        SoundSource.prototype.getPlayingUnit = function (index) {
            return this.playingUnits[index];
        };
        // own methods
        SoundSource.prototype.initializePlayingUnits = function (maxPlayingUnitCount) {
            for (var i = 0; i < maxPlayingUnitCount; i++) {
                var playingUnit = this.device.createSoundPlayingUnit();
                this.playingUnits.push(playingUnit);
            }
        };
        return SoundSource;
    }(PTWTipsSound.SoundSource));
    PTWTipsSound_HTML5_Audio.SoundSource = SoundSource;
    var SoundDevice = (function (_super) {
        __extends(SoundDevice, _super);
        function SoundDevice() {
            // Override methods
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.maxParallelLoadingCount = 1;
            return _this;
        }
        SoundDevice.prototype.isAvailable = function () {
            var tempAudio = document.createElement('audio');
            return ((tempAudio.canPlayType('audio/mpeg;') != '') && (tempAudio.canPlayType('audio/wav;') != ''));
        };
        SoundDevice.prototype.initialize = function () {
            return true;
        };
        SoundDevice.prototype.createSoundSource = function (maxPlayingUnitCount) {
            var soundSource = new SoundSource();
            soundSource.device = this;
            soundSource.initializePlayingUnits(maxPlayingUnitCount);
            return soundSource;
        };
        // own methods
        SoundDevice.prototype.loadSound = function (soundSource, url) {
            var audio = new Audio();
            audio.preload = 'auto';
            audio.src = url;
            soundSource.masterAudio = audio;
            var loadedCount = 0;
            // Function for recursive loading
            var canplaythrough = function (ev) {
                // Gurding for over called event
                if (soundSource.isLoaded) {
                    return;
                }
                // End last audio
                audio.removeEventListener('canplaythrough', canplaythrough);
                // Setup playing unit
                var playingUnit = soundSource.playingUnits[loadedCount];
                playingUnit.audio = audio;
                loadedCount++;
                // Load next audio or exit
                if (loadedCount < soundSource.playingUnits.length) {
                    audio = new Audio();
                    audio.preload = 'auto';
                    audio.src = url;
                    // Execute recursively
                    audio.addEventListener('canplaythrough', canplaythrough);
                    audio.load();
                }
                else {
                    soundSource.isLoaded = true;
                }
            };
            // Start loading
            audio.addEventListener('canplaythrough', canplaythrough);
            audio.load();
        };
        SoundDevice.prototype.createSoundPlayingUnit = function () {
            var playingUnit = new SoundPlayingUnit();
            playingUnit.initialize(this);
            return playingUnit;
        };
        return SoundDevice;
    }(PTWTipsSound.SoundDevice));
    PTWTipsSound_HTML5_Audio.SoundDevice = SoundDevice;
})(PTWTipsSound_HTML5_Audio || (PTWTipsSound_HTML5_Audio = {}));
