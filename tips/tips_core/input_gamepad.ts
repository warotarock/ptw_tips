﻿
module PTWTipsInput {

    interface HTMLGamepadButton {
        pressed: boolean;
    }

    interface HTMLGamepad {
        buttons: List<HTMLGamepadButton>;
        axes: List<float>;
        mapping: string;
    }

    class StickIndexMapping {

        xIndex = 0;
        yIndex = 0;
    }

    class GamepadDeviceLayout {

        buttonMappings: List<int> = null;

        axesMappings: List<int> = null;

        StickIndexMappings: List<StickIndexMapping> = null;

        initialize() {

            // Override method
        }

        protected getMappingTypeForEnvironment(): int {

            let userAgent = window.navigator.userAgent.toLowerCase();

            let browerType = 0;

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
        }

        isMatch(mappingName: string): boolean {

            // Override method

            return false;
        }

        processPollingCrossButton(crossButtons: List<ButtonInputControl>, buttons: List<ButtonInputControl>, gamepad: HTMLGamepad, time: float, doublePressMilliSecond: float) {

            // Override method
        }
    }

    class W3CStandardGamepadLayout extends GamepadDeviceLayout {

        initialize() {

            // Detect gamepad environment
            let mappingType = this.getMappingTypeForEnvironment();

            // Set mappings
            this.buttonMappings = [
                0,  // A
                1,  // B
                2,  // X
                3,  // Y
                4,  // L1
                5,  // R1
                6,  // L2
                7,  // R2
                8,  // Select/Back
                9,  // Start/Forward
                10, // Left stick button
                11, // Right stick button
                12, // POV Up
                13, // POV Down
                14, // POV Left
                15, // POV Right
                16, // Home
            ];

            this.axesMappings = [
                0, // stick1 x
                1, // stick1 y
                2, // stick2 x
                3  // stick2 y
            ];

            this.StickIndexMappings = [
                { xIndex: 0, yIndex: 1 },
                { xIndex: 2, yIndex: 3 }
            ];
        }

        isMatch(mappingName: string) {

            return StringContains(mappingName, 'standard');
        }

        processPollingCrossButton(crossButtons: List<ButtonInputControl>, buttons: List<ButtonInputControl>, gamepad: HTMLGamepad, time: float, doublePressMilliSecond: float) {

            // Up
            buttons[12].copyTo(crossButtons[0]);

            // Right
            buttons[15].copyTo(crossButtons[1]);

            // Down
            buttons[13].copyTo(crossButtons[2]);

            // Left
            buttons[14].copyTo(crossButtons[3]);
        }
    }

    class GenericGamepadLayout extends GamepadDeviceLayout {

        initialize() {

            // Detect gamepad environment
            let mappingType = this.getMappingTypeForEnvironment();

            // Set mappings
            this.buttonMappings = [
                2,  // A
                3,  // B
                0,  // X
                1,  // Y
                4,  // L1
                5,  // R1
                6,  // L2
                7,  // R2
                8,  // Select/Back
                9,  // Start/Forward
                10, // Left stick button
                11, // Right stick button
            ];

            if (mappingType == 0) {

                this.axesMappings = [
                    0, // stick1 x
                    1, // stick1 y
                    2, // stick2 x
                    5, // stick2 y
                    9  // pov
                ];
            }
            else {

                this.axesMappings = [
                    0, // stick1 x
                    1, // stick1 y
                    2, // stick2 x
                    3, // stick2 y
                    9  // pov
                ];
            }

            this.StickIndexMappings = [
                { xIndex: 0, yIndex: 1 },
                { xIndex: 2, yIndex: 3 }
            ];
        }

        isMatch(mappingName: string) {

            return (StringIsNullOrEmpty(mappingName) || !StringContains(mappingName, 'standard'));
        }

