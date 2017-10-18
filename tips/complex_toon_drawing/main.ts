
namespace ComplexToonDrawing {

    // skinning model
    interface SkinningModelData {
        images: List<string>;
        bones: List<SkinningModelBoneData>;
        parts: List<SkinningModelPartData>;
    }

    interface SkinningModelBoneData {
        name: string;
        parent: int;
        matrix: Mat4;
    }

    interface SkinningModelPartData {
        bone: List<int>;
        material: int;
        vertexStride: int;
        vertex: List<float>;
        index: List<int>;

        renderModel: RenderModel;
    }

    class SkinningModel {
        data: SkinningModelData = null;
        name: string;
    }

    class SkinningModelLoadingState {
        isInitialized = false;
        isLoaded = false;
        models = new Dictionary<SkinningModel>();
        modelList = new List<SkinningModel>();
    }

    class AnimationDataLoadingState {
        isInitialized = false;
        isLoaded = false;
        animations = new Dictionary<IPOBoneAnimation>();
    }

    // drawing buffer
    class RenderTargetBuffer {
        framebuffer: WebGLFramebuffer = null;
        renderbuffer: WebGLRenderbuffer = null;
        width = 0;
        height = 0;
        texture = new List<RenderImage>();
        textureWidth = 0;
        textureHeight = 0;
    }

    class Main {

        logicalScreenWidth = 640.0;
        logicalScreenHeight = 360.0;

        canvas: HTMLCanvasElement = null;
        gl: WebGLRenderingContext = null;

        render = new WebGLRender();
        screenShader = new ScreenShader();
        bone2Shader = new Bone2Shader();
        bone4Shader = new Bone4Shader();
        bone2Shader_Toons = new Bone2Shader_Toons();
        bone4Shader_Toons = new Bone4Shader_Toons();
        drawer_Bone2Shader: Bone2Shader = null;
        drawer_Bone4Shader: Bone4Shader = null;

        loaded = false;

        screen_ModelResource = new RenderModel();

        skinningModelLoadingState = new SkinningModelLoadingState();
        modelResourceList: List<SkinningModel> = null;

        skinModelImageResources = new List<RenderImage>();
        backImageResources = new List<RenderImage>();

        animationDataLoadingState = new AnimationDataLoadingState();
        boneAnimationResource: IPOBoneAnimation = null;
        boneModel: SkinningModel = null;

        animationSolver = new AnimationSolver();
        boneAnimationBuffer: BoneAnimationBuffer = null;
        boneMatrixBuffer: BoneAnimationMatrixBuffer = null;

        clothes_ModelNameList: List<string> = [
            'CoatBase', 'MafuraBase'
        ];

        skin_ModelNameList: List<string> = [
            'SkinBase'
        ];

        hair_ModelNameList: List<string> = [
            'HairBase'
        ];

        face_ModelNameList: List<string> = [
            'EyeWhite', 'Mayuge', 'Eyes', 'EyeLight', 'Matuge', 'MouseNose'
        ];

        skinShader_ModelNameList: List<string> = [
            'SkinShader'
        ];

        skinBase_FrameBuffer: RenderTargetBuffer;

        eyeLocation = vec3.create();
        lookatLocation = vec3.create();
        upVector = vec3.create();

        modelMatrix = mat4.create();
        viewMatrix = mat4.create();
        pMatrix = mat4.create();
        mvMatrix = mat4.create();
        normalMatrix = mat4.create();
        boneMatrix = mat4.create();

        tmpVector = vec3.create();

        animationTime = 0.0;

