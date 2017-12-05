
namespace CanvasDrawing {

    class Main {

        logicalScreenWidth = 640.0;
        logicalScreenHeight = 360.0;

        render = new WebGLRender();
        shader = new SampleShaders.PlainShader();
        model = new RenderModel();
        images = new List<RenderImage>();

        eyeLocation = vec3.create();
        lookatLocation = vec3.create();
        upVector = vec3.create();

        modelMatrix = mat4.create();
        viewMatrix = mat4.create();
        modelViewMatrix = mat4.create();
        projectionMatrix = mat4.create();

        canvasDrawer = new CanvasDrawer();
        textDrawer: TextDrawer = null;
        iamgeDrawer: ImageDrawer = null;

        animationTime = 0.0;
        debugDraw = true;

        isLoaded = false;

        initialize(canvas: HTMLCanvasElement) {

            canvas.width = this.logicalScreenWidth;
            canvas.height = this.logicalScreenHeight;

            if (this.render.initializeWebGL(canvas)) {
                return;
            }

            this.canvasDrawer.debug = this.debugDraw;

            this.render.initializeShader(this.shader);

            {
                let image = new RenderImage();
                this.loadTexture(image, './image01.png');
                this.images.push(image);
            }
            {
                let image = new RenderImage();
                this.loadTexture(image, './image02.png');
                this.images.push(image);
            }

            this.loadModel(this.model, '../temp/sample_basic_model.json', 'Cube2');

            document.getElementById('toggle_origin').addEventListener('click', (e) => {

                this.debugDraw = !this.debugDraw;
                this.canvasDrawer.setRedraw();
            });
        }

        processLoading() {

            // Waiting for data
            for (let image of this.images) {

                if (image.texture == null) {
                    return;
                }
            }

            if (this.model.vertexBuffer == null) {
                return;
            }

            // Loading finished
            let textureImage = this.images[0];
            this.canvasDrawer.initialize(textureImage.imageData.width, textureImage.imageData.height);

            this.prepareDrawers();

            let div = document.getElementById('debug_container');
            div.appendChild(this.canvasDrawer.getCanvas());
            div.appendChild(this.canvasDrawer.getMeasuringCanvas());

            this.isLoaded = true;
        }

        private prepareDrawers() {

            {
                let iamgeDrawer = new ImageDrawer();
                iamgeDrawer.setImage(this.images[1].imageData)
                vec3.set(iamgeDrawer.location, 255.0, 225.0, 0.0);
                vec3.set(iamgeDrawer.scaling, 0.3, 0.3, 1.0);
                vec3.set(iamgeDrawer.origin, 0.5, 0.5, 0.0);
                iamgeDrawer.alpha = 0.5;
                this.canvasDrawer.addImageDrawer(iamgeDrawer);

                this.iamgeDrawer = iamgeDrawer;
            }

            {
                let textDrawer = new HorizontalTextDrawer();
                textDrawer.fontHeight = 45.0;
                textDrawer.mearsureSampleLetter = '8';
                textDrawer.verticalTextAlignType = TextDrawerVerticalAlignType.middle;
                textDrawer.horizontalTextAlignType = TextDrawerHorizontalAlignType.center;
                vec3.set(textDrawer.location, 255.0, 320.0, 0.0);
                vec4.set(textDrawer.color, 0.7, 1.0, 0.7, 1.0);
                this.canvasDrawer.addTextDrawer(textDrawer);

                this.textDrawer = textDrawer;
            }

            {
                let textDrawer = new HorizontalTextDrawer();
                textDrawer.text = 'PTW Tips\nsince 2017';
                textDrawer.fontHeight = 14.0;
                textDrawer.mearsureSampleLetter = 'W8';
                textDrawer.verticalTextAlignType = TextDrawerVerticalAlignType.bottom;
                textDrawer.horizontalTextAlignType = TextDrawerHorizontalAlignType.center;
                textDrawer.lineSpan = 10.0;
                vec3.set(textDrawer.location, 255.0, 400.0, 0.0);
                vec4.set(textDrawer.color, 1.0, 0.6, 0.2, 1.0);
                this.canvasDrawer.addTextDrawer(textDrawer);
            }

            {
                let textDrawer = new VerticalTextDrawer();
                textDrawer.text = '明日は\n晴れるかな\nDelight';
                textDrawer.isVertical = true;
                textDrawer.fontHeight = 25.0;
                textDrawer.mearsureSampleLetter = '晴';
                textDrawer.verticalTextAlignType = TextDrawerVerticalAlignType.top;
                textDrawer.horizontalTextAlignType = TextDrawerHorizontalAlignType.right;
                textDrawer.lineSpan = 10.0;
                vec3.set(textDrawer.location, 310.0, 40.0, 0.0);
                vec4.set(textDrawer.color, 1.0, 0.6, 0.2, 1.0);
                this.canvasDrawer.addTextDrawer(textDrawer);
            }
        }

        run() {

            this.animationTime += 1.0;

            // Camera position
            vec3.set(this.eyeLocation, 3.0, -2.5, 1.8);
            vec3.set(this.lookatLocation, 0.0, 0.0, 0.0);
            vec3.set(this.upVector, 0.0, 0.0, 1.0);

            // Object animation
            mat4.identity(this.modelMatrix);
            mat4.rotateZ(this.modelMatrix, this.modelMatrix, this.animationTime * 0.02);

            // Text animation
            let now = new Date();
            let dateTimeText = '' + (now.getHours()) + ':' + (now.getMinutes()) + ':' + (now.getSeconds());
            this.textDrawer.setText(dateTimeText);

            this.iamgeDrawer.setRotation(-2.0 * Math.PI * now.getSeconds() / 60.0);

            this.canvasDrawer.debug = this.debugDraw;
        }

        draw() {

            // Redraw canvas drawer

            if (this.canvasDrawer.isNeededRedraw()) {

                this.canvasDrawer.draw();

                this.render.setTextureImageFromCanvas(this.images[0], this.canvasDrawer.getCanvas());
            }

            // Draw a cube
            let aspect = this.logicalScreenWidth / this.logicalScreenHeight;
            mat4.perspective(this.projectionMatrix, 45.0 * Math.PI / 180, aspect, 0.1, 100.0);
            mat4.lookAt(this.viewMatrix, this.eyeLocation, this.lookatLocation, this.upVector);

            this.render.setDepthTest(true)
            this.render.setCulling(false);
            this.render.clearColorBufferDepthBuffer(0.0, 0.0, 0.1, 1.0);

            this.drawModel(this.modelMatrix, this.model, this.images);
        }

        private drawModel(modelMatrix: Mat4, model: RenderModel, images: List<RenderImage>) {

            mat4.multiply(this.modelViewMatrix, this.viewMatrix, modelMatrix);

            this.render.setShader(this.shader);

            this.shader.setProjectionMatrix(this.projectionMatrix);
            this.shader.setModelViewMatrix(this.modelViewMatrix);
            this.shader.setBuffers(model, images);

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

        private loadModel(resultModel: RenderModel, url: string, modelName: string) {

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

                    let modelData = data['models'][modelName];

                    this.render.initializeModelBuffer(resultModel, modelData.vertex, modelData.index, 4 * modelData.vertexStride); // 4 = size of float
                }
            );

            xhr.send();
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
