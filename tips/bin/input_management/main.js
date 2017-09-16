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
    var Main = (function () {
        function Main() {
            this.logicalScreenWidth = 640.0;
            this.logicalScreenHeight = 360.0;
            this.display = null;
            this.inputManager = new Input.InputManager();
            this.mouse = new Input.MouseDevice();
            this.keyboard = new Input.KeyboardDevice();
            this.gamepad = new Input.GamepadDevice();
            this.config = {
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
        };
        Main.prototype.processLoading = function () {
            // Loading finished
            this.isLoaded = true;
        };
        Main.prototype.run = function () {
            var time = DateGetTime();
            this.inputManager.processPolling(time);
            var texts = [];
            var tab1 = '  ';
            texts.push('Mouse: (' + this.mouse.mousePoint.x.toFixed(2) + ', ' + this.mouse.mousePoint.y.toFixed(2) + ')'
                + ' Left(' + this.mouse.leftButton.singlePressState + ',' + this.mouse.leftButton.doublePressState
                + ') Middle(' + this.mouse.middleButton.singlePressState + ',' + this.mouse.middleButton.doublePressState
                + ') Right(' + this.mouse.rightButton.singlePressState + ',' + this.mouse.rightButton.doublePressState
                + ')');
            this.display.innerHTML = texts.join('<br />');
            this.inputManager.updateStates(time);
        };
        Main.prototype.draw = function () {
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
