
namespace BasicWebGL {

    class Main {

        logicalScreenWidth = 640.0;
        logicalScreenHeight = 360.0;

        render = new WebGLRender();
        shader = new SampleShader();
        model = new RenderModel();
        images = new List<RenderImage>();

        eyeLocation = vec3.create();
        lookatLocation = vec3.create();
        upVector = vec3.create();

        modelMatrix = mat4.create();
        viewMatrix = mat4.create();
        modelViewMatrix = mat4.create();
        projectionMatrix = mat4.create();

        // x, y, z, u, v
        vertexData = [
            0.0, -0.2, 0.20, 0.00, 1.00,
            0.0, 0.20, 0.20, 1.00, 1.00,
            0.0, -0.2, -0.2, 0.00, 0.00,
            0.0, 0.20, -0.2, 1.00, 0.00
        ];

        indexData = [
            0, 1, 2,
            3, 2, 1
        ];

        animationTime = 0.0;

        isLoaded = false;

        initialize(canvas: HTMLCanvasElement) {

            canvas.width = this.logicalScreenWidth;
            canvas.height = this.logicalScreenHeight;

            if (this.render.initializeWebGL(canvas)) {
                return;
            }

            this.render.initializeShader(this.shader);

            this.render.initializeModelBuffer(this.model, this.vertexData, this.indexData, 4 * 5); // 4 (=size of float) * 5 (=x, y, z, u, v)

            let image = new RenderImage();
            this.loadTexture(image, './texture.png');
            this.images.push(image);
        }

        processLoading() {

            // Waiting for loading data
            if (this.images[0].texture == null) {
                return;
            }

            // Loading finished
            this.isLoaded = true;
        }

        run() {

            this.animationTime += 1.0;

            // Camera position
            vec3.set(this.eyeLocation, 0.6, 0.0, 0.3);
            vec3.set(this.lookatLocation, 0.0, 0.0, 0.0);
            vec3.set(this.upVector, 0.0, 0.0, 1.0);

            // Object animation
            mat4.identity(this.modelMatrix);
            mat4.rotateZ(this.modelMatrix, this.modelMatrix, this.animationTime * 0.02);
        }

        draw() {

            let aspect = this.logicalScreenWidth / this.logicalScreenHeight;
            mat4.perspective(this.projectionMatrix, 45.0 * Math.PI / 180, aspect, 0.1, 2.0);
            mat4.lookAt(this.viewMatrix, this.eyeLocation, this.lookatLocation, this.upVector);

            this.render.setDepthTest(false)
            this.render.setCulling(false);
            this.render.clearColorBufferDepthBuffer(0.0, 0.0, 0.1, 1.0);

            this.drawModel(this.modelMatrix, this.model, this.images);
        }

        private drawModel(modelMatrix: Mat4, model: RenderModel, images: List<RenderImage>) {

            mat4.multiply(this.modelViewMatrix, this.viewMatrix, modelMatrix);

            this.render.setShader(this.shader);
            this.render.setProjectionMatrix(this.projectionMatrix);
            this.render.setModelViewMatrix(this.modelViewMatrix);

            this.render.setBuffers(model, images);

            this.render.setDepthTest(true)
            this.render.setCulling(false);
            this.render.drawElements(model);
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
    }

    class SampleShader extends RenderShader {

        aPosition = -1;
        aTexCoord = -1;

        uTexture0: WebGLUniformLocation = null;

        initializeVertexSourceCode() {

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
            this.initializeAttributes_SampleShader(gl);
        }

        initializeAttributes_SampleShader(gl: WebGLRenderingContext) {

            this.aPosition = this.getAttribLocation('aPosition', gl);
            this.aTexCoord = this.getAttribLocation('aTexCoord', gl);

            this.uTexture0 = this.getUniformLocation('uTexture0', gl);
        }

        setBuffers(model: RenderModel, images: List<RenderImage>, gl: WebGLRenderingContext) {

            gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);

            this.enableVertexAttributes(gl);
            this.resetVertexAttribPointerOffset();

            this.vertexAttribPointer(this.aPosition, 3, gl.FLOAT, model.vertexDataStride, gl);
            this.vertexAttribPointer(this.aTexCoord, 2, gl.FLOAT, model.vertexDataStride, gl);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, images[0].texture);
            gl.uniform1i(this.uTexture0, 0);
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
