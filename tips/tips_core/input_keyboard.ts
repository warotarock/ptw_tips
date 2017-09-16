
module Input {

    export class KeyboardDevice extends InputDeviceBase {

        dummyButton = new ButtonInputControl();

        setEvents(canvas: HTMLCanvasElement) {
        }

        processPolling(time: float) {

        }

        updateStates(time: float) {

        }

        getButtonControlByName(controlName: string): ButtonInputControl {

            return this.dummyButton;
        }
    }
}
