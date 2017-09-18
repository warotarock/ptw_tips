var Input;
(function (Input) {
    var MouseDevice = (function () {
        function MouseDevice() {
            this.maxButtonCount = 16;
            this.maxAxisCount = 1;
            this.buttons = new List();
            this.wheel = new Input.AxisInputControl();
            this.location = new Input.PointingInputControl();
            this.initialWidth = 0.0;
            this.initialHeight = 0.0;
            this.doublePressMilliSecond = 200;
        }
        MouseDevice.prototype.initialize = function () {
            this.buttons = new List(this.maxButtonCount);
            for (var i = 0; i < this.buttons.length; i++) {
                this.buttons[i] = new Input.ButtonInputControl();
                this.buttons[i].name = ('button' + (1 + i));
            }
            this.wheel.name = 'wheel';
            this.location.name = 'location';
        };
        MouseDevice.prototype.setEvents = function (canvas) {
            var _this = this;
            this.initialWidth = canvas.clientWidth;
            this.initialHeight = canvas.clientHeight;
            var onMouseMove = function (e) {
                _this.inputMouseLocation(_this.location, e);
            };
            var onMouseDown = function (e) {
                _this.buttons[e.button].inputPress();
                _this.inputMouseLocation(_this.location, e);
                return _this.preventDefaultEvent(e);
            };
            var onMouseUp = function (e) {
                _this.buttons[e.button].inputRelease();
                _this.inputMouseLocation(_this.location, e);
                return _this.preventDefaultEvent(e);
            };
            var onMouseWheel = function (e) {
                var delta = 0;
                if (!e) {
                    e = window.event; // IE
                }
                ;
                if (e.wheelDelta) {
                    delta = -e.wheelDelta / 120;
                }
                else if (e.deltaY) {
                    delta = e.deltaY / 3;
                }
                else if (e.detail) {
                    delta = e.detail / 3;
                }
                _this.wheel.inputAxis(0.0, delta);
                return _this.preventDefaultEvent(e);
            };
            var onTouchStart = function (e) {
                _this.buttons[0].inputRelease();
                _this.inputMouseLocation(_this.location, e);
                return _this.preventDefaultEvent(e);
            };
            var onTouchEnd = function (e) {
                _this.buttons[0].inputRelease();
                _this.inputMouseLocation(_this.location, e);
                return _this.preventDefaultEvent(e);
            };
            var ontTouchMove = function (e) {
                _this.inputMouseLocation(_this.location, e);
                return _this.preventDefaultEvent(e);
            };
            canvas.addEventListener("mousemove", onMouseMove);
            canvas.addEventListener("mousedown", onMouseDown);
            canvas.addEventListener("mouseup", onMouseUp);
            canvas.addEventListener("wheel", onMouseWheel);
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
            for (var i = 0; i < this.buttons.length; i++) {
                var button = this.buttons[i];
                button.processPollingDoublePress(time, this.doublePressMilliSecond);
            }
        };
        MouseDevice.prototype.updateStates = function () {
            for (var i = 0; i < this.buttons.length; i++) {
                var button = this.buttons[i];
                button.updateStates();
            }
            this.wheel.y = 0.0;
        };
        MouseDevice.prototype.getButtonControlByName = function (name) {
            for (var i = 0; i < this.buttons.length; i++) {
                var button = this.buttons[i];
                if (button.name == name) {
                    return button;
                }
            }
            return null;
        };
        MouseDevice.prototype.getAxisControlByName = function (name) {
            if (name == this.wheel.name) {
                return this.wheel;
            }
            return null;
        };
        MouseDevice.prototype.getPointingControlByName = function (name) {
            if (name == this.location.name) {
                return this.location;
            }
            return null;
        };
        return MouseDevice;
    }());
    Input.MouseDevice = MouseDevice;
})(Input || (Input = {}));
