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
var Input;
(function (Input) {
    // Control class
    var ButtonState;
    (function (ButtonState) {
        ButtonState[ButtonState["released"] = 0] = "released";
        ButtonState[ButtonState["justReleased"] = 1] = "justReleased";
        ButtonState[ButtonState["justPressed"] = 2] = "justPressed";
        ButtonState[ButtonState["pressed"] = 3] = "pressed";
    })(ButtonState = Input.ButtonState || (Input.ButtonState = {}));
    var InputControl = (function () {
        function InputControl() {
            this.isInputed = false;
            this.name = null;
        }
        return InputControl;
    }());
    Input.InputControl = InputControl;
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
        ButtonInputControl.prototype.inputPressed = function () {
            this.isInputed = true;
            this.pressure = 1.0;
            if (this.singlePressState == ButtonState.pressed || this.singlePressState == ButtonState.justPressed) {
                this.singlePressState = ButtonState.pressed;
            }
            else {
                this.singlePressState = ButtonState.justPressed;
            }
        };
        ButtonInputControl.prototype.inputReleased = function () {
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
        return ButtonInputControl;
    }(InputControl));
    Input.ButtonInputControl = ButtonInputControl;
    var AxisInputControl = (function (_super) {
        __extends(AxisInputControl, _super);
        function AxisInputControl() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.x = 0.0;
            _this.y = 0.0;
            return _this;
        }
        AxisInputControl.prototype.inputAxis = function (x, y) {
            this.isInputed = true;
            this.x = x;
            this.y = y;
        };
        return AxisInputControl;
    }(InputControl));
    Input.AxisInputControl = AxisInputControl;
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
    Input.PointingInputControl = PointingInputControl;
    //export class InputDeviceBase implements IInputDevice {
    //    initialize() {
    //        // override method
    //    }
    //    setEvents(canvas: HTMLCanvasElement) {
    //        // override method
    //    }
    //    processPolling(time: float) {
    //        // override method
    //    }
    //    updateStates(time: float) {
    //        // override method
    //    }
    //    getButtonControlByName(name: string): ButtonInputControl {
    //        // override method
    //        return null;
    //    }
    //    getAxisControlByName(name: string): AxisInputControl {
    //        // override method
    //        return null;
    //    }
    //    getPointingControlByName(name: string): PointingInputControl {
    //        // override method
    //        return null;
    //    }
    //}
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
    Input.ButtonInputMapping = ButtonInputMapping;
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
    Input.IntegratedButtonControl = IntegratedButtonControl;
    var AxisInputMapping = (function (_super) {
        __extends(AxisInputMapping, _super);
        function AxisInputMapping() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return AxisInputMapping;
    }(InputMapping));
    Input.AxisInputMapping = AxisInputMapping;
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
    Input.IntegratedAxisControl = IntegratedAxisControl;
    var PointingInputMapping = (function (_super) {
        __extends(PointingInputMapping, _super);
        function PointingInputMapping() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return PointingInputMapping;
    }(InputMapping));
    Input.PointingInputMapping = PointingInputMapping;
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
    Input.IntegratedPointingInputControl = IntegratedPointingInputControl;
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
        InputManager.prototype.setMappingFromConfig = function (devieMappingConfigs) {
            for (var deviceName in devieMappingConfigs) {
                var device = this.deciveDictionary[deviceName];
                var devieMappingConfig = devieMappingConfigs[deviceName];
                for (var deviceInputName in devieMappingConfig) {
                    var inputMapName = devieMappingConfig[deviceInputName];
                    // Add the control to an existing mapping for the control type
                    if (this.buttonInputMappingSet.existsMapping(inputMapName)) {
                        var buttonControl = device.getButtonControlByName(deviceInputName);
                        if (buttonControl == null) {
                            throw ('setInputMappingFromConfig: cannot find control \"' + deviceInputName + '\" in ' + deviceInputName + '.');
                        }
                        this.buttonInputMappingSet.addControl(inputMapName, buttonControl);
                    }
                    else if (this.axisInputMapppingSet.existsMapping(inputMapName)) {
                        var axisControl = device.getAxisControlByName(deviceInputName);
                        if (axisControl == null) {
                            throw ('setInputMappingFromConfig: cannot find control \"' + deviceInputName + '\" in ' + deviceInputName + '.');
                        }
                        this.axisInputMapppingSet.addControl(inputMapName, axisControl);
                    }
                    else if (this.pointingInputMappingSet.existsMapping(inputMapName)) {
                        var pointingControl = device.getPointingControlByName(deviceInputName);
                        if (pointingControl == null) {
                            throw ('setInputMappingFromConfig: cannot find control \"' + deviceInputName + '\" in ' + deviceInputName + '.');
                        }
                        this.pointingInputMappingSet.addControl(inputMapName, pointingControl);
                    }
                    else {
                        throw ('setInputMappingFromConfig: cannot find map \"' + inputMapName + '\".');
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
    Input.InputManager = InputManager;
})(Input || (Input = {}));
