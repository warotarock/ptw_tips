var PTWTipsSound;
(function (PTWTipsSound) {
    var PlayUnitPlayingState;
    (function (PlayUnitPlayingState) {
        PlayUnitPlayingState[PlayUnitPlayingState["none"] = 0] = "none";
        PlayUnitPlayingState[PlayUnitPlayingState["ready"] = 1] = "ready";
        PlayUnitPlayingState[PlayUnitPlayingState["playing"] = 2] = "playing";
        PlayUnitPlayingState[PlayUnitPlayingState["stopped"] = 3] = "stopped";
        PlayUnitPlayingState[PlayUnitPlayingState["paused"] = 4] = "paused";
        PlayUnitPlayingState[PlayUnitPlayingState["done"] = 5] = "done";
    })(PlayUnitPlayingState = PTWTipsSound.PlayUnitPlayingState || (PTWTipsSound.PlayUnitPlayingState = {}));
    var PlayingUnit = (function () {
        function PlayingUnit() {
            this.isFadeing = false;
            this.fadeTime = -1.0;
            this.fadeDuration = 0.0;
            this.fadeEndVolume = 0.0;
            this.fadeStartVolume = 0.0;
            this.loopStartTime = -1.0;
            this.loopEndTime = -1.0;
        }
        PlayingUnit.prototype.resetEffects = function () {
            this.isFadeing = false;
            this.fadeTime = -1.0;
            this.fadeDuration = -1.0;
            this.fadeStartVolume = -1.0;
            this.fadeEndVolume = -1.0;
            this.loopStartTime = -1.0;
            this.loopEndTime = -1.0;
        };
        PlayingUnit.prototype.setFading = function (fadeDuration, fadeStartVolume, fadeEndVolume) {
            this.isFadeing = true;
            this.fadeTime = 0;
            this.fadeDuration = fadeDuration;
            this.fadeStartVolume = fadeStartVolume;
            this.fadeEndVolume = fadeEndVolume;
        };
        PlayingUnit.prototype.setLooping = function (loopStartTime, loopEndTime) {
            this.loopStartTime = loopStartTime;
            this.loopEndTime = loopEndTime;
        };
        // override methods
        PlayingUnit.prototype.getState = function () {
            // override method
            return PlayUnitPlayingState.none;
        };
        PlayingUnit.prototype.play = function () {
            // override method
        };
        PlayingUnit.prototype.pause = function () {
            // override method
        };
        PlayingUnit.prototype.stop = function () {
            // override method
        };
        PlayingUnit.prototype.getPosition = function () {
            // override method
            return 0.0;
        };
        PlayingUnit.prototype.setPosition = function (time) {
            // override method
        };
        PlayingUnit.prototype.getVolume = function () {
            // override method
            return 0.0;
        };
        PlayingUnit.prototype.setVolume = function (volume) {
            // override method
        };
        return PlayingUnit;
    }());
    PTWTipsSound.PlayingUnit = PlayingUnit;
    var SoundUnit = (function () {
        function SoundUnit() {
            this.isLoaded = false;
        }
        // override methods
        SoundUnit.prototype.release = function () {
            // override method
        };
        SoundUnit.prototype.getDulation = function () {
            // override method
            return 0.0;
        };
        SoundUnit.prototype.getPlayingUnitCount = function () {
            // override method
            return 0;
        };
        SoundUnit.prototype.getPlayingUnit = function (index) {
            // override method
            return null;
        };
        return SoundUnit;
    }());
    PTWTipsSound.SoundUnit = SoundUnit;
    var SoundSystem = (function () {
        function SoundSystem() {
            this.volume = 1.0;
            this.maxParallelLoadingCount = 1;
        }
        // override methods
        SoundSystem.prototype.isAvailable = function () {
            // override method
            return false;
        };
        SoundSystem.prototype.initialize = function () {
            // override method
            return false;
        };
        SoundSystem.prototype.getMasterVolume = function () {
            // override method
            return this.volume;
        };
        SoundSystem.prototype.setMasterVolume = function (volume) {
            // override method
            this.volume = volume;
        };
        return SoundSystem;
    }());
    PTWTipsSound.SoundSystem = SoundSystem;
    var SoundManager = (function () {
        function SoundManager() {
            this.soundUnits = new List();
            this.isMuted = false;
        }
        SoundManager.prototype.addSoundUnit = function (soundUnit) {
            this.soundUnits.push(soundUnit);
        };
        SoundManager.prototype.play = function (soundUnit) {
            if (this.isMuted) {
                return null;
            }
            if (soundUnit.isPlayedOnce) {
                return null;
            }
            soundUnit.isPlayedOnce = true;
            // Get playing unit
            var playingUnitCount = soundUnit.getPlayingUnitCount();
            var playingUnit = null;
            for (var i = 0; i < playingUnitCount; i++) {
                var pu = soundUnit.getPlayingUnit(i);
                var state = pu.getState();
                if (state == PlayUnitPlayingState.ready || state == PlayUnitPlayingState.stopped || state == PlayUnitPlayingState.done) {
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
        SoundManager.prototype.setMute = function (enable) {
            this.isMuted = enable;
        };
        SoundManager.prototype.processSounds = function () {
            for (var _i = 0, _a = this.soundUnits; _i < _a.length; _i++) {
                var soundUnit = _a[_i];
                var playingUnitCount = soundUnit.getPlayingUnitCount();
                for (var i = 0; i < playingUnitCount; i++) {
                    var playUnit = soundUnit.getPlayingUnit(i);
                    var state = playUnit.getState();
                    if (state == PlayUnitPlayingState.done) {
                        // Finish playing
                        playUnit.stop();
                        playUnit.setPosition(0);
                        // Process looping
                        if (playUnit.loopStartTime != -1.0) {
                            playUnit.play();
                            playUnit.setPosition(playUnit.loopStartTime);
                        }
                    }
                    else if (state == PlayUnitPlayingState.playing) {
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
