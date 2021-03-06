var SoundMnagement;
(function (SoundMnagement) {
    var SoundResource = (function () {
        function SoundResource() {
            this.fileName = null;
            this.poolCount = null;
            this.soundSource = null;
            this.isLoading = false;
        }
        SoundResource.prototype.file = function (fileName) {
            this.fileName = fileName;
            return this;
        };
        SoundResource.prototype.pool = function (poolCount) {
            this.poolCount = poolCount;
            return this;
        };
        return SoundResource;
    }());
    var Main = (function () {
        function Main() {
            this.logicalScreenWidth = 640.0;
            this.logicalScreenHeight = 360.0;
            this.soundResources = new List();
            this.soundManager = new PTWTipsSound.SoundManager();
            this.soundDevice = null;
            this.loadingSoundResources = new List();
            this.isLoaded = false;
        }
        Main.prototype.initialize = function () {
            var _this = this;
            // Initialize sound system and start loading
            var useAudioElement = false;
            if (useAudioElement) {
                this.soundDevice = new PTWTipsSound_HTML5_Audio.SoundDevice();
            }
            else {
                this.soundDevice = new PTWTipsSound_HTML5_WebAudio.SoundDevice();
            }
            this.soundDevice.initialize();
            //Setup sound resources
            this.soundResources.push((new SoundResource()).file('cursor33.ogg').pool(1));
            this.soundResources.push((new SoundResource()).file('cursor34.ogg').pool(2));
            this.soundResources.push((new SoundResource()).file('cursor35.ogg').pool(3));
            // Start loading
            for (var _i = 0, _a = this.soundResources; _i < _a.length; _i++) {
                var soundResource = _a[_i];
                soundResource.soundSource = this.soundDevice.createSoundSource(soundResource.poolCount);
                this.soundManager.addSoundSource(soundResource.soundSource);
                this.loadingSoundResources.push(soundResource);
            }
            // Set events
            document.getElementById('sound1').addEventListener('click', function (e) {
                _this.playSound(0);
            });
            document.getElementById('sound2').addEventListener('click', function (e) {
                _this.playSound(1);
            });
            document.getElementById('sound3').addEventListener('click', function (e) {
                _this.playSound(2);
            });
        };
        Main.prototype.processLoading = function () {
            // Process loading
            if (this.loadingSoundResources.length > 0) {
                var soundResource = this.loadingSoundResources[0];
                if (!soundResource.isLoading) {
                    soundResource.soundSource.load(soundResource.fileName);
                    soundResource.isLoading = true;
                }
                else if (soundResource.soundSource.isLoaded) {
                    ListRemoveAt(this.loadingSoundResources, 0);
                }
                return;
            }
            // Loading finished
            this.isLoaded = true;
        };
        Main.prototype.run = function () {
            this.soundManager.processSounds();
        };
        Main.prototype.playSound = function (soundID) {
            if (this.isLoaded) {
                this.soundResources[soundID].soundSource.play();
            }
        };
        Main.prototype.draw = function () {
        };
        return Main;
    }());
    var _Main;
    window.onload = function () {
        _Main = new Main();
        _Main.initialize();
        setTimeout(run, 1000 / 30);
    };
    function run() {
        if (_Main.isLoaded) {
            _Main.run();
            _Main.draw();
        }
        else {
            _Main.processLoading();
        }
        setTimeout(run, 1000 / 30);
    }
})(SoundMnagement || (SoundMnagement = {}));
