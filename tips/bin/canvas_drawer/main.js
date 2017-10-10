var CanvsDrawerSample;
(function (CanvsDrawerSample) {
    var Main = (function () {
        function Main() {
            this.logicalScreenWidth = 640.0;
            this.logicalScreenHeight = 360.0;
            this.render = new WebGLRender();
            this.shader = new SampleShaders.PlainShader();
            this.model = new RenderModel();
            this.images = new List();
            this.canvasDrawer = new CanvasDrawer();
            this.textArea = null;
            this.eyeLocation = vec3.create();
            this.lookatLocation = vec3.create();
            this.upVector = vec3.create();
            this.modelScaling = vec3.create();
            this.modelMatrix = mat4.create();
            this.viewMatrix = mat4.create();
            this.pMatrix = mat4.create();
            this.mvMatrix = mat4.create();
            this.animationTime = 0.0;
            this.isLoaded = false;
        }
        Main.prototype.initialize = function (canvas) {
            canvas.width = this.logicalScreenWidth;
            canvas.height = this.logicalScreenHeight;
            if (this.render.initializeWebGL(canvas)) {
                return;
            }
            if (this.render.initializeWebGL(canvas)) {
                return;
            }
            this.render.initializeShader(this.shader);
            var image = new RenderImage();
            this.loadTexture(image, './texture.png');
            this.images.push(image);
            this.loadModel(this.model, '../temp/sample_basic_model.json', 'Cube2');
        };
        Main.prototype.processLoading = function () {
            // Waiting for data
            if (this.images[0].texture == null) {
                return;
            }
            if (this.model.vertexBuffer == null) {
                return;
            }
            // Loading finished
            var textureImage = this.images[0];
            this.canvasDrawer.initialize(textureImage.imageData.width, textureImage.imageData.height);
            var div = document.getElementById('debug_container');
            div.appendChild(this.canvasDrawer.getCanvas());
            div.appendChild(this.canvasDrawer.mearsuringCanvasContext.canvas);
            var textArea = new TextArea();
            textArea.fontHeight = 80.0;
            textArea.heightTestLetter = '8W';
            textArea.verticalTextAlignType = 1;
            //textArea.isVertical = true;
            vec3.set(textArea.location, 255.0, 295.0, 0.0);
            vec4.set(textArea.color, 0.7, 1.0, 0.7, 1.0);
            this.canvasDrawer.addTextArea(textArea);
            this.textArea = textArea;
            this.isLoaded = true;
        };
        Main.prototype.run = function () {
            this.animationTime += 1.0;
            var now = new Date();
            var dateTimeText = '' + (now.getHours()) + ':' + (now.getMinutes()) + ':' + (now.getSeconds());
            this.textArea.setText(dateTimeText);
            // Camera position
            vec3.set(this.eyeLocation, 7.0, -6.4, 5.0);
            vec3.set(this.lookatLocation, 0.0, 0.0, 0.0);
            vec3.set(this.upVector, 0.0, 0.0, 1.0);
            // Object animation
            mat4.identity(this.modelMatrix);
            mat4.rotateZ(this.modelMatrix, this.modelMatrix, this.animationTime * 0.02);
            mat4.scale(this.modelMatrix, this.modelMatrix, vec3.set(this.modelScaling, 2.0, 2.0, 2.0));
        };
        Main.prototype.draw = function () {
            // Redraw canvas drawer
            this.canvasDrawer.commitRedraw();
            if (this.canvasDrawer.isRedrawCommited()) {
                this.canvasDrawer.draw();
                this.render.setTextureImageFromCanvas(this.images[0], this.canvasDrawer.getCanvas());
            }
            var aspect = this.logicalScreenWidth / this.logicalScreenHeight;
            mat4.perspective(this.pMatrix, 45.0 * Math.PI / 180, aspect, 0.1, 100.0);
            mat4.lookAt(this.viewMatrix, this.eyeLocation, this.lookatLocation, this.upVector);
            this.render.setDepthTest(true);
            this.render.setCulling(false);
            this.render.clearColorBufferDepthBuffer(0.0, 0.0, 0.1, 1.0);
            this.drawModel(this.modelMatrix, this.model, this.images);
        };
        Main.prototype.drawModel = function (modelMatrix, model, images) {
            mat4.multiply(this.mvMatrix, this.viewMatrix, modelMatrix);
            this.render.setShader(this.shader);
            this.render.setProjectionMatrix(this.pMatrix);
            this.render.setModelViewMatrix(this.mvMatrix);
            this.render.setBuffers(model, images);
            this.render.setDepthTest(false);
            this.render.setCulling(false);
            this.render.drawElements(model);
        };
        Main.prototype.loadTexture = function (result, url) {
            var _this = this;
            result.imageData = new Image();
            result.imageData.addEventListener('load', function () {
                _this.render.initializeImageTexture(result);
            });
            result.imageData.src = url;
        };
        Main.prototype.loadModel = function (result, url, modelName) {
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
                _this.render.initializeModelBuffer(_this.model, modelData.vertex, modelData.index, 4 * modelData.vertexStride); // 4 = size of float
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
})(CanvsDrawerSample || (CanvsDrawerSample = {}));
