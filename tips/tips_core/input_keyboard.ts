
module PTWTipsInput {

    export class KeyboardDevice implements IInputDevice {

        buttons: Dictionary<ButtonInputControl> = null;

        maxButtonCount = 256;
        doublePressMilliSecond = 200;

        initialize() {

            this.buttons = new List<ButtonInputControl>(this.maxButtonCount);
        }

        setEvents(canvas: HTMLCanvasElement) {
            
            var keydown = (e: KeyboardEvent) => {
            
                //console.log('keydown ' + e.key + ' ' + e.keyCode);

                this.prepareButtonControlForKey(e.key);

                let button: ButtonInputControl = this.buttons[e.key];

                button.inputPress();
            };

            var keyup = (e: KeyboardEvent) => {

                //console.log('keyup ' + e.key + ' ' + e.keyCode);

                this.prepareButtonControlForKey(e.key);

                let button: ButtonInputControl = this.buttons[e.key];

                button.inputRelease();
            };

            document.addEventListener('keydown', keydown, false);
            document.addEventListener('keyup', keyup, false);
        }

        prepareButtonControlForKey(name: string) {

            if (DictionaryContainsKey(this.buttons, name)) {
                return;
            }

            var button = new ButtonInputControl();
            button.name = name;

            this.buttons[name] = button;
        }

        processPolling(time: float) {

            for (let buttonName in this.buttons) {
                var button: ButtonInputControl = this.buttons[buttonName];

                button.processPollingDoublePress(time, this.doublePressMilliSecond);
            }
        }

        updateStates() {

            for (let buttonName in this.buttons) {
                var button: ButtonInputControl = this.buttons[buttonName];

                button.updateStates();
            }
        }

        getButtonControlByName(name: string): ButtonInputControl {

            this.prepareButtonControlForKey(name);

            return this.buttons[name];
        }

        getAxisControlByName(name: string): AxisInputControl {

            return null;
        }

        getPointingControlByName(name: string): PointingInputControl {

            return null;
        }
    }
}
