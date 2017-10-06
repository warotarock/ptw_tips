

enum DrawerObjectTypeID {

    none = 0,
    verticalText = 1,
    horizontalText = 2,
    image = 3,
}

class DrawerObject implements IRecyclableObject {

    Type = DrawerObjectTypeID.none;

    recycleIndex: int;
    recycle() {

        this.drawer = null;
    }

    drawer: CanvasDrawer = null;

    protected setRedraw() {

        if (this.drawer != null) {
            this.drawer.setRedraw();
        }
    }
}

enum TextDrawerVerticalAlignType {
    top = 1,
    middle = 2,
    bottom = 3,
}

enum TextDrawerHorizontalAlignType {
    left = 1,
    center = 2,
    right = 3,
}

class TextDrawer extends DrawerObject {

    text = '';
    mearsureTestLetter = '8';

    isVertical = false;
    verticalTextAlignType = TextDrawerVerticalAlignType.bottom;
    horizontalTextAlignType = TextDrawerHorizontalAlignType.left;
    fontHeight = 24.0;
    lineSpan = 0.0;

    letterHeightScale = 1.0;
    letterOffsetLeft = 0.0;
    letterOffsetTop = 0.0;
    letterOffsetRight = 0.0;
    letterOffsetBottom = 0.0;

    location: List<float> = [0.0, 0.0, 0.0];
    color: List<float> = [0.0, 0.0, 0.0, 1.0];

    setText(text: string) {

        if (text == this.text) {

            return;
        }

        this.text = text;

        this.setRedraw();
    }

    setLocation(x: float, y: float) {

        if (x == this.location[0] && y == this.location[1]){

            return;
        }

        this.location[0] = x;
        this.location[1] = y;

        this.setRedraw();
    }

    setColor(r: float, g: float, b: float) {

        if (r == this.color[0] && g == this.color[1] && b == this.color[2]) {

            return;
        }

        this.color[0] = r;
        this.color[1] = g;
        this.color[2] = b;

        this.setRedraw();
    }

    setAlpha(alpha: float) {

        if (alpha == this.color[3]) {

            return;
        }

        this.color[3] = alpha;

        this.setRedraw();
    }
}

class VerticalTextDrawer extends TextDrawer{

    Type = DrawerObjectTypeID.verticalText;

    isVertical= true;
    mearsureTestLetter = 'çë';

    verticalTextAlignType = TextDrawerVerticalAlignType.top;
    horizontalTextAlignType = TextDrawerHorizontalAlignType.right;
}

class HorizontalTextDrawer extends TextDrawer {

    Type = DrawerObjectTypeID.horizontalText;

    isVertical = false;
    mearsureTestLetter = '8';

    verticalTextAlignType = TextDrawerVerticalAlignType.top;
    horizontalTextAlignType = TextDrawerHorizontalAlignType.left;
}

class ImageDrawer extends DrawerObject {

    Type = DrawerObjectTypeID.image;

    imageData: HTMLImageElement = null;

    sourceRect: List<float> = [0.0, 0.0, 0.0, 0.0];

    origin: List<float> = [0.0, 0.0, 0.0];

    location: List<float> = [0.0, 0.0, 0.0];
    scaling: List<float> = [1.0, 1.0, 1.0];
    rotation = 0.0;
    alpha = 1.0;

    setImage(imageData: HTMLImageElement) {

        this.imageData = imageData;
        this.sourceRect[0] = 0.0;
        this.sourceRect[1] = 0.0;
        this.sourceRect[2] = imageData.width;
        this.sourceRect[3] = imageData.height;

        this.setRedraw();
    }

    setRotation(rotation: float) {

        if (rotation == this.rotation) {

            return;
        }

        this.rotation = rotation;

        this.setRedraw();
    }
}

class CanvasDrawer {

    private mainCanvasContext: CanvasContext = null;
    private measuringCanvasContext: CanvasContext = null;

