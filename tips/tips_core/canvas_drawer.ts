
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
    mearsureSampleLetter = '8';

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

    setTransparency(alpha: float) {

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
    mearsureSampleLetter = 'çë';

    verticalTextAlignType = TextDrawerVerticalAlignType.top;
    horizontalTextAlignType = TextDrawerHorizontalAlignType.right;
}

class HorizontalTextDrawer extends TextDrawer {

    Type = DrawerObjectTypeID.horizontalText;

    isVertical = false;
    mearsureSampleLetter = '8';

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

    setSourceRect(left: float, right: float, width: float, height: float) {

        if (left == this.sourceRect[0] && right == this.sourceRect[1] && width == this.sourceRect[2] && height == this.sourceRect[3]) {

            return;
        }

        this.sourceRect[0] = left;
        this.sourceRect[1] = right;

        this.sourceRect[2] = width;
        this.sourceRect[3] = height;

        this.setRedraw();
    }

    setLocation(x: float, y: float) {

        if (x == this.location[0] && y == this.location[1]) {

            return;
        }

        this.location[0] = x;
        this.location[1] = y;

        this.setRedraw();
    }

    setOrigin(x: float, y: float) {

        if (x == this.origin[0] && y == this.origin[1]) {

            return;
        }

        this.origin[0] = x;
        this.origin[1] = y;

        this.setRedraw();
    }

    setRotation(rotation: float) {

        if (rotation == this.rotation) {

            return;
        }

        this.rotation = rotation;

        this.setRedraw();
    }

