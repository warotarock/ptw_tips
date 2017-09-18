var Input;
(function (Input) {
    var AxisMapping = (function () {
        function AxisMapping() {
            this.xIndex = 0;
            this.yIndex = 0;
        }
        return AxisMapping;
    }());
    var GamepadDevice = (function () {
        function GamepadDevice() {
            this.maxButtonCount = 16;
            this.maxAxisCount = 2;
            this.doublePressMilliSecond = 200;
            this.buttons = new List();
            this.sticks = new List();
            this.crossButtonEmulationEnabled = true;
            this.crossButtons = new List();
            this.connected = false;
            this.gamepad = null;
            this.axisIndexMappings = null;
        }
        GamepadDevice.prototype.initialize = function () {
            this.connected = false;
            this.buttons = new List(this.maxButtonCount);
            for (var i = 0; i < this.buttons.length; i++) {
                this.buttons[i] = new Input.ButtonInputControl();
                this.buttons[i].name = ('button' + (1 + i));
            }
            this.sticks = new List(this.maxAxisCount);
            for (var i = 0; i < this.sticks.length; i++) {
                this.sticks[i] = new Input.AxisInputControl();
                this.sticks[i].name = ('stick' + (1 + i));
            }
            this.crossButtons = new List(4);
            for (var i = 0; i < this.crossButtons.length; i++) {
                this.crossButtons[i] = new Input.ButtonInputControl();
                this.crossButtons[i].name = ('crossButton' + (1 + i));
            }
            this.initializeAxesIndexMap();
        };
        GamepadDevice.prototype.initializeAxesIndexMap = function () {
            var userAgent = window.navigator.userAgent.toLowerCase();
            if (userAgent.indexOf('msie') != -1 || userAgent.indexOf('trident') != -1) {
                this.axisIndexMappings = [{ xIndex: 0, yIndex: 1 }, { xIndex: 2, yIndex: 3 }];
            }
            else if (userAgent.indexOf('edge') != -1) {
                this.axisIndexMappings = [{ xIndex: 0, yIndex: 1 }, { xIndex: 2, yIndex: 3 }];
            }
            else if (userAgent.indexOf('chrome') != -1) {
                this.axisIndexMappings = [{ xIndex: 0, yIndex: 1 }, { xIndex: 2, yIndex: 5 }];
            }
            else if (userAgent.indexOf('safari') != -1) {
                this.axisIndexMappings = [{ xIndex: 0, yIndex: 1 }, { xIndex: 2, yIndex: 3 }];
            }
            else if (userAgent.indexOf('firefox') != -1) {
                this.axisIndexMappings = [{ xIndex: 0, yIndex: 1 }, { xIndex: 2, yIndex: 3 }];
            }
            else if (userAgent.indexOf('opera') != -1) {
                this.axisIndexMappings = [{ xIndex: 0, yIndex: 1 }, { xIndex: 2, yIndex: 5 }];
            }
            else {
                this.axisIndexMappings = [{ xIndex: 0, yIndex: 1 }, { xIndex: 2, yIndex: 3 }];
            }
        };
        GamepadDevice.prototype.setEvents = function (canvas) {
            var _this = this;
            var gamepadconnected = function (e) {
                if (_this.checkGamepads()) {
                    _this.gamepad = _this.getFirstGamepad();
                    if (_this.gamepad != null) {
                        _this.connected = true;
                    }
                }
            };
            var gamepaddisconnected = function (e) {
                _this.gamepad = null;
            };
            window.addEventListener('gamepadconnected', gamepadconnected);
            window.addEventListener('gamepaddisconnected', gamepaddisconnected);
        };
        GamepadDevice.prototype.processPolling = function (time) {
            if (this.connected == false) {
                return;
            }
            this.pollingForChrome();
            if (this.gamepad == null) {
                return;
            }
            // Polling for each buttons
            this.processPollingButtons(time);
            // Polling for each axes
            this.processPollingAxes();
            // Emulating cross buttons by first stick
            this.processCrossButtonEmulation();
            //var debugbuttonTexts = [];
            //for (var i = 0; i < gamepad.buttons.length; i++) {
            //    let button = gamepad.buttons[i];
            //    for (var prop in button) {
            //        debugbuttonTexts.push(button[prop]);
            //    }
            //}
            //console.log(debugbuttonTexts.join(', '));
            //var debugAxisTexts = [];
            //for (var i = 0; i < gamepad.axes.length; i++) {
            //    debugAxisTexts.push(gamepad.axes[i].toFixed(2));
            //}
            //console.log(debugAxisTexts.join(', '));
        };
        GamepadDevice.prototype.processPollingButtons = function (time) {
            var gamepad = this.gamepad;
            for (var i = 0; i < this.buttons.length && i < gamepad.buttons.length; i++) {
                var button = this.buttons[i];
                var gamepadButton = gamepad.buttons[i];
                if (this.isGamepadButtonPressed(gamepadButton)) {
                    if (!button.isPressed()) {
                        button.inputPress();
                    }
                }
                else {
                    if (!button.isReleased()) {
                        button.inputRelease();
                    }
                }
                button.processPollingDoublePress(time, this.doublePressMilliSecond);
            }
        };
        GamepadDevice.prototype.processPollingAxes = function () {
            var gamepad = this.gamepad;
            for (var i = 0; i < this.sticks.length; i++) {
                var axis = this.sticks[i];
                var axisIndexMap = this.axisIndexMappings[i];
                var gamepadAxisValueX = 0.0;
                var gamepadAxisValueY = 0.0;
                if (axisIndexMap.xIndex < gamepad.axes.length) {
                    gamepadAxisValueX = gamepad.axes[axisIndexMap.xIndex];
                }
                if (axisIndexMap.yIndex < gamepad.axes.length) {
                    gamepadAxisValueY = gamepad.axes[axisIndexMap.yIndex];
                }
                axis.inputAxis(gamepadAxisValueX, gamepadAxisValueY);
            }
        };
        GamepadDevice.prototype.processCrossButtonEmulation = function () {
            if (!this.crossButtonEmulationEnabled) {
                return false;
            }
            var axis = this.sticks[0];
            var axis_threshold = 0.01;
            // Up direction
            if (axis.y <= -axis_threshold) {
                // Press up button
                if (this.crossButtons[0].isReleased()) {
                    this.crossButtons[0].inputPress();
                }
                // Release down button
                if (this.crossButtons[2].isPressed()) {
                    this.crossButtons[2].inputRelease();
                }
            }
            // Right direction
            if (axis.x >= axis_threshold) {
                // Press right button
                if (this.crossButtons[1].isReleased()) {
                    this.crossButtons[1].inputPress();
                }
                // Release left button
                if (this.crossButtons[3].isPressed()) {
                    this.crossButtons[3].inputRelease();
                }
            }
            // Down direction
            if (axis.y >= axis_threshold) {
                // Press down button
                if (this.crossButtons[2].isReleased()) {
                    this.crossButtons[2].inputPress();
                }
                // Release up button
                if (this.crossButtons[0].isPressed()) {
                    this.crossButtons[0].inputRelease();
                }
            }
            // Left direction
            if (axis.x <= -axis_threshold) {
                // Press left button
                if (this.crossButtons[3].isReleased()) {
                    this.crossButtons[3].inputPress();
                }
                // Release right button
                if (this.crossButtons[1].isPressed()) {
                    this.crossButtons[1].inputRelease();
                }
            }
        };
        GamepadDevice.prototype.updateStates = function () {
            for (var i = 0; i < this.buttons.length; i++) {
                var button = this.buttons[i];
                button.updateStates();
            }
        };
        GamepadDevice.prototype.getButtonControlByName = function (name) {
            for (var i = 0; i < this.buttons.length; i++) {
                var button = this.buttons[i];
                if (button.name == name) {
                    return button;
                }
            }
            for (var i = 0; i < this.crossButtons.length; i++) {
                var button = this.crossButtons[i];
                if (button.name == name) {
                    return button;
                }
            }
            return null;
        };
        GamepadDevice.prototype.getAxisControlByName = function (name) {
            for (var i = 0; i < this.sticks.length; i++) {
                var axis = this.sticks[i];
                if (axis.name == name) {
                    return axis;
                }
            }
            return null;
        };
        GamepadDevice.prototype.getPointingControlByName = function (name) {
            return null;
        };
        GamepadDevice.prototype.checkGamepads = function () {
            if ('getGamepads' in navigator) {
                var gamepads = navigator.getGamepads();
                for (var i = 0; i < gamepads.length; i++) {
                    if (gamepads[i]) {
                        return true;
                    }
                }
            }
        };
        GamepadDevice.prototype.getFirstGamepad = function () {
            var gamepads = navigator.getGamepads();
            for (var i = 0; i < gamepads.length; i++) {
                if (gamepads[i]) {
                    return gamepads[i];
                }
            }
            return null;
        };
        GamepadDevice.prototype.pollingForChrome = function () {
            this.gamepad = this.getFirstGamepad();
        };
        GamepadDevice.prototype.isGamepadButtonPressed = function (button) {
            if (typeof (button) == 'object') {
                return button.pressed;
            }
            return (button == 1.0);
        };
        return GamepadDevice;
    }());
    Input.GamepadDevice = GamepadDevice;
})(Input || (Input = {}));
