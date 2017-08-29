var RenderObjectAndManager;
(function (RenderObjectAndManager) {
    var Main = (function () {
        function Main() {
            this.logicalScreenWidth = 640.0;
            this.logicalScreenHeight = 360.0;
            this.canvas = null;
            this.gl = null;
            this.render = new WebGLRender();
            this.shader = new SampleShaders.PlainShader();
            this.model = new RenderModel();
            this.images1 = new List();
            this.images2 = new List();
            // x, y, z, u, v
            this.vertexData = [1, 1, -1, 0.3544, 0.0633, 1, -1, -1, 0.3544, 0.3544, -1, -1, -1, 0.3544, 0.6456, -1, 1, -1, 0.3544, 0.3544, 1, 1, 1, 0.0633, 0.0633, 1, -1, 1, 0.3544, 0.0633, -1, -1, 1, 0.0633, 0.6456, -1, 1, 1, 0.0633, 0.3544];
            this.indexData = [0, 1, 2, 7, 6, 5, 4, 5, 1, 5, 6, 2, 2, 6, 7, 0, 3, 7, 3, 0, 2, 4, 7, 5, 0, 4, 1, 1, 5, 2, 3, 2, 7, 4, 0, 7];
            this.eyeLocation = vec3.create();
            this.lookatLocation = vec3.create();
            this.upVector = vec3.create();
            this.direction = vec3.create();
            this.renderObjectManager = new RenderObjectManager();
            this.renderObjects = new List();
            this.MAX_RENDER_OBJECT = 100;
            this.modelMatrix = mat4.create();
            this.viewMatrix = mat4.create();
            this.pMatrix = mat4.create();
            this.mvMatrix = mat4.create();
            this.animationTime = 0.0;
            this.isLoaded = false;
        }
        Main.prototype.initialize = function (canvas) {
            this.canvas = canvas;
            this.canvas.width = this.logicalScreenWidth;
            this.canvas.height = this.logicalScreenHeight;
            try {
                var option = { preserveDrawingBuffer: true, antialias: true };
                this.gl = (canvas.getContext('webgl', option)
                    || canvas.getContext('experimental-webgl', option));
                if (this.gl == null) {
                    return;
                }
            }
            catch (e) {
                return;
            }
            this.render.attach(this.gl);
            this.render.initializeShader(this.shader);
            this.render.initializeModelBuffer(this.model, this.vertexData, this.indexData, 4 * 5); // 4 (=size of float) * 5 (elements)
            var image1 = new RenderImage();
            this.loadTexture(image1, './texture1.png');
            this.images1.push(image1);
            var image2 = new RenderImage();
            this.loadTexture(image2, './texture2.png');
            this.images2.push(image2);
            this.renderObjectManager.allocate(this.MAX_RENDER_OBJECT);
            // Create background object
            var renderObject = this.renderObjectManager.createObject();
            if (renderObject != null) {
                renderObject.model = this.model;
                renderObject.images = this.images2;
                renderObject.layerID = RenderObjectLayerID.backGround;
                vec3.set(renderObject.location, 0.0, 0.0, 0.0);
                vec3.set(renderObject.scaling, 5.0, 5.0, 5.0);
                renderObject.tag = 1;
                this.renderObjectManager.addObject(renderObject);
                this.renderObjects.push(renderObject);
            }
        };
        Main.prototype.processLading = function () {
            // Waiting for image data
            for (var i = 0; i < this.images1.length; i++) {
                var image = this.images1[i];
                if (image.texture == null) {
                    return;
                }
            }
            this.isLoaded = true;
        };
        Main.prototype.run = function () {
            this.animationTime += 1.0;
            // Camera position
            vec3.set(this.eyeLocation, 14.1, -12.8, 10.0);
            vec3.set(this.lookatLocation, 0.0, 0.0, 0.0);
            vec3.set(this.upVector, 0.0, 0.0, 1.0);
            // Create object time by time
            if (this.animationTime > 5.0) {
                this.animationTime = 0.0;
                var renderObject = this.renderObjectManager.createObject();
                if (renderObject != null) {
                    renderObject.model = this.model;
                    renderObject.images = this.images1;
                    renderObject.layerID = RenderObjectLayerID.foreGround;
                    var locationRange = 20.0;
                    vec3.set(renderObject.location, (-0.5 + Math.random()) * locationRange, (-0.5 + Math.random()) * locationRange, (-0.5 + Math.random()) * locationRange);
                    var rotationRange = Math.PI * 2.0;
                    vec3.set(renderObject.rotation, Math.random() * rotationRange, Math.random() * rotationRange, Math.random() * rotationRange);
                    this.renderObjectManager.addObject(renderObject);
                    this.renderObjects.push(renderObject);
                }
            }
            // Object animation
            for (var i = this.renderObjects.length - 1; i >= 0; i--) {
                var renderObject = this.renderObjects[i];
                // Destroy object
                if (renderObject.tag == 0) {
                    renderObject.animationTime += 1.0;
                    if (renderObject.animationTime > 200.0) {
                        this.renderObjectManager.removeObject(renderObject);
                        this.renderObjects.splice(i, 1);
                    }
                }
            }
            for (var i = 0; i < this.renderObjects.length; i++) {
                var renderObject = this.renderObjects[i];
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
        Main.prototype.draw = function () {
            var aspect = this.logicalScreenWidth / this.logicalScreenHeight;
            mat4.perspective(this.pMatrix, 45.0 * Math.PI / 180, aspect, 0.1, 100.0);
            mat4.lookAt(this.viewMatrix, this.eyeLocation, this.lookatLocation, this.upVector);
            this.render.setDepthTest(true);
            this.render.setCulling(false);
            this.render.clearColorBufferDepthBuffer(0.0, 0.0, 0.1, 1.0);
            // Calc value for sorting
            for (var i = 0; i < this.renderObjects.length; i++) {
                var renderObject = this.renderObjects[i];
                this.renderObjectManager.calcObjectSortingValue(renderObject, this.viewMatrix, RenderObjectSortingMode.z);
            }
            // Draw first layer
            this.render.setCulling(true);
            var objects = this.renderObjectManager.getZsortedObjectList(RenderObjectLayerID.backGround);
            for (var i = 0; i < objects.length; i++) {
                var renderObject = objects[i];
                this.drawModel(renderObject.locationMatrix, renderObject.model, renderObject.images);
            }
            // Clear depth buffer
            this.render.clearDepthBuffer();
            // Draw second layer
            objects = this.renderObjectManager.getZsortedObjectList(RenderObjectLayerID.foreGround);
            for (var i = 0; i < objects.length; i++) {
                var renderObject = objects[i];
                this.drawModel(renderObject.locationMatrix, renderObject.model, renderObject.images);
            }
        };
        Main.prototype.drawModel = function (modelMatrix, model, images) {
            mat4.multiply(this.mvMatrix, this.viewMatrix, modelMatrix);
            this.render.setShader(this.shader);
            this.render.setProjectionMatrix(this.pMatrix);
            this.render.setModelViewMatrix(this.mvMatrix);
            this.render.setBuffers(model, images);
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
            _Main.processLading();
        }
        setTimeout(run, 1000 / 30);
    }
})(RenderObjectAndManager || (RenderObjectAndManager = {}));
