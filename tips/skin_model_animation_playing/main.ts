
namespace SkinModelAnimationPlaying {

    interface SkinModelBoneData {

        name: string;
        parent: int;
        matrix: List<float>;
    }

    interface SkinModelPartData {

        boneIndices: List<int>;
        material: int;
        vertexStride: int;
        vertex: List<float>;
        index: List<int>;

        renderModel: RenderModel;
    }

    interface SkinModelData {

        bones: List<SkinModelBoneData>;
        parts: List<SkinModelPartData>;
    }

    class SkinModel {

        data: SkinModelData = null;
        loaded = false;
    }

    interface AnimationSet {

        boneAnimations: Dictionary<BoneAnimation>;
        objectAnimation: ObjectAnimationCurveSet;
    }

    class AnimationData {

        data = new Dictionary<AnimationSet>();
        loaded = false;
    }

    class Main {

        logicalScreenWidth = 640.0;
        logicalScreenHeight = 360.0;

        render = new WebGLRender();
        bone2Shader = new Bone2Shader();
        bone4Shader = new Bone4Shader();
        skinModel = new SkinModel();
        images = new List<RenderImage>();
        noColor = vec4.fromValues(0.0, 0.0, 0.0, 0.0);
        redColor = vec4.fromValues(0.8, 0.0, 0.0, 1.0);

        animationData = new AnimationData();
        objectAnimation: ObjectAnimationCurveSet = null;
        boneAnimation: BoneAnimation = null;

        eyeLocation = vec3.create();
        lookatLocation = vec3.create();
        upVector = vec3.create();

        modelMatrix = mat4.create();
        viewMatrix = mat4.create();
        modelViewMatrix = mat4.create();
        projectionMatrix = mat4.create();

        objectMatrix = mat4.create();
        boneAnimationBuffer: BoneAnimationBuffer = null;
        boneMatrixBuffer: BoneAnimationMatrixBuffer = null;
        boneMatrix = mat4.create();

        animationSolver = new AnimationSolver();

        modelLocation = vec3.create();
        modelRotation = vec3.create();
        modelScaling = vec3.create();

        objectAnimationTime = 0.0;
        boneAnimationTime = 0.0;

        isLoaded = false;

        initialize(canvas: HTMLCanvasElement) {

            canvas.width = this.logicalScreenWidth;
            canvas.height = this.logicalScreenHeight;

            if (this.render.initializeWebGL(canvas)) {
                return;
            }

            this.render.initializeShader(this.bone2Shader);
            this.render.initializeShader(this.bone4Shader);

            let image = new RenderImage();
            this.loadTexture(image, '../skinning_model_converting/texture.png');
            this.images.push(image);

            this.skinModel = new SkinModel();
            this.loadSkinModel(this.skinModel, '../temp/sample_skin_model.json', 'SkinModel1');

            this.loadAnimation(this.animationData, '../temp/sample_skin_model_animation.json');
        }

        processLoading() {

            // Waiting for data
            if (this.images[0].texture == null) {
                return;
            }

            if (!this.skinModel.loaded) {
                return;
            }

            if (!this.animationData.loaded) {
                return;
            }

            // Loading finished
            let animation: AnimationSet = this.animationData.data['ArmatureAction'];
            this.boneAnimation = animation.boneAnimations;
            this.objectAnimation = animation.objectAnimation;

            this.boneAnimationBuffer = this.animationSolver.createBoneAnimationBuffer(this.skinModel.data.bones);
            this.boneMatrixBuffer = this.animationSolver.createBoneMatrixBuffer(this.skinModel.data.bones);

            this.isLoaded = true;
        }

        run() {

            // Animation time
            this.objectAnimationTime += 0.8;
            if (this.objectAnimationTime >= 80.0) {

                this.objectAnimationTime -= 80.0;
            }

            this.boneAnimationTime += 0.8;
            if (this.boneAnimationTime >= 40.0) {

                this.boneAnimationTime -= 40.0;
            }

            // Camera position
            vec3.set(this.eyeLocation, 9.2, -4.2, 5.3);
            vec3.set(this.lookatLocation, 0.0, 0.0, 1.0);
            vec3.set(this.upVector, 0.0, 0.0, 1.0);

            // Object animation
            this.calculateObjectMatrix(this.objectMatrix, this.objectAnimation, this.objectAnimationTime);

            // Bone animation
            this.calculateBoneMatrix(this.boneMatrixBuffer, this.boneAnimationBuffer, this.skinModel, this.boneAnimation, this.boneAnimationTime);
        }

