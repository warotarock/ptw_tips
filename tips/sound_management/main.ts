
namespace SoundMnagement {

    class SoundResource {

        fileName: string = null;
        poolCount: int = null;

        soundUnit: PTWTipsSound_HTML5_WebAudio.SoundUnit = null;

        isLoading = false;

        file(fileName: string): SoundResource {

            this.fileName = fileName;

            return this;
        }

        pool(poolCount: int): SoundResource {

            this.poolCount = poolCount;

            return this;
        }
    }

    class Main {

        logicalScreenWidth = 640.0;
        logicalScreenHeight = 360.0;

        soundResources = new List<SoundResource>();
        soundSystem = new PTWTipsSound_HTML5_WebAudio.SoundSystem();
        soundManager = new PTWTipsSound.SoundManager();

        loadingSoundResources = new List<SoundResource>();

        isLoaded = false;

        initialize() {

            //Setup sound resources
            this.soundResources.push((new SoundResource()).file('cursor33.ogg').pool(1));
            this.soundResources.push((new SoundResource()).file('cursor34.ogg').pool(2));
            this.soundResources.push((new SoundResource()).file('cursor35.ogg').pool(3));

            // Initialize sound system and start loading
            this.soundSystem.initialize();

            for (let soundResource of this.soundResources) {

                soundResource.soundUnit = this.soundSystem.createSoundUnit(soundResource.poolCount)

                this.soundManager.addSoundUnit(soundResource.soundUnit);

                this.loadingSoundResources.push(soundResource);
            }

            // Set events
            document.getElementById('sound1').addEventListener('click', (e) => {

                this.playSound(0);
            })

            document.getElementById('sound2').addEventListener('click', (e) => {

                this.playSound(1);
            })

            document.getElementById('sound3').addEventListener('click', (e) => {

                this.playSound(2);
            })
        }

        processLoading() {

            // Process loading
            if (this.loadingSoundResources.length > 0) {

                let soundResource = this.loadingSoundResources[0];

                if (!soundResource.isLoading) {

                    this.soundSystem.loadSound(soundResource.soundUnit, soundResource.fileName);

                    soundResource.isLoading = true;
                }
                else if (soundResource.soundUnit.isLoaded) {

                    ListRemoveAt(this.loadingSoundResources, 0);
                }

                return;
            }

            // Loading finished
            this.isLoaded = true;
        }

        run() {

            this.soundManager.processSounds();
        }

        private playSound(soundID: int) {

            if (this.isLoaded) {
                this.soundManager.play(this.soundResources[soundID].soundUnit);
            }
        }

        draw() {

        }
    }

    var _Main: Main;

    window.onload = () => {

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
}
