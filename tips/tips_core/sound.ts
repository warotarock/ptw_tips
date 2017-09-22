
module PTWTipsSound {

    export enum PlayUnitPlayingState {
        none = 0,
        ready = 1,
        playing = 2,
        stopped = 3,
        paused = 4,
        done = 5,
    }

    export class PlayingUnit {

        isFadeing = false;
        fadeTime = -1.0;
        fadeDuration = 0.0;
        fadeEndVolume = 0.0;
        fadeStartVolume = 0.0;

        loopStartTime = -1.0;
        loopEndTime = -1.0;

        resetEffects() {

            this.isFadeing = false;
            this.fadeTime = -1.0;
            this.fadeDuration = -1.0;
            this.fadeStartVolume = -1.0;
            this.fadeEndVolume = -1.0;

            this.loopStartTime = -1.0;
            this.loopEndTime = -1.0;
        }

        setFading(fadeDuration: float, fadeStartVolume: float, fadeEndVolume: float) {

            this.isFadeing = true;
            this.fadeTime = 0;
            this.fadeDuration = fadeDuration;
            this.fadeStartVolume = fadeStartVolume;
            this.fadeEndVolume = fadeEndVolume;
        }

        setLooping(loopStartTime: float, loopEndTime: float) {

            this.loopStartTime = loopStartTime;
            this.loopEndTime = loopEndTime;
        }

        // override methods

        getState(): PlayUnitPlayingState {

            // override method

            return PlayUnitPlayingState.none;
        }

        play() {

            // override method
        }

        pause() {

            // override method
        }

        stop() {

            // override method
        }

        getPosition(): float {

            // override method

            return 0.0;
        }

        setPosition(time: float) {

            // override method
        }

        getVolume(): float {

            // override method

            return 0.0;
        }

        setVolume(volume: float) {

            // override method
        }
    }

    export class SoundUnit {

        isLoaded = false;
        isPlayedOnce: boolean;

        // override methods

        release() {

            // override method
        }

        getDulation(): float {

            // override method

            return 0.0;
        }

        getPlayingUnitCount(): int {

            // override method

            return 0;
        }

        getPlayingUnit(index: int): PlayingUnit {

            // override method

            return null;
        }
    }

    export class SoundSystem {

        volume = 1.0;
        maxParallelLoadingCount = 1;

        // override methods

        isAvailable(): boolean {

            // override method

            return false;
        }

        initialize(): boolean {

            // override method

            return false;
        }

        getMasterVolume(): float {

            // override method

            return this.volume;
        }

        setMasterVolume(volume: float) {

            // override method

            this.volume = volume;
        }
    }

    export class SoundManager {

        private soundUnits = new List<SoundUnit>();

        private isMuted = false;

        addSoundUnit(soundUnit: SoundUnit) {

            this.soundUnits.push(soundUnit);
        }

        play(soundUnit: SoundUnit): PlayingUnit {

            if (this.isMuted) {
                return null;
            }

            if (soundUnit.isPlayedOnce) {
                return null;
            }

            soundUnit.isPlayedOnce = true;

            // Get playing unit
            let playingUnitCount = soundUnit.getPlayingUnitCount();
            let playingUnit: PlayingUnit = null;

            for (let i = 0; i < playingUnitCount; i++) {

                let pu = soundUnit.getPlayingUnit(i);
                let state = pu.getState();

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
        }

        setMute(enable: boolean) {

            this.isMuted = enable;
        }

        processSounds() {

            for (let soundUnit of this.soundUnits) {

                let playingUnitCount = soundUnit.getPlayingUnitCount();

                for (let i = 0; i < playingUnitCount; i++) {

                    let playUnit = soundUnit.getPlayingUnit(i);

                    let state = playUnit.getState();

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
        }
    }
}