        draw() {

            let aspect = this.logicalScreenWidth / this.logicalScreenHeight;
            mat4.perspective(this.projectionMatrix, 30.0 * Math.PI / 180, aspect, 0.1, 100.0);
            mat4.lookAt(this.viewMatrix, this.eyeLocation, this.lookatLocation, this.upVector);

            this.render.setDepthTest(true)
            this.render.setCulling(false);
            this.render.clearColorBufferDepthBuffer(0.0, 0.0, 0.1, 1.0);

            this.drawSkinModel(this.objectMatrix, this.skinModel, this.images, this.boneMatrixBuffer);
        }

        private calculateObjectMatrix(objectMatrix: Mat4, objectAnimation: ObjectAnimationCurveSet, animationTime: float) {

            let solver = this.animationSolver;

            // Object animation
            vec3.set(this.modelLocation
                , solver.getIPOCurveValueIfNotNull(objectAnimation.locationX, animationTime, 0.0)
                , solver.getIPOCurveValueIfNotNull(objectAnimation.locationY, animationTime, 0.0)
                , solver.getIPOCurveValueIfNotNull(objectAnimation.locationZ, animationTime, 0.0));

            vec3.set(this.modelRotation
                , solver.getIPOCurveValueIfNotNull(objectAnimation.rotationX, animationTime, 0.0)
                , solver.getIPOCurveValueIfNotNull(objectAnimation.rotationY, animationTime, 0.0)
                , solver.getIPOCurveValueIfNotNull(objectAnimation.rotationZ, animationTime, 0.0));

            vec3.set(this.modelScaling
                , solver.getIPOCurveValueIfNotNull(objectAnimation.scalingX, animationTime, 1.0)
                , solver.getIPOCurveValueIfNotNull(objectAnimation.scalingY, animationTime, 1.0)
                , solver.getIPOCurveValueIfNotNull(objectAnimation.scalingZ, animationTime, 1.0));

            mat4.identity(objectMatrix);
            mat4.translate(objectMatrix, objectMatrix, this.modelLocation);
            mat4.rotateX(objectMatrix, objectMatrix, this.modelRotation[0]);
            mat4.rotateY(objectMatrix, objectMatrix, this.modelRotation[1]);
            mat4.rotateZ(objectMatrix, objectMatrix, this.modelRotation[2]);
            mat4.scale(objectMatrix, objectMatrix, this.modelScaling);
        }

        private calculateBoneMatrix(boneMatrixBuffer: BoneAnimationMatrixBuffer, boneAnimationBuffer: BoneAnimationBuffer, skinModel: SkinModel, boneAnimation: BoneAnimation, animationTime: float) {

            let solver = this.animationSolver;

            solver.calcBoneAnimation(boneAnimationBuffer, skinModel.data.bones, boneAnimation, animationTime);
            solver.calcBoneMatrix(boneMatrixBuffer, skinModel.data.bones, boneAnimationBuffer);
        }

