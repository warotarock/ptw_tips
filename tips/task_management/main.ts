
namespace TaskManagement {

    class RenderObjectTask extends Game.TaskClass {

        renderObject: Game.RenderObject = null;

        onCreate(env: Game.TaskEnvironment) {

            this.onCreate_RenderObjectTask(env);
            this.onCreateExt(env);
        }

        onCreate_RenderObjectTask(env: Game.TaskEnvironment) {

            var renderObject = env.renderObjectManager.createObject();

            if (renderObject != null) {

                env.renderObjectManager.addObject(renderObject);

                this.renderObject = renderObject;
            }
        }

        onCreateExt(env: Game.TaskEnvironment) {

            // Override method
        }

        onDestroy(env: Game.TaskEnvironment) {

            this.onDestroy_RenderObjectTask(env);
            this.onDestroyExt(env);
        }

        onDestroy_RenderObjectTask(env: Game.TaskEnvironment) {

            if (this.renderObject != null) {

                env.renderObjectManager.removeObject(this.renderObject);

                this.renderObject = null;
            }
        }

        onDestroyExt(env: Game.TaskEnvironment) {

            // Override method
        }
    }

    class SampleTask1 extends RenderObjectTask {

        initialLocation: Vec3 = null;

        main: Main = null;

        animationTime = 0.0;
        maxAnimationTime = 200.0;

        recycle() {

            this.main = null;
            this.animationTime = 0.0;
        }

        onCreate(env: Game.TaskEnvironment) {

            this.onCreate_RenderObjectTask(env);
            this.onCreate_SampleTask1(env);
            this.onCreateExt(env);
        }

        onCreate_SampleTask1(env: Game.TaskEnvironment) {

            this.renderObject.model = this.main.model;
            this.renderObject.images = this.main.images1;

            vec3.copy(this.renderObject.location, this.initialLocation);
        }

        onCreateExt(env: Game.TaskEnvironment) {

            vec3.set(this.renderObject.scaling, 0.8, 0.8, 0.8);
        }

        run(env: Game.TaskEnvironment) {

            this.animationTime += env.globalAnimationTimeElapsed;

            if (this.animationTime > this.maxAnimationTime) {
                env.taskManager.destroyTask(this);
                return;
            }

            this.runExt(env);
        }

        runExt(env: Game.TaskEnvironment) {

            this.renderObject.location[2] += 0.06 * env.globalAnimationTimeElapsed;

            this.renderObject.rotation[0] += 0.05 * env.globalAnimationTimeElapsed;
        }

    }

    class SampleTask2 extends SampleTask1 {

        maxAnimationTime = 200.0;

        baseLocation = vec3.create();
        locationAnimationScale = 2.0;

        onCreateExt(env: Game.TaskEnvironment) {

            this.renderObject.images = this.main.images2;

            vec3.set(this.renderObject.scaling, 0.3, 0.3, 0.3);

            vec3.copy(this.baseLocation, this.renderObject.location);

            this.calcLocation(env);
        }

        runExt(env: Game.TaskEnvironment) {

            this.renderObject.rotation[2] += 0.05 * env.globalAnimationTimeElapsed;

            this.calcLocation(env);
        }

        calcLocation(env: Game.TaskEnvironment) {

            this.renderObject.location[0] = this.baseLocation[0] + Math.cos(this.animationTime * 0.005 * Math.PI * 2.0) * this.locationAnimationScale;
            this.renderObject.location[1] = this.baseLocation[1] - Math.sin(this.animationTime * 0.005 * Math.PI * 2.0) * this.locationAnimationScale;
        }
    }

    class Main {

        logicalScreenWidth = 640.0;
        logicalScreenHeight = 360.0;

        canvas: HTMLCanvasElement = null;
        gl: WebGLRenderingContext = null;

        render = new WebGLRender();
        shader = new SampleShaders.PlainShader();
        model = new RenderModel();
        images1 = new List<RenderImage>();
        images2 = new List<RenderImage>();

        eyeLocation = vec3.create();
        lookatLocation = vec3.create();
        upVector = vec3.create();

        location = vec3.create();

        renderObjectManager = new Game.RenderObjectManager();
        MAX_RENDER_OBJECT = 100;

        sampleTask1Pool = new Game.TaskRecyclePool<SampleTask1>(SampleTask1, 50, "SampleTask1");
        sampleTask2Pool = new Game.TaskRecyclePool<SampleTask2>(SampleTask2, 50, "SampleTask2");

        taskManager = new Game.TaskManager();

        modelMatrix = mat4.create();
        viewMatrix = mat4.create();
        pMatrix = mat4.create();
        mvMatrix = mat4.create();

        animationTime = 0.0;

        isLoaded = false;

        initialize(canvas: HTMLCanvasElement) {

            this.canvas = canvas;
            this.canvas.width = this.logicalScreenWidth;
            this.canvas.height = this.logicalScreenHeight;

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
        }

        processLoading() {

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
        }

        run() {

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
        }

        private generateTasks() {

            if (this.animationTime < 5.0) {
                return;
            }

            this.animationTime = 0.0;

            var generateTask1 = (Math.random() > 0.5);

            if (generateTask1) {

                var task1 = this.sampleTask1Pool.get();

                if (task1 != null) {

                    task1.main = this;

                    var locationRange = 15.0;
                    task1.initialLocation = vec3.set(this.location
                        , (-0.5 + Math.random()) * locationRange
                        , (-0.5 + Math.random()) * locationRange
                        , Math.random() * locationRange * 0.5
                    );

                    this.taskManager.addTask(task1);
                }
            }
            else {

                var task2 = this.sampleTask2Pool.get();

                if (task2 != null) {

                    task2.main = this;

                    var locationRange = 30.0;
                    task2.initialLocation = vec3.set(this.location
                        , (-0.5 + Math.random()) * locationRange
                        , (-0.5 + Math.random()) * locationRange
                        , Math.random() * 0.2
                    );

                    this.taskManager.addTask(task2);
                }

            }
        }

        draw() {

            var aspect = this.logicalScreenWidth / this.logicalScreenHeight;
            mat4.perspective(this.pMatrix, 45.0 * Math.PI / 180, aspect, 0.1, 100.0);
            mat4.lookAt(this.viewMatrix, this.eyeLocation, this.lookatLocation, this.upVector);

            this.render.setDepthTest(true)
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
        }

        private drawLayer(layerID: Game.RenderObjectLayerID) {

            var objects = this.renderObjectManager.getZsortedObjectList(layerID)

            for (var i = 0; i < objects.length; i++) {
                var renderObject = objects[i];

                this.drawRenderObject(renderObject);
            }
        }

        private drawRenderObject(renderObject: Game.RenderObject) {

            mat4.multiply(this.mvMatrix, this.viewMatrix, renderObject.locationMatrix);

            this.render.setShader(this.shader);
            this.render.setProjectionMatrix(this.pMatrix);
            this.render.setModelViewMatrix(this.mvMatrix);

            this.render.setBuffers(renderObject.model, renderObject.images);

            this.render.setDepthTest(renderObject.depthTest);
            this.render.setDepthMask(renderObject.depthMask);
            this.render.setCulling(renderObject.culling);

            this.render.drawElements(renderObject.model);
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
