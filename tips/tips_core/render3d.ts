
class RenderModel {

    vertexBuffer: WebGLBuffer = null;
    indexBuffer: WebGLBuffer = null;

    vertexData: List<float> = null;
    indexData: List<float> = null;
    indexCount: int = 0;
    vertexDataStride: int = 0;
}

class RenderImage {

    width = 0;
    height = 0;

    texture: WebGLTexture = null;

    imageData: HTMLImageElement = null;
}

class RenderShader {

    floatPrecisionDefinitionCode = '';
    vertexShaderSourceCode = '';
    fragmentShaderSourceCode = '';

    vertexShader: WebGLShader = null;
    fragmentShader: WebGLShader = null;
    program: WebGLProgram = null;

    attribLocationList = new List<int>();
    vertexAttribPointerOffset = 0;

    uPMatrix: WebGLUniformLocation = null;
    uMVMatrix: WebGLUniformLocation = null;

    initializeSourceCode(precisionText: string) {

        this.floatPrecisionDefinitionCode = '#ifdef GL_ES\n precision ' + precisionText + ' float;\n #endif\n';

        this.initializeVertexSourceCode();

        this.initializeFragmentSourceCode();
    }

    protected initializeVertexSourceCode() {

        // Override method
    }

    protected initializeFragmentSourceCode() {

        // Override method
    }

    initializeAttributes(gl: WebGLRenderingContext) {

        this.initializeAttributes_RenderShader(gl);
    }

    initializeAttributes_RenderShader(gl: WebGLRenderingContext) {

        this.uPMatrix = this.getUniformLocation('uPMatrix', gl);
        this.uMVMatrix = this.getUniformLocation('uMVMatrix', gl);
    }

    protected getAttribLocation(name: string, gl: WebGLRenderingContext): int {

        var attribLocation = gl.getAttribLocation(this.program, name);
        this.attribLocationList.push(attribLocation);

        return attribLocation;
    }

    protected getUniformLocation(name: string, gl: WebGLRenderingContext): WebGLUniformLocation {

        return gl.getUniformLocation(this.program, name);
    }

    setBuffers(model: RenderModel, images: List<RenderImage>, gl: WebGLRenderingContext) {

        // Override method
    }

    enableVertexAttributes(gl: WebGLRenderingContext) {

        for (var i = 0; i < this.attribLocationList.length; i++) {
            gl.enableVertexAttribArray(this.attribLocationList[i]);
        }
    }

    disableVertexAttributes(gl: WebGLRenderingContext) {

        for (var i = 0; i < this.attribLocationList.length; i++) {
            gl.disableVertexAttribArray(this.attribLocationList[i]);
        }
    }

    resetVertexAttribPointerOffset() {
        this.vertexAttribPointerOffset = 0;
    }

    vertexAttribPointer(indx: number, size: number, type: number, stride: number, gl: WebGLRenderingContext) {

        if (type == gl.FLOAT || type == gl.INT) {
            gl.vertexAttribPointer(indx, size, type, false, stride, this.vertexAttribPointerOffset);
            this.vertexAttribPointerOffset += 4 * size;
        }
    }

    setProjectionMatrix(matrix: Mat4, gl: WebGLRenderingContext) {

        gl.uniformMatrix4fv(this.uPMatrix, false, matrix);
    }

    setModelViewMatrix(matrix: Mat4, gl: WebGLRenderingContext) {

        gl.uniformMatrix4fv(this.uMVMatrix, false, matrix);
    }
}

enum WebGLRenderBlendType {
    blend = 1,
    add = 2,
}

class WebGLRender {

    gl: WebGLRenderingContext = null;
    floatPrecisionText: string = '';

    currentShader: RenderShader = null;

    initializeWebGL(canvas: HTMLCanvasElement): boolean {

        try {
            var option = { preserveDrawingBuffer: true, antialias: true };

            var gl = <WebGLRenderingContext>(
                canvas.getContext('webgl', option)
                || canvas.getContext('experimental-webgl', option)
            );

            if (gl != null) {
                this.attach(gl);
            }
            else {
                throw ("Faild to initialize WebGL.");
            }
        }
        catch (e) {
            return true;
        }

        return false;
    }

    attach(gl: WebGLRenderingContext) {

        this.gl = gl;

        var format = this.gl.getShaderPrecisionFormat(this.gl.FRAGMENT_SHADER, this.gl.HIGH_FLOAT);
        this.floatPrecisionText = format.precision != 0 ? 'highp' : 'mediump';

        this.resetBasicParameters();
    }

    initializeModelBuffer(model: RenderModel, vertexData: List<float>, indexData: List<int>, vertexDataStride: int) {

        model.vertexBuffer = this.createVertexBuffer(vertexData, this.gl);
        model.indexBuffer = this.createIndexBuffer(indexData, this.gl);

        model.vertexData = vertexData;
        model.indexData = indexData;
        model.indexCount = indexData.length;
        model.vertexDataStride = vertexDataStride;
    }

    private createVertexBuffer(data: List<float>, gl: WebGLRenderingContext): WebGLBuffer {

        var glBuffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, glBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        return glBuffer;
    }

