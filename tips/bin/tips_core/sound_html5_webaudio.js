var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var PTWTipsSound_HTML5_WebAudio;
(function (PTWTipsSound_HTML5_WebAudio) {
    var SoundPlayingUnit = (function (_super) {
        __extends(SoundPlayingUnit, _super);
        function SoundPlayingUnit() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.device = null;
            _this.audioBuffer = null;
            _this.gainNode = null;
            _this.sourceNode = null;
            _this.state = PTWTipsSound.SoundPlayingState.ready;
            _this.startTime = 0;
            _this.restartTime = 0;
            return _this;
        }
        // Override methods
        SoundPlayingUnit.prototype.getState = function () {
            return this.state;
        };
        SoundPlayingUnit.prototype.play = function () {
            var _this = this;
            this.sourceNode = this.device.audioContext.createBufferSource();
            this.sourceNode.buffer = this.audioBuffer;
            this.sourceNode.onended = function () {
                _this.onended();
            };
            this.sourceNode.connect(this.gainNode);
            this.startTime = this.device.audioContext.currentTime;
            this.sourceNode.start(0, this.restartTime); // 一つ目の引数はコンテキストの再生時刻でいつ再生開始するか、二つ目の引数はソースの中での開始位置、三つ目の引数は再生する長さ（デフォルトでは開始位置から最後まで）
            this.state = PTWTipsSound.SoundPlayingState.playing;
        };
        SoundPlayingUnit.prototype.onended = function () {
            this.stop();
            this.state = PTWTipsSound.SoundPlayingState.done;
        };
        SoundPlayingUnit.prototype.pause = function () {
            this.restartTime = this.getPosition();
            this.stop();
            this.state = PTWTipsSound.SoundPlayingState.paused;
        };
        SoundPlayingUnit.prototype.stop = function () {
            if (this.sourceNode != null) {
                this.sourceNode.stop();
                this.sourceNode.disconnect();
                this.sourceNode = null;
            }
            this.restartTime = 0;
            this.state = PTWTipsSound.SoundPlayingState.stopped;
        };
        SoundPlayingUnit.prototype.getPosition = function () {
            return (this.device.audioContext.currentTime - this.startTime);
        };
        SoundPlayingUnit.prototype.setPosition = function (position) {
            this.restartTime = position;
            if (this.state == PTWTipsSound.SoundPlayingState.playing) {
                this.stop();
                this.play();
            }
        };
        SoundPlayingUnit.prototype.getVolume = function () {
            return this.gainNode.gain.value;
        };
        SoundPlayingUnit.prototype.setVolume = function (valume) {
            this.gainNode.gain.value = valume * this.device.volume;
        };
        // own methods
        SoundPlayingUnit.prototype.initialize = function (device) {
            this.device = device;
            this.gainNode = this.device.audioContext.createGain();
            this.gainNode.connect(this.device.audioContext.destination);
        };
        SoundPlayingUnit.prototype.release = function () {
            this.stop();
            this.device = null;
            this.gainNode.disconnect();
            this.gainNode = null;
            this.state = PTWTipsSound.SoundPlayingState.none;
        };
        return SoundPlayingUnit;
    }(PTWTipsSound.SoundPlayingUnit));
    PTWTipsSound_HTML5_WebAudio.SoundPlayingUnit = SoundPlayingUnit;
    var SoundSource = (function (_super) {
        __extends(SoundSource, _super);
        function SoundSource() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.device = null;
            _this.masterAudioBuffer = null;
            _this.playingUnits = new List();
            _this.loadingDataTotal = 0;
            _this.loadingDataLoaded = 0;
            return _this;
        }
        // Override methods
        SoundSource.prototype.load = function (fileName) {
            this.device.loadSound(this, fileName);
        };
        SoundSource.prototype.release = function () {
            for (var _i = 0, _a = this.playingUnits; _i < _a.length; _i++) {
                var playingUnit = _a[_i];
                playingUnit.release();
            }
            this.masterAudioBuffer = null;
            this.playingUnits = null;
            this.isLoaded = false;
        };
        SoundSource.prototype.getDulation = function () {
            return this.masterAudioBuffer.duration;
        };
        SoundSource.prototype.getPlayingUnitCount = function () {
            return this.playingUnits.length;
        };
        SoundSource.prototype.getPlayingUnit = function (index) {
            return this.playingUnits[index];
        };
        // own methods
        SoundSource.prototype.initializePlayingUnits = function (maxPlayingUnitCount) {
            for (var i = 0; i < maxPlayingUnitCount; i++) {
                var playingUnit = this.device.createSoundPlayingUnit();
                this.playingUnits.push(playingUnit);
            }
        };
        SoundSource.prototype.setAudioBuffer = function (audioBuffer) {
            this.masterAudioBuffer = audioBuffer;
            for (var i = 0; i < this.playingUnits.length; i++) {
                var playingUnit = this.playingUnits[i];
                playingUnit.audioBuffer = audioBuffer;
            }
        };
        return SoundSource;
    }(PTWTipsSound.SoundSource));
    PTWTipsSound_HTML5_WebAudio.SoundSource = SoundSource;
    var SoundDevice = (function (_super) {
        __extends(SoundDevice, _super);
        function SoundDevice() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.audioContext = null;
            _this.audioBufferChache = new Dictionary();
            _this.isReady = false;
            // Override methods
            _this.maxParallelLoadingCount = 3;
            return _this;
        }
        SoundDevice.prototype.isAvailable = function () {
            this.initialize();
            return this.isReady;
        };
        SoundDevice.prototype.initialize = function () {
            if (this.audioContext == null) {
                this.audioContext = this.createContext();
            }
            if (this.audioContext != null) {
                this.isReady = true;
            }
            return this.isReady;
        };
        SoundDevice.prototype.createContext = function () {
            try {
                var context = new (window.AudioContext || window.webkitAudioContext)();
                return context;
            }
            catch (e) {
                return null;
            }
        };
        SoundDevice.prototype.createSoundSource = function (maxPlayingUnitCount) {
            var soundSource = new SoundSource();
            soundSource.device = this;
            soundSource.initializePlayingUnits(maxPlayingUnitCount);
            return soundSource;
        };
        // own methods
        SoundDevice.prototype.loadSound = function (soundSource, url) {
            var _this = this;
            if (DictionaryContainsKey(this.audioBufferChache, url)) {
                soundSource.setAudioBuffer(this.audioBufferChache[url]);
                return;
            }
            var request = new XMLHttpRequest();
            request.open('GET', url, true);
            request.responseType = 'arraybuffer';
            var on_progress = function (e) {
                soundSource.loadingDataTotal = e.total;
                soundSource.loadingDataLoaded = e.loaded;
                if (soundSource.loadingDataLoaded == soundSource.loadingDataTotal) {
                    // デコードの時間が必要であるためロード完了だけでは完了扱いにならないようにしている
                    soundSource.loadingDataLoaded = soundSource.loadingDataTotal - 1;
                }
            };
            var on_error = function (e) {
                console.log('Sound ' + url + ' loading faild.');
            };
            var on_abort = function (e) {
                console.log('Sound ' + url + ' loading aborted.');
            };
            var on_load = function (e) {
                if (soundSource.isLoaded) {
                    return;
                }
                request.removeEventListener('progress', on_load);
                request.removeEventListener('error', on_load);
                request.removeEventListener('abort', on_load);
                request.removeEventListener('load', on_load);
                //console.log('sound data recieved');
                // Decoding
                _this.audioContext.decodeAudioData(request.response, function (buffer) {
                    _this.audioBufferChache[url] = buffer;
                    soundSource.setAudioBuffer(buffer);
                    soundSource.isLoaded = true;
                    //console.log('sound data decoded.');
                }, function () {
                    //console.log('decodeAudioData error');
                });
            };
            request.addEventListener('progress', on_progress);
            request.addEventListener('error', on_error);
            request.addEventListener('abort', on_abort);
            request.addEventListener('load', on_load);
            //console.log('sound data loading started.');
            request.send();
        };
        SoundDevice.prototype.createSoundPlayingUnit = function () {
            var playingUnit = new SoundPlayingUnit();
            playingUnit.initialize(this);
            return playingUnit;
        };
        return SoundDevice;
    }(PTWTipsSound.SoundDevice));
    PTWTipsSound_HTML5_WebAudio.SoundDevice = SoundDevice;
})(PTWTipsSound_HTML5_WebAudio || (PTWTipsSound_HTML5_WebAudio = {}));
