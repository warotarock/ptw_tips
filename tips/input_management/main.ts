
namespace InputMnagement {

    enum GameButtonID {

        start = 0,
        up = 1,
        right = 2,
        down = 3,
        left = 4,
        attack = 5,
        shield = 6,
        maxID = 6
    }

    enum GameAnalogStickID {

        move = 0,
        direction = 1,
        accel = 2,
        maxID = 2
    }

    enum GamePointerInputID {

        target = 0,
        maxID = 0
    }

    class Main {

        logicalScreenWidth = 640.0;
        logicalScreenHeight = 360.0;

        display: HTMLElement = null;

        inputManager = new Input.InputManager();
        mouse = new Input.MouseDevice();
        keyboard = new Input.KeyboardDevice();
        gamepad = new Input.GamepadDevice();

        config = {
            'keyboard': {
                'space': 'start',
                'enter': 'start',
                'up': 'up',
                'right': 'right',
                'down': 'down',
                'left': 'left',
                'w': 'up',
                'd': 'right',
                's': 'down',
                'a': 'left',
                'z': 'attack',
                'j': 'attack',
                'x': 'shield',
                'k': 'shield',
            },
            'mouse': {
                'left': 'attack',
                'right': 'shield',
                'middle': 'start',
                'location': 'pointer',
                'wheel': 'analog3'
            },
            'gamepad': {
                'button10': 'start',
                'button01': 'up',
                'button02': 'right',
                'button03': 'down',
                'button04': 'left',
                'button05': 'attack',
                'button06': 'shield',
                'stick1': 'analog1',
                'stick2': 'analog2'
            },
        };

        isLoaded = false;

        initialize(canvas: HTMLCanvasElement, display: HTMLElement) {

            canvas.width = this.logicalScreenWidth;
            canvas.height = this.logicalScreenHeight;

            this.display = display;

            // Set up input devices and mappings
            this.initializeInput(canvas);
        }

        private initializeInput(canvas: HTMLCanvasElement) {

            this.inputManager.addDevice('keyboard', this.keyboard);
            this.inputManager.addDevice('mouse', this.mouse);
            this.inputManager.addDevice('gamepad', this.gamepad);

            this.inputManager.addButtonInputMap('start');
            this.inputManager.addButtonInputMap('up');
            this.inputManager.addButtonInputMap('right');
            this.inputManager.addButtonInputMap('down');
            this.inputManager.addButtonInputMap('left');
            this.inputManager.addButtonInputMap('attack');
            this.inputManager.addButtonInputMap('shield');

            this.inputManager.addAxisInputMap('analog1');
            this.inputManager.addAxisInputMap('analog2');
            this.inputManager.addAxisInputMap('analog3');

            this.inputManager.addPointingInputMap('pointer');

            this.inputManager.setInputMappingFromConfig(this.config);

            this.inputManager.setEvents(canvas);
        }

        processLoading() {

            // Loading finished
            this.isLoaded = true;
        }

        run() {

            var time = DateGetTime();

            this.inputManager.processPolling(time);

            var texts = [];
            var tab1 = '  ';

            texts.push('Mouse: (' + this.mouse.mousePoint.x.toFixed(2) + ', ' + this.mouse.mousePoint.y.toFixed(2) + ')'
                + ' Left(' + this.mouse.leftButton.singlePressState + ',' + this.mouse.leftButton.doublePressState
                + ') Middle(' + this.mouse.middleButton.singlePressState + ',' + this.mouse.middleButton.doublePressState
                + ') Right(' + this.mouse.rightButton.singlePressState + ',' + this.mouse.rightButton.doublePressState
                + ')'
            );

            this.display.innerHTML = texts.join('<br />');

            this.inputManager.updateStates(time);
        }

        draw() {
        }
    }

    var _Main: Main;

    window.onload = () => {

        var canvas = <HTMLCanvasElement>document.getElementById('canvas');
        var display = <HTMLElement>document.getElementById('display');
        _Main = new Main();
        _Main.initialize(canvas, display);

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