        initialize(canvas: HTMLCanvasElement) {

            this.canvas = canvas;
            this.canvas.width = this.logicalScreenWidth;
            this.canvas.height = this.logicalScreenHeight;

            if (this.render.initializeWebGL(canvas)) {
                return;
            }

            this.gl = this.render.gl;

            this.render.initializeShader(this.screenShader);
            this.render.initializeShader(this.bone2Shader);
            this.render.initializeShader(this.bone4Shader);
            this.render.initializeShader(this.bone4Shader_Toons);
            this.render.initializeShader(this.bone2Shader_Toons);

            this.render.initializeModelBuffer(this.screen_ModelResource, [
                -1.0, -1.0, 0.0, 0.00, 0.00,
                1.00, -1.0, 0.0, 1.00, 0.00,
                -1.0, 1.00, 0.0, 0.00, 1.00,
                1.00, 1.00, 0.0, 1.00, 1.00]
                , [0, 1, 2, 3, 2, 1]
                , 4 * 5);

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
        }

        processLoading() {

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
        }

        run() {

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
        }

        draw() {

            if (!this.loaded) {
                return;
            }

            // calculates camera matrix
            var aspect = this.logicalScreenWidth / this.logicalScreenHeight;
            mat4.perspective(this.pMatrix, 8.0 * Math.PI / 180, aspect, 0.1, 50.0);
            mat4.lookAt(this.viewMatrix, this.eyeLocation, this.lookatLocation, this.upVector);

            // background
            this.render.setDepthTest(false)
            this.render.setCulling(false);
            this.render.clearColorBufferDepthBuffer(0.0, 0.0, 0.1, 0.0);
            this.drawScreenModel(this.backImageResources);

            // skin base layer
            this.setRenderTargetBuffer(this.skinBase_FrameBuffer);
            this.gl.viewport(0, 0, this.logicalScreenWidth, this.logicalScreenHeight);

            this.render.setDepthTest(true)
            this.render.clearColorBufferDepthBuffer(0.0, 0.0, 0.0, 0.0);

            this.drawer_Bone2Shader = this.bone2Shader;
            this.drawer_Bone4Shader = this.bone4Shader;
            this.drawSkinningModels(this.modelMatrix, this.clothes_ModelNameList, this.skinModelImageResources)
            this.drawSkinningModels(this.modelMatrix, this.skin_ModelNameList, this.skinModelImageResources)
            this.drawSkinningModels(this.modelMatrix, this.hair_ModelNameList, this.skinModelImageResources)

            this.render.setDepthTest(false)
            this.drawSkinningModels(this.modelMatrix, this.face_ModelNameList, this.skinModelImageResources)

            // skin shader layer
            this.setRenderTargetBuffer(null);
            this.gl.viewport(0, 0, this.logicalScreenWidth, this.logicalScreenHeight);

            this.render.setDepthTest(true)
            this.render.clearDepthBuffer();

            this.drawer_Bone2Shader = this.bone2Shader_Toons;
            this.drawer_Bone4Shader = this.bone4Shader_Toons;
            this.render.setDepthTest(true)
            this.drawSkinningModels(this.modelMatrix, this.skinShader_ModelNameList, this.skinBase_FrameBuffer.texture)
        }

        private calcNormalMatrix(out: Mat4, matrix: Mat4) {

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
        }

        private drawSkinningModels(modelMatrix: Mat4, modelNameList: List<string>, imageResources: List<RenderImage>) {

            for (var i = 0; i < modelNameList.length; i++) {
                var model = this.skinningModelLoadingState.models[modelNameList[i]];

                this.drawSkinningModel(modelMatrix, model, this.boneMatrixBuffer, imageResources);
            }
        }

        private drawSkinningModel(modelMatrix: Mat4, skinningModel: SkinningModel, matrixBuffer: BoneAnimationMatrixBuffer, imageResources: List<RenderImage>) {

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
                var shader: Bone2Shader;
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
        }

