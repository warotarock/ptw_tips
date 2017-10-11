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
    // Control class
    var ButtonState;
    (function (ButtonState) {
        ButtonState[ButtonState["released"] = 0] = "released";
        ButtonState[ButtonState["justReleased"] = 1] = "justReleased";
        ButtonState[ButtonState["justPressed"] = 2] = "justPressed";
        ButtonState[ButtonState["pressed"] = 3] = "pressed";
    })(ButtonState = PTWTipsInput.ButtonState || (PTWTipsInput.ButtonState = {}));
    var InputControl = (function () {
        function InputControl() {
            this.isInputed = false;
            this.name = null;
        }
        return InputControl;
    }());
    PTWTipsInput.InputControl = InputControl;
    var ButtonInputControl = (function (_super) {
        __extends(ButtonInputControl, _super);
        function ButtonInputControl() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.singlePressState = ButtonState.released;
            _this.doublePressState = ButtonState.released;
            _this.pressure = 0.0;
            _this.lastPressedTime = 0.0;
            return _this;
        }
        ButtonInputControl.prototype.inputPress = function () {
            this.isInputed = true;
            this.pressure = 1.0;
            if (this.singlePressState == ButtonState.pressed || this.singlePressState == ButtonState.justPressed) {
                this.singlePressState = ButtonState.pressed;
            }
            else {
                this.singlePressState = ButtonState.justPressed;
            }
        };
        ButtonInputControl.prototype.inputRelease = function () {
            this.isInputed = true;
            this.pressure = 0.0;
            if (this.singlePressState == ButtonState.released || this.singlePressState == ButtonState.justReleased) {
                this.singlePressState = ButtonState.released;
            }
            else {
                this.singlePressState = ButtonState.justReleased;
            }
        };
        ButtonInputControl.prototype.getButtonPressNextState = function (currentState) {
            var nextState = currentState;
            if (currentState == ButtonState.justPressed) {
                nextState = ButtonState.pressed;
            }
            else if (currentState == ButtonState.justReleased) {
                nextState = ButtonState.released;
            }
            return nextState;
        };
        ButtonInputControl.prototype.processPollingDoublePress = function (time, doublePressMilliSecond) {
            if (this.singlePressState == ButtonState.justPressed) {
                if (time - this.lastPressedTime < doublePressMilliSecond) {
                    this.doublePressState = ButtonState.pressed;
                }
                this.lastPressedTime = time;
            }
        };
        ButtonInputControl.prototype.updateStates = function () {
            this.singlePressState = this.getButtonPressNextState(this.singlePressState);
            this.doublePressState = ButtonState.released;
            this.isInputed = false;
        };
        ButtonInputControl.prototype.isPressed = function () {
            return (this.singlePressState == ButtonState.pressed || this.singlePressState == ButtonState.justPressed);
        };
        ButtonInputControl.prototype.isJustPressed = function () {
            return (this.singlePressState == ButtonState.justPressed);
        };
        ButtonInputControl.prototype.isReleased = function () {
            return (this.singlePressState == ButtonState.released || this.singlePressState == ButtonState.justReleased);
        };
        ButtonInputControl.prototype.isJustReleased = function () {
            return (this.singlePressState == ButtonState.justReleased);
        };
        ButtonInputControl.prototype.isDoublePressed = function () {
            return (this.doublePressState == ButtonState.pressed);
        };
        ButtonInputControl.prototype.copyTo = function (target) {
            target.singlePressState = this.singlePressState;
            target.doublePressState = this.doublePressState;
            target.pressure = this.pressure;
            target.lastPressedTime = this.lastPressedTime;
            target.isInputed = this.isInputed;
        };
        return ButtonInputControl;
    }(InputControl));
    PTWTipsInput.ButtonInputControl = ButtonInputControl;
    var AxisInputControl = (function (_super) {
        __extends(AxisInputControl, _super);
        function AxisInputControl() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.x = 0.0;
            _this.y = 0.0;
            _this.threshold = 0.005;
            return _this;
        }
        AxisInputControl.prototype.inputAxis = function (x, y) {
            if (Math.abs(x) < this.threshold) {
                x = 0.0;
            }
            if (Math.abs(y) < this.threshold) {
                y = 0.0;
            }
            if ((this.x == 0.0 && this.y == 0.0) && (x != 0.0 || y != 0.0)) {
                this.isInputed = true;
            }
            this.x = x;
            this.y = y;
        };
        return AxisInputControl;
    }(InputControl));
    PTWTipsInput.AxisInputControl = AxisInputControl;
    var PointingInputControl = (function (_super) {
        __extends(PointingInputControl, _super);
        function PointingInputControl() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.x = 0.0;
            _this.y = 0.0;
            return _this;
        }
        PointingInputControl.prototype.inputLocation = function (x, y) {
            this.isInputed = true;
            this.x = x;
            this.y = y;
        };
        return PointingInputControl;
    }(InputControl));
    PTWTipsInput.PointingInputControl = PointingInputControl;
    // Input mapping for multi-device integration
    var InputMapping = (function () {
        function InputMapping() {
            this.controls = new List();
            this.primaryControl = null;
        }
        InputMapping.prototype.processSwitchingPrimaryControl = function () {
            for (var _i = 0, _a = this.controls; _i < _a.length; _i++) {
                var control = _a[_i];
                if (control.isInputed) {
                    this.primaryControl = control;
                    break;
                }
            }
        };
        InputMapping.prototype.add = function (control) {
            this.controls.push(control);
            return this;
        };
        return InputMapping;
    }());
    var ButtonInputMapping = (function (_super) {
        __extends(ButtonInputMapping, _super);
        function ButtonInputMapping() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return ButtonInputMapping;
    }(InputMapping));
    PTWTipsInput.ButtonInputMapping = ButtonInputMapping;
    var IntegratedButtonControl = (function () {
        function IntegratedButtonControl(mapping) {
            this.mapping = mapping;
        }
        IntegratedButtonControl.prototype.getState = function () {
            if (this.mapping.primaryControl == null) {
                return ButtonState.released;
            }
            return this.mapping.primaryControl.singlePressState;
        };
        IntegratedButtonControl.prototype.getDoublePressState = function () {
            if (this.mapping.primaryControl == null) {
                return ButtonState.released;
            }
            return this.mapping.primaryControl.doublePressState;
        };
        IntegratedButtonControl.prototype.isPressed = function () {
            if (this.mapping.primaryControl == null) {
                return false;
            }
            this.mapping.primaryControl.isPressed();
        };
        IntegratedButtonControl.prototype.isJustPressed = function () {
            if (this.mapping.primaryControl == null) {
                return false;
            }
            this.mapping.primaryControl.isJustPressed();
        };
        IntegratedButtonControl.prototype.isReleased = function () {
            if (this.mapping.primaryControl == null) {
                return false;
            }
            this.mapping.primaryControl.isReleased();
        };
        IntegratedButtonControl.prototype.isJustReleased = function () {
            if (this.mapping.primaryControl == null) {
                return false;
            }
            this.mapping.primaryControl.isJustReleased();
        };
        IntegratedButtonControl.prototype.isDoublePressed = function () {
            if (this.mapping.primaryControl == null) {
                return false;
            }
            return this.mapping.primaryControl.isDoublePressed();
        };
        return IntegratedButtonControl;
    }());
    PTWTipsInput.IntegratedButtonControl = IntegratedButtonControl;
    var AxisInputMapping = (function (_super) {
        __extends(AxisInputMapping, _super);
        function AxisInputMapping() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return AxisInputMapping;
    }(InputMapping));
    PTWTipsInput.AxisInputMapping = AxisInputMapping;
    var IntegratedAxisControl = (function () {
        function IntegratedAxisControl(mapping) {
            this.mapping = mapping;
        }
        IntegratedAxisControl.prototype.getAxis = function (vec) {
            if (this.mapping.primaryControl == null) {
                vec[0] = 0.0;
                vec[1] = 0.0;
                vec[2] = 0.0;
                return;
            }
            vec[0] = this.mapping.primaryControl.x;
            vec[1] = this.mapping.primaryControl.y;
            vec[2] = 0.0;
        };
        return IntegratedAxisControl;
    }());
    PTWTipsInput.IntegratedAxisControl = IntegratedAxisControl;
    var PointingInputMapping = (function (_super) {
        __extends(PointingInputMapping, _super);
        function PointingInputMapping() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return PointingInputMapping;
    }(InputMapping));
    PTWTipsInput.PointingInputMapping = PointingInputMapping;
    var InputMappingSet = (function () {
        function InputMappingSet() {
            this.mappings = new List();
            this.mappingDictionary = new Dictionary();
        }
        InputMappingSet.prototype.processSwitchingPrimaryControl = function () {
            for (var _i = 0, _a = this.mappings; _i < _a.length; _i++) {
                var mapping = _a[_i];
                mapping.processSwitchingPrimaryControl();
            }
        };
        InputMappingSet.prototype.clear = function () {
            this.mappings = new List();
            this.mappingDictionary = new Dictionary();
        };
        InputMappingSet.prototype.addMapping = function (name, mapping) {
            this.mappings.push(mapping);
            this.mappingDictionary[name] = mapping;
        };
        InputMappingSet.prototype.existsMapping = function (name) {
            return (DictionaryContainsKey(this.mappingDictionary, name));
        };
        InputMappingSet.prototype.addControl = function (name, control) {
            var mapping = this.mappingDictionary[name];
            mapping.add(control);
        };
        return InputMappingSet;
    }());
    var IntegratedPointingInputControl = (function () {
        function IntegratedPointingInputControl(mapping) {
            this.mapping = mapping;
        }
        IntegratedPointingInputControl.prototype.getLocation = function (vec) {
            if (this.mapping.primaryControl == null) {
                vec[0] = 0.0;
                vec[1] = 0.0;
                vec[2] = 0.0;
                return;
            }
            vec[0] = this.mapping.primaryControl.x;
            vec[1] = this.mapping.primaryControl.y;
            vec[2] = 0.0;
        };
        return IntegratedPointingInputControl;
    }());
    PTWTipsInput.IntegratedPointingInputControl = IntegratedPointingInputControl;
    // Manager
    var InputManager = (function () {
        function InputManager() {
            this.decives = new List();
            this.deciveDictionary = new Dictionary();
            this.buttonInputMappingSet = new InputMappingSet();
            this.axisInputMapppingSet = new InputMappingSet();
            this.pointingInputMappingSet = new InputMappingSet();
        }
        // Device
        InputManager.prototype.addDevice = function (name, device) {
            this.decives.push(device);
            this.deciveDictionary[name] = device;
            device.initialize();
        };
        // Mapping
        InputManager.prototype.clearButtons = function () {
            this.buttonInputMappingSet.clear();
        };
        InputManager.prototype.addButton = function (name) {
            var mapping = new ButtonInputMapping();
            var integratedButton = new IntegratedButtonControl(mapping);
            this.buttonInputMappingSet.addMapping(name, mapping);
            return integratedButton;
        };
        InputManager.prototype.clearAxes = function () {
            this.axisInputMapppingSet.clear();
        };
        InputManager.prototype.addAxis = function (name) {
            var mapping = new AxisInputMapping();
            var integratedAxis = new IntegratedAxisControl(mapping);
            this.axisInputMapppingSet.addMapping(name, mapping);
            return integratedAxis;
        };
        InputManager.prototype.clearPointingInput = function () {
            this.pointingInputMappingSet.clear();
        };
        InputManager.prototype.addPointingInputs = function (name) {
            var mapping = new PointingInputMapping();
            var integratedPointing = new IntegratedPointingInputControl(mapping);
            this.pointingInputMappingSet.addMapping(name, mapping);
            return integratedPointing;
        };
        // Config JSON file support
        InputManager.prototype.setMappingFromConfig = function (configs) {
            for (var _i = 0, configs_1 = configs; _i < configs_1.length; _i++) {
                var config = configs_1[_i];
                var device = this.deciveDictionary[config.deviceName];
                for (var _a = 0, _b = config.mappings; _a < _b.length; _a++) {
                    var mapping = _b[_a];
                    var inputControlName = mapping[0];
                    var mappingName = mapping[1];
                    // Add the control to an existing mapping for the control type
                    if (this.buttonInputMappingSet.existsMapping(mappingName)) {
                        var buttonControl = device.getButtonControlByName(inputControlName);
                        if (buttonControl == null) {
                            throw ('setInputMappingFromConfig: cannot find control \"' + inputControlName + '\" in ' + config.deviceName + '.');
                        }
                        this.buttonInputMappingSet.addControl(mappingName, buttonControl);
                    }
                    else if (this.axisInputMapppingSet.existsMapping(mappingName)) {
                        var axisControl = device.getAxisControlByName(inputControlName);
                        if (axisControl == null) {
                            throw ('setInputMappingFromConfig: cannot find control \"' + inputControlName + '\" in ' + config.deviceName + '.');
                        }
                        this.axisInputMapppingSet.addControl(mappingName, axisControl);
                    }
                    else if (this.pointingInputMappingSet.existsMapping(mappingName)) {
                        var pointingControl = device.getPointingControlByName(inputControlName);
                        if (pointingControl == null) {
                            throw ('setInputMappingFromConfig: cannot find control \"' + inputControlName + '\" in ' + config.deviceName + '.');
                        }
                        this.pointingInputMappingSet.addControl(mappingName, pointingControl);
                    }
                    else {
                        throw ('setInputMappingFromConfig: cannot find map \"' + mappingName + '\".');
                    }
                }
            }
        };
        // Event and polling
        InputManager.prototype.setEvents = function (canvas) {
            for (var _i = 0, _a = this.decives; _i < _a.length; _i++) {
                var device = _a[_i];
                device.setEvents(canvas);
            }
        };
        InputManager.prototype.processPolling = function (time) {
            // Polling for each device
            for (var _i = 0, _a = this.decives; _i < _a.length; _i++) {
                var device = _a[_i];
                device.processPolling(time);
            }
            // Affect polling result
            this.buttonInputMappingSet.processSwitchingPrimaryControl();
            this.axisInputMapppingSet.processSwitchingPrimaryControl();
            this.pointingInputMappingSet.processSwitchingPrimaryControl();
        };
        InputManager.prototype.updateStates = function () {
            // Update for such as button releasing and double pressing
            for (var _i = 0, _a = this.decives; _i < _a.length; _i++) {
                var device = _a[_i];
                device.updateStates();
            }
        };
        return InputManager;
    }());
    PTWTipsInput.InputManager = InputManager;
})(PTWTipsInput || (PTWTipsInput = {}));
