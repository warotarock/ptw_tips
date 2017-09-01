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
var ComplexToonDrawing;
(function (ComplexToonDrawing) {
    var SkinningModel = (function () {
        function SkinningModel() {
            this.data = null;
        }
        return SkinningModel;
    }());
    var SkinningModelLoadingState = (function () {
        function SkinningModelLoadingState() {
            this.isInitialized = false;
            this.isLoaded = false;
            this.models = new Dictionary();
            this.modelList = new List();
        }
        return SkinningModelLoadingState;
    }());
    var AnimationDataLoadingState = (function () {
        function AnimationDataLoadingState() {
            this.isInitialized = false;
            this.isLoaded = false;
            this.animations = new Dictionary();
        }
        return AnimationDataLoadingState;
    }());
    // drawing buffer
    var RenderTargetBuffer = (function () {
        function RenderTargetBuffer() {
            this.framebuffer = null;
            this.renderbuffer = null;
            this.width = 0;
            this.height = 0;
            this.texture = new List();
            this.textureWidth = 0;
            this.textureHeight = 0;
        }
        return RenderTargetBuffer;
    }());
    var Main = (function () {
        function Main() {
            this.logicalScreenWidth = 640.0;
            this.logicalScreenHeight = 360.0;
            this.canvas = null;
            this.gl = null;
            this.render = new WebGLRender();
            this.screenShader = new ScreenShader();
            this.bone2Shader = new Bone2Shader();
            this.bone4Shader = new Bone4Shader();
            this.bone2Shader_Toons = new Bone2Shader_Toons();
            this.bone4Shader_Toons = new Bone4Shader_Toons();
            this.drawer_Bone2Shader = null;
            this.drawer_Bone4Shader = null;
            this.loaded = false;
            this.screen_ModelResource = new RenderModel();
            this.skinningModelLoadingState = new SkinningModelLoadingState();
            this.modelResourceList = null;
            this.skinModelImageResources = new List();
            this.backImageResources = new List();
            this.animationDataLoadingState = new AnimationDataLoadingState();
            this.boneAnimationResource = null;
            this.boneModel = null;
            this.animationSolver = new AnimationSolver();
            this.boneAnimationBuffer = null;
            this.boneMatrixBuffer = null;
            this.clothes_ModelNameList = [
                'CoatBase', 'MafuraBase'
            ];
            this.skin_ModelNameList = [
                'SkinBase'
            ];
            this.hair_ModelNameList = [
                'HairBase'
            ];
            this.face_ModelNameList = [
                'EyeWhite', 'Mayuge', 'Eyes', 'EyeLight', 'Matuge', 'MouseNose'
            ];
            this.skinShader_ModelNameList = [
                'SkinShader'
            ];
            this.eyeLocation = vec3.create();
            this.lookatLocation = vec3.create();
            this.upVector = vec3.create();
            this.modelMatrix = mat4.create();
            this.viewMatrix = mat4.create();
            this.pMatrix = mat4.create();
            this.mvMatrix = mat4.create();
            this.normalMatrix = mat4.create();
            this.boneMatrix = mat4.create();
            this.tmpVector = vec3.create();
            this.animationTime = 0.0;
        }
        Main.prototype.initialize = function (canvas) {
            this.canvas = canvas;
            this.canvas.width = this.logicalScreenWidth;
            this.canvas.height = this.logicalScreenHeight;
            if (this.render.initializeWebGL(canvas)) {
                return;
            }
            this.render.initializeShader(this.screenShader);
            this.render.initializeShader(this.bone2Shader);
            this.render.initializeShader(this.bone4Shader);
            this.render.initializeShader(this.bone4Shader_Toons);
            this.render.initializeShader(this.bone2Shader_Toons);
            this.render.initializeModelBuffer(this.screen_ModelResource, [
                -1.0, -1.0, 0.0, 0.00, 0.00,
                1.00, -1.0, 0.0, 1.00, 0.00,
                -1.0, 1.00, 0.0, 0.00, 1.00,
                1.00, 1.00, 0.0, 1.00, 1.00
            ], [0, 1, 2, 3, 2, 1], 4 * 5);
            this.loadModel(this.skinningModelLoadingState, '../temp/complex_toon_model.json');
            var image = new RenderImage();
            this.loadTexture(image, './texture.png');
            this.skinModelImageResources.push(image);
            var image2 = new RenderImage();
            this.loadTexture(image2, './ebisu_xmas_032.jpg');
            this.backImageResources.push(image2);
            this.loadAnimation(this.animationDataLoadingState, '../temp/complex_toon_animation.json');
            this.skinBase_FrameBuffer = this.createRenderTargetBuffer(this.logicalScreenWidth, this.logicalScreenHeight);
            this.render.setShader(this.bone2Shader_Toons);
            this.bone2Shader_Toons.setResolution(this.skinBase_FrameBuffer.textureWidth, this.skinBase_FrameBuffer.textureHeight, this.gl);
            this.render.setShader(this.bone4Shader_Toons);
            this.bone4Shader_Toons.setResolution(this.skinBase_FrameBuffer.textureWidth, this.skinBase_FrameBuffer.textureHeight, this.gl);
        };
        Main.prototype.processLoading = function () {
            // model
            if (!this.skinningModelLoadingState.isInitialized) {
                if (this.skinningModelLoadingState.isLoaded) {
                    this.initializeSkinningModelBuffers(this.skinningModelLoadingState);
                    this.modelResourceList = this.skinningModelLoadingState.modelList;
                    this.skinningModelLoadingState.isInitialized = true;
                }
                else {
                    return;
                }
            }
            // image
            if (this.skinModelImageResources[0].texture == null) {
                return;
            }
            if (this.backImageResources[0].texture == null) {
                return;
            }
            // animation
            if (!this.animationDataLoadingState.isInitialized) {
                if (this.animationDataLoadingState.isLoaded) {
                    this.boneAnimationResource = this.animationDataLoadingState.animations['runrun'];
                    this.boneModel = this.skinningModelLoadingState.models['CoatBase'];
                    this.boneAnimationBuffer = this.animationSolver.createBoneAnimationBuffer(this.boneModel.data.bones);
                    this.boneMatrixBuffer = this.animationSolver.createBoneMatrixBuffer(this.boneModel.data.bones);
                    this.animationDataLoadingState.isInitialized = true;
                }
                else {
                    return;
                }
            }
            this.loaded = true;
        };
        Main.prototype.run = function () {
            if (!this.loaded) {
                this.processLoading();
                if (!this.loaded) {
                    return;
                }
            }
            // animate time
            this.animationTime += 1.0;
            if (this.animationTime > 216.0) {
                this.animationTime -= 144.0;
            }
            // camera position
            vec3.set(this.eyeLocation, 10.4, 0.0, 0.9);
            vec3.set(this.lookatLocation, 0.0, 0.3, 0.9);
            vec3.set(this.upVector, 0.0, 0.0, 1.0);
            // animation
            this.animationSolver.calcBoneAnimation(this.boneAnimationBuffer, this.boneModel.data.bones, this.boneAnimationResource, this.animationTime);
            this.animationSolver.calcBoneMatrix(this.boneMatrixBuffer, this.boneModel.data.bones, this.boneAnimationBuffer);
            mat4.identity(this.modelMatrix);
            mat4.rotateZ(this.modelMatrix, this.modelMatrix, Math.PI * 0.65);
        };
        Main.prototype.draw = function () {
            if (!this.loaded) {
                return;
            }
            // calculates camera matrix
            var aspect = this.logicalScreenWidth / this.logicalScreenHeight;
            mat4.perspective(this.pMatrix, 8.0 * Math.PI / 180, aspect, 0.1, 50.0);
            mat4.lookAt(this.viewMatrix, this.eyeLocation, this.lookatLocation, this.upVector);
            // background
            this.render.setDepthTest(false);
            this.render.setCulling(false);
            this.render.clearColorBufferDepthBuffer(0.0, 0.0, 0.1, 0.0);
            this.drawScreenModel(this.backImageResources);
            // skin base layer
            this.setRenderTargetBuffer(this.skinBase_FrameBuffer);
            this.gl.viewport(0, 0, this.logicalScreenWidth, this.logicalScreenHeight);
            this.render.setDepthTest(true);
            this.render.clearColorBufferDepthBuffer(0.0, 0.0, 0.0, 0.0);
            this.drawer_Bone2Shader = this.bone2Shader;
            this.drawer_Bone4Shader = this.bone4Shader;
            this.drawSkinningModels(this.modelMatrix, this.clothes_ModelNameList, this.skinModelImageResources);
            this.drawSkinningModels(this.modelMatrix, this.skin_ModelNameList, this.skinModelImageResources);
            this.drawSkinningModels(this.modelMatrix, this.hair_ModelNameList, this.skinModelImageResources);
            this.render.setDepthTest(false);
            this.drawSkinningModels(this.modelMatrix, this.face_ModelNameList, this.skinModelImageResources);
            // skin shader layer
            this.setRenderTargetBuffer(null);
            this.gl.viewport(0, 0, this.logicalScreenWidth, this.logicalScreenHeight);
            this.render.setDepthTest(true);
            this.render.clearDepthBuffer();
            this.drawer_Bone2Shader = this.bone2Shader_Toons;
            this.drawer_Bone4Shader = this.bone4Shader_Toons;
            this.render.setDepthTest(true);
            this.drawSkinningModels(this.modelMatrix, this.skinShader_ModelNameList, this.skinBase_FrameBuffer.texture);
        };
        Main.prototype.calcNormalMatrix = function (out, matrix) {
            var length = Math.sqrt(Math.pow(matrix[0], 2) + Math.pow(matrix[1], 2) + Math.pow(matrix[2], 2));
            out[0] /= length;
            out[1] /= length;
            out[2] /= length;
            out[3] = 0;
            length = Math.sqrt(Math.pow(matrix[4], 2) + Math.pow(matrix[5], 2) + Math.pow(matrix[6], 2));
            out[4] /= length;
            out[5] /= length;
            out[6] /= length;
            out[7] = 0;
            length = Math.sqrt(Math.pow(matrix[8], 2) + Math.pow(matrix[9], 2) + Math.pow(matrix[10], 2));
            out[8] /= length;
            out[9] /= length;
            out[10] /= length;
            out[11] = 0;
            out[12] = 0;
            out[13] = 0;
            out[14] = 0;
            out[16] = 1;
        };
        Main.prototype.drawSkinningModels = function (modelMatrix, modelNameList, imageResources) {
            for (var i = 0; i < modelNameList.length; i++) {
                var model = this.skinningModelLoadingState.models[modelNameList[i]];
                this.drawSkinningModel(modelMatrix, model, this.boneMatrixBuffer, imageResources);
            }
        };
        Main.prototype.drawSkinningModel = function (modelMatrix, skinningModel, matrixBuffer, imageResources) {
            // calc base matrix (model-view matrix)
            mat4.multiply(this.mvMatrix, this.viewMatrix, this.modelMatrix);
            // cals normal matrix
            this.calcNormalMatrix(this.normalMatrix, this.mvMatrix);
            // set parameter not dependent on parts
            this.render.setShader(this.drawer_Bone2Shader);
            this.render.setModelViewMatrix(this.mvMatrix);
            this.render.setProjectionMatrix(this.pMatrix);
            this.drawer_Bone2Shader.setNormalMatrix(this.normalMatrix, this.gl);
            this.render.setShader(this.drawer_Bone4Shader);
            this.render.setModelViewMatrix(this.mvMatrix);
            this.render.setProjectionMatrix(this.pMatrix);
            this.drawer_Bone4Shader.setNormalMatrix(this.normalMatrix, this.gl);
            // drawing for each part
            var bones = skinningModel.data.bones;
            var parts = skinningModel.data.parts;
            for (var i = 0; i < parts.length; i++) {
                var part = parts[i];
                // select shader
                var shader;
                if (part.bone.length <= 2) {
                    shader = this.drawer_Bone2Shader;
                }
                else {
                    shader = this.drawer_Bone4Shader;
                }
                this.render.setShader(shader);
                // set bone matrix
                for (var boneIndex = 0; boneIndex < part.bone.length; boneIndex++) {
                    mat4.copy(this.boneMatrix, matrixBuffer.animatedBoneMatrixList[part.bone[boneIndex]]);
                    shader.setBoneMatrix(boneIndex, this.boneMatrix, this.gl);
                }
                // draw
                this.render.setBuffers(part.renderModel, imageResources);
                this.render.drawElements(part.renderModel);
                shader.disableVertexAttributes(this.gl);
            }
        };
        Main.prototype.loadModel = function (loadingState, url) {
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
                for (var modelName in data) {
                    var skinningModel = new SkinningModel();
                    skinningModel.name = modelName;
                    skinningModel.data = data[modelName];
                    loadingState.models[modelName] = skinningModel;
                }
                loadingState.isLoaded = true;
            });
            xhr.send();
        };
        Main.prototype.initializeSkinningModelBuffers = function (loadingState) {
            for (var modelName in loadingState.models) {
                var skinningModel = loadingState.models[modelName];
                console.log('initializing skin model: ' + modelName);
                this.initializeSkinningModelBuffer(skinningModel);
                loadingState.modelList.push(skinningModel);
            }
        };
        Main.prototype.initializeSkinningModelBuffer = function (skinningModel) {
            // create buffers for each part
            for (var i = 0; i < skinningModel.data.parts.length; i++) {
                var part = skinningModel.data.parts[i];
                var renderModel = new RenderModel();
                this.render.initializeModelBuffer(renderModel, part.vertex, part.index, 4 * part.vertexStride); // 4 (=size of float)
                part.renderModel = renderModel;
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
        Main.prototype.loadAnimation = function (loadingState, url) {
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
                loadingState.animations = data;
                loadingState.isLoaded = true;
            });
            xhr.send();
        };
        Main.prototype.createRenderTargetBuffer = function (width, height) {
            var gl = this.gl;
            var textureWidth = 2;
            var textureHeight = 2;
            while (textureWidth < width) {
                textureWidth *= 2;
            }
            while (textureHeight < height) {
                textureHeight *= 2;
            }
            var glFrameBuffer = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, glFrameBuffer);
            var glTexture = gl.createTexture();
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, glTexture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, textureWidth, textureHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, glTexture, 0);
            gl.bindTexture(gl.TEXTURE_2D, null);
            var glRenderbuffer = gl.createRenderbuffer();
            gl.bindRenderbuffer(gl.RENDERBUFFER, glRenderbuffer);
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, textureWidth, textureHeight);
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, glRenderbuffer);
            gl.bindRenderbuffer(gl.RENDERBUFFER, null);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            var renderImage = new RenderImage();
            renderImage.texture = glTexture;
            var buffer = new RenderTargetBuffer();
            buffer.framebuffer = glFrameBuffer;
            buffer.renderbuffer = glRenderbuffer;
            buffer.width = width;
            buffer.height = height;
            buffer.texture.push(renderImage);
            buffer.textureWidth = textureWidth;
            buffer.textureHeight = textureHeight;
            return buffer;
        };
        Main.prototype.setRenderTargetBuffer = function (buffer) {
            if (buffer != null) {
                this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, buffer.framebuffer);
            }
            else {
                this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
            }
        };
        Main.prototype.drawScreenModel = function (renderImages) {
            this.render.setShader(this.screenShader);
            this.render.setBuffers(this.screen_ModelResource, renderImages);
            this.render.drawElements(this.screen_ModelResource);
        };
        return Main;
    }());
    var ScreenShader = (function (_super) {
        __extends(ScreenShader, _super);
        function ScreenShader() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.aVertexPosition = -1;
            _this.aTexCoord = -1;
            _this.uTexture0 = null;
            return _this;
        }
        ScreenShader.prototype.initializeVertexSourceCode = function () {
            this.vertexShaderSourceCode = ''
                + this.floatPrecisionDefinitionCode
                + 'attribute vec3 aVertexPosition;'
                + 'attribute vec2 aTexCoord;'
                + 'varying vec2 vTexCoord;'
                + 'void main(void) {'
                + '    gl_Position = vec4(aVertexPosition, 1.0);'
                + '    vTexCoord = aTexCoord;'
                + '}';
        };
        ScreenShader.prototype.initializeFragmentSourceCode = function () {
            this.fragmentShaderSourceCode = ''
                + this.floatPrecisionDefinitionCode
                + 'varying vec2 vTexCoord;'
                + 'uniform sampler2D uTexture0;'
                + 'void main(void) {'
                + '    gl_FragColor = texture2D(uTexture0, vTexCoord);'
                + '}';
        };
        ScreenShader.prototype.initializeAttributes = function (gl) {
            this.aVertexPosition = this.getAttribLocation('aVertexPosition', gl);
            this.aTexCoord = this.getAttribLocation('aTexCoord', gl);
            this.uTexture0 = this.getUniformLocation('uTexture0', gl);
        };
        ScreenShader.prototype.setBuffers = function (model, images, gl) {
            gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
            this.enableVertexAttributes(gl);
            this.resetVertexAttribPointerOffset();
            this.vertexAttribPointer(this.aVertexPosition, 3, gl.FLOAT, model.vertexDataStride, gl);
            this.vertexAttribPointer(this.aTexCoord, 2, gl.FLOAT, model.vertexDataStride, gl);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, images[0].texture);
            gl.uniform1i(this.uTexture0, 0);
        };
        return ScreenShader;
    }(RenderShader));
    ComplexToonDrawing.ScreenShader = ScreenShader;
    var Bone2Shader = (function (_super) {
        __extends(Bone2Shader, _super);
        function Bone2Shader() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.aTexCoord1 = -1;
            _this.uTexture0 = null;
            _this.aWeight1 = -1;
            _this.aVertexPosition1 = -1;
            _this.aVertexNormal1 = -1;
            _this.aVertexPosition2 = -1;
            _this.aWeight2 = -1;
            _this.aVertexNormal2 = -1;
            _this.uNormalMatrix = null;
            _this.uBoneMatrixList = new List();
            return _this;
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
                + 'uniform mat4 uNormalMatrix;'
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
            gl.uniformMatrix4fv(this.uBoneMatrixList[boneIndex], false, matrix);
        };
        return Bone2Shader;
    }(RenderShader));
    ComplexToonDrawing.Bone2Shader = Bone2Shader;
    var Bone4Shader = (function (_super) {
        __extends(Bone4Shader, _super);
        function Bone4Shader() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.aWeight3 = -1;
            _this.aVertexPosition3 = -1;
            _this.aVertexNormal3 = -1;
            _this.aVertexPosition4 = -1;
            _this.aWeight4 = -1;
            _this.aVertexNormal4 = -1;
            return _this;
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
                + 'uniform mat4 uNormalMatrix;'
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
            this.vertexAttribPointer(this.aVertexPosition3, 3, gl.FLOAT, model.vertexDataStride, gl);
            this.vertexAttribPointer(this.aVertexNormal3, 3, gl.FLOAT, model.vertexDataStride, gl);
            this.vertexAttribPointer(this.aWeight4, 1, gl.FLOAT, model.vertexDataStride, gl);
            this.vertexAttribPointer(this.aVertexPosition4, 3, gl.FLOAT, model.vertexDataStride, gl);
            this.vertexAttribPointer(this.aVertexNormal4, 3, gl.FLOAT, model.vertexDataStride, gl);
        };
        return Bone4Shader;
    }(Bone2Shader));
    ComplexToonDrawing.Bone4Shader = Bone4Shader;
    var toonFragmentShaderCode = ''
        + 'varying vec2 vTexCoord;'
        + 'varying vec3 vTransformedNormal;'
        + 'uniform sampler2D uTexture0;'
        + 'uniform vec2 uResolution;'
        + 'vec3 rgb2hsv(vec3 c)'
        + '{'
        + '  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);'
        + '  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));'
        + '  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));'
        + '  float d = q.x - min(q.w, q.y);'
        + '  float e = 1.0e-10;'
        + '  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);'
        + '}'
        + 'vec3 hsv2rgb(vec3 c)'
        + '{'
        + '  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);'
        + '  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);'
        + '  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);'
        + '}'
        + 'void main(void) {'
        + '    vec2 p = gl_FragCoord.xy / uResolution;'
        + '    vec3  nnormal = normalize(vTransformedNormal);'
        + '    float directional = clamp(dot(nnormal, vec3(0.5, -0.5, 0.0)), 0.0, 1.0);'
        + '    float toons = 1.0 - smoothstep(0.57, 0.6, directional);'
        + '    vec4 sourceColor = texture2D(uTexture0, p);'
        + '    vec3 hsv = rgb2hsv(sourceColor.rgb);'
        + '    vec3 rgb = hsv2rgb(vec3(hsv.r, hsv.g + (hsv.b * toons * 0.2), hsv.b - (hsv.b * toons * 0.2)));'
        + '    gl_FragColor = vec4(rgb, sourceColor.a);'
        + '}';
    var Bone2Shader_Toons = (function (_super) {
        __extends(Bone2Shader_Toons, _super);
        function Bone2Shader_Toons() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.uResolution = null;
            return _this;
        }
        Bone2Shader_Toons.prototype.initializeFragmentSourceCode = function () {
            this.fragmentShaderSourceCode = ''
                + this.floatPrecisionDefinitionCode
                + toonFragmentShaderCode;
        };
        Bone2Shader_Toons.prototype.initializeAttributes = function (gl) {
            this.initializeAttributes_RenderShader(gl);
            this.initializeAttributes_Bone2Shader(gl);
            this.initializeAttributes_Bone2Shader_Toons(gl);
        };
        Bone2Shader_Toons.prototype.initializeAttributes_Bone2Shader_Toons = function (gl) {
            this.uResolution = this.getUniformLocation('uResolution', gl);
        };
        Bone2Shader_Toons.prototype.setResolution = function (width, height, gl) {
            gl.uniform2fv(this.uResolution, vec2.fromValues(width, height));
        };
        return Bone2Shader_Toons;
    }(Bone2Shader));
    ComplexToonDrawing.Bone2Shader_Toons = Bone2Shader_Toons;
    var Bone4Shader_Toons = (function (_super) {
        __extends(Bone4Shader_Toons, _super);
        function Bone4Shader_Toons() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.uResolution = null;
            return _this;
        }
        Bone4Shader_Toons.prototype.initializeFragmentSourceCode = function () {
            this.fragmentShaderSourceCode = ''
                + this.floatPrecisionDefinitionCode
                + toonFragmentShaderCode;
        };
        Bone4Shader_Toons.prototype.initializeAttributes = function (gl) {
            this.initializeAttributes_RenderShader(gl);
            this.initializeAttributes_Bone2Shader(gl);
            this.initializeAttributes_Bone4Shader(gl);
            this.initializeAttributes_Bone2Shader_Toons(gl);
        };
        Bone4Shader_Toons.prototype.initializeAttributes_Bone2Shader_Toons = function (gl) {
            this.uResolution = this.getUniformLocation('uResolution', gl);
        };
        Bone4Shader_Toons.prototype.setResolution = function (width, height, gl) {
            gl.uniform2fv(this.uResolution, vec2.fromValues(width, height));
        };
        return Bone4Shader_Toons;
    }(Bone4Shader));
    ComplexToonDrawing.Bone4Shader_Toons = Bone4Shader_Toons;
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
        setTimeout(run, 1000 / 24);
    }
})(ComplexToonDrawing || (ComplexToonDrawing = {}));
