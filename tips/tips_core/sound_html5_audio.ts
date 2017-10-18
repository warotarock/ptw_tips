
namespace PTWTipsSound_HTML5_Audio {

    export class SoundPlayingUnit extends PTWTipsSound.SoundPlayingUnit {

        device: SoundDevice = null;
        audio: HTMLAudioElement = null;

        private state = PTWTipsSound.SoundPlayingState.ready;

        // Override methods

        getState(): PTWTipsSound.SoundPlayingState {

            if (this.audio.ended) {

                return PTWTipsSound.SoundPlayingState.done;
            }

            return this.state;
        }

        pause() {

            this.audio.pause();

            this.state = PTWTipsSound.SoundPlayingState.paused;
        }

        play() {

            this.audio.play();

            this.state = PTWTipsSound.SoundPlayingState.playing;
        }

        stop() {

            this.audio.pause();
            this.audio.currentTime = 0;

            this.state = PTWTipsSound.SoundPlayingState.stopped;
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

            this.audio.volume = valume * this.device.volume;
        }

        // own methods

        initialize(device: SoundDevice) {

            this.device = device;
        }

        release() {

            this.stop();

            this.device = null;
            this.audio = null;

            this.state = PTWTipsSound.SoundPlayingState.none;
        }
    }

    export class SoundSource extends PTWTipsSound.SoundSource {

        device: SoundDevice = null;
        masterAudio: HTMLAudioElement = null;

        playingUnits = new List<SoundPlayingUnit>();

        // Override methods

        load(fileName: string) {

            this.device.loadSound(this, fileName);
        }

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

        getPlayingUnit(index: int): PTWTipsSound.SoundPlayingUnit {

            return this.playingUnits[index];
        }

        // own methods

        initializePlayingUnits(maxPlayingUnitCount: int) {

            for (let i = 0; i < maxPlayingUnitCount; i++) {

                let playingUnit = this.device.createSoundPlayingUnit();

                this.playingUnits.push(playingUnit);
            }
        }
    }

    export class SoundDevice extends PTWTipsSound.SoundDevice {

        // Override methods

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

        createSoundSource(maxPlayingUnitCount: int): PTWTipsSound.SoundSource {

            var soundSource = new SoundSource();

            soundSource.device = this;

            soundSource.initializePlayingUnits(maxPlayingUnitCount);

            return soundSource;
        }

        // own methods

        loadSound(soundSource: SoundSource, url: string) {

            var audio: HTMLAudioElement = new Audio();
            audio.preload = 'auto';
            audio.src = url;

            soundSource.masterAudio = audio;

            var loadedCount = 0;

            // Function for recursive loading
            var canplaythrough = (ev) => {

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
        }

        createSoundPlayingUnit(): SoundPlayingUnit {

            let playingUnit = new SoundPlayingUnit();
            playingUnit.initialize(this);

            return playingUnit;
        }
    }
}
