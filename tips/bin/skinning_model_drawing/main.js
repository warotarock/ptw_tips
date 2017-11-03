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
var SkinModelDrawing;
(function (SkinModelDrawing) {
    var SkinModel = (function () {
        function SkinModel() {
            this.data = null;
            this.loaded = false;
        }
        return SkinModel;
    }());
    var Main = (function () {
        function Main() {
            this.logicalScreenWidth = 640.0;
            this.logicalScreenHeight = 360.0;
            this.render = new WebGLRender();
            this.bone2Shader = new Bone2Shader();
            this.bone4Shader = new Bone4Shader();
            this.skinModel = new SkinModel();
            this.images = new List();
            this.eyeLocation = vec3.create();
            this.lookatLocation = vec3.create();
            this.upVector = vec3.create();
            this.modelMatrix = mat4.create();
            this.viewMatrix = mat4.create();
            this.modelViewMatrix = mat4.create();
            this.projectionMatrix = mat4.create();
            this.boneMatrix = mat4.create();
            this.boneMatrixList = new List();
            this.animationTime = 0.0;
            this.isLoaded = false;
        }
        Main.prototype.initialize = function (canvas) {
            canvas.width = this.logicalScreenWidth;
            canvas.height = this.logicalScreenHeight;
            if (this.render.initializeWebGL(canvas)) {
                return;
            }
            this.render.initializeShader(this.bone2Shader);
            this.render.initializeShader(this.bone4Shader);
            this.skinModel = new SkinModel();
            this.loadSkinModel(this.skinModel, '../temp/sample_skin_model.json', 'SkinModel1');
            var image = new RenderImage();
            this.loadTexture(image, './texture.png');
            this.images.push(image);
        };
        Main.prototype.processLading = function () {
            // Waiting for data
            if (this.images[0].texture == null) {
                return;
            }
            if (!this.skinModel.loaded) {
                return;
            }
            // Loading finished
            this.isLoaded = true;
        };
        Main.prototype.run = function () {
            this.animationTime += 1.0;
            vec3.set(this.eyeLocation, 6.0, 0.0, 2.0);
            vec3.set(this.lookatLocation, 0.0, 0.0, 1.5);
            vec3.set(this.upVector, 0.0, 0.0, 1.0);
            this.calcBoneMatrix(this.boneMatrixList, this.skinModel);
            mat4.identity(this.modelMatrix);
            mat4.rotateZ(this.modelMatrix, this.modelMatrix, this.animationTime * 0.01);
        };
        Main.prototype.draw = function () {
            var aspect = this.logicalScreenWidth / this.logicalScreenHeight;
            mat4.perspective(this.projectionMatrix, 45.0 * Math.PI / 180, aspect, 0.1, 50.0);
            mat4.lookAt(this.viewMatrix, this.eyeLocation, this.lookatLocation, this.upVector);
            this.render.setDepthTest(true);
            this.render.setCulling(false);
            this.render.clearColorBufferDepthBuffer(0.0, 0.0, 0.1, 1.0);
            this.drawSkinModel(this.modelMatrix, this.skinModel, this.boneMatrixList);
        };
        Main.prototype.calcBoneMatrix = function (result, skinModel) {
            for (var i = 0; i < skinModel.data.bones.length; i++) {
                var bone = skinModel.data.bones[i];
                if (bone.parent == -1) {
                    // root parent
                    mat4.copy(result[i], bone.matrix);
                }
                else {
                    // child
                    mat4.multiply(result[i], result[bone.parent], bone.matrix);
                    // sample motion
                    mat4.rotateX(result[i], result[i], Math.cos(this.animationTime * 0.05));
                }
            }
        };
        Main.prototype.drawSkinModel = function (modelMatrix, skinModel, boneMatrixList) {
            // calc base matrix (model-view matrix)
            mat4.multiply(this.modelViewMatrix, this.viewMatrix, this.modelMatrix);
            // set parameter not dependent on parts
            this.render.setShader(this.bone2Shader);
            this.render.setModelViewMatrix(this.modelViewMatrix);
            this.render.setProjectionMatrix(this.projectionMatrix);
            this.render.setShader(this.bone4Shader);
            this.render.setModelViewMatrix(this.modelViewMatrix);
            this.render.setProjectionMatrix(this.projectionMatrix);
            // drawing for each part
            var parts = skinModel.data.parts;
            for (var i = 0; i < parts.length; i++) {
                var part = parts[i];
                // select shader
                var shader;
                if (part.bone.length <= 2) {
                    shader = this.bone2Shader;
                }
                else {
                    shader = this.bone4Shader;
                }
                this.render.setShader(shader);
                // set bone matrix
                for (var boneIndex = 0; boneIndex < part.bone.length; boneIndex++) {
                    mat4.copy(this.boneMatrix, boneMatrixList[part.bone[boneIndex]]);
                    shader.setBoneMatrix(boneIndex, this.boneMatrix, this.render.gl);
                }
                // draw
                this.render.setBuffers(part.renderModel, this.images);
                this.render.setDepthTest(true);
                this.render.setCulling(false);
                this.render.drawElements(part.renderModel);
            }
        };
        Main.prototype.loadTexture = function (resultImage, url) {
            var _this = this;
            resultImage.imageData = new Image();
            resultImage.imageData.addEventListener('load', function () {
                _this.render.initializeImageTexture(resultImage);
            });
            resultImage.imageData.src = url;
        };
        Main.prototype.loadSkinModel = function (resultModel, url, modelName) {
            var _this = this;
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url);
            xhr.responseType = 'json';
            xhr.addEventListener('load', function (e) {
                var data;
                if (xhr.responseType == 'json') {
                    data = xhr.response;
                }
                else {
                    data = JSON.parse(xhr.response);
                }
                resultModel.data = data['skin_models'][modelName];
                resultModel.loaded = true;
                _this.initializeSkinModelBuffer(resultModel);
            });
            xhr.send();
        };
        Main.prototype.initializeSkinModelBuffer = function (skinModel) {
            // create buffers for each part
            for (var i = 0; i < skinModel.data.parts.length; i++) {
                var part = skinModel.data.parts[i];
                var renderModel = new RenderModel();
                this.render.initializeModelBuffer(renderModel, part.vertex, part.index, 4 * part.vertexStride); // 4 (=size of float)
                part.renderModel = renderModel;
            }
            // create bone matrix
            this.boneMatrixList = new List();
            for (var i = 0; i < skinModel.data.bones.length; i++) {
                this.boneMatrixList.push(mat4.create());
            }
        };
        return Main;
    }());
    var Bone2Shader = (function (_super) {
        __extends(Bone2Shader, _super);
        function Bone2Shader() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.aTexCoord1 = -1;
            _this.uTexture0 = null;
            _this.aWeight1 = -1;
            _this.aPosition1 = -1;
            _this.aWeight2 = -1;
            _this.aPosition2 = -1;
            _this.uBoneMatrixList = new List();
            return _this;
        }
        Bone2Shader.prototype.initializeVertexSourceCode = function () {
            this.vertexShaderSourceCode = ''
                + this.floatPrecisionDefinitionCode
                + 'attribute float aWeight1;'
                + 'attribute vec3 aPosition1;'
                + 'attribute float aWeight2;'
                + 'attribute vec3 aPosition2;'
                + 'attribute vec2 aTexCoord1;'
                + 'uniform mat4 uBoneMatrix1;'
                + 'uniform mat4 uBoneMatrix2;'
                + 'uniform mat4 uMVMatrix;'
                + 'uniform mat4 uPMatrix;'
                + 'varying vec2 vTexCoord;'
                + 'void main(void) {'
                + '    vTexCoord = aTexCoord1;'
                + '    gl_Position = uPMatrix * uMVMatrix * (  uBoneMatrix1 * vec4(aPosition1, 1.0) * aWeight1 '
                + '                                          + uBoneMatrix2 * vec4(aPosition2, 1.0) * aWeight2);'
                + '}';
        };
        Bone2Shader.prototype.initializeFragmentSourceCode = function () {
            this.fragmentShaderSourceCode = ''
                + this.floatPrecisionDefinitionCode
                + 'varying vec2 vTexCoord;'
                + 'uniform sampler2D uTexture0;'
                + 'void main(void) {'
                + '    gl_FragColor = texture2D(uTexture0, vTexCoord);'
                + '}';
        };
        Bone2Shader.prototype.initializeAttributes = function (gl) {
            this.initializeAttributes_RenderShader(gl);
            this.initializeAttributes_Bone2Shader(gl);
        };
        Bone2Shader.prototype.initializeAttributes_Bone2Shader = function (gl) {
            this.aWeight1 = this.getAttribLocation('aWeight1', gl);
            this.aPosition1 = this.getAttribLocation('aPosition1', gl);
            this.aWeight2 = this.getAttribLocation('aWeight2', gl);
            this.aPosition2 = this.getAttribLocation('aPosition2', gl);
            this.aTexCoord1 = this.getAttribLocation('aTexCoord1', gl);
            this.uBoneMatrixList.push(this.getUniformLocation('uBoneMatrix1', gl));
            this.uBoneMatrixList.push(this.getUniformLocation('uBoneMatrix2', gl));
            this.uTexture0 = this.getUniformLocation('uTexture0', gl);
        };
        Bone2Shader.prototype.setBuffers = function (model, images, gl) {
            this.setBuffers_Bone2Shader(model, images, gl);
            this.setBuffers_Bone2Shader_UV(model, gl);
        };
        Bone2Shader.prototype.setBuffers_Bone2Shader = function (model, images, gl) {
            gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
            this.enableVertexAttributes(gl);
            this.resetVertexAttribPointerOffset();
            this.vertexAttribPointer(this.aWeight1, 1, gl.FLOAT, model.vertexDataStride, gl);
            this.vertexAttribPointer(this.aPosition1, 3, gl.FLOAT, model.vertexDataStride, gl);
            this.addVertexAttribPointerOffset(4 * 3); // skip normal data
            this.vertexAttribPointer(this.aWeight2, 1, gl.FLOAT, model.vertexDataStride, gl);
            this.vertexAttribPointer(this.aPosition2, 3, gl.FLOAT, model.vertexDataStride, gl);
            this.addVertexAttribPointerOffset(4 * 3); // skip normal data
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, images[0].texture);
            gl.uniform1i(this.uTexture0, 0);
        };
        Bone2Shader.prototype.setBuffers_Bone2Shader_UV = function (model, gl) {
            this.vertexAttribPointer(this.aTexCoord1, 2, gl.FLOAT, model.vertexDataStride, gl);
            //this.vertexAttribPointer(this.aTexCoord2, 2, gl.FLOAT, model.vertexDataStride, gl); skip (not used in this sample)
            //this.vertexAttribPointer(this.aTexCoord3, 2, gl.FLOAT, model.vertexDataStride, gl); skip (not used in this sample)
        };
        Bone2Shader.prototype.setBoneMatrix = function (boneIndex, matrix, gl) {
            gl.uniformMatrix4fv(this.uBoneMatrixList[boneIndex], false, matrix);
        };
        return Bone2Shader;
    }(RenderShader));
    SkinModelDrawing.Bone2Shader = Bone2Shader;
    var Bone4Shader = (function (_super) {
        __extends(Bone4Shader, _super);
        function Bone4Shader() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.aWeight3 = -1;
            _this.aPosition3 = -1;
            _this.aPosition4 = -1;
            _this.aWeight4 = -1;
            return _this;
        }
        Bone4Shader.prototype.initializeVertexSourceCode = function () {
            this.vertexShaderSourceCode = ''
                + this.floatPrecisionDefinitionCode
                + 'attribute float aWeight1;'
                + 'attribute vec3 aPosition1;'
                + 'attribute float aWeight2;'
                + 'attribute vec3 aPosition2;'
                + 'attribute float aWeight3;'
                + 'attribute vec3 aPosition3;'
                + 'attribute float aWeight4;'
                + 'attribute vec3 aPosition4;'
                + 'attribute vec2 aTexCoord1;'
                + 'uniform mat4 uBoneMatrix1;'
                + 'uniform mat4 uBoneMatrix2;'
                + 'uniform mat4 uBoneMatrix3;'
                + 'uniform mat4 uBoneMatrix4;'
                + 'uniform mat4 uMVMatrix;'
                + 'uniform mat4 uPMatrix;'
                + 'varying vec2 vTexCoord;'
                + 'void main(void) {'
                + '    vTexCoord = aTexCoord1;'
                + '    gl_Position = uPMatrix * uMVMatrix * (  uBoneMatrix1 * vec4(aPosition1, 1.0) * aWeight1 '
                + '                                          + uBoneMatrix2 * vec4(aPosition2, 1.0) * aWeight2 '
                + '                                          + uBoneMatrix3 * vec4(aPosition3, 1.0) * aWeight3 '
                + '                                          + uBoneMatrix4 * vec4(aPosition4, 1.0) * aWeight4);'
                + '}';
        };
        Bone4Shader.prototype.initializeAttributes = function (gl) {
            this.initializeAttributes_RenderShader(gl);
            this.initializeAttributes_Bone2Shader(gl);
            this.initializeAttributes_Bone4Shader(gl);
        };
        Bone4Shader.prototype.initializeAttributes_Bone4Shader = function (gl) {
            this.aWeight3 = this.getAttribLocation('aWeight3', gl);
            this.aPosition3 = this.getAttribLocation('aPosition3', gl);
            this.aWeight4 = this.getAttribLocation('aWeight4', gl);
            this.aPosition4 = this.getAttribLocation('aPosition4', gl);
            this.uBoneMatrixList.push(this.getUniformLocation('uBoneMatrix3', gl));
            this.uBoneMatrixList.push(this.getUniformLocation('uBoneMatrix4', gl));
        };
        Bone4Shader.prototype.setBuffers = function (model, images, gl) {
            this.setBuffers_Bone2Shader(model, images, gl);
            this.setBuffers_Bone4Shader(model, images, gl);
            this.setBuffers_Bone2Shader_UV(model, gl);
        };
        Bone4Shader.prototype.setBuffers_Bone4Shader = function (model, images, gl) {
            this.vertexAttribPointer(this.aWeight3, 1, gl.FLOAT, model.vertexDataStride, gl);
            this.vertexAttribPointer(this.aPosition3, 3, gl.FLOAT, model.vertexDataStride, gl);
            this.vertexAttribPointerOffset += 4 * 3; // skip normal data
            this.vertexAttribPointer(this.aWeight4, 1, gl.FLOAT, model.vertexDataStride, gl);
            this.vertexAttribPointer(this.aPosition4, 3, gl.FLOAT, model.vertexDataStride, gl);
            this.vertexAttribPointerOffset += 4 * 3; // skip normal data
        };
        return Bone4Shader;
    }(Bone2Shader));
    SkinModelDrawing.Bone4Shader = Bone4Shader;
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
            _Main.processLading();
        }
        setTimeout(run, 1000 / 30);
    }
})(SkinModelDrawing || (SkinModelDrawing = {}));
