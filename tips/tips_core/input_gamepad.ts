
module Input {

    export class GamepadDevice extends InputDeviceBase {

        dummyButton = new ButtonInputControl();
        dummyAxis = new AxisInputControl();

        setEvents(canvas: HTMLCanvasElement) {
        }

        processPolling(time: float) {

        }

        updateStates(time: float) {

        }

        getButtonControlByName(controlName: string): ButtonInputControl {

            return this.dummyButton;
        }

        getAxisControlByName(controlName: string): AxisInputControl {

            return this.dummyAxis;
        }
    }
}
