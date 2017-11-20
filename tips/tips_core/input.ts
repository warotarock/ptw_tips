
module PTWTipsInput {

    // Control class

    export enum ButtonState {

        released = 0,
        justReleased = 1,
        justPressed = 2,
        pressed = 3
    }

    export class InputControl {

        isInputed = false;
        name: string = null;
    }

    export class ButtonInputControl extends InputControl {

        singlePressState = ButtonState.released;
        doublePressState = ButtonState.released;
        pressure = 0.0;

        lastPressedTime = 0.0;

        inputPress() {

            this.isInputed = true;
            this.pressure = 1.0;

            if (this.singlePressState == ButtonState.pressed || this.singlePressState == ButtonState.justPressed) {
                this.singlePressState = ButtonState.pressed;
            }
            else {
                this.singlePressState = ButtonState.justPressed;
            }
        }

        inputRelease() {

            this.isInputed = true;
            this.pressure = 0.0;

            if (this.singlePressState == ButtonState.released || this.singlePressState == ButtonState.justReleased) {
                this.singlePressState = ButtonState.released;
            }
            else {
                this.singlePressState = ButtonState.justReleased;
            }
        }

        protected getButtonPressNextState(currentState: ButtonState): int {

            let nextState = currentState;

            if (currentState == ButtonState.justPressed) {
                nextState = ButtonState.pressed;
            }
            else if (currentState == ButtonState.justReleased) {
                nextState = ButtonState.released;
            }

            return nextState;
        }

        processPollingDoublePress(time: long, doublePressMilliSecond: long) {

            if (this.singlePressState == ButtonState.justPressed) {

                if (time - this.lastPressedTime < doublePressMilliSecond) {
                    this.doublePressState = ButtonState.pressed;
                }

                this.lastPressedTime = time;
            }
        }

        updateStates() {

            this.singlePressState = this.getButtonPressNextState(this.singlePressState);

            this.doublePressState = ButtonState.released;

            this.isInputed = false;
        }

        isPressed(): boolean {

            return (this.singlePressState == ButtonState.pressed || this.singlePressState == ButtonState.justPressed);
        }

        isJustPressed(): boolean {

            return (this.singlePressState == ButtonState.justPressed);
        }

        isReleased(): boolean {

            return (this.singlePressState == ButtonState.released || this.singlePressState == ButtonState.justReleased);
        }

        isJustReleased(): boolean {

            return (this.singlePressState == ButtonState.justReleased);
        }

        isDoublePressed(): boolean {

            return (this.doublePressState == ButtonState.pressed);
        }

        copyTo(target: ButtonInputControl) {

            target.singlePressState = this.singlePressState;
            target.doublePressState = this.doublePressState;
            target.pressure = this.pressure;
            target.lastPressedTime = this.lastPressedTime;
            target.isInputed = this.isInputed;
        }
    }

    export class AxisInputControl extends InputControl {

        x = 0.0;
        y = 0.0;

        threshold = 0.005;

        inputAxis(x: float, y: float) {

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
        }
    }

    export class PointingInputControl extends InputControl {

        x = 0.0;
        y = 0.0;

        inputLocation(x: float, y: float) {

            this.isInputed = true;
            this.x = x;
            this.y = y;
        }
    }

    // Device interface

    export interface IInputDevice {

        initialize();
        setEvents(canvas: HTMLCanvasElement);
        processPolling(time: float);
        updateStates();
        getButtonControlByName(name: string): ButtonInputControl;
        getAxisControlByName(name: string): AxisInputControl;
        getPointingControlByName(name: string): PointingInputControl;
    }

    // Input mapping for multi-device integration

    class InputMapping<T extends InputControl> {

        controls = new List<T>();

        primaryControl: T = null;

        processSwitchingPrimaryControl() {

            for (let control of this.controls) {

                if (control.isInputed) {
                    this.primaryControl = control;
                    break;
                }
            }
        }

        add(control: T): InputMapping<T> {

            this.controls.push(control);

            return this;
        }
    }

    export class ButtonInputMapping extends InputMapping<ButtonInputControl> {
    }

    export class IntegratedButtonControl {

        private mapping: ButtonInputMapping;

        constructor(mapping: ButtonInputMapping) {

            this.mapping = mapping;
        }

        getState(): ButtonState {

            if (this.mapping.primaryControl == null) {
                return ButtonState.released;
            }

            return this.mapping.primaryControl.singlePressState;
        }

        getDoublePressState(): ButtonState {

            if (this.mapping.primaryControl == null) {
                return ButtonState.released;
            }

            return this.mapping.primaryControl.doublePressState;
        }

        isPressed(): boolean {

            if (this.mapping.primaryControl == null) {
                return false;
            }

            this.mapping.primaryControl.isPressed();
        }

        isJustPressed(): boolean {

            if (this.mapping.primaryControl == null) {
                return false;
            }

            this.mapping.primaryControl.isJustPressed();
        }

        isReleased(): boolean {

            if (this.mapping.primaryControl == null) {
                return false;
            }

            this.mapping.primaryControl.isReleased();
        }

        isJustReleased(): boolean {

            if (this.mapping.primaryControl == null) {
                return false;
            }

            this.mapping.primaryControl.isJustReleased();
        }

        isDoublePressed(): boolean {

            if (this.mapping.primaryControl == null) {
                return false;
            }

            return this.mapping.primaryControl.isDoublePressed();
        }
    }

    export class AxisInputMapping extends InputMapping<AxisInputControl> {
    }

    export class IntegratedAxisControl {

        private mapping: AxisInputMapping;

        constructor(mapping: AxisInputMapping) {

            this.mapping = mapping;
        }

