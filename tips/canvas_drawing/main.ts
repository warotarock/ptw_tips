
namespace CanvsDrawerSample {

    class Main {

        debugDraw = false;

        logicalScreenWidth = 640.0;
        logicalScreenHeight = 360.0;

        render = new WebGLRender();
        shader = new SampleShaders.PlainShader();
        model = new RenderModel();
        images = new List<RenderImage>();

        canvasDrawer = new CanvasDrawer();
        textArea: TextArea = null;

        eyeLocation = vec3.create();
        lookatLocation = vec3.create();
        upVector = vec3.create();

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

            this.loadModel(this.model, '../temp/sample_basic_model.json', 'Cube2');

            document.getElementById('toggle_origin').addEventListener('click', (e) => {

                this.debugDraw = !this.debugDraw;
                this.canvasDrawer.setRedraw();
            });
        }

        processLoading() {

            // Waiting for data
            if (this.images[0].texture == null) {
                return;
            }

            if (this.model.vertexBuffer == null) {
                return;
            }

            // Loading finished
            let textureImage = this.images[0];
            this.canvasDrawer.initialize(textureImage.imageData.width, textureImage.imageData.height);

            this.prepareTexts();

            var div = document.getElementById('debug_container');
            div.appendChild(this.canvasDrawer.getCanvas());
            div.appendChild(this.canvasDrawer.getMeasuringCanvas());

            this.isLoaded = true;
        }

        private prepareTexts() {

            {
                let textArea = new VerticalTextArea();
                textArea.text = '明日は\n晴れるかな\nDelight';
                textArea.isVertical = true;
                textArea.fontHeight = 25.0;
                textArea.mearsureTestLetter = '晴';
                textArea.verticalTextAlignType = TextAreaVerticalAlignType.top;
                textArea.horizontalTextAlignType = TextAreaHorizontalAlignType.right;
                textArea.lineSpan = 10.0;
                vec3.set(textArea.location, 310.0, 40.0, 0.0);
                vec4.set(textArea.color, 1.0, 0.6, 0.2, 1.0);
                this.canvasDrawer.addTextArea(textArea);
            }

            {
                let textArea = new HorizontalTextArea();
                textArea.fontHeight = 45.0;
                textArea.mearsureTestLetter = '8';
                textArea.verticalTextAlignType = TextAreaVerticalAlignType.middle;
                textArea.horizontalTextAlignType = TextAreaHorizontalAlignType.center;
                vec3.set(textArea.location, 255.0, 320.0, 0.0);
                vec4.set(textArea.color, 0.7, 1.0, 0.7, 1.0);
                this.canvasDrawer.addTextArea(textArea);

                this.textArea = textArea;
            }

            {
                let textArea = new HorizontalTextArea();
                textArea.text = 'PTW Tips\nsince 2017';
                textArea.fontHeight = 14.0;
                textArea.mearsureTestLetter = 'W8';
                textArea.verticalTextAlignType = TextAreaVerticalAlignType.bottom;
                textArea.horizontalTextAlignType = TextAreaHorizontalAlignType.center;
                textArea.lineSpan = 10.0;
                vec3.set(textArea.location, 255.0, 400.0, 0.0);
                vec4.set(textArea.color, 1.0, 0.6, 0.2, 1.0);
                this.canvasDrawer.addTextArea(textArea);
            }
        }

        run() {

            this.animationTime += 1.0;

            // Camera position
            vec3.set(this.eyeLocation, 6.0, -4.4, 3.0);
            vec3.set(this.lookatLocation, 0.0, 0.0, 0.0);
            vec3.set(this.upVector, 0.0, 0.0, 1.0);

            // Object animation
            mat4.identity(this.modelMatrix);
            mat4.rotateZ(this.modelMatrix, this.modelMatrix, this.animationTime * 0.02);
            mat4.scale(this.modelMatrix, this.modelMatrix, vec3.set(this.modelScaling, 2.0, 2.0, 2.0));

            // Text animation
            var now = new Date();
            let dateTimeText = '' + (now.getHours()) + ':' + (now.getMinutes()) + ':' + (now.getSeconds());
            this.textArea.setText(dateTimeText);

            this.canvasDrawer.debug = this.debugDraw;
        }

        draw() {

            // Redraw canvas drawer
            this.canvasDrawer.commitRedraw();

            if (this.canvasDrawer.isRedrawCommited()) {

                this.canvasDrawer.draw();

                this.render.setTextureImageFromCanvas(this.images[0], this.canvasDrawer.getCanvas());
            }

            // Draw a cube
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

            this.render.setDepthTest(false)
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
                    }
                    else {
                        data = JSON.parse(xhr.response);
                    }

                    var modelData = data['models'][modelName];

                    this.render.initializeModelBuffer(this.model, modelData.vertex, modelData.index, 4 * modelData.vertexStride); // 4 = size of float
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
