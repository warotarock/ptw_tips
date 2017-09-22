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
    var PlayingUnit = (function (_super) {
        __extends(PlayingUnit, _super);
        function PlayingUnit() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.soundSystem = null;
            _this.audio = null;
            _this.state = PTWTipsSound.PlayUnitPlayingState.ready;
            return _this;
        }
        PlayingUnit.prototype.getState = function () {
            if (this.audio.ended) {
                return PTWTipsSound.PlayUnitPlayingState.done;
            }
            return this.state;
        };
        PlayingUnit.prototype.pause = function () {
            this.audio.pause();
            this.state = PTWTipsSound.PlayUnitPlayingState.paused;
        };
        PlayingUnit.prototype.play = function () {
            this.audio.play();
            this.state = PTWTipsSound.PlayUnitPlayingState.playing;
        };
        PlayingUnit.prototype.stop = function () {
            this.audio.pause();
            this.audio.currentTime = 0;
            this.state = PTWTipsSound.PlayUnitPlayingState.stopped;
        };
        PlayingUnit.prototype.getPosition = function () {
            return this.audio.currentTime;
        };
        PlayingUnit.prototype.setPosition = function (milliSeconds) {
            this.audio.currentTime = milliSeconds;
        };
        PlayingUnit.prototype.getVolume = function () {
            return this.audio.volume;
        };
        PlayingUnit.prototype.setVolume = function (valume) {
            this.audio.volume = valume * this.soundSystem.volume;
        };
        PlayingUnit.prototype.initialize = function (soundSystem) {
            this.soundSystem = soundSystem;
        };
        PlayingUnit.prototype.release = function () {
            this.stop();
            this.soundSystem = null;
            this.audio = null;
            this.state = PTWTipsSound.PlayUnitPlayingState.none;
        };
        return PlayingUnit;
    }(PTWTipsSound.PlayingUnit));
    PTWTipsSound_HTML5_Audio.PlayingUnit = PlayingUnit;
    var SoundUnit = (function (_super) {
        __extends(SoundUnit, _super);
        function SoundUnit() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.masterAudio = null;
            _this.playingUnits = new List();
            return _this;
        }
        SoundUnit.prototype.release = function () {
            for (var _i = 0, _a = this.playingUnits; _i < _a.length; _i++) {
                var playingUnit = _a[_i];
                playingUnit.release();
            }
            this.masterAudio = null;
            this.playingUnits = null;
            this.isLoaded = false;
        };
        SoundUnit.prototype.getDulation = function () {
            return this.masterAudio.duration;
        };
        SoundUnit.prototype.getPlayingUnitCount = function () {
            return this.playingUnits.length;
        };
        SoundUnit.prototype.getPlayingUnit = function (index) {
            return this.playingUnits[index];
        };
        SoundUnit.prototype.initializePlayingUnits = function (soundSystem, maxPlayingUnitCount) {
            for (var i = 0; i < maxPlayingUnitCount; i++) {
                var playingUnit = new PlayingUnit();
                playingUnit.initialize(soundSystem);
                this.playingUnits.push(playingUnit);
            }
        };
        return SoundUnit;
    }(PTWTipsSound.SoundUnit));
    PTWTipsSound_HTML5_Audio.SoundUnit = SoundUnit;
    var SoundSystem = (function (_super) {
        __extends(SoundSystem, _super);
        function SoundSystem() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.maxParallelLoadingCount = 1;
            return _this;
        }
        SoundSystem.prototype.isAvailable = function () {
            var tempAudio = document.createElement('audio');
            return ((tempAudio.canPlayType('audio/mpeg;') != '') && (tempAudio.canPlayType('audio/wav;') != ''));
        };
        SoundSystem.prototype.initialize = function () {
            return true;
        };
        SoundSystem.prototype.createSoundUnit = function (maxPlayingUnitCount) {
            var soundUnit = new SoundUnit();
            soundUnit.initializePlayingUnits(this, maxPlayingUnitCount);
            return soundUnit;
        };
        SoundSystem.prototype.loadSound = function (soundUnit, url) {
            var audio = new Audio();
            audio.preload = 'auto';
            audio.src = url;
            soundUnit.masterAudio = audio;
            var loadedCount = 0;
            var soundSystem = this;
            // Function for recursive loading
            var canplaythrough = function (ev) {
                // Gurding for over called event
                if (soundUnit.isLoaded) {
                    return;
                }
                // End last audio
                audio.removeEventListener('canplaythrough', canplaythrough);
                // Setup playing unit
                var playingUnit = soundUnit.playingUnits[loadedCount];
                playingUnit.audio = audio;
                loadedCount++;
                // Load next audio
                if (loadedCount < soundUnit.playingUnits.length) {
                    audio = new Audio();
                    audio.preload = 'auto';
                    audio.src = url;
                    // Execute recursively
                    audio.addEventListener('canplaythrough', canplaythrough);
                    audio.load();
                }
                else {
                    soundUnit.isLoaded = true;
                }
            };
            // Start loading
            audio.addEventListener('canplaythrough', canplaythrough);
            audio.load();
        };
        return SoundSystem;
    }(PTWTipsSound.SoundSystem));
    PTWTipsSound_HTML5_Audio.SoundSystem = SoundSystem;
})(PTWTipsSound_HTML5_Audio || (PTWTipsSound_HTML5_Audio = {}));
