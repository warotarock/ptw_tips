
module PTWTipsSound {

    export enum SoundPlayingState {
        none = 0,
        ready = 1,
        playing = 2,
        stopped = 3,
        paused = 4,
        done = 5,
    }

    export class SoundPlayingUnit {

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

        getState(): SoundPlayingState {

            // override method

            return SoundPlayingState.none;
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

    export class SoundSourceUnit {

        soundManger: SoundManager = null;

        isLoaded = false;
        isPlayedOnce: boolean;

        play(): SoundPlayingUnit {

            if (this.soundManger.isMuted) {
                return null;
            }

            if (this.isPlayedOnce) {
                return null;
            }

            this.isPlayedOnce = true;

            // Get playing unit
            let playingUnitCount = this.getPlayingUnitCount();
            let playingUnit: SoundPlayingUnit = null;

            for (let i = 0; i < playingUnitCount; i++) {

                let pu = this.getPlayingUnit(i);
                let state = pu.getState();

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
        }

        // override methods

        load(fileName: string) {

            // override method
        }

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

        getPlayingUnit(index: int): SoundPlayingUnit {

            // override method

            return null;
        }
    }

    export class SoundDevice {

        volume = 1.0;
        maxParallelLoadingCount = 1;

        getMasterVolume(): float {

            return this.volume;
        }

        setMasterVolume(volume: float) {

            this.volume = volume;
        }

        // override methods

        isAvailable(): boolean {

            // override method

            return false;
        }

        initialize(): boolean {

            // override method

            return false;
        }

        createSoundSource(maxPlayingUnitCount: int): SoundSourceUnit {

            // override method

            return null;
        }
    }

    export class SoundManager {

        private soundSources = new List<SoundSourceUnit>();

        isMuted = false;

        addSoundSource(soundUnit: SoundSourceUnit) {

            soundUnit.soundManger = this;

            this.soundSources.push(soundUnit);
        }

        setMute(enable: boolean) {

            this.isMuted = enable;
        }

        processSounds() {

            for (let soundUnit of this.soundSources) {

                let playingUnitCount = soundUnit.getPlayingUnitCount();

                for (let i = 0; i < playingUnitCount; i++) {

                    let playUnit = soundUnit.getPlayingUnit(i);

                    let state = playUnit.getState();

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
        }
    }
}