    private render = new CanvasRender();
    private transformMatrix = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0]; // x1, y1, x2, y2, tx, ty
    private transformIdentity = [1.0, 0.0, 0.0, 1.0, 0.0, 0.0];

    private drawerObjects = new List<DrawerObject>();

    private needsRedraw = false;
    private redrawCommited = false;

    debug = false;

    initialize(screenWidth: int, screenHeight: int): boolean {

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
    }

    setRedraw() {

        this.needsRedraw = true;
    }

    commitRedraw() {

        if (this.needsRedraw) {
            this.redrawCommited = true;
        }
    }

    isRedrawCommited(): boolean {

        return this.redrawCommited;
    }

    draw() {

        if (!this.redrawCommited) {
            return;
        }

        this.render.setContext(this.mainCanvasContext);

        this.render.clearRect(0, 0, this.mainCanvasContext.width, this.mainCanvasContext.height);

        this.drawObjects(this.mainCanvasContext);

        this.needsRedraw = false;
        this.redrawCommited = false;
    }

    addTextDrawer(textDrawer: TextDrawer) {

        this.measureActualLetterProfile(textDrawer);

        textDrawer.drawer = this;

        this.drawerObjects.push(textDrawer);

        this.setRedraw();
    }

    addImageDrawer(imageDrawer: ImageDrawer) {

        imageDrawer.drawer = this;

        this.drawerObjects.push(imageDrawer);

        this.setRedraw();
    }

    removeObject(drawerObject: DrawerObject) {

        for (let i = 0; i < this.drawerObjects.length; i++) {

            if (this.drawerObjects[i] == drawerObject) {

                ListRemoveAt(this.drawerObjects, i);

                this.setRedraw();

                break;
            }
        }
    }

    getCanvas(): HTMLCanvasElement {

        return this.mainCanvasContext.canvas;
    }

    getMeasuringCanvas(): HTMLCanvasElement {

        return this.measuringCanvasContext.canvas;
    }

    private initializeMainContext(canvasWidth: int, canvasHeight: int) {

        let measuringCanvas = <HTMLCanvasElement>document.createElement('canvas');
        measuringCanvas.width = canvasWidth;
        measuringCanvas.height = canvasHeight;

        this.mainCanvasContext = new CanvasContext();
        this.mainCanvasContext.initialize(measuringCanvas);
    }

    private initializeContextForMeasuring() {

        let measuringCanvas = <HTMLCanvasElement>document.createElement('canvas');
        measuringCanvas.width = 100;
        measuringCanvas.height = 100;

        this.measuringCanvasContext = new CanvasContext();
        this.measuringCanvasContext.initialize(measuringCanvas);
    }

    private drawObjects(canvasContext: CanvasContext) {

        for (var i = 0; i < this.drawerObjects.length; i++) {
            var drawerObject = this.drawerObjects[i];

            if (drawerObject.Type == DrawerObjectTypeID.verticalText || drawerObject.Type == DrawerObjectTypeID.horizontalText) {

                let textDrawer = <TextDrawer>drawerObject;

                if (textDrawer.isVertical) {

                    this.drawVerticalTextDrawer(textDrawer);
                }
                else {

                    this.drawHorizontalTextDrawer(textDrawer);
                }
            }
            else if (drawerObject.Type == DrawerObjectTypeID.image) {

                let imageDrawer = <ImageDrawer>drawerObject;

                this.drawImageDrawer(imageDrawer);
            }
        }
    }

    private drawVerticalTextDrawer(textDrawer: TextDrawer) {

        var letterHeight = textDrawer.fontHeight * textDrawer.letterHeightScale;
        var lineWidth = letterHeight + textDrawer.lineSpan;
        var lineEnd = '\n';

        var lineText = textDrawer.text;
        var textLength = lineText.length;

        var topPos = textDrawer.location[1];
        var x = textDrawer.location[0];

        let offsetX: float;
        if (textDrawer.horizontalTextAlignType == TextDrawerHorizontalAlignType.right) {

            offsetX = textDrawer.letterOffsetLeft + textDrawer.letterOffsetRight;
        }
        else if (textDrawer.horizontalTextAlignType == TextDrawerHorizontalAlignType.center) {

            offsetX = textDrawer.letterOffsetLeft + Math.floor((textDrawer.letterOffsetRight - textDrawer.letterOffsetLeft) / 2.0 - 1.0);
        }
        else {

            offsetX = textDrawer.letterOffsetLeft;
        }

        var offsetY: float;
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
        this.render.setFillColor(textDrawer.color[0], textDrawer.color[1], textDrawer.color[2], textDrawer.color[3]);

        var currentIndex = 0;
        var textLength = textDrawer.text.length;
        while (currentIndex < textLength) {

            var endIndex = StringIndexOf(textDrawer.text, lineEnd, currentIndex);
            if (endIndex == -1) {
                endIndex = textDrawer.text.length;
            }

            var lineText = StringSubstring(textDrawer.text, currentIndex, endIndex - currentIndex);
            var lineTextLength = lineText.length;

            if (lineTextLength > 0) {

                let y: float;
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
                        this.render.setStrokeColor(0.0, 0.0, 0.0, 0.2);
                        this.render.beginPath();
                        this.render.rect(x + offsetX, y + offsetY, textMetrics.width, 1);
                        this.render.stroke();
                    }

                    this.render.fillText(letter, x + offsetX, y + offsetY);

                    this.drawAxis(x, y, letterHeight);

                    // ï∂éöÇëóÇÈ
                    y += letterHeight;
                }

                currentIndex = endIndex + 1;
                x -= lineWidth;
            }
        }
    }

    private drawHorizontalTextDrawer(textDrawer: TextDrawer) {

        var letterHeight = textDrawer.fontHeight * textDrawer.letterHeightScale;
        var lineHeight = letterHeight + textDrawer.lineSpan;
        var lineEnd = '\n';

        var x = textDrawer.location[0];
        var y = textDrawer.location[1];

        var offsetY: float;
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
        this.render.setFillColor(textDrawer.color[0], textDrawer.color[1], textDrawer.color[2], textDrawer.color[3]);

        var currentIndex = 0;
        var textLength = textDrawer.text.length;
        while (currentIndex < textLength) {

            var endIndex = StringIndexOf(textDrawer.text, lineEnd, currentIndex);
            if (endIndex == -1) {
                endIndex = textDrawer.text.length;
            }

            var lineText = StringSubstring(textDrawer.text, currentIndex, endIndex - currentIndex);
            var lineTextLength = lineText.length;

            if (lineTextLength > 0) {

                var textMetrics = this.render.measureText(lineText);

                let offsetX: float;
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
                    this.render.setStrokeColor(0.0, 0.0, 0.0, 0.2);
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
    }

    private measureActualLetterProfile(textDrawer: TextDrawer) {

        this.render.setContext(this.measuringCanvasContext);

        var maxWidth = this.measuringCanvasContext.width;
        var maxHeight = this.measuringCanvasContext.height;

        var sampleLeftMargin = 5;
        var sampleBottomMargin = 10;

        // measure scaling

        this.render.clearRect(0, 0, maxWidth, maxHeight);
        this.render.setFontSize(textDrawer.fontHeight);
        this.render.fillText(textDrawer.mearsureTestLetter, sampleLeftMargin, maxHeight - sampleBottomMargin);

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
        this.render.fillText(textDrawer.mearsureTestLetter, sampleLeftMargin, maxHeight - sampleBottomMargin);

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
            this.render.setStrokeColor(1.0, 0.0, 0.0, 0.2);
            this.render.beginPath();
            this.render.rect(left, top, adjustedWidth, adjustedHeight);
            this.render.stroke();
        }

        this.drawAxis(sampleLeftMargin, maxHeight - sampleBottomMargin, actualHeight);
    }

    private scanImageArea(out: List<number>, imageData: ImageData, fontHeight: float, bottomMargin: int) {

        var data = imageData.data;

        var lineByteLength = 4 * imageData.width;
        var limitByteOffset = data.length - Math.floor(fontHeight * 1.05) * lineByteLength;

        if (limitByteOffset < 0) {
            return 1.0
        }

        var left = imageData.width;
        var top = imageData.height;
        var right = 0;
        var bottom = 0;

        let yLimit: int = Math.floor(imageData.height - bottomMargin - fontHeight * 1.05);

        for (let x = 0; x < imageData.width; x++) {

            for (let y = imageData.height - 1; y >= yLimit; y--) {

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
    }

    private drawAxis(x: float, y: float, size: float) {

        if (!this.debug) {
            return;
        }

        x = Math.floor(x);
        y = Math.floor(y);

        this.render.setStrokeWidth(0);

        this.render.setStrokeColor(1.0, 0.0, 0.0, 0.5);
        this.render.beginPath();
        this.render.moveTo(x - size, y);
        this.render.lineTo(x, y);
        this.render.stroke();

        this.render.setStrokeColor(0.0, 0.8, 0.0, 0.5);
        this.render.beginPath();
        this.render.moveTo(x, y);
        this.render.lineTo(x, y + size);
        this.render.stroke();
    }

    private drawImageDrawer(imageDrawer: ImageDrawer) {

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
    }
}
