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
    var MouseDevice = (function (_super) {
        __extends(MouseDevice, _super);
        function MouseDevice() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.leftButton = new Input.ButtonInputControl();
            _this.middleButton = new Input.ButtonInputControl();
            _this.rightButton = new Input.ButtonInputControl();
            _this.mousePoint = new Input.PointingInputControl();
            _this.wheelAxis = new Input.AxisInputControl();
            _this.initialWidth = 0.0;
            _this.initialHeight = 0.0;
            _this.doublePressMilliSecond = 200;
            return _this;
        }
        MouseDevice.prototype.setEvents = function (canvas) {
            var _this = this;
            this.initialWidth = canvas.clientWidth;
            this.initialHeight = canvas.clientHeight;
            var onMouseMove = function (e) {
                _this.inputMouseLocation(_this.mousePoint, e);
            };
            var onMouseDown = function (e) {
                if (e.button == 0) {
                    _this.leftButton.inputPressed();
                }
                else if (e.button == 1) {
                    _this.middleButton.inputPressed();
                }
                else if (e.button == 2) {
                    _this.rightButton.inputPressed();
                }
                _this.inputMouseLocation(_this.mousePoint, e);
                return _this.preventDefaultEvent(e);
            };
            var onMouseUp = function (e) {
                if (e.button == 0) {
                    _this.leftButton.inputReleased();
                }
                else if (e.button == 1) {
                    _this.middleButton.inputReleased();
                }
                else if (e.button == 2) {
                    _this.rightButton.inputReleased();
                }
                _this.inputMouseLocation(_this.mousePoint, e);
                return _this.preventDefaultEvent(e);
            };
            var onMouseWheel = function (e) {
                var delta = 0;
                if (!e) {
                    e = window.event;
                }
                ; // IE
                if (e.wheelDelta) {
                    delta = e.wheelDelta / 120;
                }
                else if (e.detail) {
                    delta = -e.detail / 3;
                }
                _this.wheelAxis.inputAxis(0.0, delta);
                return _this.preventDefaultEvent(e);
            };
            var onTouchStart = function (e) {
                _this.leftButton.inputReleased();
                _this.inputMouseLocation(_this.mousePoint, e);
                return _this.preventDefaultEvent(e);
            };
            var onTouchEnd = function (e) {
                _this.leftButton.inputReleased();
                _this.inputMouseLocation(_this.mousePoint, e);
                return _this.preventDefaultEvent(e);
            };
            var ontTouchMove = function (e) {
                _this.inputMouseLocation(_this.mousePoint, e);
                return _this.preventDefaultEvent(e);
            };
            canvas.addEventListener("mousemove", onMouseMove);
            canvas.addEventListener("mousedown", onMouseDown);
            canvas.addEventListener("mouseup", onMouseUp);
            canvas.addEventListener("mousewheel", onMouseWheel);
            canvas.addEventListener("touchstart", onTouchStart);
            canvas.addEventListener("touchend", onTouchEnd);
            canvas.addEventListener("touchmove", ontTouchMove);
            canvas.addEventListener('contextmenu', this.preventDefaultEvent);
        };
        MouseDevice.prototype.inputMouseLocation = function (control, e) {
            var scale = (this.initialWidth / e.target.clientWidth);
            control.inputLocation((e.pageX - e.target.offsetLeft) * scale, (e.pageY - e.target.offsetTop) * scale);
        };
        MouseDevice.prototype.preventDefaultEvent = function (e) {
            if (e.preventDefault) {
                e.preventDefault();
            }
            else if (e.returnValue) {
                e.returnValue = false;
            }
            return false;
        };
        MouseDevice.prototype.processPolling = function (time) {
            this.leftButton.processPollingDoublePress(time, this.doublePressMilliSecond);
            this.middleButton.processPollingDoublePress(time, this.doublePressMilliSecond);
            this.rightButton.processPollingDoublePress(time, this.doublePressMilliSecond);
        };
        MouseDevice.prototype.updateStates = function (time) {
            this.leftButton.updateStates(time);
            this.middleButton.updateStates(time);
            this.rightButton.updateStates(time);
            this.wheelAxis.y = 0.0;
        };
        MouseDevice.prototype.getButtonControlByName = function (name) {
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
        };
        MouseDevice.prototype.getAxisControlByName = function (name) {
            if (name == 'wheel') {
                return this.wheelAxis;
            }
            return null;
        };
        MouseDevice.prototype.getPointingControlByName = function (name) {
            if (name == 'location') {
                return this.mousePoint;
            }
            return null;
        };
        return MouseDevice;
    }(Input.InputDeviceBase));
    Input.MouseDevice = MouseDevice;
})(Input || (Input = {}));
