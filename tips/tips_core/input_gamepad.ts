
module Input {

    interface HTMLGamepadButton {
        pressed: boolean;
    }

    interface HTMLGamepad {
        buttons: List<HTMLGamepadButton>;
        axes: List<float>;
    }

    class AxisMapping {

        xIndex = 0;
        yIndex = 0;
    }

    export class GamepadDevice implements IInputDevice {

        maxButtonCount = 16;
        maxAxisCount = 2;
        doublePressMilliSecond = 200;

        buttons = new List<ButtonInputControl>();
        sticks = new List<AxisInputControl>();

        private connected = false;
        private gamepad: HTMLGamepad = null;
        private axisIndexMappings: List<AxisMapping> = null;

        initialize() {

            this.connected = false;
            this.buttons = new List<ButtonInputControl>(this.maxButtonCount);

            for (var i = 0; i < this.buttons.length; i++) {

                this.buttons[i] = new ButtonInputControl();
                this.buttons[i].name = ('button' + (1 + i));
            }

            this.sticks = new List<AxisInputControl>(this.maxAxisCount);

            for (var i = 0; i < this.sticks.length; i++) {

                this.sticks[i] = new AxisInputControl();
                this.sticks[i].name = ('stick' + (1 + i));
            }

            this.initializeAxesIndexMap();
        }

        private initializeAxesIndexMap() {

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
        }

        setEvents(canvas: HTMLCanvasElement) {

            var gamepadconnected = (e) => {
                if (this.checkGamepads()) {
                    this.gamepad = this.getFirstGamepad();

                    if (this.gamepad != null) {
                        this.connected = true;
                    }
                }
            };

            var gamepaddisconnected = (e) => {
                this.gamepad = null;
            };

            window.addEventListener('gamepadconnected', gamepadconnected);
            window.addEventListener('gamepaddisconnected', gamepaddisconnected);
        }

        processPolling(time: float) {

            if (this.connected == false) {
                return;
            }

            this.pollingForChrome();

            if (this.gamepad == null) {
                return;
            }

            let gamepad = this.gamepad;

            for (var i = 0; i < this.buttons.length && i < gamepad.buttons.length; i++) {

                var button = this.buttons[i];
                var gamepadButton = gamepad.buttons[i];

                if (this.isGamepadButtonPressed(gamepadButton)) {

                    if (!button.isPressed()) {
                        button.inputPressed();
                    }
                }
                else {

                    if (!button.isReleased()) {
                        button.inputReleased();
                    }
                }

                button.processPollingDoublePress(time, this.doublePressMilliSecond);
            }

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

        }

        updateStates() {

            for (var i = 0; i < this.buttons.length; i++) {
                var button = this.buttons[i];

                button.updateStates();
            }
        }

        getButtonControlByName(name: string): ButtonInputControl {

            for (var i = 0; i < this.buttons.length; i++) {
                var button = this.buttons[i];

                if (button.name == name) {
                    return button;
                }
            }

            return null;
        }

        getAxisControlByName(name: string): AxisInputControl {

            for (var i = 0; i < this.sticks.length; i++) {
                var axis = this.sticks[i];

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
                var gamepads: List<HTMLGamepad> = navigator.getGamepads();

                for (var i = 0; i < gamepads.length; i++) {
                    if (gamepads[i]) {
                        return true;
                    }
                }
            }
        }

        private getFirstGamepad(): HTMLGamepad {

            var gamepads: List<HTMLGamepad> = navigator.getGamepads();

            for (var i = 0; i < gamepads.length; i++) {
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
