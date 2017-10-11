
namespace PTWTipsSound_HTML5_WebAudio {

    export class SoundPlayingUnit extends PTWTipsSound.SoundPlayingUnit {

        device: SoundDevice = null;
        audioBuffer: AudioBuffer = null;

        private gainNode: GainNode = null;
        private sourceNode: AudioBufferSourceNode = null;

        private state = PTWTipsSound.SoundPlayingState.ready;
        private startTime: long = 0;
        private restartTime: long = 0;

        // override methods

        getState(): PTWTipsSound.SoundPlayingState {

            return this.state;
        }

        play() {

            this.sourceNode = this.device.audioContext.createBufferSource();
            this.sourceNode.buffer = this.audioBuffer;
            this.sourceNode.onended = () => {
                this.onended();
            };

            this.sourceNode.connect(this.gainNode);

            this.startTime = this.device.audioContext.currentTime;

            this.sourceNode.start(0, this.restartTime); // 一つ目の引数はコンテキストの再生時刻でいつ再生開始するか、二つ目の引数はソースの中での開始位置、三つ目の引数は再生する長さ（デフォルトでは開始位置から最後まで）

            this.state = PTWTipsSound.SoundPlayingState.playing;
        }

        private onended() {

            this.stop();

            this.state = PTWTipsSound.SoundPlayingState.done;
        }

        pause() {

            this.restartTime = this.getPosition();
            this.stop();

            this.state = PTWTipsSound.SoundPlayingState.paused;
        }

        stop() {

            if (this.sourceNode != null) {

                this.sourceNode.stop();
                this.sourceNode.disconnect();
                this.sourceNode = null;
            }

            this.restartTime = 0;

            this.state = PTWTipsSound.SoundPlayingState.stopped;
        }

        getPosition(): float {

            return (this.device.audioContext.currentTime - this.startTime);
        }

        setPosition(position: float) {

            this.restartTime = position;

            if (this.state == PTWTipsSound.SoundPlayingState.playing) {

                this.stop();
                this.play();
            }
        }

        getVolume(): float {

            return this.gainNode.gain.value;
        }

        setVolume(valume: float) {

            this.gainNode.gain.value = valume * this.device.volume;
        }

        // own methods

        initialize(device: SoundDevice) {

            this.device = device;
            this.gainNode = this.device.audioContext.createGain();
            this.gainNode.connect(this.device.audioContext.destination);
        }

        release() {

            this.stop();

            this.device = null;

            this.gainNode.disconnect();
            this.gainNode = null;

            this.state = PTWTipsSound.SoundPlayingState.none;
        }
    }

    export class SoundSource extends PTWTipsSound.SoundSource {

        device: SoundDevice = null;
        masterAudioBuffer: AudioBuffer = null;

        playingUnits = new List<SoundPlayingUnit>();

        loadingDataTotal: long = 0;
        loadingDataLoaded: long = 0;

        // override methods

        load(fileName: string) {

            this.device.loadSound(this, fileName);
        }

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

        setAudioBuffer(audioBuffer: AudioBuffer) {

            this.masterAudioBuffer = audioBuffer;

            for (let i = 0; i < this.playingUnits.length; i++) {
                let playingUnit = this.playingUnits[i];

                playingUnit.audioBuffer = audioBuffer;
            }
        }
    }

    export class SoundDevice extends PTWTipsSound.SoundDevice {

        audioContext: AudioContext = null;

        audioBufferChache = new Dictionary<AudioBuffer>();

        isReady = false;

        // override methods

        maxParallelLoadingCount = 3;

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

        createSoundSource(maxPlayingUnitCount: int): PTWTipsSound.SoundSource {

            var soundSource = new soundSource();

            soundSource.device = this;

            soundSource.initializePlayingUnits(this, maxPlayingUnitCount)

            return soundSource;
        }

        // own methods

        loadSound(soundSource: SoundSource, url: string) {

            if (DictionaryContainsKey(this.audioBufferChache, url)) {

                soundSource.setAudioBuffer(this.audioBufferChache[url]);
                return;
            }

            var request = new XMLHttpRequest();
            request.open('GET', url, true);
            request.responseType = 'arraybuffer';

            var on_progress = (e) => {

                soundSource.loadingDataTotal = e.total;
                soundSource.loadingDataLoaded = e.loaded;

                if (soundSource.loadingDataLoaded == soundSource.loadingDataTotal) {

                    // デコードの時間が必要であるためロード完了だけでは完了扱いにならないようにしている
                    soundSource.loadingDataLoaded = soundSource.loadingDataTotal - 1;
                }
            };

            var on_error = (e) => {
                console.log('Sound ' + url + ' loading faild.');
            };

            var on_abort = (e) => {
                console.log('Sound ' + url + ' loading aborted.');
            };

            var on_load = (e) => {

                if (soundSource.isLoaded) {
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

                        soundSource.setAudioBuffer(buffer);

                        soundSource.isLoaded = true;

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

        createSoundPlayingUnit(): SoundPlayingUnit {

            let playingUnit = new SoundPlayingUnit();
            playingUnit.initialize(this);

            return playingUnit;
        }
    }
}
