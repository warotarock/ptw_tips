
namespace ObjectAnimationDrawing {

    class Main {

        logicalScreenWidth = 640.0;
        logicalScreenHeight = 360.0;

        render = new WebGLRender();
        shader = new SampleShaders.PlainShader();
        model = new RenderModel();
        images = new List<RenderImage>();

        animationDatas = new Dictionary<IPOObjectAnimation>();
        cubeAnimation: IPOObjectAnimation = null;

        animationSolver = new AnimationSolver();

        eyeLocation = vec3.create();
        lookatLocation = vec3.create();
        upVector = vec3.create();

        modelLocation = vec3.create();
        modelRotation = vec3.create();
        modelScaling = vec3.create();

        modelMatrix = mat4.create();
        viewMatrix = mat4.create();
        pMatrix = mat4.create();
        mvMatrix = mat4.create();

        animationTime = 0.0;

        isLoaded = false;

        initialize(canvas: HTMLCanvasElement) {

            canvas.width = this.logicalScreenWidth;
            canvas.height = this.logicalScreenHeight;

            if (this.render.initializeWebGL(canvas)) {
                return;
            }

            this.render.initializeShader(this.shader);

            var image = new RenderImage();
            this.loadTexture(image, './texture.png');
            this.images.push(image);

            this.loadModel(this.model, '../temp/sample_basic_model.json', 'Cube');

            this.loadAnimation(this.animationDatas, '../temp/sample_obj_animation.json');
        }

        processLoading() {

            // Waiting for data
            if (this.images[0].texture == null) {
                return;
            }

            if (this.model.vertexBuffer == null) {
                return;
            }

            if (!DictionaryContainsKey(this.animationDatas, 'CubeAction')) {
                return;
            }

            // Loading finished
            this.cubeAnimation = this.animationDatas['CubeAction']['Object'];

            this.isLoaded = true;
        }

        run() {

            let solver = this.animationSolver;

            this.animationTime += 1.0;

            let animationTime = Math.abs(Math.sin(this.animationTime * 0.1)) * 30.0;

            // Camera position
            vec3.set(this.eyeLocation, 14.1, -12.8, 10.0);
            vec3.set(this.lookatLocation, 0.0, 0.0, 0.0);
            vec3.set(this.upVector, 0.0, 0.0, 1.0);

            // Object animation
            vec3.set(this.modelLocation
                , solver.getIPOCurveValueIfNotNull(this.cubeAnimation.locationX, animationTime, 0.0)
                , solver.getIPOCurveValueIfNotNull(this.cubeAnimation.locationY, animationTime, 0.0)
                , solver.getIPOCurveValueIfNotNull(this.cubeAnimation.locationZ, animationTime, 0.0));

            vec3.set(this.modelRotation
                , solver.getIPOCurveValueIfNotNull(this.cubeAnimation.rotationX, animationTime, 0.0)
                , solver.getIPOCurveValueIfNotNull(this.cubeAnimation.rotationY, animationTime, 0.0)
                , solver.getIPOCurveValueIfNotNull(this.cubeAnimation.rotationZ, animationTime, 0.0));

            vec3.set(this.modelScaling
                , solver.getIPOCurveValueIfNotNull(this.cubeAnimation.scalingX, animationTime, 1.0)
                , solver.getIPOCurveValueIfNotNull(this.cubeAnimation.scalingY, animationTime, 1.0)
                , solver.getIPOCurveValueIfNotNull(this.cubeAnimation.scalingZ, animationTime, 1.0));

            mat4.identity(this.modelMatrix);
            mat4.translate(this.modelMatrix, this.modelMatrix, this.modelLocation);
            mat4.rotateX(this.modelMatrix, this.modelMatrix, this.modelRotation[0]);
            mat4.rotateY(this.modelMatrix, this.modelMatrix, this.modelRotation[1]);
            mat4.rotateZ(this.modelMatrix, this.modelMatrix, this.modelRotation[2]);
            mat4.scale(this.modelMatrix, this.modelMatrix, this.modelScaling);
        }

        draw() {

            var aspect = this.logicalScreenWidth / this.logicalScreenHeight;
            mat4.perspective(this.pMatrix, 45.0 * Math.PI / 180, aspect, 0.1, 100.0);
            mat4.lookAt(this.viewMatrix, this.eyeLocation, this.lookatLocation, this.upVector);

            this.render.setDepthTest(true)
            this.render.setCulling(false);
            this.render.clearColorBufferDepthBuffer(0.0, 0.0, 0.1, 1.0);

            this.drawModel(this.modelMatrix, this.model, this.images);
        }

        private drawModel(modelMatrix: Mat4, model: RenderModel, images: List<RenderImage>) {

            mat4.multiply(this.mvMatrix, this.viewMatrix, modelMatrix);

            this.render.setShader(this.shader);
            this.render.setProjectionMatrix(this.pMatrix);
            this.render.setModelViewMatrix(this.mvMatrix);

            this.render.setBuffers(model, images);

            this.render.setDepthTest(true)
            this.render.setCulling(false);
            this.render.drawElements(model);
        }

        private loadTexture(result: RenderImage, url: string) {

            result.imageData = new Image();

            result.imageData.addEventListener('load',
                () => {
                    this.render.initializeImageTexture(result);
                }
            );

            result.imageData.src = url;
        }

        private loadModel(result: RenderModel, url: string, modelName: string) {

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

                    var modelData = data[modelName];

                    this.render.initializeModelBuffer(this.model, modelData.vertex, modelData.index, 4 * modelData.vertexStride); // 4 = size of float
                }
            );

            xhr.send();
        }

        private loadAnimation(result: Dictionary<IPOObjectAnimation>, url: string) {

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


                    for (let key in data) {
                        result[key] = data[key];
                    }
                }
            );

            xhr.send();
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
