var RenderObjectManagement;
(function (RenderObjectManagement) {
    var Main = (function () {
        function Main() {
            this.logicalScreenWidth = 640.0;
            this.logicalScreenHeight = 360.0;
            this.render = new WebGLRender();
            this.shader = new SampleShaders.PlainShader();
            this.model = new RenderModel();
            this.images1 = new List();
            this.images2 = new List();
            this.eyeLocation = vec3.create();
            this.lookatLocation = vec3.create();
            this.upVector = vec3.create();
            this.modelMatrix = mat4.create();
            this.viewMatrix = mat4.create();
            this.modelViewMatrix = mat4.create();
            this.projectionMatrix = mat4.create();
            this.renderObjectManager = new Game.RenderObjectManager();
            this.MAX_RENDER_OBJECT = 100;
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
            var image1 = new RenderImage();
            this.loadTexture(image1, './texture1.png');
            this.images1.push(image1);
            var image2 = new RenderImage();
            this.loadTexture(image2, './texture2.png');
            this.images2.push(image2);
            this.loadModel(this.model, '../temp/sample_basic_model.json', 'Cube');
            // Allocate render object pool
            this.renderObjectManager.allocate(this.MAX_RENDER_OBJECT);
            // Create an object for background layer
            var renderObject = this.renderObjectManager.createObject();
            if (renderObject != null) {
                renderObject.model = this.model;
                renderObject.images = this.images2;
                renderObject.layerID = Game.RenderObjectLayerID.backGround;
                vec3.set(renderObject.location, 0.0, 0.0, 0.0);
                vec3.set(renderObject.scaling, 5.0, 5.0, 5.0);
                renderObject.tag = 1;
                this.renderObjectManager.addObject(renderObject);
            }
        };
        Main.prototype.processLoading = function () {
            // Waiting for data
            for (var i = 0; i < this.images1.length; i++) {
                var image = this.images1[i];
                if (image.texture == null) {
                    return;
                }
            }
            if (this.model.vertexBuffer == null) {
                return;
            }
            // Loading finished
            this.isLoaded = true;
        };
        Main.prototype.run = function () {
            this.animationTime += 1.0;
            // Camera position
            vec3.set(this.eyeLocation, -20.0, 0.0, 0.0);
            vec3.set(this.lookatLocation, 0.0, 0.0, 0.0);
            vec3.set(this.upVector, 0.0, 0.0, 1.0);
            // Create objects time by time
            this.generateObjects();
            // Object animation
            this.runObjects();
            this.destroyFinishedObjects();
        };
        Main.prototype.generateObjects = function () {
            if (this.animationTime < 5.0) {
                return;
            }
            this.animationTime = 0.0;
            var renderObject = this.renderObjectManager.createObject();
            if (renderObject != null) {
                renderObject.model = this.model;
                renderObject.images = this.images1;
                renderObject.layerID = Game.RenderObjectLayerID.foreGround;
                var locationRange = 30.0;
                vec3.set(renderObject.location, (0.00 + Math.random()) * locationRange, (-0.5 + Math.random()) * locationRange, (-0.5 + Math.random()) * locationRange);
                var rotationRange = Math.PI * 2.0;
                vec3.set(renderObject.rotation, Math.random() * rotationRange, Math.random() * rotationRange, Math.random() * rotationRange);
                this.renderObjectManager.addObject(renderObject);
            }
        };
        Main.prototype.runObjects = function () {
            var renderObjects = this.renderObjectManager.getObjectList();
            for (var i = 0; i < renderObjects.length; i++) {
                var renderObject = renderObjects[i];
                // Rotation
                if (renderObject.tag == 0) {
                    renderObject.rotation[1] += 0.05;
                }
                else {
                    renderObject.rotation[1] += 0.01;
                    renderObject.rotation[2] += 0.01;
                }
                // Calculate object matrix
                this.renderObjectManager.calcMatrix(renderObject);
            }
        };
        Main.prototype.destroyFinishedObjects = function () {
            var renderObjects = this.renderObjectManager.getObjectList();
            for (var i = renderObjects.length - 1; i >= 0; i--) {
                var renderObject = renderObjects[i];
                if (renderObject.tag == 0) {
                    renderObject.animationTime += 1.0;
                    if (renderObject.animationTime > 200.0) {
                        this.renderObjectManager.removeObject(renderObject);
                    }
                }
            }
        };
        Main.prototype.draw = function () {
            var aspect = this.logicalScreenWidth / this.logicalScreenHeight;
            mat4.perspective(this.projectionMatrix, 45.0 * Math.PI / 180, aspect, 0.1, 100.0);
            mat4.lookAt(this.viewMatrix, this.eyeLocation, this.lookatLocation, this.upVector);
            this.render.setDepthTest(true);
            this.render.setCulling(false);
            this.render.clearColorBufferDepthBuffer(0.0, 0.0, 0.1, 1.0);
            // Update object layer before sorting
            this.renderObjectManager.updateObjectLayers();
            // Calc value for sorting
            var objectList = this.renderObjectManager.getObjectList();
            for (var i = 0; i < objectList.length; i++) {
                var renderObject = objectList[i];
                this.renderObjectManager.calcObjectSortingValue(renderObject, this.viewMatrix, Game.RenderObjectSortingMode.z);
            }
            // Draw first layer
            this.render.setCulling(true);
            this.drawLayer(Game.RenderObjectLayerID.backGround);
            // Clear depth buffer
            this.render.clearDepthBuffer();
            // Draw second layer
            this.render.setCulling(true);
            this.drawLayer(Game.RenderObjectLayerID.foreGround);
        };
        Main.prototype.drawLayer = function (layerID) {
            var objects = this.renderObjectManager.getZsortedObjectList(layerID);
            for (var i = 0; i < objects.length; i++) {
                var renderObject = objects[i];
                this.drawRenderObject(renderObject);
            }
        };
        Main.prototype.drawRenderObject = function (renderObject) {
            mat4.multiply(this.modelViewMatrix, this.viewMatrix, renderObject.locationMatrix);
            this.render.setShader(this.shader);
            this.render.setProjectionMatrix(this.projectionMatrix);
            this.render.setModelViewMatrix(this.modelViewMatrix);
            this.render.setBuffers(renderObject.model, renderObject.images);
            this.render.setDepthTest(renderObject.depthTest);
            this.render.setDepthMask(renderObject.depthMask);
            this.render.setCulling(renderObject.culling);
            this.render.drawElements(renderObject.model);
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
})(RenderObjectManagement || (RenderObjectManagement = {}));
