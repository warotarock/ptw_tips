var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var TaskManagement;
(function (TaskManagement) {
    var RenderObjectTask = (function (_super) {
        __extends(RenderObjectTask, _super);
        function RenderObjectTask() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.renderObject = null;
            return _this;
        }
        RenderObjectTask.prototype.onCreate = function (env) {
            this.onCreate_RenderObjectTask(env);
            this.onCreateExt(env);
        };
        RenderObjectTask.prototype.onCreate_RenderObjectTask = function (env) {
            var renderObject = env.renderObjectManager.createObject();
            if (renderObject != null) {
                env.renderObjectManager.addObject(renderObject);
                this.renderObject = renderObject;
            }
        };
        RenderObjectTask.prototype.onCreateExt = function (env) {
            // Override method
        };
        RenderObjectTask.prototype.onDestroy = function (env) {
            this.onDestroy_RenderObjectTask(env);
            this.onDestroyExt(env);
        };
        RenderObjectTask.prototype.onDestroy_RenderObjectTask = function (env) {
            if (this.renderObject != null) {
                env.renderObjectManager.removeObject(this.renderObject);
                this.renderObject = null;
            }
        };
        RenderObjectTask.prototype.onDestroyExt = function (env) {
            // Override method
        };
        return RenderObjectTask;
    }(Game.TaskClass));
    var SampleTask1 = (function (_super) {
        __extends(SampleTask1, _super);
        function SampleTask1() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.initialLocation = null;
            _this.main = null;
            _this.animationTime = 0.0;
            _this.maxAnimationTime = 200.0;
            return _this;
        }
        SampleTask1.prototype.recycle = function () {
            this.main = null;
            this.animationTime = 0.0;
        };
        SampleTask1.prototype.onCreate = function (env) {
            this.onCreate_RenderObjectTask(env);
            this.onCreate_SampleTask1(env);
            this.onCreateExt(env);
        };
        SampleTask1.prototype.onCreate_SampleTask1 = function (env) {
            this.renderObject.model = this.main.model;
            this.renderObject.images = this.main.images1;
            vec3.copy(this.renderObject.location, this.initialLocation);
        };
        SampleTask1.prototype.onCreateExt = function (env) {
            vec3.set(this.renderObject.scaling, 0.5, 0.5, 0.5);
            this.renderObject.rotation[0] = Math.random() * Math.PI;
            this.renderObject.rotation[1] = Math.random() * Math.PI;
        };
        SampleTask1.prototype.run = function (env) {
            this.animationTime += env.globalAnimationTimeElapsed;
            if (this.animationTime > this.maxAnimationTime) {
                env.taskManager.destroyTask(this);
                return;
            }
            this.processAnimation(env);
        };
        SampleTask1.prototype.processAnimation = function (env) {
            this.renderObject.location[2] += 0.1 * env.globalAnimationTimeElapsed;
        };
        return SampleTask1;
    }(RenderObjectTask));
    var SampleTask2 = (function (_super) {
        __extends(SampleTask2, _super);
        function SampleTask2() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.maxAnimationTime = 200.0;
            _this.baseLocation = vec3.create();
            _this.locationAnimationScale = 0.5;
            return _this;
        }
        SampleTask2.prototype.onCreateExt = function (env) {
            this.renderObject.images = this.main.images2;
            vec3.set(this.renderObject.scaling, 0.3, 0.3, 0.3);
            vec3.copy(this.baseLocation, this.renderObject.location);
            this.processAnimation(env);
        };
        SampleTask2.prototype.processAnimation = function (env) {
            this.renderObject.rotation[2] += 0.05 * env.globalAnimationTimeElapsed;
            var x = Math.cos(this.animationTime * 0.005 * Math.PI * 2.0) * this.locationAnimationScale;
            var y = Math.sin(this.animationTime * 0.005 * Math.PI * 2.0) * this.locationAnimationScale;
            this.renderObject.location[0] = this.baseLocation[0] + x;
            this.renderObject.location[1] = this.baseLocation[1] - y;
        };
        return SampleTask2;
    }(SampleTask1));
    var Main = (function () {
        function Main() {
            this.logicalScreenWidth = 640.0;
            this.logicalScreenHeight = 360.0;
            this.render = new WebGLRender();
            this.shader = new SampleShaders.PlainShader();
            this.model = new RenderModel();
            this.images1 = new List();
            this.images2 = new List();
            this.renderObjectManager = new Game.RenderObjectManager();
            this.MAX_RENDER_OBJECT = 100;
            this.sampleTask1Pool = new Game.TaskRecyclePool(SampleTask1, 50, "SampleTask1");
            this.sampleTask2Pool = new Game.TaskRecyclePool(SampleTask2, 50, "SampleTask2");
            this.taskManager = new Game.TaskManager();
            this.eyeLocation = vec3.create();
            this.lookatLocation = vec3.create();
            this.upVector = vec3.create();
            this.location = vec3.create();
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
            var image1 = new RenderImage();
            this.loadTexture(image1, './texture1.png');
            this.images1.push(image1);
            var image2 = new RenderImage();
            this.loadTexture(image2, './texture2.png');
            this.images2.push(image2);
            this.loadModel(this.model, '../temp/sample_basic_model.json', 'Cube');
            // Allocate render object pool
            this.renderObjectManager.allocate(this.MAX_RENDER_OBJECT);
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
            vec3.set(this.eyeLocation, 17.1, -15.8, 10.0);
            vec3.set(this.lookatLocation, 0.0, 0.0, 4.0);
            vec3.set(this.upVector, 0.0, 0.0, 1.0);
            // Create tasks time by time
            this.generateTasks();
            // Setup task execution environment variables
            this.taskManager.environment.render = this.render;
            this.taskManager.environment.renderObjectManager = this.renderObjectManager;
            this.taskManager.environment.taskManager = this.taskManager;
            this.taskManager.environment.globalAnimationTime = this.animationTime;
            this.taskManager.environment.globalAnimationTimeElapsed = 1.0;
            // Run tasks to animate objects
            this.taskManager.runTasks_run();
            // Destroy tasks waiting to be destoried
            this.taskManager.executeDestroyTask();
            // Update task state
            this.taskManager.updateTaskState();
        };
        Main.prototype.generateTasks = function () {
            if (this.animationTime < 3.0) {
                return;
            }
            this.animationTime = 0.0;
            var generateTask1 = (Math.random() > 0.5);
            if (generateTask1) {
                var task1 = this.sampleTask1Pool.get();
                if (task1 != null) {
                    task1.main = this;
                    var locationRange = 6.0;
                    task1.initialLocation = vec3.set(this.location, (-0.5 + Math.random()) * locationRange, (-0.5 + Math.random()) * locationRange, -5.0);
                    this.taskManager.addTask(task1);
                }
            }
            else {
                var task2 = this.sampleTask2Pool.get();
                if (task2 != null) {
                    task2.main = this;
                    var locationRange = 30.0;
                    task2.initialLocation = vec3.set(this.location, (-0.5 + Math.random()) * locationRange, (-0.5 + Math.random()) * locationRange, 0.0);
                    this.taskManager.addTask(task2);
                }
            }
        };
        Main.prototype.draw = function () {
            var aspect = this.logicalScreenWidth / this.logicalScreenHeight;
            mat4.perspective(this.pMatrix, 45.0 * Math.PI / 180, aspect, 0.1, 100.0);
            mat4.lookAt(this.viewMatrix, this.eyeLocation, this.lookatLocation, this.upVector);
            this.render.setDepthTest(true);
            this.render.setCulling(false);
            this.render.clearColorBufferDepthBuffer(0.0, 0.0, 0.1, 1.0);
            // Calculate object matrix
            var renderObjects = this.renderObjectManager.getObjectList();
            for (var i = 0; i < renderObjects.length; i++) {
                var renderObject = renderObjects[i];
                this.renderObjectManager.calcMatrix(renderObject);
            }
            // Update object layer before sorting
            this.renderObjectManager.updateObjectLayers();
            // Calc value for sorting
            var objectList = this.renderObjectManager.getObjectList();
            for (var i = 0; i < objectList.length; i++) {
                var renderObject = objectList[i];
                this.renderObjectManager.calcObjectSortingValue(renderObject, this.viewMatrix, Game.RenderObjectSortingMode.z);
            }
            // Run tasks to update rendering status
            this.taskManager.runTasks_onBeforeRendering();
            // Draw layers
            this.render.setCulling(true);
            this.drawLayer(Game.RenderObjectLayerID.backGround);
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
            mat4.multiply(this.mvMatrix, this.viewMatrix, renderObject.locationMatrix);
            this.render.setShader(this.shader);
            this.render.setProjectionMatrix(this.pMatrix);
            this.render.setModelViewMatrix(this.mvMatrix);
            this.render.setBuffers(renderObject.model, renderObject.images);
            this.render.setDepthTest(renderObject.depthTest);
            this.render.setDepthMask(renderObject.depthMask);
            this.render.setCulling(renderObject.culling);
            this.render.drawElements(renderObject.model);
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
})(TaskManagement || (TaskManagement = {}));