        private loadModel(loadingState: SkinningModelLoadingState, url: string) {

            var xhr = new XMLHttpRequest();
            xhr.open('GET', url);
            xhr.responseType = 'json';

            xhr.addEventListener('load',
                (e: Event) => {
                    var data: any;
                    if (xhr.responseType == 'json') {
                        data = xhr.response;
                    } else {
                        data = JSON.parse(xhr.response);
                    }

                    for (var modelName in data) {
                        var skinningModel = new SkinningModel();
                        skinningModel.name = modelName;
                        skinningModel.data = data[modelName];
                        loadingState.models[modelName] = skinningModel;
                    }

                    loadingState.isLoaded = true;
                }
            );

            xhr.send();
        }

        private initializeSkinningModelBuffers(loadingState: SkinningModelLoadingState) {

            for (var modelName in loadingState.models) {
                var skinningModel = loadingState.models[modelName];

                console.log('initializing skin model: ' + modelName);

                this.initializeSkinningModelBuffer(skinningModel);

                loadingState.modelList.push(skinningModel);
            }
        }

        private initializeSkinningModelBuffer(skinningModel: SkinningModel) {

            // create buffers for each part
            for (var i = 0; i < skinningModel.data.parts.length; i++) {
                var part = skinningModel.data.parts[i];

                var renderModel = new RenderModel();
                this.render.initializeModelBuffer(renderModel, part.vertex, part.index, 4 * part.vertexStride); // 4 (=size of float)

                part.renderModel = renderModel;
            }
        }

        private loadTexture(image: RenderImage, url: string) {

            image.imageData = new Image();

            image.imageData.addEventListener('load',
                () => {
                    this.render.initializeImageTexture(image);
                }
            );

            image.imageData.src = url;
        }

        private loadAnimation(loadingState: AnimationDataLoadingState, url: string) {

            var xhr = new XMLHttpRequest();
            xhr.open('GET', url);
            xhr.responseType = 'json';

            xhr.addEventListener('load',
                (e: Event) => {
                    var data: any;
                    if (xhr.responseType == 'json') {
                        data = xhr.response;
                    } else {
                        data = JSON.parse(xhr.response);
                    }

                    loadingState.animations = data;
                    loadingState.isLoaded = true;
                }
            );

            xhr.send();
        }

        private createRenderTargetBuffer(width: int, height: int): RenderTargetBuffer {

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
        }

        private setRenderTargetBuffer(buffer: RenderTargetBuffer) {

            if (buffer != null) {
                this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, buffer.framebuffer);
            }
            else {
                this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
            }
        }