        processPollingCrossButton(crossButtons: List<ButtonInputControl>, buttons: List<ButtonInputControl>, gamepad: HTMLGamepad, time: float, doublePressMilliSecond: float) {

            let povAxisIndex = this.axesMappings[4];

            if (povAxisIndex >= gamepad.axes.length) {
                return;
            }

            // Get direction from pov
            let verticalPressedIndex = -1;
            let horizontalPressedIndex = -1;

            let axisValue = gamepad.axes[povAxisIndex];

            if (axisValue >= -1.0 && axisValue <= 1.0) {

                // POV value takes -1.0 when angle is PI * 0.5) , and takes 1.0 when angle is PI * 0.75
                let angle = (1.625 - (axisValue * 0.875));
                if (angle >= 2.0) {
                    angle -= 2.0;
                }

                let limitAngle = 0.3;

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

            for (let i = 0; i < crossButtons.length; i++) {
                let button = crossButtons[i];

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
        }
    }

    export class GamepadDevice implements IInputDevice {

        maxButtonCount = 16;
        maxAxisCount = 2;
        doublePressMilliSecond = 200;

        buttons = new List<ButtonInputControl>();
        sticks = new List<AxisInputControl>();
        crossButtons = new List<ButtonInputControl>();

        crossButtonEmulationEnabled = false;

        private standardGamepadLayout = new W3CStandardGamepadLayout();
        private genericGamepadLayout = new GenericGamepadLayout();
        private currentDeviceLayout: GamepadDeviceLayout = null;

        private connected = false;
        private gamepad: HTMLGamepad = null;

        initialize() {

            this.connected = false;

            this.buttons = new List<ButtonInputControl>(this.maxButtonCount);
            for (let i = 0; i < this.buttons.length; i++) {

                this.buttons[i] = new ButtonInputControl();
                this.buttons[i].name = ('button' + (1 + i));
            }

            this.sticks = new List<AxisInputControl>(this.maxAxisCount);
            for (let i = 0; i < this.sticks.length; i++) {

                this.sticks[i] = new AxisInputControl();
                this.sticks[i].name = ('stick' + (1 + i));
            }

            this.crossButtons = new List<ButtonInputControl>(4);
            for (let i = 0; i < this.crossButtons.length; i++) {

                this.crossButtons[i] = new ButtonInputControl();
                this.crossButtons[i].name = ('crossButton' + (1 + i));
            }

            this.standardGamepadLayout.initialize();
            this.genericGamepadLayout.initialize();
        }

        setEvents(canvas: HTMLCanvasElement) {

            let gamepadconnected = (e) => {

                this.gamepadconnected(e);
            };

            let gamepaddisconnected = (e) => {

                this.gamepaddisconnected(e);
            };

            window.addEventListener('gamepadconnected', gamepadconnected);
            window.addEventListener('gamepaddisconnected', gamepaddisconnected);
        }

        private gamepadconnected(e: any) {

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
        }

        private gamepaddisconnected(e: any) {

            this.gamepad = null;
        }

        processPolling(time: float) {

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
        }

        private processPollingButtons(time: float) {

            let gamepad = this.gamepad;

            for (let i = 0; i < this.buttons.length; i++) {

                let button = this.buttons[i];

                if (i >= this.currentDeviceLayout.buttonMappings.length) {
                    break;
                }

                let mappedIndex = this.currentDeviceLayout.buttonMappings[i];

                if (mappedIndex >= gamepad.buttons.length) {
                    continue;
                }

                let gamepadButton = gamepad.buttons[mappedIndex];

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
        }

        private processPollingAxes() {

            let gamepad = this.gamepad;

            for (let i = 0; i < this.sticks.length; i++) {

                let axis = this.sticks[i];

                if (i >= this.currentDeviceLayout.StickIndexMappings.length) {
                    break;
                }

                let mapping = this.currentDeviceLayout.StickIndexMappings[i];

                if (mapping.xIndex >= gamepad.axes.length || mapping.yIndex >= gamepad.axes.length) {
                    continue;
                }

                let mappedIndexX = this.currentDeviceLayout.axesMappings[mapping.xIndex];
                let mappedIndexY = this.currentDeviceLayout.axesMappings[mapping.yIndex];

                if (mappedIndexX >= gamepad.axes.length || mappedIndexY >= gamepad.axes.length) {
                    continue;
                }

                let gamepadAxisValueX = 0.0;
                let gamepadAxisValueY = 0.0;

                if (mapping.xIndex < gamepad.axes.length) {

                    gamepadAxisValueX = gamepad.axes[mappedIndexX];
                }

                if (mapping.yIndex < gamepad.axes.length) {

                    gamepadAxisValueY = gamepad.axes[mappedIndexY];
                }

                axis.inputAxis(gamepadAxisValueX, gamepadAxisValueY);
            }
        }

        private processPollingCrossButton(time: float) {

            this.currentDeviceLayout.processPollingCrossButton(this.crossButtons, this.buttons, this.gamepad, time, this.doublePressMilliSecond);
        }

        private processCrossButtonEmulation(time: float) {

            // If any cross button is inputed, cancel emulation
            for (let button of this.crossButtons) {

                if (button.isInputed) {
                    return;
                }
            }

            let axis = this.sticks[0];
            let axis_threshold = 0.3

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

            for (let button of this.crossButtons) {

                button.processPollingDoublePress(time, this.doublePressMilliSecond);
            }
        }

        updateStates() {

            for (let button of this.buttons) {

                button.updateStates();
            }

            for (let button of this.crossButtons) {

                button.updateStates();
            }
        }

        getButtonControlByName(name: string): ButtonInputControl {

            for (let button of this.buttons) {

                if (button.name == name) {
                    return button;
                }
            }

            for (let button of this.crossButtons) {

                if (button.name == name) {
                    return button;
                }
            }

            return null;
        }

        getAxisControlByName(name: string): AxisInputControl {

            for (let axis of this.sticks) {

                if (axis.name == name) {
                    return axis;
                }
            }

            return null;
        }

        getPointingControlByName(name: string): PointingInputControl {

            return null;
        }

        private checkGamepads(): boolean {

            if ('getGamepads' in navigator) {

                let gamepads: List<HTMLGamepad> = navigator.getGamepads();

                for (let i = 0; i < gamepads.length; i++) {

                    if (gamepads[i]) {
                        return true;
                    }
                }
            }
        }

        private getFirstGamepad(): HTMLGamepad {

            let gamepads: List<HTMLGamepad> = navigator.getGamepads();

            for (let i = 0; i < gamepads.length; i++) {

                if (gamepads[i]) {

                    return gamepads[i]
                }
            }

            return null;
        }

        private pollingForChrome() {

            this.gamepad = this.getFirstGamepad();
        }

        private isGamepadButtonPressed(button: HTMLGamepadButton): boolean {

            if (typeof (button) == 'object') {

                return button.pressed;
            }

            return (<any>button == 1.0);
        }
    }
}
