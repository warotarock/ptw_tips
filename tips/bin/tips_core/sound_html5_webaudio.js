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
    var PlayingUnit = (function (_super) {
        __extends(PlayingUnit, _super);
        function PlayingUnit() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.soundSystem = null;
            _this.audioBuffer = null;
            _this.gainNode = null;
            _this.sourceNode = null;
            _this.state = PTWTipsSound.PlayUnitPlayingState.ready;
            _this.startTime = 0;
            _this.restartTime = 0;
            return _this;
        }
        PlayingUnit.prototype.getState = function () {
            return this.state;
        };
        PlayingUnit.prototype.play = function () {
            var _this = this;
            this.sourceNode = this.soundSystem.audioContext.createBufferSource();
            this.sourceNode.buffer = this.audioBuffer;
            this.sourceNode.onended = function () {
                _this.onended();
            };
            this.sourceNode.connect(this.gainNode);
            this.startTime = this.soundSystem.audioContext.currentTime;
            this.sourceNode.start(0, this.restartTime); // 一つ目の引数はコンテキストの再生時刻でいつ再生開始するか、二つ目の引数はソースの中での開始位置、三つ目の引数は再生する長さ（デフォルトでは開始位置から最後まで）
            this.state = PTWTipsSound.PlayUnitPlayingState.playing;
        };
        PlayingUnit.prototype.onended = function () {
            this.stop();
            this.state = PTWTipsSound.PlayUnitPlayingState.done;
        };
        PlayingUnit.prototype.pause = function () {
            this.restartTime = this.getPosition();
            this.stop();
            this.state = PTWTipsSound.PlayUnitPlayingState.paused;
        };
        PlayingUnit.prototype.stop = function () {
            if (this.sourceNode != null) {
                this.sourceNode.stop();
                this.sourceNode.disconnect();
                this.sourceNode = null;
            }
            this.restartTime = 0;
            this.state = PTWTipsSound.PlayUnitPlayingState.stopped;
        };
        PlayingUnit.prototype.getPosition = function () {
            return (this.soundSystem.audioContext.currentTime - this.startTime);
        };
        PlayingUnit.prototype.setPosition = function (position) {
            this.restartTime = position;
            if (this.state == PTWTipsSound.PlayUnitPlayingState.playing) {
                this.stop();
                this.play();
            }
        };
        PlayingUnit.prototype.getVolume = function () {
            return this.gainNode.gain.value;
        };
        PlayingUnit.prototype.setVolume = function (valume) {
            this.gainNode.gain.value = valume * this.soundSystem.volume;
        };
        PlayingUnit.prototype.initialize = function (soundSystem) {
            this.soundSystem = soundSystem;
            this.gainNode = this.soundSystem.audioContext.createGain();
            this.gainNode.connect(this.soundSystem.audioContext.destination);
        };
        PlayingUnit.prototype.release = function () {
            this.stop();
            this.soundSystem = null;
            this.gainNode.disconnect();
            this.gainNode = null;
            this.state = PTWTipsSound.PlayUnitPlayingState.none;
        };
        return PlayingUnit;
    }(PTWTipsSound.PlayingUnit));
    PTWTipsSound_HTML5_WebAudio.PlayingUnit = PlayingUnit;
    var SoundUnit = (function (_super) {
        __extends(SoundUnit, _super);
        function SoundUnit() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.masterAudioBuffer = null;
            _this.playingUnits = new List();
            _this.loadingDataTotal = 0;
            _this.loadingDataLoaded = 0;
            return _this;
        }
        SoundUnit.prototype.release = function () {
            for (var _i = 0, _a = this.playingUnits; _i < _a.length; _i++) {
                var playingUnit = _a[_i];
                playingUnit.release();
            }
            this.masterAudioBuffer = null;
            this.playingUnits = null;
            this.isLoaded = false;
        };
        SoundUnit.prototype.getDulation = function () {
            return this.masterAudioBuffer.duration;
        };
        SoundUnit.prototype.getPlayingUnitCount = function () {
            return this.playingUnits.length;
        };
        SoundUnit.prototype.getPlayingUnit = function (index) {
            return this.playingUnits[index];
        };
        SoundUnit.prototype.initializePlayingUnits = function (soundSystem, maxPlayingUnitCount) {
            for (var i = 0; i < maxPlayingUnitCount; i++) {
                var playingUnit = new PlayingUnit();
                playingUnit.initialize(soundSystem);
                this.playingUnits.push(playingUnit);
            }
        };
        SoundUnit.prototype.setAudioBuffer = function (audioBuffer) {
            this.masterAudioBuffer = audioBuffer;
            for (var i = 0; i < this.playingUnits.length; i++) {
                var playingUnit = this.playingUnits[i];
                playingUnit.audioBuffer = audioBuffer;
            }
        };
        return SoundUnit;
    }(PTWTipsSound.SoundUnit));
    PTWTipsSound_HTML5_WebAudio.SoundUnit = SoundUnit;
    var SoundSystem = (function (_super) {
        __extends(SoundSystem, _super);
        function SoundSystem() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.maxParallelLoadingCount = 3;
            _this.audioContext = null;
            _this.audioBufferChache = new Dictionary();
            _this.isReady = false;
            return _this;
        }
        SoundSystem.prototype.isAvailable = function () {
            this.initialize();
            return this.isReady;
        };
        SoundSystem.prototype.initialize = function () {
            if (this.audioContext == null) {
                this.audioContext = this.createContext();
            }
            if (this.audioContext != null) {
                this.isReady = true;
            }
            return this.isReady;
        };
        SoundSystem.prototype.createContext = function () {
            try {
                var context = new (window.AudioContext || window.webkitAudioContext)();
                return context;
            }
            catch (e) {
                return null;
            }
        };
        SoundSystem.prototype.createSoundUnit = function (maxPlayingUnitCount) {
            var soundUnit = new SoundUnit();
            soundUnit.initializePlayingUnits(this, maxPlayingUnitCount);
            return soundUnit;
        };
        SoundSystem.prototype.loadSound = function (soundUnit, url) {
            var _this = this;
            if (DictionaryContainsKey(this.audioBufferChache, url)) {
                soundUnit.masterAudioBuffer = this.audioBufferChache[url];
                return;
            }
            var request = new XMLHttpRequest();
            request.open('GET', url, true);
            request.responseType = 'arraybuffer';
            var on_progress = function (e) {
                soundUnit.loadingDataTotal = e.total;
                soundUnit.loadingDataLoaded = e.loaded;
                if (soundUnit.loadingDataLoaded == soundUnit.loadingDataTotal) {
                    // デコードの時間が必要であるためロード完了だけでは完了扱いにならないようにしている
                    soundUnit.loadingDataLoaded = soundUnit.loadingDataTotal - 1;
                }
            };
            var on_error = function (e) {
                console.log('Sound ' + url + ' loading faild.');
            };
            var on_abort = function (e) {
                console.log('Sound ' + url + ' loading aborted.');
            };
            var on_load = function (e) {
                if (soundUnit.isLoaded) {
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
                    soundUnit.setAudioBuffer(buffer);
                    soundUnit.isLoaded = true;
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
        return SoundSystem;
    }(PTWTipsSound.SoundSystem));
    PTWTipsSound_HTML5_WebAudio.SoundSystem = SoundSystem;
})(PTWTipsSound_HTML5_WebAudio || (PTWTipsSound_HTML5_WebAudio = {}));
