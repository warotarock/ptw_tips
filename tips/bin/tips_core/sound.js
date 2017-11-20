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
        // Override methods
        SoundPlayingUnit.prototype.getState = function () {
            // Override method
            return SoundPlayingState.none;
        };
        SoundPlayingUnit.prototype.play = function () {
            // Override method
        };
        SoundPlayingUnit.prototype.pause = function () {
            // Override method
        };
        SoundPlayingUnit.prototype.stop = function () {
            // Override method
        };
        SoundPlayingUnit.prototype.getPosition = function () {
            // Override method
            return 0.0;
        };
        SoundPlayingUnit.prototype.setPosition = function (time) {
            // Override method
        };
        SoundPlayingUnit.prototype.getVolume = function () {
            // Override method
            return 0.0;
        };
        SoundPlayingUnit.prototype.setVolume = function (volume) {
            // Override method
        };
        return SoundPlayingUnit;
    }());
    PTWTipsSound.SoundPlayingUnit = SoundPlayingUnit;
    var SoundSource = (function () {
        function SoundSource() {
            this.soundManger = null;
            this.isLoaded = false;
        }
        SoundSource.prototype.play = function () {
            if (this.soundManger.isMuted) {
                return null;
            }
            if (this.isPlayedOnce) {
                return null;
            }
            this.isPlayedOnce = true;
            // Get playing unit
            var playingUnitCount = this.getPlayingUnitCount();
            var available_PlayingUnit = null;
            for (var i = 0; i < playingUnitCount; i++) {
                var playingUnit = this.getPlayingUnit(i);
                var state = playingUnit.getState();
                if (state == SoundPlayingState.ready || state == SoundPlayingState.stopped || state == SoundPlayingState.done) {
                    available_PlayingUnit = playingUnit;
                }
            }
            // Play 
            if (available_PlayingUnit == null) {
                return null;
            }
            available_PlayingUnit.resetEffects();
            available_PlayingUnit.play();
            return available_PlayingUnit;
        };
        // Override methods
        SoundSource.prototype.load = function (fileName) {
            // Override method
        };
        SoundSource.prototype.release = function () {
            // Override method
        };
        SoundSource.prototype.getDulation = function () {
            // Override method
            return 0.0;
        };
        SoundSource.prototype.getPlayingUnitCount = function () {
            // Override method
            return 0;
        };
        SoundSource.prototype.getPlayingUnit = function (index) {
            // Override method
            return null;
        };
        return SoundSource;
    }());
    PTWTipsSound.SoundSource = SoundSource;
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
        // Override methods
        SoundDevice.prototype.isAvailable = function () {
            // Override method
            return false;
        };
        SoundDevice.prototype.initialize = function () {
            // Override method
            return false;
        };
        SoundDevice.prototype.createSoundSource = function (maxPlayingUnitCount) {
            // Override method
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
        SoundManager.prototype.addSoundSource = function (soundSource) {
            soundSource.soundManger = this;
            this.soundSources.push(soundSource);
        };
        SoundManager.prototype.setMute = function (enable) {
            this.isMuted = enable;
        };
        SoundManager.prototype.processSounds = function () {
            for (var _i = 0, _a = this.soundSources; _i < _a.length; _i++) {
                var soundSource = _a[_i];
                var playingUnitCount = soundSource.getPlayingUnitCount();
                for (var i = 0; i < playingUnitCount; i++) {
                    var playUnit = soundSource.getPlayingUnit(i);
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
                soundSource.isPlayedOnce = false;
            }
        };
        return SoundManager;
    }());
    PTWTipsSound.SoundManager = SoundManager;
})(PTWTipsSound || (PTWTipsSound = {}));
