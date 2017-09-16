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
    var KeyboardDevice = (function (_super) {
        __extends(KeyboardDevice, _super);
        function KeyboardDevice() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.dummyButton = new Input.ButtonInputControl();
            return _this;
        }
        KeyboardDevice.prototype.setEvents = function (canvas) {
        };
        KeyboardDevice.prototype.processPolling = function (time) {
        };
        KeyboardDevice.prototype.updateStates = function (time) {
        };
        KeyboardDevice.prototype.getButtonControlByName = function (controlName) {
            return this.dummyButton;
        };
        return KeyboardDevice;
    }(Input.InputDeviceBase));
    Input.KeyboardDevice = KeyboardDevice;
})(Input || (Input = {}));
