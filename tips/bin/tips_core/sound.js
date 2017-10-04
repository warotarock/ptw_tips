var PTWTipsSound;
(function (PTWTipsSound) {
    var SoundPlayingState;
    (function (SoundPlayingState) {
        SoundPlayingState[SoundPlayingState["none"] = 0] = "none";
        SoundPlayingState[SoundPlayingState["ready"] = 1] = "ready";
        SoundPlayingState[SoundPlayingState["playing"] = 2] = "playing";
        SoundPlayingState[SoundPlayingState["stopped"] = 3] = "stopped";
        SoundPlayingState[SoundPlayingState["paused"] = 4] = "paused";
        SoundPlayingState[SoundPlayingState["done"] = 5] = "done";
    })(SoundPlayingState = PTWTipsSound.SoundPlayingState || (PTWTipsSound.SoundPlayingState = {}));
    var SoundPlayingUnit = (function () {
        function SoundPlayingUnit() {
            this.isFadeing = false;
            this.fadeTime = -1.0;
            this.fadeDuration = 0.0;
            this.fadeEndVolume = 0.0;
            this.fadeStartVolume = 0.0;
            this.loopStartTime = -1.0;
            this.loopEndTime = -1.0;
        }
        SoundPlayingUnit.prototype.resetEffects = function () {
            this.isFadeing = false;
            this.fadeTime = -1.0;
            this.fadeDuration = -1.0;
            this.fadeStartVolume = -1.0;
            this.fadeEndVolume = -1.0;
            this.loopStartTime = -1.0;
            this.loopEndTime = -1.0;
        };
        SoundPlayingUnit.prototype.setFading = function (fadeDuration, fadeStartVolume, fadeEndVolume) {
            this.isFadeing = true;
            this.fadeTime = 0;
            this.fadeDuration = fadeDuration;
            this.fadeStartVolume = fadeStartVolume;
            this.fadeEndVolume = fadeEndVolume;
        };
        SoundPlayingUnit.prototype.setLooping = function (loopStartTime, loopEndTime) {
            this.loopStartTime = loopStartTime;
            this.loopEndTime = loopEndTime;
        };
        // override methods
        SoundPlayingUnit.prototype.getState = function () {
            // override method
            return SoundPlayingState.none;
        };
        SoundPlayingUnit.prototype.play = function () {
            // override method
        };
        SoundPlayingUnit.prototype.pause = function () {
            // override method
        };
        SoundPlayingUnit.prototype.stop = function () {
            // override method
        };
        SoundPlayingUnit.prototype.getPosition = function () {
            // override method
            return 0.0;
        };
        SoundPlayingUnit.prototype.setPosition = function (time) {
            // override method
        };
        SoundPlayingUnit.prototype.getVolume = function () {
            // override method
            return 0.0;
        };
        SoundPlayingUnit.prototype.setVolume = function (volume) {
            // override method
        };
        return SoundPlayingUnit;
    }());
    PTWTipsSound.SoundPlayingUnit = SoundPlayingUnit;
    var SoundSourceUnit = (function () {
        function SoundSourceUnit() {
            this.soundManger = null;
            this.isLoaded = false;
        }
        SoundSourceUnit.prototype.play = function () {
            if (this.soundManger.isMuted) {
                return null;
            }
            if (this.isPlayedOnce) {
                return null;
            }
            this.isPlayedOnce = true;
            // Get playing unit
            var playingUnitCount = this.getPlayingUnitCount();
            var playingUnit = null;
            for (var i = 0; i < playingUnitCount; i++) {
                var pu = this.getPlayingUnit(i);
                var state = pu.getState();
                if (state == SoundPlayingState.ready || state == SoundPlayingState.stopped || state == SoundPlayingState.done) {
                    playingUnit = pu;
                }
            }
            // Play 
            if (playingUnit == null) {
                return null;
            }
            playingUnit.resetEffects();
            playingUnit.play();
            return playingUnit;
        };
        // override methods
        SoundSourceUnit.prototype.load = function (fileName) {
            // override method
        };
        SoundSourceUnit.prototype.release = function () {
            // override method
        };
        SoundSourceUnit.prototype.getDulation = function () {
            // override method
            return 0.0;
        };
        SoundSourceUnit.prototype.getPlayingUnitCount = function () {
            // override method
            return 0;
        };
        SoundSourceUnit.prototype.getPlayingUnit = function (index) {
            // override method
            return null;
        };
        return SoundSourceUnit;
    }());
    PTWTipsSound.SoundSourceUnit = SoundSourceUnit;
    var SoundDevice = (function () {
        function SoundDevice() {
            this.volume = 1.0;
            this.maxParallelLoadingCount = 1;
        }
        SoundDevice.prototype.getMasterVolume = function () {
            return this.volume;
        };
        SoundDevice.prototype.setMasterVolume = function (volume) {
            this.volume = volume;
        };
        // override methods
        SoundDevice.prototype.isAvailable = function () {
            // override method
            return false;
        };
        SoundDevice.prototype.initialize = function () {
            // override method
            return false;
        };
        SoundDevice.prototype.createSoundSource = function (maxPlayingUnitCount) {
            // override method
            return null;
        };
        return SoundDevice;
    }());
    PTWTipsSound.SoundDevice = SoundDevice;
    var SoundManager = (function () {
        function SoundManager() {
            this.soundSources = new List();
            this.isMuted = false;
        }
        SoundManager.prototype.addSoundSource = function (soundUnit) {
            soundUnit.soundManger = this;
            this.soundSources.push(soundUnit);
        };
        SoundManager.prototype.setMute = function (enable) {
            this.isMuted = enable;
        };
        SoundManager.prototype.processSounds = function () {
            for (var _i = 0, _a = this.soundSources; _i < _a.length; _i++) {
                var soundUnit = _a[_i];
                var playingUnitCount = soundUnit.getPlayingUnitCount();
                for (var i = 0; i < playingUnitCount; i++) {
                    var playUnit = soundUnit.getPlayingUnit(i);
                    var state = playUnit.getState();
                    if (state == SoundPlayingState.done) {
                        // Finish playing
                        playUnit.stop();
                        playUnit.setPosition(0);
                        // Process looping
                        if (playUnit.loopStartTime != -1.0) {
                            playUnit.play();
                            playUnit.setPosition(playUnit.loopStartTime);
                        }
                    }
                    else if (state == SoundPlayingState.playing) {
                        if (playUnit.isFadeing) {
                            // Process fading
                            playUnit.fadeTime += 1.0;
                            if (playUnit.fadeTime >= playUnit.fadeDuration) {
                                playUnit.setVolume(playUnit.fadeEndVolume);
                                playUnit.isFadeing = false;
                            }
                            else {
                                var rate = playUnit.fadeTime / playUnit.fadeDuration;
                                playUnit.setVolume(playUnit.fadeStartVolume * (1.0 - rate) + playUnit.fadeEndVolume * rate);
                            }
                        }
                        if (playUnit.loopStartTime != -1.0 && playUnit.getPosition() > playUnit.loopEndTime) {
                            // Process looping
                            playUnit.setPosition(playUnit.loopStartTime);
                        }
                    }
                }
                soundUnit.isPlayedOnce = false;
            }
        };
        return SoundManager;
    }());
    PTWTipsSound.SoundManager = SoundManager;
})(PTWTipsSound || (PTWTipsSound = {}));
