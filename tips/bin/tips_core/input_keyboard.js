var Input;
(function (Input) {
    var KeyboardDevice = (function () {
        function KeyboardDevice() {
            this.buttons = null;
            this.maxButtonCount = 256;
            this.doublePressMilliSecond = 200;
        }
        KeyboardDevice.prototype.initialize = function () {
            this.buttons = new List(this.maxButtonCount);
        };
        KeyboardDevice.prototype.setEvents = function (canvas) {
            var _this = this;
            var keydown = function (e) {
                //console.log('keydown ' + e.key + ' ' + e.keyCode);
                _this.prepareButtonControlForKey(e.key);
                _this.buttons[e.key].inputPressed();
            };
            var keyup = function (e) {
                //console.log('keyup ' + e.key + ' ' + e.keyCode);
                _this.prepareButtonControlForKey(e.key);
                _this.buttons[e.key].inputReleased();
            };
            document.addEventListener('keydown', keydown, false);
            document.addEventListener('keyup', keyup, false);
        };
        KeyboardDevice.prototype.prepareButtonControlForKey = function (name) {
            if (DictionaryContainsKey(this.buttons, name)) {
                return;
            }
            var button = new Input.ButtonInputControl();
            button.name = name;
            this.buttons[name] = button;
        };
        KeyboardDevice.prototype.processPolling = function (time) {
            for (var buttonName in this.buttons) {
                var button = this.buttons[buttonName];
                button.processPollingDoublePress(time, this.doublePressMilliSecond);
            }
        };
        KeyboardDevice.prototype.updateStates = function () {
            for (var buttonName in this.buttons) {
                var button = this.buttons[buttonName];
                button.updateStates();
            }
        };
        KeyboardDevice.prototype.getButtonControlByName = function (name) {
            this.prepareButtonControlForKey(name);
            return this.buttons[name];
        };
        KeyboardDevice.prototype.getAxisControlByName = function (name) {
            return null;
        };
        KeyboardDevice.prototype.getPointingControlByName = function (name) {
            return null;
        };
        return KeyboardDevice;
    }());
    Input.KeyboardDevice = KeyboardDevice;
})(Input || (Input = {}));
