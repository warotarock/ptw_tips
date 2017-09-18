
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

    class SampleInputSet {

        up: Input.IntegratedButtonControl;
        right: Input.IntegratedButtonControl;
        down: Input.IntegratedButtonControl;
        left: Input.IntegratedButtonControl;

        attack: Input.IntegratedButtonControl;
        shield: Input.IntegratedButtonControl;

        start: Input.IntegratedButtonControl;

        analog1: Input.IntegratedAxisControl;
        analog2: Input.IntegratedAxisControl;
        analog3: Input.IntegratedAxisControl;

        pointer: Input.IntegratedPointingInputControl;
    }

    class Main {

        logicalScreenWidth = 640.0;
        logicalScreenHeight = 360.0;

        display: HTMLElement = null;

        inputManager = new Input.InputManager();
        mouse = new Input.MouseDevice();
        keyboard = new Input.KeyboardDevice();
        gamepad = new Input.GamepadDevice();

        input = new SampleInputSet();

        config = {
            'keyboard': {
                ' ': 'start',
                'Enter': 'start',
                'ArrowUp': 'up',
                'ArrowRight': 'right',
                'ArrowDown': 'down',
                'ArrowLeft': 'left',
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
                'button1': 'attack',
                'button3': 'shield',
                'button2': 'start',
                'location': 'pointer',
                'wheel': 'analog3'
            },
            'gamepad': {
                'button1': 'attack',
                'button3': 'shield',
                'button4': 'start',
                'button10': 'start',
                'stick1': 'analog1',
                'stick2': 'analog2'
            },
        };

        buttonLetter = ['|---', '-|--', '--|-', '---|']
        doublePressButtonLetter = ['-', '-', '*', '*']
        tempVec = [0.0, 0.0, 0.0];

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

            this.input.up = this.inputManager.addButton('up');
            this.input.right = this.inputManager.addButton('right');
            this.input.down = this.inputManager.addButton('down');
            this.input.left = this.inputManager.addButton('left');

            this.input.attack = this.inputManager.addButton('attack');
            this.input.shield = this.inputManager.addButton('shield');

            this.input.start = this.inputManager.addButton('start');

            this.input.analog1 = this.inputManager.addAxis('analog1');
            this.input.analog2 = this.inputManager.addAxis('analog2');
            this.input.analog3 = this.inputManager.addAxis('analog3');

            this.input.pointer = this.inputManager.addPointingInputs('pointer');

            this.inputManager.setMappingFromConfig(this.config);

            this.inputManager.setEvents(canvas);
        }

        processLoading() {

            // Loading finished
            this.isLoaded = true;
        }

        run() {

            var time = DateGetTime();

            this.inputManager.processPolling(time);
        }

        draw() {

            var texts = [];
            var tab1 = '  ';

            texts.push('[Integrated]');

            texts.push('up' + this.getIntegratedButtonStateText(this.input.up)
                + ' right' + this.getIntegratedButtonStateText(this.input.right)
                + ' down' + this.getIntegratedButtonStateText(this.input.down)
                + ' left' + this.getIntegratedButtonStateText(this.input.left)
            );

            texts.push('attack' + this.getIntegratedButtonStateText(this.input.attack)
                + ' shield' + this.getIntegratedButtonStateText(this.input.shield)
                + ' start' + this.getIntegratedButtonStateText(this.input.start)
            );

            this.input.analog1.getAxis(this.tempVec);
            texts.push('analog1' + '(' + this.tempVec[0].toFixed(2) + ',' + this.tempVec[1].toFixed(2) + ')');

            this.input.analog2.getAxis(this.tempVec);
            texts.push('analog2' + '(' + this.tempVec[0].toFixed(2) + ',' + this.tempVec[1].toFixed(2) + ')');

            this.input.analog3.getAxis(this.tempVec);
            texts.push('analog3' + '(' + this.tempVec[0].toFixed(2) + ',' + this.tempVec[1].toFixed(2) + ')');

            texts.push('');

            texts.push('[Keyboard]');
            var buttonTexts = [];
            for (var key in this.keyboard.buttons) {

                let button: Input.ButtonInputControl = this.keyboard.buttons[key];

                if (button == null) {
                    continue;
                }

                buttonTexts.push(button.name + this.getButtonStateText(button));
            }
            texts.push(buttonTexts.join(' '));

            texts.push('');

            texts.push('[Mouse]: ' + this.mouse.location.x.toFixed(2) + ', ' + this.mouse.location.y.toFixed(2)
                + ' Left' + this.getButtonStateText(this.mouse.buttons[0])
                + ' Middle' + this.getButtonStateText(this.mouse.buttons[1])
                + ' Right' + this.getButtonStateText(this.mouse.buttons[2])
                + ' Wheel' + this.mouse.wheel.y
            );

            texts.push('');

            texts.push('[Gamepad]');
            var padButtonTexts = [];
            for (let button of this.gamepad.buttons) {

                if (button == null) {
                    continue;
                }

                padButtonTexts.push(button.name + this.getButtonStateText(button));
            }
            texts.push(padButtonTexts.join(' '));
            var padAxisTexts = [];
            for (let stickAxis of this.gamepad.sticks) {

                if (stickAxis == null) {
                    continue;
                }

                padAxisTexts.push(stickAxis.name + '(' + stickAxis.x.toFixed(2) + ',' + stickAxis.y.toFixed(2) + ')');
            }
            texts.push(padAxisTexts.join(' '));

            this.display.innerHTML = texts.join('<br />');

            this.inputManager.updateStates();
        }

        private getIntegratedButtonStateText(button: Input.IntegratedButtonControl) {

            return '(' + this.buttonLetter[button.getState()] + ' ' + this.doublePressButtonLetter[button.getDoublePressState()] + ')';
        }

        private getButtonStateText(button: Input.ButtonInputControl) {

            return '(' + this.buttonLetter[button.singlePressState] + ' ' + this.doublePressButtonLetter[button.doublePressState] + ')';
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
