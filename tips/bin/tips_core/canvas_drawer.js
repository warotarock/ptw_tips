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
var DrawerObjectTypeID;
(function (DrawerObjectTypeID) {
    DrawerObjectTypeID[DrawerObjectTypeID["none"] = 0] = "none";
    DrawerObjectTypeID[DrawerObjectTypeID["verticalText"] = 1] = "verticalText";
    DrawerObjectTypeID[DrawerObjectTypeID["horizontalText"] = 2] = "horizontalText";
    DrawerObjectTypeID[DrawerObjectTypeID["image"] = 3] = "image";
})(DrawerObjectTypeID || (DrawerObjectTypeID = {}));
var DrawerObject = (function () {
    function DrawerObject() {
        this.Type = DrawerObjectTypeID.none;
        this.drawer = null;
    }
    DrawerObject.prototype.recycle = function () {
        this.drawer = null;
    };
    DrawerObject.prototype.setRedraw = function () {
        if (this.drawer != null) {
            this.drawer.setRedraw();
        }
    };
    return DrawerObject;
}());
var TextDrawerVerticalAlignType;
(function (TextDrawerVerticalAlignType) {
    TextDrawerVerticalAlignType[TextDrawerVerticalAlignType["top"] = 1] = "top";
    TextDrawerVerticalAlignType[TextDrawerVerticalAlignType["middle"] = 2] = "middle";
    TextDrawerVerticalAlignType[TextDrawerVerticalAlignType["bottom"] = 3] = "bottom";
})(TextDrawerVerticalAlignType || (TextDrawerVerticalAlignType = {}));
var TextDrawerHorizontalAlignType;
(function (TextDrawerHorizontalAlignType) {
    TextDrawerHorizontalAlignType[TextDrawerHorizontalAlignType["left"] = 1] = "left";
    TextDrawerHorizontalAlignType[TextDrawerHorizontalAlignType["center"] = 2] = "center";
    TextDrawerHorizontalAlignType[TextDrawerHorizontalAlignType["right"] = 3] = "right";
})(TextDrawerHorizontalAlignType || (TextDrawerHorizontalAlignType = {}));
var TextDrawer = (function (_super) {
    __extends(TextDrawer, _super);
    function TextDrawer() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.text = '';
        _this.mearsureSampleLetter = '8';
        _this.isVertical = false;
        _this.verticalTextAlignType = TextDrawerVerticalAlignType.bottom;
        _this.horizontalTextAlignType = TextDrawerHorizontalAlignType.left;
        _this.fontHeight = 24.0;
        _this.lineSpan = 0.0;
        _this.letterHeightScale = 1.0;
        _this.letterOffsetLeft = 0.0;
        _this.letterOffsetTop = 0.0;
        _this.letterOffsetRight = 0.0;
        _this.letterOffsetBottom = 0.0;
        _this.location = [0.0, 0.0, 0.0];
        _this.color = [0.0, 0.0, 0.0, 1.0];
        return _this;
    }
    TextDrawer.prototype.setText = function (text) {
        if (text == this.text) {
            return;
        }
        this.text = text;
        this.setRedraw();
    };
    TextDrawer.prototype.setLocation = function (x, y) {
        if (x == this.location[0] && y == this.location[1]) {
            return;
        }
        this.location[0] = x;
        this.location[1] = y;
        this.setRedraw();
    };
    TextDrawer.prototype.setColor = function (r, g, b) {
        if (r == this.color[0] && g == this.color[1] && b == this.color[2]) {
            return;
        }
        this.color[0] = r;
        this.color[1] = g;
        this.color[2] = b;
        this.setRedraw();
    };
    TextDrawer.prototype.setTransparency = function (alpha) {
        if (alpha == this.color[3]) {
            return;
        }
        this.color[3] = alpha;
        this.setRedraw();
    };
    return TextDrawer;
}(DrawerObject));
var VerticalTextDrawer = (function (_super) {
    __extends(VerticalTextDrawer, _super);
    function VerticalTextDrawer() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.Type = DrawerObjectTypeID.verticalText;
        _this.isVertical = true;
        _this.mearsureSampleLetter = '��';
        _this.verticalTextAlignType = TextDrawerVerticalAlignType.top;
        _this.horizontalTextAlignType = TextDrawerHorizontalAlignType.right;
        return _this;
    }
    return VerticalTextDrawer;
}(TextDrawer));
var HorizontalTextDrawer = (function (_super) {
    __extends(HorizontalTextDrawer, _super);
    function HorizontalTextDrawer() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.Type = DrawerObjectTypeID.horizontalText;
        _this.isVertical = false;
        _this.mearsureSampleLetter = '8';
        _this.verticalTextAlignType = TextDrawerVerticalAlignType.top;
        _this.horizontalTextAlignType = TextDrawerHorizontalAlignType.left;
        return _this;
    }
    return HorizontalTextDrawer;
}(TextDrawer));
var ImageDrawer = (function (_super) {
    __extends(ImageDrawer, _super);
    function ImageDrawer() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.Type = DrawerObjectTypeID.image;
        _this.imageData = null;
        _this.sourceRect = [0.0, 0.0, 0.0, 0.0];
        _this.origin = [0.0, 0.0, 0.0];
        _this.location = [0.0, 0.0, 0.0];
        _this.scaling = [1.0, 1.0, 1.0];
        _this.rotation = 0.0;
        _this.alpha = 1.0;
        return _this;
    }
    ImageDrawer.prototype.setImage = function (imageData) {
        this.imageData = imageData;
        this.sourceRect[0] = 0.0;
        this.sourceRect[1] = 0.0;
        this.sourceRect[2] = imageData.width;
        this.sourceRect[3] = imageData.height;
        this.setRedraw();
    };
    ImageDrawer.prototype.setSourceRect = function (left, right, width, height) {
        if (left == this.sourceRect[0] && right == this.sourceRect[1] && width == this.sourceRect[2] && height == this.sourceRect[3]) {
            return;
        }
        this.sourceRect[0] = left;
        this.sourceRect[1] = right;
        this.sourceRect[2] = width;
        this.sourceRect[3] = height;
        this.setRedraw();
    };
    ImageDrawer.prototype.setLocation = function (x, y) {
        if (x == this.location[0] && y == this.location[1]) {
            return;
        }
        this.location[0] = x;
        this.location[1] = y;
        this.setRedraw();
    };
    ImageDrawer.prototype.setOrigin = function (x, y) {
        if (x == this.origin[0] && y == this.origin[1]) {
            return;
        }
        this.origin[0] = x;
        this.origin[1] = y;
        this.setRedraw();
    };
    ImageDrawer.prototype.setRotation = function (rotation) {
        if (rotation == this.rotation) {
            return;
        }
        this.rotation = rotation;
        this.setRedraw();
    };
    ImageDrawer.prototype.setTransparency = function (alpha) {
        if (alpha == this.alpha) {
            return;
        }
        this.alpha = alpha;
        this.setRedraw();
    };
    return ImageDrawer;
}(DrawerObject));
var CanvasDrawer = (function () {
    function CanvasDrawer() {
        this.mainCanvasContext = null;
        this.measuringCanvasContext = null;
        this.render = new CanvasRender();
        this.transformMatrix = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0]; // x1, y1, x2, y2, tx, ty
        this.transformIdentity = [1.0, 0.0, 0.0, 1.0, 0.0, 0.0];
        this.drawerObjects = new List();
        this.needsRedraw = false;
        this.color1 = [0.0, 0.0, 0.0, 0.2];
        this.color2 = [1.0, 0.0, 0.0, 0.3];
        this.color3 = [0.0, 0.8, 0.0, 0.3];
        this.debug = false;
    }
    CanvasDrawer.prototype.initialize = function (canvasWidth, canvasHeight) {
        try {
            this.initializeMainContext(canvasWidth, canvasHeight);
            this.initializeContextForMeasuring();
        }
        catch (e) {
            return false;
        }
        this.needsRedraw = false;
        return true;
    };
    CanvasDrawer.prototype.setRedraw = function () {
        this.needsRedraw = true;
    };
    CanvasDrawer.prototype.isNeededRedraw = function () {
        return this.needsRedraw;
    };
    CanvasDrawer.prototype.draw = function () {
        if (!this.needsRedraw) {
            return;
        }
        this.render.setContext(this.mainCanvasContext);
        this.render.clearRect(0, 0, this.mainCanvasContext.width, this.mainCanvasContext.height);
        this.drawObjects(this.mainCanvasContext);
        this.needsRedraw = false;
    };
    CanvasDrawer.prototype.addTextDrawer = function (textDrawer) {
        this.measureActualLetterProfile(textDrawer);
        textDrawer.drawer = this;
        this.drawerObjects.push(textDrawer);
        this.setRedraw();
    };
    CanvasDrawer.prototype.addImageDrawer = function (imageDrawer) {
        imageDrawer.drawer = this;
        this.drawerObjects.push(imageDrawer);
        this.setRedraw();
    };
    CanvasDrawer.prototype.removeObject = function (drawerObject) {
        for (var i = 0; i < this.drawerObjects.length; i++) {
            if (this.drawerObjects[i] == drawerObject) {
                ListRemoveAt(this.drawerObjects, i);
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
        for (var _i = 0, _a = this.drawerObjects; _i < _a.length; _i++) {
            var drawerObject = _a[_i];
            if (drawerObject.Type == DrawerObjectTypeID.verticalText || drawerObject.Type == DrawerObjectTypeID.horizontalText) {
                var textDrawer = drawerObject;
                if (textDrawer.isVertical) {
                    this.drawVerticalTextDrawer(textDrawer);
                }
                else {
                    this.drawHorizontalTextDrawer(textDrawer);
                }
            }
            else if (drawerObject.Type == DrawerObjectTypeID.image) {
                var imageDrawer = drawerObject;
                this.drawImageDrawer(imageDrawer);
            }
        }
    };
    CanvasDrawer.prototype.drawVerticalTextDrawer = function (textDrawer) {
        var letterHeight = textDrawer.fontHeight * textDrawer.letterHeightScale;
        var lineWidth = letterHeight + textDrawer.lineSpan;
        var lineEnd = '\n';
        var topPos = textDrawer.location[1];
        var x = textDrawer.location[0];
        var offsetX;
        if (textDrawer.horizontalTextAlignType == TextDrawerHorizontalAlignType.right) {
            offsetX = textDrawer.letterOffsetLeft + textDrawer.letterOffsetRight;
        }
        else if (textDrawer.horizontalTextAlignType == TextDrawerHorizontalAlignType.center) {
            offsetX = textDrawer.letterOffsetLeft + Math.floor((textDrawer.letterOffsetRight - textDrawer.letterOffsetLeft) / 2.0 - 1.0);
        }
        else {
            offsetX = textDrawer.letterOffsetLeft;
        }
        var offsetY;
        if (textDrawer.verticalTextAlignType == TextDrawerVerticalAlignType.bottom) {
            offsetY = textDrawer.letterOffsetBottom + letterHeight;
        }
        else if (textDrawer.verticalTextAlignType == TextDrawerVerticalAlignType.middle) {
            offsetY = textDrawer.letterOffsetBottom + letterHeight / 2.0;
        }
        else {
            offsetY = textDrawer.letterOffsetTop;
        }
        this.drawAxis(textDrawer.location[0], textDrawer.location[1], letterHeight);
        this.render.setFontSize(letterHeight);
        this.render.setFillColor(textDrawer.color);
        var currentIndex = 0;
        var allTextLength = textDrawer.text.length;
        while (currentIndex < allTextLength) {
            var endIndex = StringIndexOf(textDrawer.text, lineEnd, currentIndex);
            if (endIndex == -1) {
                endIndex = textDrawer.text.length;
            }
            var lineText = StringSubstring(textDrawer.text, currentIndex, endIndex - currentIndex);
            var lineTextLength = lineText.length;
            if (lineTextLength > 0) {
                var y = void 0;
                if (textDrawer.verticalTextAlignType == TextDrawerVerticalAlignType.bottom) {
                    y = topPos - letterHeight * lineTextLength;
                }
                else if (textDrawer.verticalTextAlignType == TextDrawerVerticalAlignType.middle) {
                    y = topPos - letterHeight * lineTextLength / 2.0;
                }
                else {
                    y = topPos;
                }
                for (var i = 0; i < lineTextLength; i++) {
                    var letter = StringSubstring(lineText, i, 1);
                    if (this.debug) {
                        var textMetrics = this.render.measureText(letter);
                        this.render.setStrokeColor(this.color1);
                        this.render.beginPath();
                        this.render.rect(x + offsetX, y + offsetY, textMetrics.width, 1);
                        this.render.stroke();
                    }
                    this.render.fillText(letter, x + offsetX, y + offsetY);
                    this.drawAxis(x, y, letterHeight);
                    // �����𑗂�
                    y += letterHeight;
                }
                currentIndex = endIndex + 1;
                x -= lineWidth;
            }
        }
    };
    CanvasDrawer.prototype.drawHorizontalTextDrawer = function (textDrawer) {
        var letterHeight = textDrawer.fontHeight * textDrawer.letterHeightScale;
        var lineHeight = letterHeight + textDrawer.lineSpan;
        var lineEnd = '\n';
        var x = textDrawer.location[0];
        var y = textDrawer.location[1];
        var offsetY;
        if (textDrawer.verticalTextAlignType == TextDrawerVerticalAlignType.bottom) {
            offsetY = textDrawer.letterOffsetBottom;
        }
        else if (textDrawer.verticalTextAlignType == TextDrawerVerticalAlignType.middle) {
            offsetY = textDrawer.letterOffsetBottom + (textDrawer.letterOffsetTop - textDrawer.letterOffsetBottom) / 2.0;
        }
        else {
            offsetY = textDrawer.letterOffsetBottom + letterHeight;
        }
        this.drawAxis(textDrawer.location[0], textDrawer.location[1], letterHeight);
        this.render.setFontSize(letterHeight);
        this.render.setFillColor(textDrawer.color);
        var currentIndex = 0;
        var allTextLength = textDrawer.text.length;
        while (currentIndex < allTextLength) {
            var endIndex = StringIndexOf(textDrawer.text, lineEnd, currentIndex);
            if (endIndex == -1) {
                endIndex = textDrawer.text.length;
            }
            var lineText = StringSubstring(textDrawer.text, currentIndex, endIndex - currentIndex);
            var lineTextLength = lineText.length;
            if (lineTextLength > 0) {
                var textMetrics = this.render.measureText(lineText);
                var offsetX = void 0;
                if (textDrawer.horizontalTextAlignType == TextDrawerHorizontalAlignType.right) {
                    offsetX = textMetrics.width;
                }
                else if (textDrawer.horizontalTextAlignType == TextDrawerHorizontalAlignType.center) {
                    offsetX = -textMetrics.width / 2;
                }
                else {
                    offsetX = textDrawer.letterOffsetLeft;
                }
                if (this.debug) {
                    this.render.setStrokeColor(this.color1);
                    this.render.beginPath();
                    this.render.rect(x + offsetX, y + offsetY, textMetrics.width, 1);
                    this.render.stroke();
                }
                this.render.fillText(lineText, x + offsetX, y + offsetY);
                this.drawAxis(x, y, letterHeight);
            }
            currentIndex = endIndex + 1;
            y += lineHeight;
        }
    };
    CanvasDrawer.prototype.measureActualLetterProfile = function (textDrawer) {
        this.render.setContext(this.measuringCanvasContext);
        var maxWidth = this.measuringCanvasContext.width;
        var maxHeight = this.measuringCanvasContext.height;
        var sampleLeftMargin = 5;
        var sampleBottomMargin = 10;
        // measure scaling
        this.render.clearRect(0, 0, maxWidth, maxHeight);
        this.render.setFontSize(textDrawer.fontHeight);
        this.render.fillText(textDrawer.mearsureSampleLetter, sampleLeftMargin, maxHeight - sampleBottomMargin);
        var pixels = this.render.getImageData(0, 0, maxWidth, maxHeight);
        var rect1 = [0, 0, 0, 0];
        this.scanImageArea(rect1, pixels, textDrawer.fontHeight, sampleBottomMargin);
        var left = rect1[0];
        var right = rect1[2];
        var top = rect1[1];
        var bottom = rect1[3];
        var actualWidth = (right - left) + 1;
        var actualHeight = (bottom - top) + 1;
        textDrawer.letterHeightScale = textDrawer.fontHeight / actualHeight;
        // measure offset
        this.render.clearRect(0, 0, maxWidth, maxHeight);
        this.render.setFontSize(textDrawer.fontHeight * textDrawer.letterHeightScale);
        this.render.fillText(textDrawer.mearsureSampleLetter, sampleLeftMargin, maxHeight - sampleBottomMargin);
        var pixels2 = this.render.getImageData(0, 0, maxWidth, maxHeight);
        var rect2 = [0, 0, 0, 0];
        this.scanImageArea(rect2, pixels2, textDrawer.fontHeight, sampleBottomMargin);
        left = rect2[0];
        top = rect2[1];
        right = rect2[2];
        bottom = rect2[3];
        var adjustedWidth = (right - left) + 1;
        var adjustedHeight = (bottom - top) + 1;
        textDrawer.letterOffsetLeft = sampleLeftMargin - left;
        textDrawer.letterOffsetRight = sampleLeftMargin - right;
        textDrawer.letterOffsetTop = (maxHeight - sampleBottomMargin) - top;
        textDrawer.letterOffsetBottom = (maxHeight - sampleBottomMargin) - bottom;
        if (this.debug) {
            this.render.setStrokeColor(this.color2);
            this.render.beginPath();
            this.render.rect(left, top, adjustedWidth, adjustedHeight);
            this.render.stroke();
        }
        this.drawAxis(sampleLeftMargin, maxHeight - sampleBottomMargin, actualHeight);
    };
    CanvasDrawer.prototype.scanImageArea = function (out, imageData, fontHeight, bottomMargin) {
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
    CanvasDrawer.prototype.drawAxis = function (x, y, size) {
        if (!this.debug) {
            return;
        }
        x = Math.floor(x);
        y = Math.floor(y);
        this.render.setStrokeWidth(0);
        this.render.setStrokeColor(this.color2);
        this.render.beginPath();
        this.render.moveTo(x - size, y);
        this.render.lineTo(x, y);
        this.render.stroke();
        this.render.setStrokeColor(this.color3);
        this.render.beginPath();
        this.render.moveTo(x, y);
        this.render.lineTo(x, y + size);
        this.render.stroke();
    };
    CanvasDrawer.prototype.drawImageDrawer = function (imageDrawer) {
        var srcLeft = imageDrawer.sourceRect[0];
        var srcTop = imageDrawer.sourceRect[1];
        var srcWidth = imageDrawer.sourceRect[2] - imageDrawer.sourceRect[0];
        var srcHeight = imageDrawer.sourceRect[3] - imageDrawer.sourceRect[1];
        var destLeft = imageDrawer.location[0];
        var destTop = imageDrawer.location[1];
        var destWidth = srcWidth * imageDrawer.scaling[0];
        var destHeight = srcHeight * imageDrawer.scaling[1];
        var rotation = imageDrawer.rotation;
        var originX = destWidth * imageDrawer.origin[0] * Math.cos(rotation) - destHeight * (-imageDrawer.origin[1]) * Math.sin(rotation);
        var originY = destWidth * imageDrawer.origin[0] * Math.sin(rotation) + destHeight * (-imageDrawer.origin[1]) * Math.cos(rotation);
        var destX = destLeft - originX;
        var destY = destTop + originY;
        this.transformMatrix[0] = Math.cos(rotation) * imageDrawer.scaling[0];
        this.transformMatrix[1] = -Math.sin(rotation) * imageDrawer.scaling[0];
        this.transformMatrix[2] = Math.sin(rotation) * imageDrawer.scaling[1];
        this.transformMatrix[3] = Math.cos(rotation) * imageDrawer.scaling[1];
        this.transformMatrix[4] = destX;
        this.transformMatrix[5] = destY;
        this.render.setTransform(this.transformMatrix);
        this.render.setGlobalAlpha(imageDrawer.alpha);
        this.render.drawImage(imageDrawer.imageData, srcLeft, srcTop, srcWidth, srcHeight, 0.0, 0.0, srcWidth, srcHeight);
        this.render.setGlobalAlpha(1.0);
        this.render.setTransform(this.transformIdentity);
    };
    return CanvasDrawer;
}());
