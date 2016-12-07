
namespace SkinningModelDrawing {

    // types used this sample
    interface SkinningModelData {
        images: List<string>;
        bones: List<SkinningModelBoneData>;
        parts: List<SkinningModelPartData>;
    }

    interface SkinningModelBoneData {
        name: string;
        parent: int;
        matrix: List<float>;
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
        loaded = false;
        initialized = false;
    }

    class Main {

        logicalScreenWidth = 640.0;
        logicalScreenHeight = 360.0;

        canvas: HTMLCanvasElement = null;
        gl: WebGLRenderingContext = null;

        render = new WebGLRender();
        bone2Shader = new Bone2Shader();
        bone4Shader = new Bone4Shader();
        modelResource = new SkinningModel();
        imageResources = new List<RenderImage>();

        boneMatrixList = new List<Mat4>();

        eyeLocation = vec3.create();
        lookatLocation = vec3.create();
        upVector = vec3.create();

        modelMatrix = mat4.create();
        viewMatrix = mat4.create();
        pMatrix = mat4.create();
        mvMatrix = mat4.create();
        boneMatrix = mat4.create();

        animationTime = 0.0;

        initialize(canvas: HTMLCanvasElement) {

            this.canvas = canvas;
            this.canvas.width = this.logicalScreenWidth;
            this.canvas.height = this.logicalScreenHeight;

            try {
                var option = { preserveDrawingBuffer: true, antialias: true };

                this.gl = <WebGLRenderingContext>(
                    canvas.getContext('webgl', option)
                    || canvas.getContext('experimental-webgl', option)
                );

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
        }

        run() {

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
        }

        draw() {

            // calculates camera matrix
            var aspect = this.logicalScreenWidth / this.logicalScreenHeight;
            mat4.perspective(this.pMatrix, 45.0 * Math.PI / 180, aspect, 0.1, 50.0);
            mat4.lookAt(this.viewMatrix, this.eyeLocation, this.lookatLocation, this.upVector);

            // starts drawing
            this.render.clearColorBufferDepthBuffer(0.0, 0.0, 0.1, 1.0);

            this.drawSkinningModel(this.modelMatrix, this.modelResource);
        }

        private calcBoneMatrix(out: List<Mat4>, skinningModel: SkinningModel) {

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
        }

        private drawSkinningModel(modelMatrix: Mat4, skinningModel: SkinningModel) {

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
                var shader: Bone2Shader;
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
        }

        private loadModel(model: SkinningModel, url: string) {

            var xhr = new XMLHttpRequest();
            xhr.open('GET', url);
            xhr.responseType = 'json';

            xhr.addEventListener('load', (e: Event) => {
                var data: any;
                if (xhr.responseType == 'json') {
                    data = xhr.response;
                } else {
                    data = JSON.parse(xhr.response);
                }

                model.data = data['Cube'];
                model.loaded = true;
            });

            xhr.send();

        }

        private initializeSkinningModelBuffer(skinningModel: SkinningModel) {

            // create buffers for each part
            for (var i = 0; i < skinningModel.data.parts.length; i++) {
                var part = skinningModel.data.parts[i];

                var renderModel = new RenderModel();
                this.render.initializeModelBuffer(renderModel, part.vertex, part.index, 4 * part.vertexStride); // 4 (=size of float)

                part.renderModel = renderModel;
            }

            // create bone matrix
            this.boneMatrixList = new List<Mat4>();
            for (var i = 0; i < skinningModel.data.bones.length; i++) {
                this.boneMatrixList.push(mat4.create());
            }
        }

        private loadTexture(image: RenderImage, url: string) {

            image.imageData = new Image();

            image.imageData.addEventListener('load', () => {
                this.render.initializeImageTexture(image);
            });

            image.imageData.src = url;
        }
    }

    export class Bone2Shader extends RenderShader {

        aTexCoord1 = -1;

        uTexture0: WebGLUniformLocation = null;

        aWeight1 = -1;
        aVertexPosition1 = -1;

        aVertexPosition2 = -1;
        aWeight2 = -1;

        uBoneMatrixList = new List<WebGLUniformLocation>();

