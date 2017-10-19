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
var BasicWebGL;
(function (BasicWebGL) {
    var Main = (function () {
        function Main() {
            this.logicalScreenWidth = 640.0;
            this.logicalScreenHeight = 360.0;
            this.render = new WebGLRender();
            this.shader = new SampleShader();
            this.model = new RenderModel();
            this.images = new List();
            this.eyeLocation = vec3.create();
            this.lookatLocation = vec3.create();
            this.upVector = vec3.create();
            this.modelMatrix = mat4.create();
            this.viewMatrix = mat4.create();
            this.modelViewMatrix = mat4.create();
            this.projectionMatrix = mat4.create();
            // x, y, z, u, v
            this.vertexData = [
                0.0, -0.2, 0.20, 0.00, 1.00,
                0.0, 0.20, 0.20, 1.00, 1.00,
                0.0, -0.2, -0.2, 0.00, 0.00,
                0.0, 0.20, -0.2, 1.00, 0.00
            ];
            this.indexData = [
                0, 1, 2,
                3, 2, 1
            ];
            this.animationTime = 0.0;
            this.isLoaded = false;
        }
        Main.prototype.initialize = function (canvas) {
            canvas.width = this.logicalScreenWidth;
            canvas.height = this.logicalScreenHeight;
            if (this.render.initializeWebGL(canvas)) {
                return;
            }
            this.render.initializeShader(this.shader);
            this.render.initializeModelBuffer(this.model, this.vertexData, this.indexData, 4 * 5); // 4 (=size of float) * 5 (=x, y, z, u, v)
            var image = new RenderImage();
            this.loadTexture(image, './texture.png');
            this.images.push(image);
        };
        Main.prototype.processLoading = function () {
            // Waiting for loading data
            if (this.images[0].texture == null) {
                return;
            }
            // Loading finished
            this.isLoaded = true;
        };
        Main.prototype.run = function () {
            this.animationTime += 1.0;
            // Camera position
            vec3.set(this.eyeLocation, 0.6, 0.0, 0.3);
            vec3.set(this.lookatLocation, 0.0, 0.0, 0.0);
            vec3.set(this.upVector, 0.0, 0.0, 1.0);
            // Object animation
            mat4.identity(this.modelMatrix);
            mat4.rotateZ(this.modelMatrix, this.modelMatrix, this.animationTime * 0.02);
        };
        Main.prototype.draw = function () {
            var aspect = this.logicalScreenWidth / this.logicalScreenHeight;
            mat4.perspective(this.projectionMatrix, 45.0 * Math.PI / 180, aspect, 0.1, 2.0);
            mat4.lookAt(this.viewMatrix, this.eyeLocation, this.lookatLocation, this.upVector);
            this.render.setDepthTest(false);
            this.render.setCulling(false);
            this.render.clearColorBufferDepthBuffer(0.0, 0.0, 0.1, 1.0);
            this.drawModel(this.modelMatrix, this.model, this.images);
        };
        Main.prototype.drawModel = function (modelMatrix, model, images) {
            mat4.multiply(this.modelViewMatrix, this.viewMatrix, modelMatrix);
            this.render.setShader(this.shader);
            this.render.setProjectionMatrix(this.projectionMatrix);
            this.render.setModelViewMatrix(this.modelViewMatrix);
            this.render.setBuffers(model, images);
            this.render.setDepthTest(true);
            this.render.setCulling(false);
            this.render.drawElements(model);
        };
        Main.prototype.loadTexture = function (resultImage, url) {
            var _this = this;
            resultImage.imageData = new Image();
            resultImage.imageData.addEventListener('load', function () {
                _this.render.initializeImageTexture(resultImage);
            });
            resultImage.imageData.src = url;
        };
        return Main;
    }());
    var SampleShader = (function (_super) {
        __extends(SampleShader, _super);
        function SampleShader() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.aPosition = -1;
            _this.aTexCoord = -1;
            _this.uTexture0 = null;
            return _this;
        }
        SampleShader.prototype.initializeVertexSourceCode = function () {
            this.vertexShaderSourceCode = ''
                + this.floatPrecisionDefinitionCode
                + 'attribute vec3 aPosition;'
                + 'attribute vec2 aTexCoord;'
                + 'uniform mat4 uPMatrix;'
                + 'uniform mat4 uMVMatrix;'
                + 'varying vec2 vTexCoord;'
                + 'void main(void) {'
                + '	   gl_Position = uPMatrix * uMVMatrix * vec4(aPosition, 1.0);'
                + '    vTexCoord = aTexCoord;'
                + '}';
        };
        SampleShader.prototype.initializeFragmentSourceCode = function () {
            this.fragmentShaderSourceCode = ''
                + this.floatPrecisionDefinitionCode
                + 'varying vec2 vTexCoord;'
                + 'uniform sampler2D uTexture0;'
                + 'void main(void) {'
                + '    gl_FragColor = texture2D(uTexture0, vTexCoord);'
                + '}';
        };
        SampleShader.prototype.initializeAttributes = function (gl) {
            this.initializeAttributes_RenderShader(gl);
            this.initializeAttributes_SampleShader(gl);
        };
        SampleShader.prototype.initializeAttributes_SampleShader = function (gl) {
            this.aPosition = this.getAttribLocation('aPosition', gl);
            this.aTexCoord = this.getAttribLocation('aTexCoord', gl);
            this.uTexture0 = this.getUniformLocation('uTexture0', gl);
        };
        SampleShader.prototype.setBuffers = function (model, images, gl) {
            gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
            this.enableVertexAttributes(gl);
            this.resetVertexAttribPointerOffset();
            this.vertexAttribPointer(this.aPosition, 3, gl.FLOAT, model.vertexDataStride, gl);
            this.vertexAttribPointer(this.aTexCoord, 2, gl.FLOAT, model.vertexDataStride, gl);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, images[0].texture);
            gl.uniform1i(this.uTexture0, 0);
        };
        return SampleShader;
    }(RenderShader));
    var _Main;
    window.onload = function () {
        var canvas = document.getElementById('canvas');
        _Main = new Main();
        _Main.initialize(canvas);
        setTimeout(run, 1000 / 30);
    };
    function run() {
        if (_Main.isLoaded) {
            _Main.run();
            _Main.draw();
        }
        else {
            _Main.processLoading();
        }
        setTimeout(run, 1000 / 30);
    }
})(BasicWebGL || (BasicWebGL = {}));