        private drawSkinModel(modelMatrix: Mat4, skinModel: SkinModel, images: List<RenderImage>, matrixBuffer: BoneAnimationMatrixBuffer) {

            // calc base matrix (model-view matrix)
            mat4.multiply(this.modelViewMatrix, this.viewMatrix, modelMatrix);

            // set parameter not dependent on parts
            this.render.setShader(this.bone2Shader);
            this.bone2Shader.setModelViewMatrix(this.modelViewMatrix);
            this.bone2Shader.setProjectionMatrix(this.projectionMatrix);

            this.render.setShader(this.bone4Shader);
            this.bone4Shader.setModelViewMatrix(this.modelViewMatrix);
            this.bone4Shader.setProjectionMatrix(this.projectionMatrix);

            // drawing for each part
            let bones = skinModel.data.bones;
            let parts = skinModel.data.parts;

            for (let part of parts) {

                // select shader
                let shader: Bone2Shader;
                if (part.boneIndices.length <= 2) {
                    shader = this.bone2Shader;
                }
                else {
                    shader = this.bone4Shader;
                }
                this.render.setShader(shader);

                // set bone matrix
                for (let part_BoneIndex = 0; part_BoneIndex < part.boneIndices.length; part_BoneIndex++) {

                    let model_BoneIndex = part.boneIndices[part_BoneIndex];

                    mat4.copy(this.boneMatrix, matrixBuffer.boneMatrixList[model_BoneIndex]);
                    shader.setBoneMatrix(part_BoneIndex, this.boneMatrix);
                }

                // set material
                if (part.material == 0) {
                    shader.setColor(this.noColor);
                }
                else {
                    shader.setColor(this.redColor);
                }

                // draw
                shader.setBuffers(part.renderModel, images);

                this.render.setDepthTest(true)
                this.render.setCulling(false);

                this.render.drawElements(part.renderModel);
            }
        }

        private loadTexture(resultImage: RenderImage, url: string) {

            resultImage.imageData = new Image();

            resultImage.imageData.addEventListener('load',
                () => {
                    this.render.initializeImageTexture(resultImage);
                }
            );

            resultImage.imageData.src = url;
        }

        private loadSkinModel(resultModel: SkinModel, url: string, modelName: string) {

            let xhr = new XMLHttpRequest();
            xhr.open('GET', url);
            xhr.responseType = 'json';

            xhr.addEventListener('load',
                (e: Event) => {

                    let data: any;
                    if (xhr.responseType == 'json') {
                        data = xhr.response;
                    }
                    else {
                        data = JSON.parse(xhr.response);
                    }

                    resultModel.data = data['skin_models'][modelName];
                    resultModel.loaded = true;

                    this.initializeSkinModelBuffer(resultModel);
                }
            );

            xhr.send();

        }

        private initializeSkinModelBuffer(skinModel: SkinModel) {

            // create buffers for each part
            for (let part of skinModel.data.parts) {

                let renderModel = new RenderModel();
                this.render.initializeModelBuffer(renderModel, part.vertex, part.index, 4 * part.vertexStride); // 4 (=size of float)

                part.renderModel = renderModel;
            }
        }

        private loadAnimation(animationData: AnimationData, url: string) {

            let xhr = new XMLHttpRequest();
            xhr.open('GET', url);
            xhr.responseType = 'json';

            xhr.addEventListener('load',
                (e: Event) => {

                    let data: any;
                    if (xhr.responseType == 'json') {
                        data = xhr.response;
                    }
                    else {
                        data = JSON.parse(xhr.response);
                    }

                    animationData.data = data;
                    animationData.loaded = true;
                }
            );

            xhr.send();
        }
    }

    export class Bone2Shader extends RenderShader {

        aTexCoord1 = -1;

        uTexture0: WebGLUniformLocation = null;

        aWeight1 = -1;
        aPosition1 = -1;

        aWeight2 = -1;
        aPosition2 = -1;

        uBoneMatrixs = new List<WebGLUniformLocation>();

        uColor: WebGLUniformLocation = null;

        initializeVertexSourceCode() {

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
        }

        initializeFragmentSourceCode() {

            this.fragmentShaderSourceCode = ''
                + this.floatPrecisionDefinitionCode

                + 'varying vec2 vTexCoord;'

                + 'uniform sampler2D uTexture0;'
                + 'uniform vec4 uColor;'

                + 'void main(void) {'
                + '    vec4 texColor = texture2D(uTexture0, vTexCoord);'
                + '    gl_FragColor = vec4(mix(texColor.rgb, uColor.rgb, uColor.a), texColor.a);'
                + '}';
        }

        initializeAttributes() {

            this.initializeAttributes_RenderShader();
            this.initializeAttributes_Bone2Shader();
        }

