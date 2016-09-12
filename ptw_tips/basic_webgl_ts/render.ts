
class RenderModel {

    vertexData: Array<number> = null;
    indexData: Array<number> = null;

    vertexBuffer: WebGLBuffer = null;
    indexBuffer: WebGLBuffer = null;
}

class RenderImage {

    imageData: HTMLImageElement = null;
    texture: WebGLTexture = null;
}

class RenderShader {

    floatPrecisionDefinitionCode: string = "";
    vertexShaderSourceCode = "";
    fragmentShaderSourceCode = "";

    vertexShader: WebGLShader = null;
    fragmentShader: WebGLShader = null;
    program: WebGLProgram = null;

    AttribLocationList = new List<int>();

    uPMatrix: WebGLUniformLocation = null;
    uMVMatrix: WebGLUniformLocation = null;

    initializeSourceCode(precisionText: string) {

        this.floatPrecisionDefinitionCode = "#ifdef GL_ES\n precision " + precisionText + " float;\n #endif\n";

        this.initializeVertexSourceCode();

        this.initializeFragmentSourceCode();
    }

    protected initializeVertexSourceCode() {
        // override method
    }

    protected initializeFragmentSourceCode() {
        // override method
    }

    initializeAttributes(gl: WebGLRenderingContext) {
        // override method
    }

    protected getAttribute(name: string, gl: WebGLRenderingContext): int {

        var attribLocation = gl.getAttribLocation(this.program, name);
        this.AttribLocationList.push(attribLocation);

        return attribLocation;
    }

    protected getUniform(name: string, gl: WebGLRenderingContext): WebGLUniformLocation {

        return gl.getUniformLocation(this.program, name);
    }

    setBuffers(model: RenderModel, images: List<RenderImage>, gl: WebGLRenderingContext) {
        // override methodr
    }
}

class WebGLRender {

    gl: WebGLRenderingContext = null;
    floatPrecisionText: string = "";

    currentShader: RenderShader = null;

    attach(gl: WebGLRenderingContext) {

        this.gl = gl;

        var format = this.gl.getShaderPrecisionFormat(this.gl.FRAGMENT_SHADER, this.gl.HIGH_FLOAT);
        this.floatPrecisionText = format.precision != 0 ? "highp" : "mediump";
    }

    initializeModelBuffer(model: RenderModel, vertexData: Array<float>, indexData: Array<int>) {

        model.vertexData = vertexData;
        model.vertexBuffer = this.createVertexBuffer(vertexData, this.gl);

        model.indexData = indexData;
        model.indexBuffer = this.createIndexBuffer(indexData, this.gl);
    }

    private createVertexBuffer(data: Array<float>, gl: WebGLRenderingContext) {

        var vertexBuffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        return vertexBuffer;
    }

    private createIndexBuffer(data: Array<int>, gl: WebGLRenderingContext) {

        var indexBuffer = gl.createBuffer();

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

        return indexBuffer;
    }

    initializeImageTexture(image: RenderImage) {

        var tex = this.gl.createTexture();

        this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image.imageData);
        this.gl.generateMipmap(this.gl.TEXTURE_2D);
        this.gl.bindTexture(this.gl.TEXTURE_2D, null);

        image.texture = tex;
    }

    initializeShader(shader: RenderShader) {

        shader.initializeSourceCode(this.floatPrecisionText);

        var program = this.gl.createProgram();
        var vertexShader = this.createShader(shader.vertexShaderSourceCode, true, this.gl);
        var fragmentShader = this.createShader(shader.fragmentShaderSourceCode, false, this.gl);

        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);

        if (this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {

            shader.program = program;
            shader.vertexShader = vertexShader;
            shader.fragmentShader = fragmentShader;

            shader.initializeAttributes(this.gl);

            return program;
        }
        else {
            alert(this.gl.getProgramInfoLog(program));
        }
    }

    private createShader(glslSourceCode: string, isVertexShader: boolean, gl: WebGLRenderingContext): WebGLShader {

        var shader: WebGLShader;
        if (isVertexShader) {
            shader = gl.createShader(gl.VERTEX_SHADER);
        }
        else {
            shader = gl.createShader(gl.FRAGMENT_SHADER);
        }

        gl.shaderSource(shader, glslSourceCode);

        gl.compileShader(shader);

        if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            return shader;
        } else {
            alert(gl.getShaderInfoLog(shader));
        }
    }

    setShader(shader: RenderShader) {

        this.gl.useProgram(shader.program);
        this.currentShader = shader;
    }

    setBuffers(model: RenderModel, images: List<RenderImage>) {

        this.currentShader.setBuffers(model, images, this.gl);
    }

    setProjectionMatrix(matrix: Mat4) {

        this.gl.uniformMatrix4fv(this.currentShader.uPMatrix, false, matrix);
    }

    setModelViewMatrix(matrix: Mat4) {

        this.gl.uniformMatrix4fv(this.currentShader.uMVMatrix, false, matrix);
    }

    clearColorBufferDepthBuffer(r: float, g: float, b: float, a: float) {

        this.gl.clearColor(r, g, b, a);
        this.gl.clearDepth(1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }

    resetBasicParameters() {

        var gl = this.gl;

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);
        gl.enable(gl.BLEND);
        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE, gl.ONE, gl.ONE);
        gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
    }

    drawElements(model: RenderModel) {
        this.gl.drawElements(this.gl.TRIANGLES, model.indexData.length, this.gl.UNSIGNED_SHORT, 0);
    }
}

