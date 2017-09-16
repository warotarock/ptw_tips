
module Input {

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

    export class MouseDevice extends InputDeviceBase {

        leftButton = new ButtonInputControl();
        middleButton = new ButtonInputControl();
        rightButton = new ButtonInputControl();

        mousePoint = new PointingInputControl();
        wheelAxis = new AxisInputControl();

        initialWidth = 0.0;
        initialHeight = 0.0;

        doublePressMilliSecond = 200;

        setEvents(canvas: HTMLCanvasElement) {

            this.initialWidth = canvas.clientWidth;
            this.initialHeight = canvas.clientHeight;

            var onMouseMove = (e) => {

                this.inputMouseLocation(this.mousePoint, e);
            };

            var onMouseDown = (e) => {

                if (e.button == 0) {
                    this.leftButton.inputPressed();
                }
                else if (e.button == 1) {
                    this.middleButton.inputPressed();
                }
                else if (e.button == 2) {
                    this.rightButton.inputPressed();
                }

                this.inputMouseLocation(this.mousePoint, e);

                return this.preventDefaultEvent(e);
            };

            var onMouseUp = (e) => {

                if (e.button == 0) {
                    this.leftButton.inputReleased();
                }
                else if (e.button == 1) {
                    this.middleButton.inputReleased();
                }
                else if (e.button == 2) {
                    this.rightButton.inputReleased();
                }

                this.inputMouseLocation(this.mousePoint, e);

                return this.preventDefaultEvent(e);
            };

            var onMouseWheel = (e) => {

                var delta = 0;
                if (!e) { e = window.event }; // IE

                if (e.wheelDelta) {
                    delta = e.wheelDelta / 120;
                }
                else if (e.detail) { // Firefox
                    delta = -e.detail / 3;
                }

                this.wheelAxis.inputAxis(0.0, delta);

                return this.preventDefaultEvent(e);
            };

            var onTouchStart = (e) => {

                this.leftButton.inputReleased();

                this.inputMouseLocation(this.mousePoint, e);

                return this.preventDefaultEvent(e);
            };

            var onTouchEnd = (e) => {

                this.leftButton.inputReleased();

                this.inputMouseLocation(this.mousePoint, e);

                return this.preventDefaultEvent(e);
            };

            var ontTouchMove = (e) => {

                this.inputMouseLocation(this.mousePoint, e);

                return this.preventDefaultEvent(e);
            };

            canvas.addEventListener("mousemove", onMouseMove);
            canvas.addEventListener("mousedown", onMouseDown);
            canvas.addEventListener("mouseup", onMouseUp);
            canvas.addEventListener("mousewheel", onMouseWheel);
            canvas.addEventListener("touchstart", onTouchStart);
            canvas.addEventListener("touchend", onTouchEnd);
            canvas.addEventListener("touchmove", ontTouchMove);
            canvas.addEventListener('contextmenu', this.preventDefaultEvent);
        }

        private inputMouseLocation(control: PointingInputControl, e: HTMLMouseEvent) {

            var scale = (this.initialWidth / e.target.clientWidth);

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

            this.leftButton.processPollingDoublePress(time, this.doublePressMilliSecond);
            this.middleButton.processPollingDoublePress(time, this.doublePressMilliSecond);
            this.rightButton.processPollingDoublePress(time, this.doublePressMilliSecond);
        }

        updateStates(time: float) {

            this.leftButton.updateStates(time);
            this.middleButton.updateStates(time);
            this.rightButton.updateStates(time);

            this.wheelAxis.y = 0.0;
        }

        getButtonControlByName(name: string): ButtonInputControl {

            if (name == 'left') {
                return this.leftButton;
            }

            if (name == 'middle') {
                return this.middleButton;
            }

            if (name == 'right') {
                return this.rightButton;
            }

            return null;
        }

        getAxisControlByName(name: string): AxisInputControl {

            if (name == 'wheel') {
                return this.wheelAxis;
            }

            return null;
        }

        getPointingControlByName(name: string): PointingInputControl {

            if (name == 'location') {
                return this.mousePoint;
            }

            return null;
        }
    }
}
