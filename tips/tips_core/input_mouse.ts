
module PTWTipsInput {

    interface HTMLEvent {
        preventDefault();
        returnValue: boolean;
    }

    interface HTMLEventTarget {
        offsetLeft: float;
        offsetTop: float;
        clientWidth: float;
        clientHeight: float;
    }

    interface HTMLMouseEvent extends HTMLEvent {
        target: HTMLEventTarget;
        pageX: float;
        pageY: float;
    }

    interface HTMLTouchEventTouch {
        identifier: int;
        pageX: float;
        pageY: float;
    }

    interface HTMLTouchEvent {
        touches: List<HTMLTouchEventTouch>;
        target: HTMLEventTarget;
    }

    export class MouseDevice implements IInputDevice {

        maxButtonCount = 16;
        maxAxisCount = 1;

        buttons = new List<ButtonInputControl>();
        wheel = new AxisInputControl();
        location = new PointingInputControl();

        initialWidth = 0.0;
        initialHeight = 0.0;

        doublePressMilliSecond = 200;

        initialize() {

            this.buttons = new List<ButtonInputControl>(this.maxButtonCount);

            for (let i = 0; i < this.buttons.length; i++) {

                this.buttons[i] = new ButtonInputControl();
                this.buttons[i].name = ('button' + (1 + i));
            }

            this.wheel.name = 'wheel';

            this.location.name = 'location';
        }

        setEvents(canvas: HTMLCanvasElement) {

            this.initialWidth = canvas.clientWidth;
            this.initialHeight = canvas.clientHeight;

            let onMouseMove = (e) => {

                this.inputMouseLocation(this.location, e);
            };

            let onMouseDown = (e) => {

                this.buttons[e.button].inputPress();

                this.inputMouseLocation(this.location, e);

                return this.preventDefaultEvent(e);
            };

            let onMouseUp = (e) => {

                this.buttons[e.button].inputRelease();

                this.inputMouseLocation(this.location, e);

                return this.preventDefaultEvent(e);
            };

            let onMouseWheel = (e) => {

                let delta = 0;

                if (!e) {
                    e = window.event // IE
                };

                if (e.wheelDelta) {
                    delta = -e.wheelDelta / 120;
                }
                else if (e.deltaY) {
                    delta = e.deltaY / 3;
                }
                else if (e.detail) { // Firefox
                    delta = e.detail / 3;
                }

                this.wheel.inputAxis(0.0, delta);

                return this.preventDefaultEvent(e);
            };

            let onTouchStart = (e) => {

                this.buttons[0].inputRelease();

                this.inputMouseLocation(this.location, e);

                return this.preventDefaultEvent(e);
            };

            let onTouchEnd = (e) => {

                this.buttons[0].inputRelease();

                this.inputMouseLocation(this.location, e);

                return this.preventDefaultEvent(e);
            };

            let ontTouchMove = (e) => {

                this.inputMouseLocation(this.location, e);

                return this.preventDefaultEvent(e);
            };

            canvas.addEventListener('mousemove', onMouseMove);
            canvas.addEventListener('mousedown', onMouseDown);
            canvas.addEventListener('mouseup', onMouseUp);
            canvas.addEventListener('wheel', onMouseWheel);
            canvas.addEventListener('touchstart', onTouchStart);
            canvas.addEventListener('touchend', onTouchEnd);
            canvas.addEventListener('touchmove', ontTouchMove);
            canvas.addEventListener('contextmenu', this.preventDefaultEvent);
        }

        private inputMouseLocation(control: PointingInputControl, e: HTMLMouseEvent) {

            let scale = (this.initialWidth / e.target.clientWidth);

            control.inputLocation(
                (e.pageX - e.target.offsetLeft) * scale
                ,(e.pageY - e.target.offsetTop) * scale
            );
        }

        private preventDefaultEvent(e: HTMLEvent): boolean {

            if (e.preventDefault) {
                e.preventDefault();
            }
            else if (e.returnValue) {
                e.returnValue = false;
            }

            return false;
        }

        processPolling(time: float) {

            for (let i = 0; i < this.buttons.length; i++) {
                let button = this.buttons[i];

                button.processPollingDoublePress(time, this.doublePressMilliSecond);
            }
        }

        updateStates() {

            for (let i = 0; i < this.buttons.length; i++) {
                let button = this.buttons[i];

                button.updateStates();
            }

            this.wheel.y = 0.0;
        }

        getButtonControlByName(name: string): ButtonInputControl {

            for (let i = 0; i < this.buttons.length; i++) {
                let button = this.buttons[i];

                if (button.name == name) {
                    return button;
                }
            }

            return null;
        }

        getAxisControlByName(name: string): AxisInputControl {

            if (name == this.wheel.name) {
                return this.wheel;
            }

            return null;
        }

        getPointingControlByName(name: string): PointingInputControl {

            if (name == this.location.name) {
                return this.location;
            }

            return null;
        }
    }
}
