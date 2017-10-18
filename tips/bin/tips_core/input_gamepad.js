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
var PTWTipsInput;
(function (PTWTipsInput) {
    var StickIndexMapping = (function () {
        function StickIndexMapping() {
            this.xIndex = 0;
            this.yIndex = 0;
        }
        return StickIndexMapping;
    }());
    var GamepadDeviceLayout = (function () {
        function GamepadDeviceLayout() {
            this.buttonMappings = null;
            this.axesMappings = null;
            this.StickIndexMappings = null;
        }
        GamepadDeviceLayout.prototype.initialize = function () {
            // Override method
        };
        GamepadDeviceLayout.prototype.getMappingTypeForEnvironment = function () {
            var userAgent = window.navigator.userAgent.toLowerCase();
            var browerType = 0;
            if (userAgent.indexOf('msie') != -1 || userAgent.indexOf('trident') != -1) {
                browerType = 0;
            }
            else if (userAgent.indexOf('edge') != -1) {
                browerType = 0;
            }
            else if (userAgent.indexOf('chrome') != -1) {
                browerType = 0;
            }
            else if (userAgent.indexOf('safari') != -1) {
                browerType = 0;
            }
            else if (userAgent.indexOf('firefox') != -1) {
                browerType = 1;
            }
            else if (userAgent.indexOf('opera') != -1) {
                browerType = 0;
            }
            return browerType;
        };
        GamepadDeviceLayout.prototype.isMatch = function (mappingName) {
            // Override method
            return false;
        };
        GamepadDeviceLayout.prototype.processPollingCrossButton = function (crossButtons, buttons, gamepad, time, doublePressMilliSecond) {
            // Override method
        };
        return GamepadDeviceLayout;
    }());
    var W3CStandardGamepadLayout = (function (_super) {
        __extends(W3CStandardGamepadLayout, _super);
        function W3CStandardGamepadLayout() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        W3CStandardGamepadLayout.prototype.initialize = function () {
            // Detect gamepad environment
            var mappingType = this.getMappingTypeForEnvironment();
            // Set mappings
            this.buttonMappings = [
                0,
                1,
                2,
                3,
                4,
                5,
                6,
                7,
                8,
                9,
                10,
                11,
                12,
                13,
                14,
                15,
                16,
            ];
            this.axesMappings = [
                0,
                1,
                2,
                3 // stick2 y
            ];
            this.StickIndexMappings = [
                { xIndex: 0, yIndex: 1 },
                { xIndex: 2, yIndex: 3 }
            ];
        };
        W3CStandardGamepadLayout.prototype.isMatch = function (mappingName) {
            return StringContains(mappingName, 'standard');
        };
        W3CStandardGamepadLayout.prototype.processPollingCrossButton = function (crossButtons, buttons, gamepad, time, doublePressMilliSecond) {
            // Up
            buttons[12].copyTo(crossButtons[0]);
            // Right
            buttons[15].copyTo(crossButtons[1]);
            // Down
            buttons[13].copyTo(crossButtons[2]);
            // Left
            buttons[14].copyTo(crossButtons[3]);
        };
        return W3CStandardGamepadLayout;
    }(GamepadDeviceLayout));
    var GenericGamepadLayout = (function (_super) {
        __extends(GenericGamepadLayout, _super);
        function GenericGamepadLayout() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        GenericGamepadLayout.prototype.initialize = function () {
            // Detect gamepad environment
            var mappingType = this.getMappingTypeForEnvironment();
            // Set mappings
            this.buttonMappings = [
                2,
                3,
                0,
                1,
                4,
                5,
                6,
                7,
                8,
                9,
                10,
                11,
            ];
            if (mappingType == 0) {
                this.axesMappings = [
                    0,
                    1,
                    2,
                    5,
                    9 // pov
                ];
            }
            else {
                this.axesMappings = [
                    0,
                    1,
                    2,
                    3,
                    9 // pov
                ];
            }
            this.StickIndexMappings = [
                { xIndex: 0, yIndex: 1 },
                { xIndex: 2, yIndex: 3 }
            ];
        };
        GenericGamepadLayout.prototype.isMatch = function (mappingName) {
            return (StringIsNullOrEmpty(mappingName) || !StringContains(mappingName, 'standard'));
        };
        GenericGamepadLayout.prototype.processPollingCrossButton = function (crossButtons, buttons, gamepad, time, doublePressMilliSecond) {
            var povAxisIndex = this.axesMappings[4];
            if (povAxisIndex >= gamepad.axes.length) {
                return;
            }
            // Get direction from pov
            var verticalPressedIndex = -1;
            var horizontalPressedIndex = -1;
            var axisValue = gamepad.axes[povAxisIndex];
            if (axisValue >= -1.0 && axisValue <= 1.0) {
                // POV value takes -1.0 when angle is PI * 0.5) , and takes 1.0 when angle is PI * 0.75
                var angle = (1.625 - (axisValue * 0.875));
                if (angle >= 2.0) {
                    angle -= 2.0;
                }
                var limitAngle = 0.3;
                // Up direction
                if (angle >= (0.5 - limitAngle) && angle <= (0.5 + limitAngle)) {
                    verticalPressedIndex = 0;
                }
                // Right direction
                if (angle <= limitAngle || angle >= (2.0 - limitAngle)) {
                    horizontalPressedIndex = 1;
                }
                // Down direction
                if (angle >= (1.5 - limitAngle) && angle <= (1.5 + limitAngle)) {
                    verticalPressedIndex = 2;
                }
                // Left direction
                if (angle >= (1.0 - limitAngle) && angle <= (1.0 + limitAngle)) {
                    horizontalPressedIndex = 3;
                }
            }
            for (var i = 0; i < crossButtons.length; i++) {
                var button = crossButtons[i];
                if (i == verticalPressedIndex || i == horizontalPressedIndex) {
                    if (button.isReleased()) {
                        button.inputPress();
                    }
                }
                else {
                    if (button.isPressed()) {
                        button.inputRelease();
                    }
                }
                button.processPollingDoublePress(time, doublePressMilliSecond);
            }
        };
        return GenericGamepadLayout;
    }(GamepadDeviceLayout));
    var GamepadDevice = (function () {
        function GamepadDevice() {
            this.maxButtonCount = 16;
            this.maxAxisCount = 2;
            this.doublePressMilliSecond = 200;
            this.buttons = new List();
            this.sticks = new List();
            this.crossButtons = new List();
            this.crossButtonEmulationEnabled = false;
            this.standardGamepadLayout = new W3CStandardGamepadLayout();
            this.genericGamepadLayout = new GenericGamepadLayout();
            this.currentDeviceLayout = null;
            this.connected = false;
            this.gamepad = null;
        }
        GamepadDevice.prototype.initialize = function () {
            this.connected = false;
            this.buttons = new List(this.maxButtonCount);
            for (var i = 0; i < this.buttons.length; i++) {
                this.buttons[i] = new PTWTipsInput.ButtonInputControl();
                this.buttons[i].name = ('button' + (1 + i));
            }
            this.sticks = new List(this.maxAxisCount);
            for (var i = 0; i < this.sticks.length; i++) {
                this.sticks[i] = new PTWTipsInput.AxisInputControl();
                this.sticks[i].name = ('stick' + (1 + i));
            }
            this.crossButtons = new List(4);
            for (var i = 0; i < this.crossButtons.length; i++) {
                this.crossButtons[i] = new PTWTipsInput.ButtonInputControl();
                this.crossButtons[i].name = ('crossButton' + (1 + i));
            }
            this.standardGamepadLayout.initialize();
            this.genericGamepadLayout.initialize();
        };
        GamepadDevice.prototype.setEvents = function (canvas) {
            var _this = this;
            var gamepadconnected = function (e) {
                _this.gamepadconnected(e);
            };
            var gamepaddisconnected = function (e) {
                _this.gamepaddisconnected(e);
            };
            window.addEventListener('gamepadconnected', gamepadconnected);
            window.addEventListener('gamepaddisconnected', gamepaddisconnected);
        };
        GamepadDevice.prototype.gamepadconnected = function (e) {
            // Gets gamapad
            if (!this.checkGamepads()) {
                return;
            }
            this.gamepad = this.getFirstGamepad();
            // Detect gamepad layout
            if (this.standardGamepadLayout.isMatch(this.gamepad.mapping)) {
                this.currentDeviceLayout = this.standardGamepadLayout;
            }
            else {
                this.currentDeviceLayout = this.genericGamepadLayout;
            }
            this.connected = true;
        };
        GamepadDevice.prototype.gamepaddisconnected = function (e) {
            this.gamepad = null;
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
            // Polling cross buttons 
            if (this.crossButtonEmulationEnabled) {
                this.processCrossButtonEmulation(time);
            }
            else {
                this.processPollingCrossButton(time);
            }
            //var debugbuttonTexts = [];
            //for (var i = 0; i < this.gamepad.buttons.length; i++) {
            //    let button = this.gamepad.buttons[i];
            //    for (var prop in button) {
            //        debugbuttonTexts.push(button[prop]);
            //    }
            //}
            //console.log(debugbuttonTexts.join(', '));
            //var debugAxisTexts = [];
            //for (var i = 0; i < this.gamepad.axes.length; i++) {
            //    debugAxisTexts.push(this.gamepad.axes[i].toFixed(2));
            //}
            //console.log(debugAxisTexts.join(', '));
        };
        GamepadDevice.prototype.processPollingButtons = function (time) {
            var gamepad = this.gamepad;
            for (var i = 0; i < this.buttons.length; i++) {
                var button = this.buttons[i];
                if (i >= this.currentDeviceLayout.buttonMappings.length) {
                    break;
                }
                var mappedIndex = this.currentDeviceLayout.buttonMappings[i];
                if (mappedIndex >= gamepad.buttons.length) {
                    continue;
                }
                var gamepadButton = gamepad.buttons[mappedIndex];
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
                if (i >= this.currentDeviceLayout.StickIndexMappings.length) {
                    break;
                }
                var mapping = this.currentDeviceLayout.StickIndexMappings[i];
                if (mapping.xIndex >= gamepad.axes.length || mapping.yIndex >= gamepad.axes.length) {
                    continue;
                }
                var mappedIndexX = this.currentDeviceLayout.axesMappings[mapping.xIndex];
                var mappedIndexY = this.currentDeviceLayout.axesMappings[mapping.yIndex];
                if (mappedIndexX >= gamepad.axes.length || mappedIndexY >= gamepad.axes.length) {
                    continue;
                }
                var gamepadAxisValueX = 0.0;
                var gamepadAxisValueY = 0.0;
                if (mapping.xIndex < gamepad.axes.length) {
                    gamepadAxisValueX = gamepad.axes[mappedIndexX];
                }
                if (mapping.yIndex < gamepad.axes.length) {
                    gamepadAxisValueY = gamepad.axes[mappedIndexY];
                }
                axis.inputAxis(gamepadAxisValueX, gamepadAxisValueY);
            }
        };
        GamepadDevice.prototype.processPollingCrossButton = function (time) {
            this.currentDeviceLayout.processPollingCrossButton(this.crossButtons, this.buttons, this.gamepad, time, this.doublePressMilliSecond);
        };
        GamepadDevice.prototype.processCrossButtonEmulation = function (time) {
            // If any cross button is inputed, cancel emulation
            for (var i = 0; i < this.crossButtons.length; i++) {
                var button = this.crossButtons[i];
                if (button.isInputed) {
                    return;
                }
            }
            var axis = this.sticks[0];
            var axis_threshold = 0.3;
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
            // No direction
            if (axis.x > -axis_threshold && axis.x < axis_threshold) {
                // Release right button
                if (this.crossButtons[1].isPressed()) {
                    this.crossButtons[1].inputRelease();
                }
                // Release left button
                if (this.crossButtons[3].isPressed()) {
                    this.crossButtons[3].inputRelease();
                }
            }
            if (axis.y > -axis_threshold && axis.y < axis_threshold) {
                // Release up button
                if (this.crossButtons[0].isPressed()) {
                    this.crossButtons[0].inputRelease();
                }
                // Release down button
                if (this.crossButtons[2].isPressed()) {
                    this.crossButtons[2].inputRelease();
                }
            }
            for (var i = 0; i < this.crossButtons.length; i++) {
                var button = this.crossButtons[i];
                button.processPollingDoublePress(time, this.doublePressMilliSecond);
            }
        };
        GamepadDevice.prototype.updateStates = function () {
            for (var i = 0; i < this.buttons.length; i++) {
                var button = this.buttons[i];
                button.updateStates();
            }
            for (var i = 0; i < this.crossButtons.length; i++) {
                var button = this.crossButtons[i];
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
    PTWTipsInput.GamepadDevice = GamepadDevice;
})(PTWTipsInput || (PTWTipsInput = {}));
