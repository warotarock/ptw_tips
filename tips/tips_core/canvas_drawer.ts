
enum TextAreaVerticalAlignType {
    top = 1,
    middle = 2,
    bottom = 3,
}

enum TextAreaHorizontalAlignType {
    left = 1,
    center = 2,
    right = 3,
}

class TextArea implements IRecyclableObject {

    recycleIndex: int;
    recycle() {

        this.drawer = null;
    }

    drawer: CanvasDrawer = null;

    text = '';
    mearsureTestLetter = '8';

    isVertical = false;
    verticalTextAlignType = TextAreaVerticalAlignType.bottom;
    horizontalTextAlignType = TextAreaHorizontalAlignType.left;
    fontHeight = 24.0;
    lineSpan = 0.0;

    letterHeightScale = 1.0;
    letterOffsetLeft = 0.0;
    letterOffsetTop = 0.0;
    letterOffsetRight = 0.0;
    letterOffsetBottom = 0.0;

    location: List<float> = [0.0, 0.0, 0.0];
    color: List<float> = [0.0, 0.0, 0.0, 1.0];

    private setRedraw() {

        if (this.drawer != null) {
            this.drawer.setRedraw();
        }
    }

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

class VerticalTextArea extends TextArea{

    isVertical= true;
    mearsureTestLetter = '8';

    verticalTextAlignType = TextAreaVerticalAlignType.top;
    horizontalTextAlignType = TextAreaHorizontalAlignType.right;
}

class HorizontalTextArea extends TextArea {

    isVertical = false;
    mearsureTestLetter = '8';

    verticalTextAlignType = TextAreaVerticalAlignType.top;
    horizontalTextAlignType = TextAreaHorizontalAlignType.left;
}

class CanvasDrawer {

    private mainCanvasContext: CanvasContext = null;
    private measuringCanvasContext: CanvasContext = null;

    private render = new CanvasRender();

    private textAreas = new List<TextArea>();

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

    addTextArea(textArea: TextArea) {

        this.measureActualLetterProfile(textArea);

        textArea.drawer = this;

        this.textAreas.push(textArea);

        this.setRedraw();
    }

    removeTextArea(textArea: TextArea) {

        for (let i = 0; i < this.textAreas.length; i++) {

            if (this.textAreas[i] == textArea) {

                ListRemoveAt(this.textAreas, i);

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

        this.drawTexts();
    }

    private drawTexts() {

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
    }

    private drawVerticalText(textArea: TextArea) {

        var letterHeight = textArea.fontHeight * textArea.letterHeightScale;
        var lineWidth = letterHeight + textArea.lineSpan;
        var lineEnd = '\n';

        var lineText = textArea.text;
        var textLength = lineText.length;

        var topPos = textArea.location[1];
        var x = textArea.location[0];

        let offsetX: float;
        if (textArea.horizontalTextAlignType == TextAreaHorizontalAlignType.right) {
            offsetX = textArea.letterOffsetRight;
        }
        else if (textArea.horizontalTextAlignType == TextAreaHorizontalAlignType.center) {
            offsetX = (textArea.letterOffsetRight - textArea.letterOffsetLeft) / 2.0;
        }
        else {
            offsetX = textArea.letterOffsetLeft;
        }

        var offsetY: float;
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

                let y: float;
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

                    // •¶Žš‚ð‘—‚é
                    y += letterHeight;
                }

                currentIndex = endIndex + 1;
                x -= lineWidth;
            }
        }
    }

    private drawHorizontalText(textArea: TextArea) {

        var letterHeight = textArea.fontHeight * textArea.letterHeightScale;
        var lineHeight = letterHeight + textArea.lineSpan;
        var lineEnd = '\n';

        var x = textArea.location[0];
        var y = textArea.location[1];

        var offsetY: float;
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

                let offsetX: float;
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
    }

    private measureActualLetterProfile(textArea: TextArea) {

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
    }

    private scanRectangle(out: List<number>, imageData: ImageData, fontHeight: float, bottomMargin: int) {

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

    private drawReferentialAxis(x: float, y: float, size: float) {

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
    }
}