        private drawScreenModel(renderImages: List<RenderImage>) {

            this.render.setShader(this.screenShader);
            this.render.setBuffers(this.screen_ModelResource, renderImages);
            this.render.drawElements(this.screen_ModelResource);
        }
    }

    export class ScreenShader extends RenderShader {

        aVertexPosition = -1;
        aTexCoord = -1;

        uTexture0: WebGLUniformLocation = null;

        initializeVertexSourceCode() {

            this.vertexShaderSourceCode = ''
                + this.floatPrecisionDefinitionCode

                + 'attribute vec3 aVertexPosition;'
                + 'attribute vec2 aTexCoord;'

                + 'varying vec2 vTexCoord;'

                + 'void main(void) {'
                + '    gl_Position = vec4(aVertexPosition, 1.0);'
                + '    vTexCoord = aTexCoord;'
                + '}';
        }

        initializeFragmentSourceCode() {

            this.fragmentShaderSourceCode = ''
                + this.floatPrecisionDefinitionCode

                + 'varying vec2 vTexCoord;'

                + 'uniform sampler2D uTexture0;'

                + 'void main(void) {'
                + '    gl_FragColor = texture2D(uTexture0, vTexCoord);'
                + '}';
        }

        initializeAttributes(gl: WebGLRenderingContext) {

            this.aVertexPosition = this.getAttribLocation('aVertexPosition', gl);
            this.aTexCoord = this.getAttribLocation('aTexCoord', gl);

            this.uTexture0 = this.getUniformLocation('uTexture0', gl);
        }

        setBuffers(model: RenderModel, images: List<RenderImage>, gl: WebGLRenderingContext) {

            gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);

            this.enableVertexAttributes(gl);
            this.resetVertexAttribPointerOffset();

            this.vertexAttribPointer(this.aVertexPosition, 3, gl.FLOAT, model.vertexDataStride, gl);
            this.vertexAttribPointer(this.aTexCoord, 2, gl.FLOAT, model.vertexDataStride, gl);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, images[0].texture);
            gl.uniform1i(this.uTexture0, 0);
        }
    }

    export class Bone2Shader extends RenderShader {

        aTexCoord1 = -1;

        uTexture0: WebGLUniformLocation = null;

        aWeight1 = -1;
        aVertexPosition1 = -1;
        aVertexNormal1 = -1;

        aVertexPosition2 = -1;
        aWeight2 = -1;
        aVertexNormal2 = -1;

        uNormalMatrix: WebGLUniformLocation = null;
        uBoneMatrixList = new List<WebGLUniformLocation>();

        initializeVertexSourceCode() {

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
        }

        initializeFragmentSourceCode() {

            this.fragmentShaderSourceCode = ''
                + this.floatPrecisionDefinitionCode

                + 'varying vec2 vTexCoord;'
                + 'varying vec3 vTransformedNormal;'

                + 'uniform sampler2D uTexture0;'

                + 'void main(void) {'
                + '    gl_FragColor = texture2D(uTexture0, vTexCoord);'
                + '}';
        }

        initializeAttributes(gl: WebGLRenderingContext) {

            this.initializeAttributes_RenderShader(gl);
            this.initializeAttributes_Bone2Shader(gl);
        }

        initializeAttributes_Bone2Shader(gl: WebGLRenderingContext) {

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
        }

        setBuffers(model: RenderModel, images: List<RenderImage>, gl: WebGLRenderingContext) {

            this.setBuffers_Bone2Shader(model, images, gl);
            this.setBuffers_Bone2Shader_UV(model, gl);
        }

        setBuffers_Bone2Shader(model: RenderModel, images: List<RenderImage>, gl: WebGLRenderingContext) {

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
        }

        setBuffers_Bone2Shader_UV(model: RenderModel, gl: WebGLRenderingContext) {

            this.vertexAttribPointer(this.aTexCoord1, 2, gl.FLOAT, model.vertexDataStride, gl);
            //this.vertexAttribPointer(this.aTexCoord2, 2, gl.FLOAT, model.vertexDataStride, gl); skip (not used in this sample)
            //this.vertexAttribPointer(this.aTexCoord3, 2, gl.FLOAT, model.vertexDataStride, gl); skip (not used in this sample)
        }

        setNormalMatrix(matrix: Mat4, gl: WebGLRenderingContext) {
            gl.uniformMatrix4fv(this.uNormalMatrix, false, matrix);
        }

        setBoneMatrix(boneIndex: int, matrix: Mat4, gl: WebGLRenderingContext) {
            gl.uniformMatrix4fv(this.uBoneMatrixList[boneIndex], false, matrix);
        }
    }

    export class Bone4Shader extends Bone2Shader {

        aWeight3 = -1;
        aVertexPosition3 = -1;
        aVertexNormal3 = -1;

        aVertexPosition4 = -1;
        aWeight4 = -1;
        aVertexNormal4 = -1;

        initializeVertexSourceCode() {

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
        }

        initializeAttributes(gl: WebGLRenderingContext) {

            this.initializeAttributes_RenderShader(gl);
            this.initializeAttributes_Bone2Shader(gl);
            this.initializeAttributes_Bone4Shader(gl);
        }

        initializeAttributes_Bone4Shader(gl: WebGLRenderingContext) {

            this.aWeight3 = this.getAttribLocation('aWeight3', gl);
            this.aVertexPosition3 = this.getAttribLocation('aVertexPosition3', gl);
            this.aVertexNormal3 = this.getAttribLocation('aVertexNormal3', gl);

            this.aWeight4 = this.getAttribLocation('aWeight4', gl);
            this.aVertexPosition4 = this.getAttribLocation('aVertexPosition4', gl);
            this.aVertexNormal4 = this.getAttribLocation('aVertexNormal4', gl);

            this.uBoneMatrixList.push(this.getUniformLocation('uBoneMatrix3', gl));
            this.uBoneMatrixList.push(this.getUniformLocation('uBoneMatrix4', gl));
        }

        setBuffers(model: RenderModel, images: List<RenderImage>, gl: WebGLRenderingContext) {

            this.setBuffers_Bone2Shader(model, images, gl);
            this.setBuffers_Bone4Shader(model, images, gl);
            this.setBuffers_Bone2Shader_UV(model, gl);
        }

        setBuffers_Bone4Shader(model: RenderModel, images: List<RenderImage>, gl: WebGLRenderingContext) {

            this.vertexAttribPointer(this.aWeight3, 1, gl.FLOAT, model.vertexDataStride, gl);
            this.vertexAttribPointer(this.aVertexPosition3, 3, gl.FLOAT, model.vertexDataStride, gl);
            this.vertexAttribPointer(this.aVertexNormal3, 3, gl.FLOAT, model.vertexDataStride, gl);

            this.vertexAttribPointer(this.aWeight4, 1, gl.FLOAT, model.vertexDataStride, gl);
            this.vertexAttribPointer(this.aVertexPosition4, 3, gl.FLOAT, model.vertexDataStride, gl);
            this.vertexAttribPointer(this.aVertexNormal4, 3, gl.FLOAT, model.vertexDataStride, gl);
        }
    }

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
        //+ '    gl_FragColor = vec4(toons, 0.0, 0.0, sourceColor.a);'
        + '}';

    export class Bone2Shader_Toons extends Bone2Shader {

        uResolution: WebGLUniformLocation = null;

        initializeFragmentSourceCode() {
            this.fragmentShaderSourceCode = ''
                + this.floatPrecisionDefinitionCode
                + toonFragmentShaderCode;
        }

        initializeAttributes(gl: WebGLRenderingContext) {

            this.initializeAttributes_RenderShader(gl);
            this.initializeAttributes_Bone2Shader(gl);
            this.initializeAttributes_Bone2Shader_Toons(gl);
        }

        initializeAttributes_Bone2Shader_Toons(gl: WebGLRenderingContext) {

            this.uResolution = this.getUniformLocation('uResolution', gl);
        }

        setResolution(width: int, height: int, gl: WebGLRenderingContext) {
            gl.uniform2fv(this.uResolution, vec2.fromValues(width, height));
        }
    }

    export class Bone4Shader_Toons extends Bone4Shader {

        uResolution: WebGLUniformLocation = null;

        initializeFragmentSourceCode() {
            this.fragmentShaderSourceCode = ''
                + this.floatPrecisionDefinitionCode
                + toonFragmentShaderCode;
        }

        initializeAttributes(gl: WebGLRenderingContext) {

            this.initializeAttributes_RenderShader(gl);
            this.initializeAttributes_Bone2Shader(gl);
            this.initializeAttributes_Bone4Shader(gl);
            this.initializeAttributes_Bone2Shader_Toons(gl);
        }

        initializeAttributes_Bone2Shader_Toons(gl: WebGLRenderingContext) {

            this.uResolution = this.getUniformLocation('uResolution', gl);
        }

        setResolution(width: int, height: int, gl: WebGLRenderingContext) {
            gl.uniform2fv(this.uResolution, vec2.fromValues(width, height));
        }
    }

    var _Main: Main;

    window.onload = () => {

        var canvas = <HTMLCanvasElement>document.getElementById('canvas');
        _Main = new Main();
        _Main.initialize(canvas);

        setTimeout(run, 1000 / 30);
    };

    function run() {
        _Main.run();
        _Main.draw();

        setTimeout(run, 1000 / 24);
    }
}
