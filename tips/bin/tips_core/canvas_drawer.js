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
var TextAreaVerticalAlignType;
(function (TextAreaVerticalAlignType) {
    TextAreaVerticalAlignType[TextAreaVerticalAlignType["top"] = 1] = "top";
    TextAreaVerticalAlignType[TextAreaVerticalAlignType["middle"] = 2] = "middle";
    TextAreaVerticalAlignType[TextAreaVerticalAlignType["bottom"] = 3] = "bottom";
})(TextAreaVerticalAlignType || (TextAreaVerticalAlignType = {}));
var TextAreaHorizontalAlignType;
(function (TextAreaHorizontalAlignType) {
    TextAreaHorizontalAlignType[TextAreaHorizontalAlignType["left"] = 1] = "left";
    TextAreaHorizontalAlignType[TextAreaHorizontalAlignType["center"] = 2] = "center";
    TextAreaHorizontalAlignType[TextAreaHorizontalAlignType["right"] = 3] = "right";
})(TextAreaHorizontalAlignType || (TextAreaHorizontalAlignType = {}));
var TextArea = (function () {
    function TextArea() {
        this.drawer = null;
        this.text = '';
        this.mearsureTestLetter = '8';
        this.isVertical = false;
        this.verticalTextAlignType = TextAreaVerticalAlignType.bottom;
        this.horizontalTextAlignType = TextAreaHorizontalAlignType.left;
        this.fontHeight = 24.0;
        this.lineSpan = 0.0;
        this.letterHeightScale = 1.0;
        this.letterOffsetLeft = 0.0;
        this.letterOffsetTop = 0.0;
        this.letterOffsetRight = 0.0;
        this.letterOffsetBottom = 0.0;
        this.location = [0.0, 0.0, 0.0];
        this.color = [0.0, 0.0, 0.0, 1.0];
    }
    TextArea.prototype.recycle = function () {
        this.drawer = null;
    };
    TextArea.prototype.setRedraw = function () {
        if (this.drawer != null) {
            this.drawer.setRedraw();
        }
    };
    TextArea.prototype.setText = function (text) {
        if (text == this.text) {
            return;
        }
        this.text = text;
        this.setRedraw();
    };
    TextArea.prototype.setLocation = function (x, y) {
        if (x == this.location[0] && y == this.location[1]) {
            return;
        }
        this.location[0] = x;
        this.location[1] = y;
        this.setRedraw();
    };
    TextArea.prototype.setColor = function (r, g, b) {
        if (r == this.color[0] && g == this.color[1] && b == this.color[2]) {
            return;
        }
        this.color[0] = r;
        this.color[1] = g;
        this.color[2] = b;
        this.setRedraw();
    };
    TextArea.prototype.setAlpha = function (alpha) {
        if (alpha == this.color[3]) {
            return;
        }
        this.color[3] = alpha;
        this.setRedraw();
    };
    return TextArea;
}());
var VerticalTextArea = (function (_super) {
    __extends(VerticalTextArea, _super);
    function VerticalTextArea() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.isVertical = true;
        _this.mearsureTestLetter = '8';
        _this.verticalTextAlignType = TextAreaVerticalAlignType.top;
        _this.horizontalTextAlignType = TextAreaHorizontalAlignType.right;
        return _this;
    }
    return VerticalTextArea;
}(TextArea));
var HorizontalTextArea = (function (_super) {
    __extends(HorizontalTextArea, _super);
    function HorizontalTextArea() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.isVertical = false;
        _this.mearsureTestLetter = '8';
        _this.verticalTextAlignType = TextAreaVerticalAlignType.top;
        _this.horizontalTextAlignType = TextAreaHorizontalAlignType.left;
        return _this;
    }
    return HorizontalTextArea;
}(TextArea));
var CanvasDrawer = (function () {
    function CanvasDrawer() {
        this.mainCanvasContext = null;
        this.measuringCanvasContext = null;
        this.render = new CanvasRender();
        this.textAreas = new List();
        this.needsRedraw = false;
        this.redrawCommited = false;
        this.debug = false;
    }
    CanvasDrawer.prototype.initialize = function (screenWidth, screenHeight) {
        try {
            this.initializeMainContext(screenWidth, screenHeight);
            this.initializeContextForMeasuring();
        }
        catch (e) {
            return false;
        }
        this.needsRedraw = false;
        this.redrawCommited = false;
        return true;
    };
    CanvasDrawer.prototype.setRedraw = function () {
        this.needsRedraw = true;
    };
    CanvasDrawer.prototype.commitRedraw = function () {
        if (this.needsRedraw) {
            this.redrawCommited = true;
        }
    };
    CanvasDrawer.prototype.isRedrawCommited = function () {
        return this.redrawCommited;
    };
    CanvasDrawer.prototype.draw = function () {
        if (!this.redrawCommited) {
            return;
        }
        this.render.setContext(this.mainCanvasContext);
        this.render.clearRect(0, 0, this.mainCanvasContext.width, this.mainCanvasContext.height);
        this.drawObjects(this.mainCanvasContext);
        this.needsRedraw = false;
        this.redrawCommited = false;
    };
    CanvasDrawer.prototype.addTextArea = function (textArea) {
        this.measureActualLetterProfile(textArea);
        textArea.drawer = this;
        this.textAreas.push(textArea);
        this.setRedraw();
    };
    CanvasDrawer.prototype.removeTextArea = function (textArea) {
        for (var i = 0; i < this.textAreas.length; i++) {
            if (this.textAreas[i] == textArea) {
                ListRemoveAt(this.textAreas, i);
                this.setRedraw();
                break;
            }
        }
    };
    CanvasDrawer.prototype.getCanvas = function () {
        return this.mainCanvasContext.canvas;
    };
    CanvasDrawer.prototype.getMeasuringCanvas = function () {
        return this.measuringCanvasContext.canvas;
    };
    CanvasDrawer.prototype.initializeMainContext = function (canvasWidth, canvasHeight) {
        var measuringCanvas = document.createElement('canvas');
        measuringCanvas.width = canvasWidth;
        measuringCanvas.height = canvasHeight;
        this.mainCanvasContext = new CanvasContext();
        this.mainCanvasContext.initialize(measuringCanvas);
    };
    CanvasDrawer.prototype.initializeContextForMeasuring = function () {
        var measuringCanvas = document.createElement('canvas');
        measuringCanvas.width = 100;
        measuringCanvas.height = 100;
        this.measuringCanvasContext = new CanvasContext();
        this.measuringCanvasContext.initialize(measuringCanvas);
    };
    CanvasDrawer.prototype.drawObjects = function (canvasContext) {
        this.drawTexts();
    };
    CanvasDrawer.prototype.drawTexts = function () {
        for (var i = 0; i < this.textAreas.length; i++) {
            var textArea = this.textAreas[i];
            if (textArea != null) {
                if (textArea.isVertical) {
                    this.drawVerticalText(textArea);
                }
                else {
                    this.drawHorizontalText(textArea);
                }
            }
        }
    };
    CanvasDrawer.prototype.drawVerticalText = function (textArea) {
        var letterHeight = textArea.fontHeight * textArea.letterHeightScale;
        var lineWidth = letterHeight + textArea.lineSpan;
        var lineEnd = '\n';
        var lineText = textArea.text;
        var textLength = lineText.length;
        var topPos = textArea.location[1];
        var x = textArea.location[0];
        var offsetX;
        if (textArea.horizontalTextAlignType == TextAreaHorizontalAlignType.right) {
            offsetX = textArea.letterOffsetRight;
        }
        else if (textArea.horizontalTextAlignType == TextAreaHorizontalAlignType.center) {
            offsetX = (textArea.letterOffsetRight - textArea.letterOffsetLeft) / 2.0;
        }
        else {
            offsetX = textArea.letterOffsetLeft;
        }
        var offsetY;
        if (textArea.verticalTextAlignType == TextAreaVerticalAlignType.bottom) {
            offsetY = textArea.letterOffsetBottom + letterHeight;
        }
        else if (textArea.verticalTextAlignType == TextAreaVerticalAlignType.middle) {
            offsetY = textArea.letterOffsetBottom + letterHeight / 2.0;
        }
        else {
            offsetY = textArea.letterOffsetBottom + letterHeight;
        }
        this.drawReferentialAxis(textArea.location[0], textArea.location[1], letterHeight);
        this.render.setFontSize(letterHeight);
        this.render.setFillColor(textArea.color[0], textArea.color[1], textArea.color[2], textArea.color[3]);
        var currentIndex = 0;
        var textLength = textArea.text.length;
        while (currentIndex < textLength) {
            var endIndex = StringIndexOf(textArea.text, lineEnd, currentIndex);
            if (endIndex == -1) {
                endIndex = textArea.text.length;
            }
            var lineText = StringSubstring(textArea.text, currentIndex, endIndex - currentIndex);
            var lineTextLength = lineText.length;
            if (lineTextLength > 0) {
                var y = void 0;
                if (textArea.verticalTextAlignType == TextAreaVerticalAlignType.bottom) {
                    y = topPos - letterHeight * lineTextLength;
                }
                else if (textArea.verticalTextAlignType == TextAreaVerticalAlignType.middle) {
                    y = topPos - letterHeight * lineTextLength / 2.0;
                }
                else {
                    y = topPos;
                }
                for (var i = 0; i < lineTextLength; i++) {
                    var letter = StringSubstring(lineText, i, 1);
                    this.render.fillText(letter, x + offsetX, y + offsetY);
                    this.drawReferentialAxis(x, y, letterHeight);
                    // 文字を送る
                    y += letterHeight;
                }
                currentIndex = endIndex + 1;
                x -= lineWidth;
            }
        }
    };
    CanvasDrawer.prototype.drawHorizontalText = function (textArea) {
        var letterHeight = textArea.fontHeight * textArea.letterHeightScale;
        var lineHeight = letterHeight + textArea.lineSpan;
        var lineEnd = '\n';
        var x = textArea.location[0];
        var y = textArea.location[1];
        var offsetY;
        if (textArea.verticalTextAlignType == TextAreaVerticalAlignType.bottom) {
            offsetY = textArea.letterOffsetBottom;
        }
        else if (textArea.verticalTextAlignType == TextAreaVerticalAlignType.middle) {
            offsetY = textArea.letterOffsetBottom + (textArea.letterOffsetTop - textArea.letterOffsetBottom) / 2.0;
        }
        else {
            offsetY = textArea.letterOffsetBottom + letterHeight;
        }
        this.drawReferentialAxis(textArea.location[0], textArea.location[1], letterHeight);
        this.render.setFontSize(letterHeight);
        this.render.setFillColor(textArea.color[0], textArea.color[1], textArea.color[2], textArea.color[3]);
        var currentIndex = 0;
        var textLength = textArea.text.length;
        while (currentIndex < textLength) {
            var endIndex = StringIndexOf(textArea.text, lineEnd, currentIndex);
            if (endIndex == -1) {
                endIndex = textArea.text.length;
            }
            var lineText = StringSubstring(textArea.text, currentIndex, endIndex - currentIndex);
            var lineTextLength = lineText.length;
            if (lineTextLength > 0) {
                var textMetrics = this.render.measureText(lineText);
                var offsetX = void 0;
                if (textArea.horizontalTextAlignType == TextAreaHorizontalAlignType.right) {
                    offsetX = textMetrics.width;
                }
                else if (textArea.horizontalTextAlignType == TextAreaHorizontalAlignType.center) {
                    offsetX = -textMetrics.width / 2;
                }
                else {
                    offsetX = textArea.letterOffsetLeft;
                }
                this.render.fillText(lineText, x + offsetX, y + offsetY);
                this.drawReferentialAxis(x, y, letterHeight);
            }
            currentIndex = endIndex + 1;
            y += lineHeight;
        }
    };
    CanvasDrawer.prototype.measureActualLetterProfile = function (textArea) {
        this.render.setContext(this.measuringCanvasContext);
        var maxWidth = this.measuringCanvasContext.width;
        var maxHeight = this.measuringCanvasContext.height;
        var leftMargin = 5;
        var bottomMargin = 10;
        // measure scaling
        this.render.clearRect(0, 0, maxWidth, maxHeight);
        this.render.setFontSize(textArea.fontHeight);
        this.render.fillText(textArea.mearsureTestLetter, leftMargin, maxHeight - bottomMargin);
        var pixels = this.render.getImageData(0, 0, maxWidth, maxHeight);
        var rect1 = [0, 0, 0, 0];
        this.scanRectangle(rect1, pixels, textArea.fontHeight, bottomMargin);
        var left = rect1[0];
        var right = rect1[2];
        var top = rect1[1];
        var bottom = rect1[3];
        var actualHeight = (bottom - top) + 1;
        textArea.letterHeightScale = textArea.fontHeight / actualHeight;
        // measure offset
        this.render.clearRect(0, 0, maxWidth, maxHeight);
        this.render.setFontSize(textArea.fontHeight * textArea.letterHeightScale);
        this.render.fillText(textArea.mearsureTestLetter, leftMargin, maxHeight - bottomMargin);
        var pixels2 = this.render.getImageData(0, 0, maxWidth, maxHeight);
        var rect2 = [0, 0, 0, 0];
        this.scanRectangle(rect2, pixels2, textArea.fontHeight, bottomMargin);
        left = rect2[0];
        top = rect2[1];
        right = rect2[2];
        bottom = rect2[3];
        textArea.letterOffsetLeft = -(left - leftMargin);
        textArea.letterOffsetRight = -(right - leftMargin);
        textArea.letterOffsetTop = -(top - (maxHeight - bottomMargin));
        textArea.letterOffsetBottom = -(bottom - (maxHeight - bottomMargin));
        this.drawReferentialAxis(leftMargin, maxHeight - bottomMargin, actualHeight);
    };
    CanvasDrawer.prototype.scanRectangle = function (out, imageData, fontHeight, bottomMargin) {
        var data = imageData.data;
        var lineByteLength = 4 * imageData.width;
        var limitByteOffset = data.length - Math.floor(fontHeight * 1.05) * lineByteLength;
        if (limitByteOffset < 0) {
            return 1.0;
        }
        var left = imageData.width;
        var top = imageData.height;
        var right = 0;
        var bottom = 0;
        var yLimit = Math.floor(imageData.height - bottomMargin - fontHeight * 1.05);
        for (var x = 0; x < imageData.width; x++) {
            for (var y = imageData.height - 1; y >= yLimit; y--) {
                var alpha = data[(y * 4 * imageData.width) + (x * 4) + 3];
                if (alpha > 128) {
                    if (x < left) {
                        left = x;
                    }
                    if (y < top) {
                        top = y;
                    }
                    if (x > right) {
                        right = x;
                    }
                    if (y > bottom) {
                        bottom = y;
                    }
                }
            }
        }
        out[0] = left;
        out[1] = top;
        out[2] = right;
        out[3] = bottom;
    };
    CanvasDrawer.prototype.drawReferentialAxis = function (x, y, size) {
        if (!this.debug) {
            return;
        }
        x = Math.floor(x);
        y = Math.floor(y);
        this.render.setStrokeWidth(0);
        this.render.setStrokeColor(1.0, 0.0, 0.0, 1.0);
        this.render.beginPath();
        this.render.moveTo(x - size, y);
        this.render.lineTo(x, y);
        this.render.stroke();
        this.render.setStrokeColor(0.0, 0.8, 0.0, 1.0);
        this.render.beginPath();
        this.render.moveTo(x, y);
        this.render.lineTo(x, y + size);
        this.render.stroke();
    };
    return CanvasDrawer;
}());
