var CanvasContext = (function () {
    function CanvasContext() {
        this.canvas = null;
        this.context = null;
        this.width = 0.0;
        this.height = 0.0;
        this.font = '\'Meiryo\'';
    }
    CanvasContext.prototype.initialize = function (canvas) {
        try {
            var context = canvas.getContext('2d');
            if (context != null) {
                this.canvas = canvas;
                this.context = context;
                this.width = this.canvas.width;
                this.height = this.canvas.height;
            }
            else {
                throw ("Faild to initialize canvas 2d.");
            }
        }
        catch (e) {
            return true;
        }
        return false;
    };
    return CanvasContext;
}());
var CanvasRender = (function () {
    function CanvasRender() {
        this.canvasContext = null;
        this.context = null;
    }
    CanvasRender.prototype.setContext = function (canvasContext) {
        this.canvasContext = canvasContext;
        this.context = canvasContext.context;
    };
    // Canvas wrapper functions
    CanvasRender.prototype.setImageAntialaing = function (enable) {
        this.context.imageSmoothingEnabled = enable;
    };
    CanvasRender.prototype.setFillColor = function (r, g, b, a) {
        this.context.fillStyle = 'rgba(' + (r * 255).toFixed(0) + ',' + (g * 255).toFixed(0) + ',' + (b * 255).toFixed(0) + ',' + (a * 255).toFixed(0) + ')';
    };
    CanvasRender.prototype.clearRect = function (left, top, width, height) {
        this.context.clearRect(left, top, width, height);
    };
    CanvasRender.prototype.fillRect = function (left, top, width, height) {
        this.context.fillRect(left, top, width, height);
    };
    CanvasRender.prototype.fill = function () {
        this.context.fill();
    };
    CanvasRender.prototype.setStrokeColor = function (r, g, b, a) {
        this.context.strokeStyle = 'rgba(' + (r * 255).toFixed(0) + ',' + (g * 255).toFixed(0) + ',' + (b * 255).toFixed(0) + ',' + (a * 255).toFixed(0) + ')';
    };
    CanvasRender.prototype.setStrokeWidth = function (lineWidth) {
        this.context.lineWidth = lineWidth;
    };
    CanvasRender.prototype.beginPath = function () {
        this.context.beginPath();
    };
    CanvasRender.prototype.stroke = function () {
        this.context.stroke();
    };
    CanvasRender.prototype.moveTo = function (x, y) {
        this.context.moveTo(x, y);
    };
    CanvasRender.prototype.lineTo = function (x, y) {
        this.context.lineTo(x, y);
    };
    CanvasRender.prototype.fillText = function (text, x, y) {
        this.context.fillText(text, x, y);
    };
    CanvasRender.prototype.measureText = function (text) {
        return this.context.measureText(text);
    };
    CanvasRender.prototype.getImageData = function (left, top, width, height) {
        return this.context.getImageData(left, top, width, height);
    };
    // Additional functions
    CanvasRender.prototype.setFontSize = function (height) {
        this.context.font = height.toFixed(0) + 'px ' + this.canvasContext.font;
    };
    CanvasRender.prototype.circle = function (x, y, radius) {
        this.context.arc(x, y, radius, 0.0, Math.PI * 2.0);
    };
    return CanvasRender;
}());
