
module PTWTipsSound_HTML5_WebAudio {

    export class PlayingUnit extends PTWTipsSound.PlayingUnit {

        soundSystem: SoundSystem = null;
        audioBuffer: AudioBuffer = null;

        private gainNode: GainNode = null;
        private sourceNode: AudioBufferSourceNode = null;

        private state = PTWTipsSound.PlayUnitPlayingState.ready;
        private startTime: long = 0;
        private restartTime: long = 0;

        getState(): PTWTipsSound.PlayUnitPlayingState {

            return this.state;
        }

        play() {

            this.sourceNode = this.soundSystem.audioContext.createBufferSource();
            this.sourceNode.buffer = this.audioBuffer;
            this.sourceNode.onended = () => {
                this.onended();
            };

            this.sourceNode.connect(this.gainNode);

            this.startTime = this.soundSystem.audioContext.currentTime;

            this.sourceNode.start(0, this.restartTime); // 一つ目の引数はコンテキストの再生時刻でいつ再生開始するか、二つ目の引数はソースの中での開始位置、三つ目の引数は再生する長さ（デフォルトでは開始位置から最後まで）

            this.state = PTWTipsSound.PlayUnitPlayingState.playing;
        }

        private onended() {

            this.stop();

            this.state = PTWTipsSound.PlayUnitPlayingState.done;
        }

        pause() {

            this.restartTime = this.getPosition();
            this.stop();

            this.state = PTWTipsSound.PlayUnitPlayingState.paused;
        }

        stop() {

            if (this.sourceNode != null) {

                this.sourceNode.stop();
                this.sourceNode.disconnect();
                this.sourceNode = null;
            }

            this.restartTime = 0;

            this.state = PTWTipsSound.PlayUnitPlayingState.stopped;
        }

        getPosition(): float {

            return (this.soundSystem.audioContext.currentTime - this.startTime);
        }

        setPosition(position: float) {

            this.restartTime = position;

            if (this.state == PTWTipsSound.PlayUnitPlayingState.playing) {

                this.stop();
                this.play();
            }
        }

        getVolume(): float {

            return this.gainNode.gain.value;
        }

        setVolume(valume: float) {

            this.gainNode.gain.value = valume * this.soundSystem.volume;
        }

        initialize(soundSystem: SoundSystem) {

            this.soundSystem = soundSystem;
            this.gainNode = this.soundSystem.audioContext.createGain();
            this.gainNode.connect(this.soundSystem.audioContext.destination);
        }

        release() {

            this.stop();

            this.soundSystem = null;

            this.gainNode.disconnect();
            this.gainNode = null;

            this.state = PTWTipsSound.PlayUnitPlayingState.none;
        }
    }

    export class SoundUnit extends PTWTipsSound.SoundUnit {

        masterAudioBuffer: AudioBuffer = null;

        playingUnits = new List<PlayingUnit>();

        loadingDataTotal: long = 0;
        loadingDataLoaded: long = 0;

        release() {

            for (let playingUnit of this.playingUnits) {

                playingUnit.release();
            }

            this.masterAudioBuffer = null;
            this.playingUnits = null;
            this.isLoaded = false;
        }

        getDulation(): float {

            return this.masterAudioBuffer.duration;
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

        setAudioBuffer(audioBuffer: AudioBuffer) {

            this.masterAudioBuffer = audioBuffer;

            for (let i = 0; i < this.playingUnits.length; i++) {
                let playingUnit = this.playingUnits[i];

                playingUnit.audioBuffer = audioBuffer;
            }
        }
    }

    export class SoundSystem extends PTWTipsSound.SoundSystem {

        maxParallelLoadingCount = 3;

        audioContext: AudioContext = null;

        audioBufferChache = new Dictionary<AudioBuffer>();

        isReady = false;

        isAvailable(): boolean {

            this.initialize();

            return this.isReady;
        }

        initialize(): boolean {
            
            if (this.audioContext == null) {

                this.audioContext = this.createContext();
            }

            if (this.audioContext != null) {

                this.isReady = true;
            }

            return this.isReady;
        }

        private createContext(): AudioContext {

            try {
                var context = new ((<any>window).AudioContext || (<any>window).webkitAudioContext)();
                return context;
            }
            catch (e) {
                return null;
            }
        }

        createSoundUnit(maxPlayingUnitCount: int): SoundUnit {

            var soundUnit = new SoundUnit();

            soundUnit.initializePlayingUnits(this, maxPlayingUnitCount)

            return soundUnit;
        }

        loadSound(soundUnit: SoundUnit, url: string) {

            if (DictionaryContainsKey(this.audioBufferChache, url)) {

                soundUnit.masterAudioBuffer = this.audioBufferChache[url];
                return;
            }

            var request = new XMLHttpRequest();
            request.open('GET', url, true);
            request.responseType = 'arraybuffer';

            var on_progress = (e) => {

                soundUnit.loadingDataTotal = e.total;
                soundUnit.loadingDataLoaded = e.loaded;

                if (soundUnit.loadingDataLoaded == soundUnit.loadingDataTotal) {

                    // デコードの時間が必要であるためロード完了だけでは完了扱いにならないようにしている
                    soundUnit.loadingDataLoaded = soundUnit.loadingDataTotal - 1;
                }
            };

            var on_error = (e) => {
                console.log('Sound ' + url + ' loading faild.');
            };

            var on_abort = (e) => {
                console.log('Sound ' + url + ' loading aborted.');
            };

            var on_load = (e) => {

                if (soundUnit.isLoaded) {
                    return;
                }

                request.removeEventListener('progress', on_load);
                request.removeEventListener('error', on_load);
                request.removeEventListener('abort', on_load);
                request.removeEventListener('load', on_load);

                //console.log('sound data recieved');

                // Decoding
                this.audioContext.decodeAudioData(request.response
                    , (buffer: AudioBuffer) => {

                        this.audioBufferChache[url] = buffer;

                        soundUnit.setAudioBuffer(buffer);

                        soundUnit.isLoaded = true;

                        //console.log('sound data decoded.');
                    }
                    , () => {
                        //console.log('decodeAudioData error');
                    }
                );
            };

            request.addEventListener('progress', on_progress);
            request.addEventListener('error', on_error);
            request.addEventListener('abort', on_abort);
            request.addEventListener('load', on_load);

            //console.log('sound data loading started.');
            request.send();
        }
    }
}
