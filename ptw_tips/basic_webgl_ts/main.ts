
class GameMain {

    logicalScreenWidth = 640.0;
    logicalScreenHeight = 360.0;

    canvas: HTMLCanvasElement = null;
    gl: WebGLRenderingContext = null;

    render = new WebGLRender();
    shader = new BasicShader();
    modelResource = new RenderModel();
    imageResources = new List<RenderImage>();

    // x, y, z, u, v
    vertexData = [
        0.0, -0.2, 0.20, 0.00, 0.00,
        0.0, 0.20, 0.20, 1.00, 0.00,
        0.0, -0.2, -0.2, 0.00, 1.00,
        0.0, 0.20, -0.2, 1.00, 1.00
    ];

    indexData = [
        0, 1, 2,
        3, 2, 1
    ];

    eyeLocation = vec3.create();
    lookatLocation = vec3.create();
    upVector = vec3.create();

    modelMatrix = mat4.create();
    viewMatrix = mat4.create();
    pMatrix = mat4.create();
    mvMatrix = mat4.create();

    animationTime = 0.0;

    initialize(canvas: HTMLCanvasElement) {

        this.canvas = canvas;
        this.canvas.width = this.logicalScreenWidth;
        this.canvas.height = this.logicalScreenHeight;

        try {
            var option = { preserveDrawingBuffer: true, antialias: true };

            this.gl = <WebGLRenderingContext>(
                canvas.getContext("webgl", option)
                || canvas.getContext("experimental-webgl", option)
            );

            if (this.gl == null) {
                return;
            }
        }
        catch (e) {
            return;
        }

        this.render.attach(this.gl);
        this.render.initializeShader(this.shader);
        this.render.initializeModelBuffer(this.modelResource, this.vertexData, this.indexData);

        var image = new RenderImage();
        this.loadTexture(image, "./texture.png");
        this.imageResources.push(image);
    }

    run() {

        this.animationTime += 1.0;

        vec3.set(this.eyeLocation, 0.6, 0.0, 0.3);
        vec3.set(this.lookatLocation, 0.0, 0.0, 0.0);
        vec3.set(this.upVector, 0.0, 0.0, 1.0);
    }

    draw() {

        var aspect = this.logicalScreenWidth / this.logicalScreenHeight;
        mat4.perspective(this.pMatrix, 45.0 * Math.PI / 180, aspect, 0.0, 5.0);
        //mat4.ortho(this.pMatrix, -aspect * 0.3, aspect * 0.3, -0.3, 0.3, 0.0, 5.0);
        mat4.lookAt(this.viewMatrix, this.eyeLocation, this.lookatLocation, this.upVector);

        this.render.clearColorBufferDepthBuffer(0.0, 0.0, 0.1, 1.0);

        if (this.imageResources[0].texture == null) {
            return;
        }

        this.render.setShader(this.shader);
        this.render.setBuffers(this.modelResource, this.imageResources);
        this.render.setProjectionMatrix(this.pMatrix);

        this.drawModel(this.animationTime * 0.02);
    }

    private drawModel(angle: float) {

        mat4.identity(this.modelMatrix);
        mat4.rotateZ(this.modelMatrix, this.modelMatrix, angle * 3);

        mat4.multiply(this.mvMatrix, this.viewMatrix, this.modelMatrix);

        this.render.setModelViewMatrix(this.mvMatrix);

        this.render.resetBasicParameters();

        this.render.drawElements(this.modelResource);
    }

    private loadTexture(image: RenderImage, url: string) {

        image.imageData = new Image();

        image.imageData.addEventListener("load", () => {
            this.render.initializeImageTexture(image);
        });

        image.imageData.src = url;
    }
}

class BasicShader extends RenderShader {

    aPosition = 0;
    aTexCoord = 0;

    uTexture0: WebGLUniformLocation = null;

    initializeVertexSourceCode() {

        this.vertexShaderSourceCode = ""
            + this.floatPrecisionDefinitionCode

            + "attribute vec3 aPosition;"
            + "attribute vec2 aTexCoord;"

            + "uniform mat4 uPMatrix;"
            + "uniform mat4 uMVMatrix;"

            + "varying vec2 vTexCoord;"

            + "void main(void) {"
            + "	   gl_Position = uPMatrix * uMVMatrix * vec4(aPosition, 1.0);"
            + "    vTexCoord = aTexCoord;"
            + "}";
    }

    initializeFragmentSourceCode() {

        this.fragmentShaderSourceCode = ""
            + this.floatPrecisionDefinitionCode

            + "varying vec2 vTexCoord;"

            + "uniform sampler2D uTexture0;"

            + "void main(void) {"
            + "    gl_FragColor = texture2D(uTexture0, vTexCoord);"
            + "}";
    }

    initializeAttributes(gl: WebGLRenderingContext) {

        this.aPosition = this.getAttribute("aPosition", gl);
        this.aTexCoord = this.getAttribute("aTexCoord", gl);

        this.uPMatrix = this.getUniform("uPMatrix", gl);
        this.uMVMatrix = this.getUniform("uMVMatrix", gl);
        this.uTexture0 = this.getUniform("uTexture0", gl);
    }

    setBuffers(model: RenderModel, images: List<RenderImage>, gl: WebGLRenderingContext) {

        gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);

        gl.enableVertexAttribArray(this.aPosition);
        gl.enableVertexAttribArray(this.aTexCoord);

        gl.vertexAttribPointer(this.aPosition, 3, gl.FLOAT, false, 4 * 5, 0);
        gl.vertexAttribPointer(this.aTexCoord, 2, gl.FLOAT, false, 4 * 5, 12);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, images[0].texture);
        gl.uniform1i(this.uTexture0, 0);
    }
}

var gameMain: GameMain;

window.onload = () => {

    var canvas = <HTMLCanvasElement>document.getElementById("canvas");
    gameMain = new GameMain();
    gameMain.initialize(canvas);

    setTimeout(run, 1000 / 30);
};

function run() {
    gameMain.run();
    gameMain.draw();

    setTimeout(run, 1000 / 30);
}
