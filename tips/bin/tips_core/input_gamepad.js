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
    var GamepadDevice = (function (_super) {
        __extends(GamepadDevice, _super);
        function GamepadDevice() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.dummyButton = new Input.ButtonInputControl();
            _this.dummyAxis = new Input.AxisInputControl();
            return _this;
        }
        GamepadDevice.prototype.setEvents = function (canvas) {
        };
        GamepadDevice.prototype.processPolling = function (time) {
        };
        GamepadDevice.prototype.updateStates = function (time) {
        };
        GamepadDevice.prototype.getButtonControlByName = function (controlName) {
            return this.dummyButton;
        };
        GamepadDevice.prototype.getAxisControlByName = function (controlName) {
            return this.dummyAxis;
        };
        return GamepadDevice;
    }(Input.InputDeviceBase));
    Input.GamepadDevice = GamepadDevice;
})(Input || (Input = {}));
