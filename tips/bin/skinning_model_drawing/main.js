var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var SkinningModelDrawing;
(function (SkinningModelDrawing) {
    var SkinningModel = (function () {
        function SkinningModel() {
            this.data = null;
            this.loaded = false;
            this.initialized = false;
        }
        return SkinningModel;
    }());
    var Main = (function () {
        function Main() {
            this.logicalScreenWidth = 640.0;
            this.logicalScreenHeight = 360.0;
            this.canvas = null;
            this.gl = null;
            this.render = new WebGLRender();
            this.bone2Shader = new Bone2Shader();
            this.bone4Shader = new Bone4Shader();
            this.modelResource = new SkinningModel();
            this.imageResources = new List();
            this.boneMatrixList = new List();
            this.eyeLocation = vec3.create();
            this.lookatLocation = vec3.create();
            this.upVector = vec3.create();
            this.modelMatrix = mat4.create();
            this.viewMatrix = mat4.create();
            this.pMatrix = mat4.create();
            this.mvMatrix = mat4.create();
            this.boneMatrix = mat4.create();
            this.tmpVector = vec3.create();
            this.animationTime = 0.0;
        }
        Main.prototype.initialize = function (canvas) {
            this.canvas = canvas;
            this.canvas.width = this.logicalScreenWidth;
            this.canvas.height = this.logicalScreenHeight;
            try {
                var option = { preserveDrawingBuffer: true, antialias: true };
                this.gl = (canvas.getContext('webgl', option)
                    || canvas.getContext('experimental-webgl', option));
                if (this.gl == null) {
                    return;
                }
            }
            catch (e) {
                return;
            }
            this.render.attach(this.gl);
            this.render.initializeShader(this.bone2Shader);
            this.render.initializeShader(this.bone4Shader);
            this.modelResource = new SkinningModel();
            this.loadModel(this.modelResource, '../temp/sample_skinning_model.json');
            var image = new RenderImage();
            this.loadTexture(image, './texture.png');
            this.imageResources.push(image);
        };
        Main.prototype.run = function () {
            // loading
            if (!this.modelResource.initialized) {
                if (this.modelResource.loaded) {
                    this.initializeSkinningModelBuffer(this.modelResource);
                    this.modelResource.initialized = true;
                }
                else {
                    return;
                }
            }
            if (this.imageResources[0].texture == null) {
                return;
            }
            this.animationTime += 1.0;
            // camera position
            vec3.set(this.eyeLocation, 6.0, 0.0, 2.0);
            vec3.set(this.lookatLocation, 0.0, 0.0, 1.5);
            vec3.set(this.upVector, 0.0, 0.0, 1.0);
            // animation
            this.calcBoneMatrix(this.boneMatrixList, this.modelResource);
            mat4.identity(this.modelMatrix);
            mat4.rotateZ(this.modelMatrix, this.modelMatrix, this.animationTime * 0.01);
        };
        Main.prototype.draw = function () {
            // calculates camera matrix
            var aspect = this.logicalScreenWidth / this.logicalScreenHeight;
            mat4.perspective(this.pMatrix, 45.0 * Math.PI / 180, aspect, 0.1, 50.0);
            mat4.lookAt(this.viewMatrix, this.eyeLocation, this.lookatLocation, this.upVector);
            // starts drawing
            this.render.clearColorBufferDepthBuffer(0.0, 0.0, 0.1, 1.0);
            this.drawModel(this.modelMatrix, this.modelResource);
        };
        Main.prototype.calcBoneMatrix = function (out, skinningModel) {
            for (var i = 0; i < skinningModel.data.bones.length; i++) {
                var bone = skinningModel.data.bones[i];
                if (bone.parent == -1) {
                    // root parent
                    mat4.copy(out[i], bone.matrix);
                }
                else {
                    // child
                    mat4.multiply(out[i], out[bone.parent], bone.matrix);
                    // sample motion
                    mat4.rotateX(out[i], out[i], Math.cos(this.animationTime * 0.05));
                }
            }
        };
        Main.prototype.drawModel = function (modelMatrix, skinningModel) {
            // calc base matrix (model-view matrix)
            mat4.multiply(this.mvMatrix, this.viewMatrix, this.modelMatrix);
            // set parameter not dependent on parts
            this.render.setShader(this.bone2Shader);
            this.render.setModelViewMatrix(this.mvMatrix);
            this.render.setProjectionMatrix(this.pMatrix);
            this.render.setShader(this.bone4Shader);
            this.render.setModelViewMatrix(this.mvMatrix);
            this.render.setProjectionMatrix(this.pMatrix);
            // drawing for each part
            var bones = skinningModel.data.bones;
            var parts = skinningModel.data.parts;
            for (var i = 0; i < parts.length; i++) {
                var part = parts[i];
                // select shader
                var shader;
                if (part.bone.length == 2) {
                    shader = this.bone2Shader;
                }
                else {
                    shader = this.bone4Shader;
                }
                this.render.setShader(shader);
                // set bone matrix
                for (var boneIndex = 0; boneIndex < part.bone.length; boneIndex++) {
                    mat4.copy(this.boneMatrix, this.boneMatrixList[part.bone[boneIndex]]);
                    shader.setBoneMatrix(boneIndex, this.boneMatrix, this.gl);
                }
                // draw
                this.render.setBuffers(part.renderModel, this.imageResources);
                this.render.resetBasicParameters();
                this.render.drawElements(part.renderModel);
            }
        };
        Main.prototype.loadModel = function (model, url) {
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
                model.data = data['Cube'];
                model.loaded = true;
            });
            xhr.send();
        };
        Main.prototype.initializeSkinningModelBuffer = function (skinningModel) {
            // create buffers for each part
            for (var i = 0; i < skinningModel.data.parts.length; i++) {
                var part = skinningModel.data.parts[i];
                var renderModel = new RenderModel();
                this.render.initializeModelBuffer(renderModel, part.vertex, part.index, 4 * part.vertexStride); // 4 (=size of float)
                part.renderModel = renderModel;
            }
            // create bone matrix
            this.boneMatrixList = new List();
            for (var i = 0; i < skinningModel.data.bones.length; i++) {
                this.boneMatrixList.push(mat4.create());
            }
        };
        Main.prototype.loadTexture = function (image, url) {
            var _this = this;
            image.imageData = new Image();
            image.imageData.addEventListener('load', function () {
                _this.render.initializeImageTexture(image);
            });
            image.imageData.src = url;
        };
        return Main;
    }());
    var Bone2Shader = (function (_super) {
        __extends(Bone2Shader, _super);
        function Bone2Shader() {
            _super.apply(this, arguments);
            this.aTexCoord1 = -1;
            this.uTexture0 = null;
            this.aWeight1 = -1;
            this.aVertexPosition1 = -1;
            this.aVertexNormal1 = -1;
            this.aVertexPosition2 = -1;
            this.aWeight2 = -1;
            this.aVertexNormal2 = -1;
        }
        Bone2Shader.prototype.initializeVertexSourceCode = function () {
            this.vertexShaderSourceCode = ''
                + this.floatPrecisionDefinitionCode
                + 'attribute float aWeight1;'
                + 'attribute vec3 aVertexPosition1;'
                + 'attribute vec3 aVertexNormal1;'
                + 'attribute float aWeight2;'
                + 'attribute vec3 aVertexPosition2;'
                + 'attribute vec3 aVertexNormal2;'
                + 'attribute vec2 aTexCoord1;'
                + 'uniform mat4 uBoneMatrix1;'
                + 'uniform mat4 uBoneMatrix2;'
                + 'uniform mat4 uMVMatrix;'
                + 'uniform mat4 uPMatrix;'
                + "uniform mat4 uNormalMatrix;"
                + 'varying vec2 vTexCoord;'
                + 'varying vec3 vTransformedNormal;'
                + 'void main(void) {'
                + '    vTexCoord = aTexCoord1;'
                + '    gl_Position = uPMatrix * uMVMatrix * (  uBoneMatrix1 * vec4(aVertexPosition1, 1.0) * aWeight1 '
                + '                                          + uBoneMatrix2 * vec4(aVertexPosition2, 1.0) * aWeight2);'
                + '    vTransformedNormal = (uNormalMatrix * ((uBoneMatrix1 * vec4(aVertexNormal1, 1.0) - uBoneMatrix1[3]) * aWeight1 '
                + '                                         + (uBoneMatrix2 * vec4(aVertexNormal2, 1.0) - uBoneMatrix2[3]) * aWeight2)).xyz;'
                + '}';
        };
        Bone2Shader.prototype.initializeFragmentSourceCode = function () {
            this.fragmentShaderSourceCode = ''
                + this.floatPrecisionDefinitionCode
                + 'varying vec2 vTexCoord;'
                + 'varying vec3 vTransformedNormal;'
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
            this.aVertexPosition1 = this.getAttribLocation('aVertexPosition1', gl);
            this.aVertexNormal1 = this.getAttribLocation('aVertexNormal1', gl);
            this.aWeight2 = this.getAttribLocation('aWeight2', gl);
            this.aVertexPosition2 = this.getAttribLocation('aVertexPosition2', gl);
            this.aVertexNormal2 = this.getAttribLocation('aVertexNormal2', gl);
            this.aTexCoord1 = this.getAttribLocation('aTexCoord1', gl);
            this.uNormalMatrix = this.getUniformLocation('uNormalMatrix', gl);
            this.uBoneMatrix1 = this.getUniformLocation('uBoneMatrix1', gl);
            this.uBoneMatrix2 = this.getUniformLocation('uBoneMatrix2', gl);
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
            this.vertexAttribPointer(this.aVertexPosition1, 3, gl.FLOAT, model.vertexDataStride, gl);
            this.vertexAttribPointer(this.aVertexNormal1, 3, gl.FLOAT, model.vertexDataStride, gl);
            this.vertexAttribPointer(this.aWeight2, 1, gl.FLOAT, model.vertexDataStride, gl);
            this.vertexAttribPointer(this.aVertexPosition2, 3, gl.FLOAT, model.vertexDataStride, gl);
            this.vertexAttribPointer(this.aVertexNormal2, 3, gl.FLOAT, model.vertexDataStride, gl);
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
        Bone2Shader.prototype.setNormalMatrix = function (matrix, gl) {
            gl.uniformMatrix4fv(this.uNormalMatrix, false, matrix);
        };
        Bone2Shader.prototype.setBoneMatrix = function (boneIndex, matrix, gl) {
            if (boneIndex == 0) {
                gl.uniformMatrix4fv(this.uBoneMatrix1, false, matrix);
            }
            else if (boneIndex == 1) {
                gl.uniformMatrix4fv(this.uBoneMatrix2, false, matrix);
            }
        };
        return Bone2Shader;
    }(RenderShader));
    var Bone4Shader = (function (_super) {
        __extends(Bone4Shader, _super);
        function Bone4Shader() {
            _super.apply(this, arguments);
            this.aWeight3 = 999;
            this.aVertexPosition3 = 999;
            this.aVertexNormal3 = 999;
            this.aVertexPosition4 = 999;
            this.aWeight4 = 999;
            this.aVertexNormal4 = 999;
        }
        Bone4Shader.prototype.initializeVertexSourceCode = function () {
            this.vertexShaderSourceCode = ''
                + this.floatPrecisionDefinitionCode
                + 'attribute float aWeight1;'
                + 'attribute vec3 aVertexPosition1;'
                + 'attribute vec3 aVertexNormal1;'
                + 'attribute float aWeight2;'
                + 'attribute vec3 aVertexPosition2;'
                + 'attribute vec3 aVertexNormal2;'
                + 'attribute float aWeight3;'
                + 'attribute vec3 aVertexPosition3;'
                + 'attribute vec3 aVertexNormal3;'
                + 'attribute float aWeight4;'
                + 'attribute vec3 aVertexPosition4;'
                + 'attribute vec3 aVertexNormal4;'
                + 'attribute vec2 aTexCoord1;'
                + 'uniform mat4 uBoneMatrix1;'
                + 'uniform mat4 uBoneMatrix2;'
                + 'uniform mat4 uBoneMatrix3;'
                + 'uniform mat4 uBoneMatrix4;'
                + 'uniform mat4 uMVMatrix;'
                + 'uniform mat4 uPMatrix;'
                + "uniform mat4 uNormalMatrix;"
                + 'varying vec2 vTexCoord;'
                + 'varying vec3 vTransformedNormal;'
                + 'void main(void) {'
                + '    vTexCoord = aTexCoord1;'
                + '    gl_Position = uPMatrix * uMVMatrix * (  uBoneMatrix1 * vec4(aVertexPosition1, 1.0) * aWeight1 '
                + '                                          + uBoneMatrix2 * vec4(aVertexPosition2, 1.0) * aWeight2 '
                + '                                          + uBoneMatrix3 * vec4(aVertexPosition3, 1.0) * aWeight3 '
                + '                                          + uBoneMatrix4 * vec4(aVertexPosition4, 1.0) * aWeight4);'
                + '    vTransformedNormal = (uNormalMatrix * ((uBoneMatrix1 * vec4(aVertexNormal1, 1.0) - uBoneMatrix1[3]) * aWeight1 '
                + '                                         + (uBoneMatrix2 * vec4(aVertexNormal2, 1.0) - uBoneMatrix2[3]) * aWeight2 '
                + '                                         + (uBoneMatrix3 * vec4(aVertexNormal3, 1.0) - uBoneMatrix3[3]) * aWeight3 '
                + '                                         + (uBoneMatrix4 * vec4(aVertexNormal4, 1.0) - uBoneMatrix4[3]) * aWeight4)).xyz;'
                + '}';
        };
        Bone4Shader.prototype.initializeAttributes = function (gl) {
            this.initializeAttributes_RenderShader(gl);
            this.initializeAttributes_Bone2Shader(gl);
            this.initializeAttributes_Bone4Shader(gl);
        };
        Bone4Shader.prototype.initializeAttributes_Bone4Shader = function (gl) {
            this.aWeight3 = this.getAttribLocation('aWeight3', gl);
            this.aVertexPosition3 = this.getAttribLocation('aVertexPosition3', gl);
            this.aVertexNormal3 = this.getAttribLocation('aVertexNormal3', gl);
            this.aWeight4 = this.getAttribLocation('aWeight4', gl);
            this.aVertexPosition4 = this.getAttribLocation('aVertexPosition4', gl);
            this.aVertexNormal4 = this.getAttribLocation('aVertexNormal4', gl);
            this.uBoneMatrix1 = this.getUniformLocation('uBoneMatrix1', gl);
            this.uBoneMatrix2 = this.getUniformLocation('uBoneMatrix2', gl);
            this.uBoneMatrix3 = this.getUniformLocation('uBoneMatrix3', gl);
            this.uBoneMatrix4 = this.getUniformLocation('uBoneMatrix4', gl);
        };
        Bone4Shader.prototype.setBuffers = function (model, images, gl) {
            this.setBuffers_Bone2Shader(model, images, gl);
            this.setBuffers_Bone4Shader(model, images, gl);
            this.setBuffers_Bone2Shader_UV(model, gl);
        };
        Bone4Shader.prototype.setBuffers_Bone4Shader = function (model, images, gl) {
            this.vertexAttribPointer(this.aWeight3, 1, gl.FLOAT, model.vertexDataStride, gl);
            this.vertexAttribPointer(this.aVertexPosition3, 3, gl.FLOAT, model.vertexDataStride, gl);
            this.vertexAttribPointer(this.aVertexNormal3, 3, gl.FLOAT, model.vertexDataStride, gl);
            this.vertexAttribPointer(this.aWeight4, 1, gl.FLOAT, model.vertexDataStride, gl);
            this.vertexAttribPointer(this.aVertexPosition4, 3, gl.FLOAT, model.vertexDataStride, gl);
            this.vertexAttribPointer(this.aVertexNormal4, 3, gl.FLOAT, model.vertexDataStride, gl);
        };
        Bone4Shader.prototype.setBoneMatrix = function (boneIndex, matrix, gl) {
            if (boneIndex == 0) {
                gl.uniformMatrix4fv(this.uBoneMatrix1, false, matrix);
            }
            else if (boneIndex == 1) {
                gl.uniformMatrix4fv(this.uBoneMatrix2, false, matrix);
            }
            else if (boneIndex == 2) {
                gl.uniformMatrix4fv(this.uBoneMatrix3, false, matrix);
            }
            else if (boneIndex == 3) {
                gl.uniformMatrix4fv(this.uBoneMatrix4, false, matrix);
            }
        };
        return Bone4Shader;
    }(Bone2Shader));
    var _Main;
    window.onload = function () {
        var canvas = document.getElementById('canvas');
        _Main = new Main();
        _Main.initialize(canvas);
        setTimeout(run, 1000 / 30);
    };
    function run() {
        _Main.run();
        _Main.draw();
        setTimeout(run, 1000 / 30);
    }
})(SkinningModelDrawing || (SkinningModelDrawing = {}));
//# sourceMappingURL=main.js.map