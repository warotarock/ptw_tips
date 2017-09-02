var ObjectAnimationDrawing;
(function (ObjectAnimationDrawing) {
    var Main = (function () {
        function Main() {
            this.logicalScreenWidth = 640.0;
            this.logicalScreenHeight = 360.0;
            this.render = new WebGLRender();
            this.shader = new SampleShaders.PlainShader();
            this.model = new RenderModel();
            this.images = new List();
            this.animationSolver = new AnimationSolver();
            this.animationDatas = new Dictionary();
            this.cubeAnimation = null;
            this.eyeLocation = vec3.create();
            this.lookatLocation = vec3.create();
            this.upVector = vec3.create();
            this.modelLocation = vec3.create();
            this.modelRotation = vec3.create();
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
            this.render.initializeShader(this.shader);
            var image = new RenderImage();
            this.loadTexture(image, './texture.png');
            this.images.push(image);
            this.loadModel(this.model, '../temp/sample_basic_model.json', 'Cube');
            this.loadAnimation(this.animationDatas, '../temp/sample_obj_animation.json');
        };
        Main.prototype.processLoading = function () {
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
        };
        Main.prototype.run = function () {
            var solver = this.animationSolver;
            this.animationTime += 1.0;
            var animationTime = Math.abs(Math.sin(this.animationTime * 0.1)) * 30.0;
            // Camera position
            vec3.set(this.eyeLocation, 14.1, -12.8, 10.0);
            vec3.set(this.lookatLocation, 0.0, 0.0, 0.0);
            vec3.set(this.upVector, 0.0, 0.0, 1.0);
            // Object animation
            vec3.set(this.modelLocation, solver.getIPOCurveValueIfNotNull(this.cubeAnimation.locationX, animationTime, 0.0), solver.getIPOCurveValueIfNotNull(this.cubeAnimation.locationY, animationTime, 0.0), solver.getIPOCurveValueIfNotNull(this.cubeAnimation.locationZ, animationTime, 0.0));
            vec3.set(this.modelRotation, solver.getIPOCurveValueIfNotNull(this.cubeAnimation.rotationX, animationTime, 0.0), solver.getIPOCurveValueIfNotNull(this.cubeAnimation.rotationY, animationTime, 0.0), solver.getIPOCurveValueIfNotNull(this.cubeAnimation.rotationZ, animationTime, 0.0));
            vec3.set(this.modelScaling, solver.getIPOCurveValueIfNotNull(this.cubeAnimation.scalingX, animationTime, 1.0), solver.getIPOCurveValueIfNotNull(this.cubeAnimation.scalingY, animationTime, 1.0), solver.getIPOCurveValueIfNotNull(this.cubeAnimation.scalingZ, animationTime, 1.0));
            mat4.identity(this.modelMatrix);
            mat4.translate(this.modelMatrix, this.modelMatrix, this.modelLocation);
            mat4.rotateX(this.modelMatrix, this.modelMatrix, this.modelRotation[0]);
            mat4.rotateY(this.modelMatrix, this.modelMatrix, this.modelRotation[1]);
            mat4.rotateZ(this.modelMatrix, this.modelMatrix, this.modelRotation[2]);
            mat4.scale(this.modelMatrix, this.modelMatrix, this.modelScaling);
        };
        Main.prototype.draw = function () {
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
            this.render.setDepthTest(true);
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
                var modelData = data[modelName];
                _this.render.initializeModelBuffer(_this.model, modelData.vertex, modelData.index, 4 * modelData.vertexStride); // 4 = size of float
            });
            xhr.send();
        };
        Main.prototype.loadAnimation = function (result, url) {
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
                for (var key in data) {
                    result[key] = data[key];
                }
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
})(ObjectAnimationDrawing || (ObjectAnimationDrawing = {}));
