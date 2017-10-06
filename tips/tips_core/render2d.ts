
class CanvasContext {

    canvas: HTMLCanvasElement = null;
    context: CanvasRenderingContext2D = null;

    width: float = 0.0;
    height: float = 0.0;

    font: string = '\'Meiryo\'';

    initialize(canvas: HTMLCanvasElement): boolean {

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
    }
}

class CanvasRender {

    private canvasContext: CanvasContext = null;
    private context: CanvasRenderingContext2D = null;

    setContext(canvasContext: CanvasContext) {

        this.canvasContext = canvasContext;
        this.context = canvasContext.context;
    }

    // Canvas wrapper functions

    setImageAntialaing(enable: boolean) {

        this.context.imageSmoothingEnabled = enable;
    }

    setGlobalAlpha(a: float) {

        this.context.globalAlpha = a;
    }

    setFillColor(r: float, g: float, b: float, a: float) {

        this.context.fillStyle = 'rgba(' + (r * 255).toFixed(0) + ',' + (g * 255).toFixed(0) + ',' + (b * 255).toFixed(0) + ',' + (a).toFixed(2) + ')';
    }

    clearRect(left: int, top: int, width: int, height: int) {

        this.context.clearRect(left, top, width, height);
    }

    fillRect(left: int, top: int, width: int, height: int) {

        this.context.fillRect(left, top, width, height);
    }

    fill() {

        this.context.fill();
    }

    setStrokeColor(r: float, g: float, b: float, a: float) {

        this.context.strokeStyle = 'rgba(' + (r * 255).toFixed(0) + ',' + (g * 255).toFixed(0) + ',' + (b * 255).toFixed(0) + ',' + (a).toFixed(2) + ')';
    }

    setStrokeWidth(lineWidth: float) {

        this.context.lineWidth = lineWidth;
    }

    beginPath() {

        this.context.beginPath();
    }

    stroke() {

        this.context.stroke();
    }

    moveTo(x: float, y: float) {

        this.context.moveTo(x, y);
    }

    lineTo(x: float, y: float) {

        this.context.lineTo(x, y);
    }

    rect(x: float, y: float, width: float, height: float) {

        this.context.rect(x, y, width, height);
    }

    fillText(text: string, x: float, y: float) {

        this.context.fillText(text, x, y);
    }

    measureText(text: string): TextMetrics {

        return this.context.measureText(text);
    }

    getImageData(left: int, top: int, width: int, height: int): ImageData {

        return this.context.getImageData(left, top, width, height);
    }

    drawImage(image: HTMLImageElement, sx: float, sy: float, sWidth: float, sHeight: float, dx: float, dy: float, dWidth: float, dHeight: float) {

        this.context.drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
    }

    setTransform(matrix: List<float>) {

        this.context.setTransform(matrix[0], matrix[1], matrix[2], matrix[3], matrix[4], matrix[5]);
    }

    // Additional functions

    setFontSize(height: float) {

        this.context.font = height.toFixed(0) + 'px ' + this.canvasContext.font;
    }

    circle(x: float, y: float, radius: float) {

        this.context.arc(x, y, radius, 0.0, Math.PI * 2.0);
    }
}