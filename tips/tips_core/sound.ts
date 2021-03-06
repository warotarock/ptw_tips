﻿
namespace PTWTipsSound {

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

        // Override methods

        getState(): SoundPlayingState {

            // Override method

            return SoundPlayingState.none;
        }

        play() {

            // Override method
        }

        pause() {

            // Override method
        }

        stop() {

            // Override method
        }

        getPosition(): float {

            // Override method

            return 0.0;
        }

        setPosition(time: float) {

            // Override method
        }

        getVolume(): float {

            // Override method

            return 0.0;
        }

        setVolume(volume: float) {

            // Override method
        }
    }

    export class SoundSource {

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
            let available_PlayingUnit: SoundPlayingUnit = null;

            for (let i = 0; i < playingUnitCount; i++) {

                let playingUnit = this.getPlayingUnit(i);
                let state = playingUnit.getState();

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
        }

        // Override methods

        load(fileName: string) {

            // Override method
        }

        release() {

            // Override method
        }

        getDulation(): float {

            // Override method

            return 0.0;
        }

        getPlayingUnitCount(): int {

            // Override method

            return 0;
        }

        getPlayingUnit(index: int): SoundPlayingUnit {

            // Override method

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

        // Override methods

        isAvailable(): boolean {

            // Override method

            return false;
        }

        initialize(): boolean {

            // Override method

            return false;
        }

        createSoundSource(maxPlayingUnitCount: int): SoundSource {

            // Override method

            return null;
        }
    }

    export class SoundManager {

        private soundSources = new List<SoundSource>();

        isMuted = false;

        addSoundSource(soundSource: SoundSource) {

            soundSource.soundManger = this;

            this.soundSources.push(soundSource);
        }

        setMute(enable: boolean) {

            this.isMuted = enable;
        }

        processSounds() {

            for (let soundSource of this.soundSources) {

                let playingUnitCount = soundSource.getPlayingUnitCount();

                for (let i = 0; i < playingUnitCount; i++) {

                    let playUnit = soundSource.getPlayingUnit(i);

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

                                let rate = playUnit.fadeTime / playUnit.fadeDuration;
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
        }
    }
}