    private createIndexBuffer(data: List<int>, gl: WebGLRenderingContext): WebGLBuffer {

        var glBuffer = gl.createBuffer();

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, glBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

        return glBuffer;
    }

    releaseModelBuffer(model: RenderModel) {

        var gl = this.gl;

        if (model.vertexBuffer != null) {

            gl.bindBuffer(gl.ARRAY_BUFFER, null);

            gl.deleteBuffer(model.vertexBuffer);

            model.vertexBuffer = null;
        }

        if (model.indexBuffer != null) {

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

            gl.deleteBuffer(model.indexBuffer);

            model.indexBuffer = null;
        }
    }

    initializeImageTexture(image: RenderImage) {

        var gl = this.gl;

        var glTexture = gl.createTexture();

        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
        gl.bindTexture(gl.TEXTURE_2D, glTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image.imageData);

        gl.generateMipmap(gl.TEXTURE_2D);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

        gl.bindTexture(gl.TEXTURE_2D, null);

        image.texture = glTexture;
        image.width = image.imageData.width;
        image.height = image.imageData.height;
    }

    releaseImageTexture(image: RenderImage) {

        var gl = this.gl;

        if (image.texture != null) {

            gl.bindTexture(gl.TEXTURE_2D, null);

            gl.deleteTexture(image.texture);

            image.texture = null;
        }
    }

    setTextureImageFromCanvas(image: RenderImage, canvas: HTMLCanvasElement) {

        var gl = this.gl;

        gl.bindTexture(gl.TEXTURE_2D, image.texture);

        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, canvas);

        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    initializeShader(shader: RenderShader) {

        var gl = this.gl;

        shader.initializeSourceCode(this.floatPrecisionText);

        var program = gl.createProgram();
        var vertexShader = this.createShader(shader.vertexShaderSourceCode, true, gl);
        var fragmentShader = this.createShader(shader.fragmentShaderSourceCode, false, gl);

        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (gl.getProgramParameter(program, gl.LINK_STATUS)) {

            shader.program = program;
            shader.vertexShader = vertexShader;
            shader.fragmentShader = fragmentShader;

            shader.initializeAttributes(gl);

            return program;
        }
        else {
            alert(gl.getProgramInfoLog(program));
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

    releaseShader(shader: RenderShader) {

        var gl = this.gl;

        if (shader.program != null) {

            gl.useProgram(null);

            gl.detachShader(shader.program, shader.vertexShader);
            gl.deleteShader(shader.vertexShader);
            shader.vertexShader = null;

            gl.detachShader(shader.program, shader.fragmentShader);
            gl.deleteShader(shader.fragmentShader);
            shader.fragmentShader = null;

            gl.deleteShader(shader.program);
            shader.program = null;
        }
    }

    setShader(shader: RenderShader) {

        var lastShader = this.currentShader;

        this.gl.useProgram(shader.program);
        this.currentShader = shader;

        if (lastShader != null && lastShader.attribLocationList.length != this.currentShader.attribLocationList.length) {
            lastShader.disableVertexAttributes(this.gl);
        }
    }

    setBuffers(model: RenderModel, images: List<RenderImage>) {

        this.currentShader.setBuffers(model, images, this.gl);
    }

    setProjectionMatrix(matrix: Mat4) {

        this.currentShader.setProjectionMatrix(matrix, this.gl);
    }

    setModelViewMatrix(matrix: Mat4) {

        this.currentShader.setModelViewMatrix(matrix, this.gl);
    }

    clearColorBufferDepthBuffer(r: float, g: float, b: float, a: float) {

        this.gl.clearColor(r, g, b, a);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }

    clearDepthBuffer() {

        this.gl.clear(this.gl.DEPTH_BUFFER_BIT);
    }

    resetBasicParameters() {

        this.setDepthTest(true);
        this.setDepthMask(true);
        this.setCulling(true);
        this.setBlendType(WebGLRenderBlendType.blend);
    }

    setDepthTest(enable: boolean): WebGLRender {

        var gl = this.gl;

        if (enable) {
            gl.enable(gl.DEPTH_TEST);
        }
        else {
            gl.disable(gl.DEPTH_TEST);
        }

        return this;
    }

    setDepthMask(enable: boolean): WebGLRender {

        this.gl.depthMask(enable);

        return this;
    }

    setCulling(enable: boolean): WebGLRender {

        var gl = this.gl;

        if (enable) {
            gl.enable(gl.CULL_FACE);
        }
        else {
            gl.disable(gl.CULL_FACE);
        }

        return this;
    }

    setBlendType(blendType: WebGLRenderBlendType): WebGLRender {

        var gl = this.gl;

        gl.enable(gl.BLEND);

        if (blendType == WebGLRenderBlendType.add) {
            gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE, gl.ONE, gl.ONE);
            gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD)
        }
        else {
            gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE);
            gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
        }

        return this;
    }

    drawElements(model: RenderModel) {
        this.gl.drawElements(this.gl.TRIANGLES, model.indexCount, this.gl.UNSIGNED_SHORT, 0);
    }
}
