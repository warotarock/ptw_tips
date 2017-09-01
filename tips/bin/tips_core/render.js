var RenderModel = (function () {
    function RenderModel() {
        this.vertexBuffer = null;
        this.indexBuffer = null;
        this.vertexData = null;
        this.indexData = null;
        this.indexCount = 0;
        this.vertexDataStride = 0;
    }
    return RenderModel;
}());
var RenderImage = (function () {
    function RenderImage() {
        this.texture = null;
        this.imageData = null;
    }
    return RenderImage;
}());
var RenderShader = (function () {
    function RenderShader() {
        this.floatPrecisionDefinitionCode = '';
        this.vertexShaderSourceCode = '';
        this.fragmentShaderSourceCode = '';
        this.vertexShader = null;
        this.fragmentShader = null;
        this.program = null;
        this.attribLocationList = new List();
        this.vertexAttribPointerOffset = 0;
        this.uPMatrix = null;
        this.uMVMatrix = null;
    }
    RenderShader.prototype.initializeSourceCode = function (precisionText) {
        this.floatPrecisionDefinitionCode = '#ifdef GL_ES\n precision ' + precisionText + ' float;\n #endif\n';
        this.initializeVertexSourceCode();
        this.initializeFragmentSourceCode();
    };
    RenderShader.prototype.initializeVertexSourceCode = function () {
        // override method
    };
    RenderShader.prototype.initializeFragmentSourceCode = function () {
        // override method
    };
    RenderShader.prototype.initializeAttributes = function (gl) {
        this.initializeAttributes_RenderShader(gl);
    };
    RenderShader.prototype.initializeAttributes_RenderShader = function (gl) {
        this.uPMatrix = this.getUniformLocation('uPMatrix', gl);
        this.uMVMatrix = this.getUniformLocation('uMVMatrix', gl);
    };
    RenderShader.prototype.getAttribLocation = function (name, gl) {
        var attribLocation = gl.getAttribLocation(this.program, name);
        this.attribLocationList.push(attribLocation);
        return attribLocation;
    };
    RenderShader.prototype.getUniformLocation = function (name, gl) {
        return gl.getUniformLocation(this.program, name);
    };
    RenderShader.prototype.setBuffers = function (model, images, gl) {
        // override method
    };
    RenderShader.prototype.enableVertexAttributes = function (gl) {
        for (var i = 0; i < this.attribLocationList.length; i++) {
            gl.enableVertexAttribArray(this.attribLocationList[i]);
        }
    };
    RenderShader.prototype.disableVertexAttributes = function (gl) {
        for (var i = 0; i < this.attribLocationList.length; i++) {
            gl.disableVertexAttribArray(this.attribLocationList[i]);
        }
    };
    RenderShader.prototype.resetVertexAttribPointerOffset = function () {
        this.vertexAttribPointerOffset = 0;
    };
    RenderShader.prototype.vertexAttribPointer = function (indx, size, type, stride, gl) {
        if (type == gl.FLOAT || type == gl.INT) {
            gl.vertexAttribPointer(indx, size, type, false, stride, this.vertexAttribPointerOffset);
            this.vertexAttribPointerOffset += 4 * size;
        }
    };
    RenderShader.prototype.setProjectionMatrix = function (matrix, gl) {
        gl.uniformMatrix4fv(this.uPMatrix, false, matrix);
    };
    RenderShader.prototype.setModelViewMatrix = function (matrix, gl) {
        gl.uniformMatrix4fv(this.uMVMatrix, false, matrix);
    };
    return RenderShader;
}());
var WebGLRenderBlendType;
(function (WebGLRenderBlendType) {
    WebGLRenderBlendType[WebGLRenderBlendType["blend"] = 1] = "blend";
    WebGLRenderBlendType[WebGLRenderBlendType["add"] = 2] = "add";
})(WebGLRenderBlendType || (WebGLRenderBlendType = {}));
var WebGLRender = (function () {
    function WebGLRender() {
        this.gl = null;
        this.floatPrecisionText = '';
        this.currentShader = null;
    }
    WebGLRender.prototype.initializeWebGL = function (canvas) {
        try {
            var option = { preserveDrawingBuffer: true, antialias: true };
            var gl = (canvas.getContext('webgl', option)
                || canvas.getContext('experimental-webgl', option));
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
    };
    WebGLRender.prototype.attach = function (gl) {
        this.gl = gl;
        var format = this.gl.getShaderPrecisionFormat(this.gl.FRAGMENT_SHADER, this.gl.HIGH_FLOAT);
        this.floatPrecisionText = format.precision != 0 ? 'highp' : 'mediump';
        this.resetBasicParameters();
    };
    WebGLRender.prototype.initializeModelBuffer = function (model, vertexData, indexData, vertexDataStride) {
        model.vertexBuffer = this.createVertexBuffer(vertexData, this.gl);
        model.indexBuffer = this.createIndexBuffer(indexData, this.gl);
        model.vertexData = vertexData;
        model.indexData = indexData;
        model.indexCount = indexData.length;
        model.vertexDataStride = vertexDataStride;
    };
    WebGLRender.prototype.createVertexBuffer = function (data, gl) {
        var glBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, glBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        return glBuffer;
    };
    WebGLRender.prototype.createIndexBuffer = function (data, gl) {
        var glBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, glBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        return glBuffer;
    };
    WebGLRender.prototype.initializeImageTexture = function (image) {
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
    };
    WebGLRender.prototype.initializeShader = function (shader) {
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
    };
    WebGLRender.prototype.createShader = function (glslSourceCode, isVertexShader, gl) {
        var shader;
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
        }
        else {
            alert(gl.getShaderInfoLog(shader));
        }
    };
    WebGLRender.prototype.setShader = function (shader) {
        var lastShader = this.currentShader;
        this.gl.useProgram(shader.program);
        this.currentShader = shader;
        if (lastShader != null && lastShader.attribLocationList.length != this.currentShader.attribLocationList.length) {
            lastShader.disableVertexAttributes(this.gl);
        }
    };
    WebGLRender.prototype.setBuffers = function (model, images) {
        this.currentShader.setBuffers(model, images, this.gl);
    };
    WebGLRender.prototype.setProjectionMatrix = function (matrix) {
        this.currentShader.setProjectionMatrix(matrix, this.gl);
    };
    WebGLRender.prototype.setModelViewMatrix = function (matrix) {
        this.currentShader.setModelViewMatrix(matrix, this.gl);
    };
    WebGLRender.prototype.clearColorBufferDepthBuffer = function (r, g, b, a) {
        this.gl.clearColor(r, g, b, a);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    };
    WebGLRender.prototype.clearDepthBuffer = function () {
        this.gl.clear(this.gl.DEPTH_BUFFER_BIT);
    };
    WebGLRender.prototype.resetBasicParameters = function () {
        this.setDepthTest(true);
        this.setDepthMask(true);
        this.setCulling(true);
        this.setBlendType(WebGLRenderBlendType.blend);
    };
    WebGLRender.prototype.setDepthTest = function (enable) {
        var gl = this.gl;
        if (enable) {
            gl.enable(gl.DEPTH_TEST);
        }
        else {
            gl.disable(gl.DEPTH_TEST);
        }
        return this;
    };
    WebGLRender.prototype.setDepthMask = function (enable) {
        this.gl.depthMask(enable);
        return this;
    };
    WebGLRender.prototype.setCulling = function (enable) {
        var gl = this.gl;
        if (enable) {
            gl.enable(gl.CULL_FACE);
        }
        else {
            gl.disable(gl.CULL_FACE);
        }
        return this;
    };
    WebGLRender.prototype.setBlendType = function (blendType) {
        var gl = this.gl;
        gl.enable(gl.BLEND);
        if (blendType == WebGLRenderBlendType.add) {
            gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE, gl.ONE, gl.ONE);
            gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
        }
        else {
            gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE);
            gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
        }
        return this;
    };
    WebGLRender.prototype.drawElements = function (model) {
        this.gl.drawElements(this.gl.TRIANGLES, model.indexCount, this.gl.UNSIGNED_SHORT, 0);
    };
    return WebGLRender;
}());