        initializeAttributes_Bone2Shader() {

            this.aWeight1 = this.getAttribLocation('aWeight1');
            this.aPosition1 = this.getAttribLocation('aPosition1');

            this.aWeight2 = this.getAttribLocation('aWeight2');
            this.aPosition2 = this.getAttribLocation('aPosition2');

            this.aTexCoord1 = this.getAttribLocation('aTexCoord1');

            this.uBoneMatrixs.push(this.getUniformLocation('uBoneMatrix1'));
            this.uBoneMatrixs.push(this.getUniformLocation('uBoneMatrix2'));

            this.uTexture0 = this.getUniformLocation('uTexture0');

            this.uColor = this.getUniformLocation('uColor');
        }

        setBuffers(model: RenderModel, images: List<RenderImage>) {

            this.setBuffers_Bone2Shader(model, images);
            this.setBuffers_Bone2Shader_UV(model);
        }

        setBuffers_Bone2Shader(model: RenderModel, images: List<RenderImage>) {

            let gl = this.gl;

            gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);

            this.enableVertexAttributes();
            this.resetVertexAttribPointerOffset();

            this.vertexAttribPointer(this.aWeight1, 1, gl.FLOAT, model.vertexDataStride);
            this.vertexAttribPointer(this.aPosition1, 3, gl.FLOAT, model.vertexDataStride);
            this.skipVertexAttribPointer(gl.FLOAT, 3);// skip normal data

            this.vertexAttribPointer(this.aWeight2, 1, gl.FLOAT, model.vertexDataStride);
            this.vertexAttribPointer(this.aPosition2, 3, gl.FLOAT, model.vertexDataStride);
            this.skipVertexAttribPointer(gl.FLOAT, 3);// skip normal data

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, images[0].texture);
            gl.uniform1i(this.uTexture0, 0);
        }

        setBuffers_Bone2Shader_UV(model: RenderModel) {

            let gl = this.gl;

            this.vertexAttribPointer(this.aTexCoord1, 2, gl.FLOAT, model.vertexDataStride);
        }

        setBoneMatrix(boneIndex: int, matrix: Mat4) {

            this.gl.uniformMatrix4fv(this.uBoneMatrixs[boneIndex], false, matrix);
        }

        setColor(color: Vec4) {

            this.gl.uniform4fv(this.uColor, color);
        }
    }

    export class Bone4Shader extends Bone2Shader {

        aWeight3 = -1;
        aPosition3 = -1;

        aPosition4 = -1;
        aWeight4 = -1;

        initializeVertexSourceCode() {

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
        }

        initializeAttributes() {

            this.initializeAttributes_RenderShader();
            this.initializeAttributes_Bone2Shader();
            this.initializeAttributes_Bone4Shader();
        }

        initializeAttributes_Bone4Shader() {

            this.aWeight3 = this.getAttribLocation('aWeight3');
            this.aPosition3 = this.getAttribLocation('aPosition3');

            this.aWeight4 = this.getAttribLocation('aWeight4');
            this.aPosition4 = this.getAttribLocation('aPosition4');

            this.uBoneMatrixs.push(this.getUniformLocation('uBoneMatrix3'));
            this.uBoneMatrixs.push(this.getUniformLocation('uBoneMatrix4'));
        }

        setBuffers(model: RenderModel, images: List<RenderImage>) {

            this.setBuffers_Bone2Shader(model, images);
            this.setBuffers_Bone4Shader(model, images);
            this.setBuffers_Bone2Shader_UV(model);
        }

        setBuffers_Bone4Shader(model: RenderModel, images: List<RenderImage>) {

            let gl = this.gl;

            this.vertexAttribPointer(this.aWeight3, 1, gl.FLOAT, model.vertexDataStride);
            this.vertexAttribPointer(this.aPosition3, 3, gl.FLOAT, model.vertexDataStride);
            this.vertexAttribPointerOffset += 4 * 3;// skip normal data

            this.vertexAttribPointer(this.aWeight4, 1, gl.FLOAT, model.vertexDataStride);
            this.vertexAttribPointer(this.aPosition4, 3, gl.FLOAT, model.vertexDataStride);
            this.vertexAttribPointerOffset += 4 * 3;// skip normal data
        }
    }

    let _Main: Main;

    window.onload = () => {

        let canvas = <HTMLCanvasElement>document.getElementById('canvas');
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
}