    setTransparency(alpha: float) {

        if (alpha == this.alpha) {

            return;
        }

        this.alpha = alpha;

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

    private color1 = [0.0, 0.0, 0.0, 0.2];
    private color2 = [1.0, 0.0, 0.0, 0.3];
    private color3 = [0.0, 0.8, 0.0, 0.3];

    debug = false;

    initialize(canvasWidth: int, canvasHeight: int): boolean {

        try {

            this.initializeMainContext(canvasWidth, canvasHeight);
            this.initializeContextForMeasuring();
        }
        catch (e) {
            return false;
        }

        this.needsRedraw = false;

        return true;
    }

    setRedraw() {

        this.needsRedraw = true;
    }

    isNeededRedraw(): boolean {

        return this.needsRedraw;
    }

    draw() {

        if (!this.needsRedraw) {
            return;
        }

        this.render.setContext(this.mainCanvasContext);

        this.render.clearRect(0, 0, this.mainCanvasContext.width, this.mainCanvasContext.height);

        this.drawObjects(this.mainCanvasContext);

        this.needsRedraw = false;
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

        for (let drawerObject of this.drawerObjects) {

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

        let letterHeight = textDrawer.fontHeight * textDrawer.letterHeightScale;
        let lineWidth = letterHeight + textDrawer.lineSpan;
        let lineEnd = '\n';

        let topPos = textDrawer.location[1];
        let x = textDrawer.location[0];

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

        let offsetY: float;
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

        let currentIndex = 0;
        let allTextLength = textDrawer.text.length;
        while (currentIndex < allTextLength) {

            let endIndex = StringIndexOf(textDrawer.text, lineEnd, currentIndex);
            if (endIndex == -1) {
                endIndex = textDrawer.text.length;
            }

            let lineText = StringSubstring(textDrawer.text, currentIndex, endIndex - currentIndex);
            let lineTextLength = lineText.length;

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

                for (let i = 0; i < lineTextLength; i++) {
                    let letter = StringSubstring(lineText, i, 1);

                    if (this.debug) {
                        let textMetrics = this.render.measureText(letter);
                        this.render.setStrokeColor(this.color1);
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

        let letterHeight = textDrawer.fontHeight * textDrawer.letterHeightScale;
        let lineHeight = letterHeight + textDrawer.lineSpan;
        let lineEnd = '\n';

        let x = textDrawer.location[0];
        let y = textDrawer.location[1];

        let offsetY: float;
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

        let currentIndex = 0;
        let allTextLength = textDrawer.text.length;
        while (currentIndex < allTextLength) {

            let endIndex = StringIndexOf(textDrawer.text, lineEnd, currentIndex);
            if (endIndex == -1) {
                endIndex = textDrawer.text.length;
            }

            let lineText = StringSubstring(textDrawer.text, currentIndex, endIndex - currentIndex);
            let lineTextLength = lineText.length;

            if (lineTextLength > 0) {

                let textMetrics = this.render.measureText(lineText);

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
    }

    private measureActualLetterProfile(textDrawer: TextDrawer) {

        this.render.setContext(this.measuringCanvasContext);

        let maxWidth = this.measuringCanvasContext.width;
        let maxHeight = this.measuringCanvasContext.height;

        let sampleLeftMargin = 5;
        let sampleBottomMargin = 10;

        // measure scaling

        this.render.clearRect(0, 0, maxWidth, maxHeight);
        this.render.setFontSize(textDrawer.fontHeight);
        this.render.fillText(textDrawer.mearsureSampleLetter, sampleLeftMargin, maxHeight - sampleBottomMargin);

        let pixels = this.render.getImageData(0, 0, maxWidth, maxHeight);
        let rect1 = [0, 0, 0, 0];

        this.scanImageArea(rect1, pixels, textDrawer.fontHeight, sampleBottomMargin);
        let left = rect1[0];
        let right = rect1[2];
        let top = rect1[1];
        let bottom = rect1[3];

        let actualWidth = (right - left) + 1;
        let actualHeight = (bottom - top) + 1;
        textDrawer.letterHeightScale = textDrawer.fontHeight / actualHeight;

        // measure offset

        this.render.clearRect(0, 0, maxWidth, maxHeight);
        this.render.setFontSize(textDrawer.fontHeight * textDrawer.letterHeightScale);
        this.render.fillText(textDrawer.mearsureSampleLetter, sampleLeftMargin, maxHeight - sampleBottomMargin);

        let pixels2 = this.render.getImageData(0, 0, maxWidth, maxHeight);
        let rect2 = [0, 0, 0, 0];

        this.scanImageArea(rect2, pixels2, textDrawer.fontHeight, sampleBottomMargin);
        left = rect2[0];
        top = rect2[1];
        right = rect2[2];
        bottom = rect2[3];

        let adjustedWidth = (right - left) + 1;
        let adjustedHeight = (bottom - top) + 1;

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
    }

    private scanImageArea(out: List<number>, imageData: ImageData, fontHeight: float, bottomMargin: int) {

        let data = imageData.data;

        let lineByteLength = 4 * imageData.width;
        let limitByteOffset = data.length - Math.floor(fontHeight * 1.05) * lineByteLength;

        if (limitByteOffset < 0) {
            return 1.0
        }

        let left = imageData.width;
        let top = imageData.height;
        let right = 0;
        let bottom = 0;

        let yLimit: int = Math.floor(imageData.height - bottomMargin - fontHeight * 1.05);

        for (let x = 0; x < imageData.width; x++) {

            for (let y = imageData.height - 1; y >= yLimit; y--) {

                let alpha = data[(y * 4 * imageData.width) + (x * 4) + 3];

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
    }

    private drawImageDrawer(imageDrawer: ImageDrawer) {

        let srcLeft = imageDrawer.sourceRect[0];
        let srcTop = imageDrawer.sourceRect[1];
        let srcWidth = imageDrawer.sourceRect[2] - imageDrawer.sourceRect[0];
        let srcHeight = imageDrawer.sourceRect[3] - imageDrawer.sourceRect[1];

        let destLeft = imageDrawer.location[0];
        let destTop = imageDrawer.location[1];
        let destWidth = srcWidth * imageDrawer.scaling[0];
        let destHeight = srcHeight * imageDrawer.scaling[1];

        let rotation = imageDrawer.rotation;

        let originX = destWidth * imageDrawer.origin[0] * Math.cos(rotation) - destHeight * (-imageDrawer.origin[1]) * Math.sin(rotation);
        let originY = destWidth * imageDrawer.origin[0] * Math.sin(rotation) + destHeight * (-imageDrawer.origin[1]) * Math.cos(rotation);

        let destX = destLeft - originX;
        let destY = destTop + originY;

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
