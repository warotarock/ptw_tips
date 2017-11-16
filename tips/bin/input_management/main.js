var InputMnagement;
(function (InputMnagement) {
    var GameButtonID;
    (function (GameButtonID) {
        GameButtonID[GameButtonID["start"] = 0] = "start";
        GameButtonID[GameButtonID["up"] = 1] = "up";
        GameButtonID[GameButtonID["right"] = 2] = "right";
        GameButtonID[GameButtonID["down"] = 3] = "down";
        GameButtonID[GameButtonID["left"] = 4] = "left";
        GameButtonID[GameButtonID["attack"] = 5] = "attack";
        GameButtonID[GameButtonID["shield"] = 6] = "shield";
        GameButtonID[GameButtonID["maxID"] = 6] = "maxID";
    })(GameButtonID || (GameButtonID = {}));
    var GameAnalogStickID;
    (function (GameAnalogStickID) {
        GameAnalogStickID[GameAnalogStickID["move"] = 0] = "move";
        GameAnalogStickID[GameAnalogStickID["direction"] = 1] = "direction";
        GameAnalogStickID[GameAnalogStickID["accel"] = 2] = "accel";
        GameAnalogStickID[GameAnalogStickID["maxID"] = 2] = "maxID";
    })(GameAnalogStickID || (GameAnalogStickID = {}));
    var GamePointerInputID;
    (function (GamePointerInputID) {
        GamePointerInputID[GamePointerInputID["target"] = 0] = "target";
        GamePointerInputID[GamePointerInputID["maxID"] = 0] = "maxID";
    })(GamePointerInputID || (GamePointerInputID = {}));
    var SampleInputSet = (function () {
        function SampleInputSet() {
        }
        return SampleInputSet;
    }());
    var Main = (function () {
        function Main() {
            this.logicalScreenWidth = 640.0;
            this.logicalScreenHeight = 360.0;
            this.display = null;
            this.inputManager = new PTWTipsInput.InputManager();
            this.mouse = new PTWTipsInput.MouseDevice();
            this.keyboard = new PTWTipsInput.KeyboardDevice();
            this.gamepad = new PTWTipsInput.GamepadDevice();
            this.input = new SampleInputSet();
            this.config = [
                {
                    deviceName: 'keyboard',
                    mappings: [
                        [' ', 'start',],
                        ['Enter', 'start'],
                        ['ArrowUp', 'up'],
                        ['ArrowRight', 'right'],
                        ['ArrowDown', 'down'],
                        ['ArrowLeft', 'left'],
                        ['w', 'up'],
                        ['d', 'right'],
                        ['s', 'down'],
                        ['a', 'left'],
                        ['z', 'attack'],
                        ['j', 'attack'],
                        ['x', 'shield'],
                        ['k', 'shield'],
                    ]
                },
                {
                    deviceName: 'mouse',
                    mappings: [
                        ['button1', 'attack'],
                        ['button3', 'shield'],
                        ['location', 'pointer'],
                        ['wheel', 'analog3'],
                    ]
                },
                {
                    deviceName: 'gamepad',
                    mappings: [
                        ['crossButton1', 'up'],
                        ['crossButton2', 'right'],
                        ['crossButton3', 'down'],
                        ['crossButton4', 'left'],
                        ['button1', 'attack'],
                        ['button2', 'shield'],
                        ['button10', 'start'],
                        ['stick1', 'analog1'],
                        ['stick2', 'analog2'],
                    ]
                }
            ];
            this.buttonLetter = ['|---', '-|--', '--|-', '---|'];
            this.doublePressButtonLetter = ['-', '-', '*', '*'];
            this.tempVec = [0.0, 0.0, 0.0];
            this.isLoaded = false;
        }
        Main.prototype.initialize = function (canvas, display) {
            canvas.width = this.logicalScreenWidth;
            canvas.height = this.logicalScreenHeight;
            this.display = display;
            // Set up input devices and mappings
            this.initializeInput(canvas);
        };
        Main.prototype.initializeInput = function (canvas) {
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
            this.input.pointer = this.inputManager.addPointingInput('pointer');
            this.inputManager.setMappingFromConfig(this.config);
            this.inputManager.setEvents(canvas);
        };
        Main.prototype.processLoading = function () {
            // Loading finished
            this.isLoaded = true;
        };
        Main.prototype.run = function () {
            var time = DateGetTime();
            this.inputManager.processPolling(time);
        };
        Main.prototype.draw = function () {
            var texts = [];
            var tab1 = '  ';
            texts.push('[Integrated]');
            texts.push('up' + this.getIntegratedButtonStateText(this.input.up)
                + ' right' + this.getIntegratedButtonStateText(this.input.right)
                + ' down' + this.getIntegratedButtonStateText(this.input.down)
                + ' left' + this.getIntegratedButtonStateText(this.input.left));
            texts.push('attack' + this.getIntegratedButtonStateText(this.input.attack)
                + ' shield' + this.getIntegratedButtonStateText(this.input.shield)
                + ' start' + this.getIntegratedButtonStateText(this.input.start));
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
                var button = this.keyboard.buttons[key];
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
                + ' Wheel' + this.mouse.wheel.y);
            texts.push('');
            texts.push('[Gamepad]');
            var padButtonTexts = [];
            for (var _i = 0, _a = this.gamepad.buttons; _i < _a.length; _i++) {
                var button = _a[_i];
                if (button == null) {
                    continue;
                }
                padButtonTexts.push(button.name + this.getButtonStateText(button));
            }
            texts.push(padButtonTexts.join(' '));
            var padAxisTexts = [];
            for (var _b = 0, _c = this.gamepad.sticks; _b < _c.length; _b++) {
                var stickAxis = _c[_b];
                if (stickAxis == null) {
                    continue;
                }
                padAxisTexts.push(stickAxis.name + '(' + stickAxis.x.toFixed(2) + ',' + stickAxis.y.toFixed(2) + ')');
            }
            texts.push(padAxisTexts.join(' '));
            this.display.innerHTML = texts.join('<br />');
            this.inputManager.updateStates();
        };
        Main.prototype.getIntegratedButtonStateText = function (button) {
            return '(' + this.buttonLetter[button.getState()] + ' ' + this.doublePressButtonLetter[button.getDoublePressState()] + ')';
        };
        Main.prototype.getButtonStateText = function (button) {
            return '(' + this.buttonLetter[button.singlePressState] + ' ' + this.doublePressButtonLetter[button.doublePressState] + ')';
        };
        return Main;
    }());
    var _Main;
    window.onload = function () {
        var canvas = document.getElementById('canvas');
        var display = document.getElementById('display');
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
})(InputMnagement || (InputMnagement = {}));
