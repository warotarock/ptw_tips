var CanvasDrawing;
(function (CanvasDrawing) {
    var Main = (function () {
        function Main() {
            this.logicalScreenWidth = 640.0;
            this.logicalScreenHeight = 360.0;
            this.render = new WebGLRender();
            this.shader = new SampleShaders.PlainShader();
            this.model = new RenderModel();
            this.images = new List();
            this.eyeLocation = vec3.create();
            this.lookatLocation = vec3.create();
            this.upVector = vec3.create();
            this.modelMatrix = mat4.create();
            this.viewMatrix = mat4.create();
            this.modelViewMatrix = mat4.create();
            this.projectionMatrix = mat4.create();
            this.canvasDrawer = new CanvasDrawer();
            this.textDrawer = null;
            this.iamgeDrawer = null;
            this.animationTime = 0.0;
            this.debugDraw = true;
            this.isLoaded = false;
        }
        Main.prototype.initialize = function (canvas) {
            var _this = this;
            canvas.width = this.logicalScreenWidth;
            canvas.height = this.logicalScreenHeight;
            if (this.render.initializeWebGL(canvas)) {
                return;
            }
            this.canvasDrawer.debug = this.debugDraw;
            this.render.initializeShader(this.shader);
            {
                var image = new RenderImage();
                this.loadTexture(image, './image01.png');
                this.images.push(image);
            }
            {
                var image = new RenderImage();
                this.loadTexture(image, './image02.png');
                this.images.push(image);
            }
            this.loadModel(this.model, '../temp/sample_basic_model.json', 'Cube2');
            document.getElementById('toggle_origin').addEventListener('click', function (e) {
                _this.debugDraw = !_this.debugDraw;
                _this.canvasDrawer.setRedraw();
            });
        };
        Main.prototype.processLoading = function () {
            // Waiting for data
            for (var _i = 0, _a = this.images; _i < _a.length; _i++) {
                var image = _a[_i];
                if (image.texture == null) {
                    return;
                }
            }
            if (this.model.vertexBuffer == null) {
                return;
            }
            // Loading finished
            var textureImage = this.images[0];
            this.canvasDrawer.initialize(textureImage.imageData.width, textureImage.imageData.height);
            this.prepareDrawers();
            var div = document.getElementById('debug_container');
            div.appendChild(this.canvasDrawer.getCanvas());
            div.appendChild(this.canvasDrawer.getMeasuringCanvas());
            this.isLoaded = true;
        };
        Main.prototype.prepareDrawers = function () {
            {
                var iamgeDrawer = new ImageDrawer();
                iamgeDrawer.setImage(this.images[1].imageData);
                vec3.set(iamgeDrawer.location, 255.0, 225.0, 0.0);
                vec3.set(iamgeDrawer.scaling, 0.3, 0.3, 1.0);
                vec3.set(iamgeDrawer.origin, 0.5, 0.5, 0.0);
                iamgeDrawer.alpha = 0.5;
                this.canvasDrawer.addImageDrawer(iamgeDrawer);
                this.iamgeDrawer = iamgeDrawer;
            }
            {
                var textDrawer = new HorizontalTextDrawer();
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
                var textDrawer = new HorizontalTextDrawer();
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
                var textDrawer = new VerticalTextDrawer();
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
        };
        Main.prototype.run = function () {
            this.animationTime += 1.0;
            // Camera position
            vec3.set(this.eyeLocation, 3.0, -2.5, 1.8);
            vec3.set(this.lookatLocation, 0.0, 0.0, 0.0);
            vec3.set(this.upVector, 0.0, 0.0, 1.0);
            // Object animation
            mat4.identity(this.modelMatrix);
            mat4.rotateZ(this.modelMatrix, this.modelMatrix, this.animationTime * 0.02);
            // Text animation
            var now = new Date();
            var dateTimeText = '' + (now.getHours()) + ':' + (now.getMinutes()) + ':' + (now.getSeconds());
            this.textDrawer.setText(dateTimeText);
            this.iamgeDrawer.setRotation(-2.0 * Math.PI * now.getSeconds() / 60.0);
            this.canvasDrawer.debug = this.debugDraw;
        };
        Main.prototype.draw = function () {
            // Redraw canvas drawer
            if (this.canvasDrawer.isNeededRedraw()) {
                this.canvasDrawer.draw();
                this.render.setTextureImageFromCanvas(this.images[0], this.canvasDrawer.getCanvas());
            }
            // Draw a cube
            var aspect = this.logicalScreenWidth / this.logicalScreenHeight;
            mat4.perspective(this.projectionMatrix, 45.0 * Math.PI / 180, aspect, 0.1, 100.0);
            mat4.lookAt(this.viewMatrix, this.eyeLocation, this.lookatLocation, this.upVector);
            this.render.setDepthTest(true);
            this.render.setCulling(false);
            this.render.clearColorBufferDepthBuffer(0.0, 0.0, 0.1, 1.0);
            this.drawModel(this.modelMatrix, this.model, this.images);
        };
        Main.prototype.drawModel = function (modelMatrix, model, images) {
            mat4.multiply(this.modelViewMatrix, this.viewMatrix, modelMatrix);
            this.render.setShader(this.shader);
            this.render.setProjectionMatrix(this.projectionMatrix);
            this.render.setModelViewMatrix(this.modelViewMatrix);
            this.render.setBuffers(model, images);
            this.render.setDepthTest(true);
            this.render.setCulling(false);
            this.render.drawElements(model);
        };
        Main.prototype.loadTexture = function (resultImage, url) {
            var _this = this;
            resultImage.imageData = new Image();
            resultImage.imageData.addEventListener('load', function () {
                _this.render.initializeImageTexture(resultImage);
            });
            resultImage.imageData.src = url;
        };
        Main.prototype.loadModel = function (resultModel, url, modelName) {
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
                var modelData = data['models'][modelName];
                _this.render.initializeModelBuffer(resultModel, modelData.vertex, modelData.index, 4 * modelData.vertexStride); // 4 = size of float
            });
            xhr.send();
        };
        return Main;
    }());
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
            _Main.processLoading();
        }
        setTimeout(run, 1000 / 30);
    }
})(CanvasDrawing || (CanvasDrawing = {}));
