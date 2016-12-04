var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var DrawingSkinningModel;
(function (DrawingSkinningModel) {
    var GameMain = (function () {
        function GameMain() {
            this.logicalScreenWidth = 640.0;
            this.logicalScreenHeight = 360.0;
            this.canvas = null;
            this.gl = null;
            this.render = new WebGLRender();
            this.shader = new BasicShader();
            this.modelResource = new RenderModel();
            this.imageResources = new List();
            // x, y, z, u, v
            this.vertexData = [
                0.0, -0.2, 0.20, 0.00, 0.00,
                0.0, 0.20, 0.20, 1.00, 0.00,
                0.0, -0.2, -0.2, 0.00, 1.00,
                0.0, 0.20, -0.2, 1.00, 1.00
            ];
            this.indexData = [
                0, 1, 2,
                3, 2, 1
            ];
            this.eyeLocation = vec3.create();
            this.lookatLocation = vec3.create();
            this.upVector = vec3.create();
            this.modelMatrix = mat4.create();
            this.viewMatrix = mat4.create();
            this.pMatrix = mat4.create();
            this.mvMatrix = mat4.create();
            this.animationTime = 0.0;
        }
        GameMain.prototype.initialize = function (canvas) {
            this.canvas = canvas;
            this.canvas.width = this.logicalScreenWidth;
            this.canvas.height = this.logicalScreenHeight;
            try {
                var option = { preserveDrawingBuffer: true, antialias: true };
                this.gl = (canvas.getContext("webgl", option)
                    || canvas.getContext("experimental-webgl", option));
                if (this.gl == null) {
                    return;
                }
            }
            catch (e) {
                return;
            }
            this.render.attach(this.gl);
            this.render.initializeShader(this.shader);
            this.render.initializeModelBuffer(this.modelResource, this.vertexData, this.indexData, 4 * 5); // 4 (=sizeof float) * 5 (elements)
            var image = new RenderImage();
            this.loadTexture(image, "./texture.png");
            this.imageResources.push(image);
        };
        GameMain.prototype.run = function () {
            this.animationTime += 1.0;
            vec3.set(this.eyeLocation, 0.6, 0.0, 0.3);
            vec3.set(this.lookatLocation, 0.0, 0.0, 0.0);
            vec3.set(this.upVector, 0.0, 0.0, 1.0);
        };
        GameMain.prototype.draw = function () {
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
        };
        GameMain.prototype.drawModel = function (angle) {
            mat4.identity(this.modelMatrix);
            mat4.rotateZ(this.modelMatrix, this.modelMatrix, angle * 3);
            mat4.multiply(this.mvMatrix, this.viewMatrix, this.modelMatrix);
            this.render.setModelViewMatrix(this.mvMatrix);
            this.render.resetBasicParameters();
            this.render.drawElements(this.modelResource);
        };
        GameMain.prototype.loadTexture = function (image, url) {
            var _this = this;
            image.imageData = new Image();
            image.imageData.addEventListener("load", function () {
                _this.render.initializeImageTexture(image);
            });
            image.imageData.src = url;
        };
        return GameMain;
    }());
    var BasicShader = (function (_super) {
        __extends(BasicShader, _super);
        function BasicShader() {
            _super.apply(this, arguments);
            this.aPosition = 0;
            this.aTexCoord = 0;
            this.uTexture0 = null;
        }
        BasicShader.prototype.initializeVertexSourceCode = function () {
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
        };
        BasicShader.prototype.initializeFragmentSourceCode = function () {
            this.fragmentShaderSourceCode = ""
                + this.floatPrecisionDefinitionCode
                + "varying vec2 vTexCoord;"
                + "uniform sampler2D uTexture0;"
                + "void main(void) {"
                + "    gl_FragColor = texture2D(uTexture0, vTexCoord);"
                + "}";
        };
        BasicShader.prototype.initializeAttributes = function (gl) {
            this.initializeAttributes_RenderShader(gl);
            this.initializeAttributes_BasicShader(gl);
        };
        BasicShader.prototype.initializeAttributes_BasicShader = function (gl) {
            this.aPosition = this.getAttribLocation("aPosition", gl);
            this.aTexCoord = this.getAttribLocation("aTexCoord", gl);
            this.uTexture0 = this.getUniformLocation("uTexture0", gl);
        };
        BasicShader.prototype.setBuffers = function (model, images, gl) {
            gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
            this.enableVertexAttributes(gl);
            gl.vertexAttribPointer(this.aPosition, 3, gl.FLOAT, false, model.vertexDataStride, 0);
            gl.vertexAttribPointer(this.aTexCoord, 2, gl.FLOAT, false, model.vertexDataStride, 12);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, images[0].texture);
            gl.uniform1i(this.uTexture0, 0);
        };
        return BasicShader;
    }(RenderShader));
    var gameMain;
    window.onload = function () {
        var canvas = document.getElementById("canvas");
        gameMain = new GameMain();
        gameMain.initialize(canvas);
        setTimeout(run, 1000 / 30);
    };
    function run() {
        gameMain.run();
        gameMain.draw();
        setTimeout(run, 1000 / 30);
    }
})(DrawingSkinningModel || (DrawingSkinningModel = {}));
//# sourceMappingURL=main.js.map