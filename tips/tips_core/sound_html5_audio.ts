
module PTWTipsSound_HTML5_Audio {

    export class PlayingUnit extends PTWTipsSound.PlayingUnit {

        soundSystem: SoundSystem = null;
        audio: HTMLAudioElement = null;

        private state = PTWTipsSound.PlayUnitPlayingState.ready;

        getState(): PTWTipsSound.PlayUnitPlayingState {

            if (this.audio.ended) {

                return PTWTipsSound.PlayUnitPlayingState.done;
            }

            return this.state;
        }

        pause() {

            this.audio.pause();

            this.state = PTWTipsSound.PlayUnitPlayingState.paused;
        }

        play() {

            this.audio.play();

            this.state = PTWTipsSound.PlayUnitPlayingState.playing;
        }

        stop() {

            this.audio.pause();
            this.audio.currentTime = 0;

            this.state = PTWTipsSound.PlayUnitPlayingState.stopped;
        }

        getPosition(): float {

            return this.audio.currentTime;
        }

        setPosition(milliSeconds: float) {

            this.audio.currentTime = milliSeconds;
        }

        getVolume(): float {

            return this.audio.volume;
        }

        setVolume(valume: float) {

            this.audio.volume = valume * this.soundSystem.volume;
        }

        initialize(soundSystem: SoundSystem) {

            this.soundSystem = soundSystem;
        }

        release() {

            this.stop();

            this.soundSystem = null;
            this.audio = null;

            this.state = PTWTipsSound.PlayUnitPlayingState.none;
        }
    }

    export class SoundUnit extends PTWTipsSound.SoundUnit {

        masterAudio: HTMLAudioElement = null;

        playingUnits = new List<PlayingUnit>();

        release() {

            for (let playingUnit of this.playingUnits) {

                playingUnit.release();
            }

            this.masterAudio = null;
            this.playingUnits = null;
            this.isLoaded = false;
        }

        getDulation(): float {

            return this.masterAudio.duration;
        }

        getPlayingUnitCount(): int {

            return this.playingUnits.length;
        }

        getPlayingUnit(index: int): PTWTipsSound.PlayingUnit {

            return this.playingUnits[index];
        }

        initializePlayingUnits(soundSystem: SoundSystem, maxPlayingUnitCount: int) {

            for (let i = 0; i < maxPlayingUnitCount; i++) {

                let playingUnit = new PlayingUnit();
                playingUnit.initialize(soundSystem);

                this.playingUnits.push(playingUnit);
            }
        }
    }

    export class SoundSystem extends PTWTipsSound.SoundSystem {

        maxParallelLoadingCount = 1;

        isAvailable(): boolean {

            var tempAudio = document.createElement('audio');

            return (
                (tempAudio.canPlayType('audio/mpeg;') != '') && (tempAudio.canPlayType('audio/wav;') != '')
            );
        }

        initialize(): boolean {

            return true;
        }

        createSoundUnit(maxPlayingUnitCount: int): SoundUnit {

            var soundUnit = new SoundUnit();

            soundUnit.initializePlayingUnits(this, maxPlayingUnitCount);

            return soundUnit;
        }

        loadSound(soundUnit: SoundUnit, url: string) {

            var audio: HTMLAudioElement = new Audio();
            audio.preload = 'auto';
            audio.src = url;

            soundUnit.masterAudio = audio;

            var loadedCount = 0;

            var soundSystem = this;

            // Function for recursive loading
            var canplaythrough = (ev) => {

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
        }
    }
}