        getAxis(vec: number[]) {

            if (this.mapping.primaryControl == null) {

                vec[0] = 0.0;
                vec[1] = 0.0;
                vec[2] = 0.0;
                return;
            }

            vec[0] = this.mapping.primaryControl.x;
            vec[1] = this.mapping.primaryControl.y;
            vec[2] = 0.0;
        }
    }

    export class PointingInputMapping extends InputMapping<PointingInputControl> {
    }

    class InputMappingSet<D extends InputControl, T extends InputMapping<D>> {

        private mappings = new List<T>();
        private mappingDictionary = new Dictionary<T>();

        processSwitchingPrimaryControl() {

            for (let mapping of this.mappings) {

                mapping.processSwitchingPrimaryControl();
            }
        }

        clear() {

            this.mappings = new List<T>();
            this.mappingDictionary = new Dictionary<T>();
        }

        addMapping(name: string, mapping: T) {

            this.mappings.push(mapping);
            this.mappingDictionary[name] = mapping;
        }

        existsMapping(name: string): boolean {

            return (DictionaryContainsKey(this.mappingDictionary, name));
        }

        addControl(name: string, control: D) {

            let mapping: T = this.mappingDictionary[name];

            mapping.add(control);
        }
    }

    export class IntegratedPointingInputControl {

        private mapping: PointingInputMapping;

        constructor(mapping: PointingInputMapping) {

            this.mapping = mapping;
        }

        getLocation(vec: number[]) {

            if (this.mapping.primaryControl == null) {

                vec[0] = 0.0;
                vec[1] = 0.0;
                vec[2] = 0.0;
                return;
            }

            vec[0] = this.mapping.primaryControl.x;
            vec[1] = this.mapping.primaryControl.y;
            vec[2] = 0.0;
        }
    }

    // Config JSON file support

    export interface DeviceInputMappingConfig {

        deviceName: string;
        mappings: List<List<string>>;
    }

    // Manager

    export class InputManager {

        private decives = new List<IInputDevice>();
        private deciveDictionary = new Dictionary<IInputDevice>();

        private buttonInputMappingSet = new InputMappingSet<ButtonInputControl, ButtonInputMapping>();

        private axisInputMapppingSet = new InputMappingSet<AxisInputControl, AxisInputMapping>();

        private pointingInputMappingSet = new InputMappingSet<PointingInputControl, PointingInputMapping>();

        // Device

        addDevice(name: string, device: IInputDevice) {

            this.decives.push(device);
            this.deciveDictionary[name] = device;

            device.initialize();
        }

        // Mapping

        clearButtons() {

            this.buttonInputMappingSet.clear();
        }

        addButton(name: string): IntegratedButtonControl {

            let mapping = new ButtonInputMapping(); 
            let integratedButton = new IntegratedButtonControl(mapping); 

            this.buttonInputMappingSet.addMapping(name, mapping);

            return integratedButton;
        }

        clearAxes() {

            this.axisInputMapppingSet.clear();
        }

        addAxis(name: string): IntegratedAxisControl {

            let mapping = new AxisInputMapping();
            let integratedAxis = new IntegratedAxisControl(mapping);

            this.axisInputMapppingSet.addMapping(name, mapping);

            return integratedAxis;
        }

        clearPointingInput() {

            this.pointingInputMappingSet.clear();
        }

        addPointingInput(name: string): IntegratedPointingInputControl {

            let mapping = new PointingInputMapping();
            let integratedPointing = new IntegratedPointingInputControl(mapping);

            this.pointingInputMappingSet.addMapping(name, mapping);

            return integratedPointing;
        }

        // Config JSON file support

        setMappingFromConfig(configs: List<DeviceInputMappingConfig>) {

            for (let config of configs) {

                let device: IInputDevice = this.deciveDictionary[config.deviceName];

                for (let mapping of config.mappings) {

                    let inputControlName = mapping[0];
                    let mappingName = mapping[1];

                    // Add the control to an existing mapping for the control type
                    if (this.buttonInputMappingSet.existsMapping(mappingName)) {

                        let buttonControl = device.getButtonControlByName(inputControlName);

                        if (buttonControl == null) {
                            throw ('setInputMappingFromConfig: cannot find control \"' + inputControlName + '\" in ' + config.deviceName + '.');
                        }

                        this.buttonInputMappingSet.addControl(mappingName, buttonControl);
                    }
                    else if (this.axisInputMapppingSet.existsMapping(mappingName)) {

                        let axisControl = device.getAxisControlByName(inputControlName);

                        if (axisControl == null) {
                            throw ('setInputMappingFromConfig: cannot find control \"' + inputControlName + '\" in ' + config.deviceName + '.');
                        }

                        this.axisInputMapppingSet.addControl(mappingName, axisControl);
                    }
                    else if (this.pointingInputMappingSet.existsMapping(mappingName)) {

                        let pointingControl = device.getPointingControlByName(inputControlName);

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
        }

        // Event and polling

        setEvents(canvas: HTMLCanvasElement) {

            for (let device of this.decives) {

                device.setEvents(canvas);
            }
        }

        processPolling(time: float) {

            // Polling for each device
            for (let device of this.decives) {

                device.processPolling(time);
            }


            // Affect polling result
            this.buttonInputMappingSet.processSwitchingPrimaryControl();

            this.axisInputMapppingSet.processSwitchingPrimaryControl();

            this.pointingInputMappingSet.processSwitchingPrimaryControl();
        }

        updateStates() {

            // Update for such as button releasing and double pressing
            for (let device of this.decives) {

                device.updateStates();
            }
        }
    }
}