        initializeVertexSourceCode() {

            this.vertexShaderSourceCode = ''
                + this.floatPrecisionDefinitionCode

                + 'attribute float aWeight1;'
                + 'attribute vec3 aVertexPosition1;'

                + 'attribute float aWeight2;'
                + 'attribute vec3 aVertexPosition2;'

                + 'attribute vec2 aTexCoord1;'

                + 'uniform mat4 uBoneMatrix1;'
                + 'uniform mat4 uBoneMatrix2;'

                + 'uniform mat4 uMVMatrix;'
                + 'uniform mat4 uPMatrix;'

                + 'varying vec2 vTexCoord;'

                + 'void main(void) {'

                + '    vTexCoord = aTexCoord1;'

                + '    gl_Position = uPMatrix * uMVMatrix * (  uBoneMatrix1 * vec4(aVertexPosition1, 1.0) * aWeight1 '
                + '                                          + uBoneMatrix2 * vec4(aVertexPosition2, 1.0) * aWeight2);'
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

            this.initializeAttributes_RenderShader(gl);
            this.initializeAttributes_Bone2Shader(gl);
        }

        initializeAttributes_Bone2Shader(gl: WebGLRenderingContext) {

            this.aWeight1 = this.getAttribLocation('aWeight1', gl);
            this.aVertexPosition1 = this.getAttribLocation('aVertexPosition1', gl);

            this.aWeight2 = this.getAttribLocation('aWeight2', gl);
            this.aVertexPosition2 = this.getAttribLocation('aVertexPosition2', gl);

            this.aTexCoord1 = this.getAttribLocation('aTexCoord1', gl);

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
            this.vertexAttribPointerOffset += 4 * 3;// skip normal data

            this.vertexAttribPointer(this.aWeight2, 1, gl.FLOAT, model.vertexDataStride, gl);
            this.vertexAttribPointer(this.aVertexPosition2, 3, gl.FLOAT, model.vertexDataStride, gl);
            this.vertexAttribPointerOffset += 4 * 3;// skip normal data

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

        setBoneMatrix(boneIndex: int, matrix: Mat4, gl: WebGLRenderingContext) {
            gl.uniformMatrix4fv(this.uBoneMatrixList[boneIndex], false, matrix);
        }
    }

    export class Bone4Shader extends Bone2Shader {

        aWeight3 = -1;
        aVertexPosition3 = -1;

        aVertexPosition4 = -1;
        aWeight4 = -1;

        initializeVertexSourceCode() {

            this.vertexShaderSourceCode = ''
                + this.floatPrecisionDefinitionCode

                + 'attribute float aWeight1;'
                + 'attribute vec3 aVertexPosition1;'

                + 'attribute float aWeight2;'
                + 'attribute vec3 aVertexPosition2;'

                + 'attribute float aWeight3;'
                + 'attribute vec3 aVertexPosition3;'

                + 'attribute float aWeight4;'
                + 'attribute vec3 aVertexPosition4;'

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

                + '    gl_Position = uPMatrix * uMVMatrix * (  uBoneMatrix1 * vec4(aVertexPosition1, 1.0) * aWeight1 '
                + '                                          + uBoneMatrix2 * vec4(aVertexPosition2, 1.0) * aWeight2 '
                + '                                          + uBoneMatrix3 * vec4(aVertexPosition3, 1.0) * aWeight3 '
                + '                                          + uBoneMatrix4 * vec4(aVertexPosition4, 1.0) * aWeight4);'

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

            this.aWeight4 = this.getAttribLocation('aWeight4', gl);
            this.aVertexPosition4 = this.getAttribLocation('aVertexPosition4', gl);

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
            this.vertexAttribPointerOffset += 4 * 3;// skip normal data

            this.vertexAttribPointer(this.aWeight4, 1, gl.FLOAT, model.vertexDataStride, gl);
            this.vertexAttribPointer(this.aVertexPosition4, 3, gl.FLOAT, model.vertexDataStride, gl);
            this.vertexAttribPointerOffset += 4 * 3;// skip normal data
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

        setTimeout(run, 1000 / 30);
    }
}
