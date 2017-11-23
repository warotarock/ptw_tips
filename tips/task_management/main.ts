
namespace TaskManagement {

    class RenderObjectTask extends Game.TaskClass {

        renderObject: Game.RenderObject = null;

        onCreate(env: Game.TaskEnvironment) {

            this.onCreate_RenderObjectTask(env);
            this.onCreateExt(env);
        }

        onCreate_RenderObjectTask(env: Game.TaskEnvironment) {

            let renderObject = env.renderObjectManager.createObject();

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

            vec3.set(this.renderObject.scaling, 0.5, 0.5, 0.5);

            this.renderObject.rotation[0] = Math.random() * Math.PI;
            this.renderObject.rotation[1] = Math.random() * Math.PI;
        }

        run(env: Game.TaskEnvironment) {

            this.animationTime += env.globalAnimationTimeElapsed;

            if (this.animationTime > this.maxAnimationTime) {
                env.taskManager.destroyTask(this);
                return;
            }

            this.processAnimation(env);
        }

        processAnimation(env: Game.TaskEnvironment) {

            this.renderObject.location[2] += 0.1 * env.globalAnimationTimeElapsed;
        }
    }

    class SampleTask2 extends SampleTask1 {

        maxAnimationTime = 200.0;

        baseLocation = vec3.create();
        locationAnimationScale = 0.5;

        onCreateExt(env: Game.TaskEnvironment) {

            this.renderObject.images = this.main.images2;

            vec3.set(this.renderObject.scaling, 0.3, 0.3, 0.3);

            vec3.copy(this.baseLocation, this.renderObject.location);

            this.processAnimation(env);
        }

        processAnimation(env: Game.TaskEnvironment) {

            this.renderObject.rotation[2] += 0.05 * env.globalAnimationTimeElapsed;

            let x = Math.cos(this.animationTime * 0.005 * Math.PI * 2.0) * this.locationAnimationScale;
            let y = Math.sin(this.animationTime * 0.005 * Math.PI * 2.0) * this.locationAnimationScale;

            this.renderObject.location[0] = this.baseLocation[0] + x;
            this.renderObject.location[1] = this.baseLocation[1] - y;
        }
    }

    class Main {

        logicalScreenWidth = 640.0;
        logicalScreenHeight = 360.0;

        render = new WebGLRender();
        shader = new SampleShaders.PlainShader();
        model = new RenderModel();
        images1 = new List<RenderImage>();
        images2 = new List<RenderImage>();

        eyeLocation = vec3.create();
        lookatLocation = vec3.create();
        upVector = vec3.create();

        modelMatrix = mat4.create();
        viewMatrix = mat4.create();
        modelViewMatrix = mat4.create();
        projectionMatrix = mat4.create();

        renderObjectManager = new Game.RenderObjectManager();
        MAX_RENDER_OBJECT = 100;

        sampleTask1Pool = new Game.TaskRecyclePool<SampleTask1>(SampleTask1, 50, 'SampleTask1');
        sampleTask2Pool = new Game.TaskRecyclePool<SampleTask2>(SampleTask2, 50, 'SampleTask2');

        taskManager = new Game.TaskManager();

        location = vec3.create();

        animationTime = 0.0;

        isLoaded = false;

        initialize(canvas: HTMLCanvasElement) {

            canvas.width = this.logicalScreenWidth;
            canvas.height = this.logicalScreenHeight;

            if (this.render.initializeWebGL(canvas)) {
                return;
            }

            this.render.initializeShader(this.shader);

            let image1 = new RenderImage();
            this.loadTexture(image1, './texture1.png');
            this.images1.push(image1);

            let image2 = new RenderImage();
            this.loadTexture(image2, './texture2.png');
            this.images2.push(image2);

            this.loadModel(this.model, '../temp/sample_basic_model.json', 'Cube');

            // Allocate render object pool
            this.renderObjectManager.allocate(this.MAX_RENDER_OBJECT);
        }

        processLoading() {

            // Waiting for data
            for (let image of this.images1) {

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

            // Camera position
            vec3.set(this.eyeLocation, 17.1, -15.8, 10.0);
            vec3.set(this.lookatLocation, 0.0, 0.0, 4.0);
            vec3.set(this.upVector, 0.0, 0.0, 1.0);

            // Create tasks time by time
            this.processGeneratingTask();

            // Task process
            this.runTasks();

            // RenderObject process
            this.calclateRenderObjectMatrix();

            // Destroy tasks waiting to be destoried
            this.taskManager.executeDestroyTask();
        }

        private processGeneratingTask() {

            this.animationTime += 1.0;

            if (this.animationTime < 3.0) {
                return;
            }

            this.animationTime = 0.0;

            let generateTask1 = (Math.random() > 0.5);

            if (generateTask1) {

                let task1 = this.sampleTask1Pool.get();

                if (task1 != null) {

                    task1.main = this;

                    let locationRange = 6.0;
                    task1.initialLocation = vec3.set(this.location
                        , (-0.5 + Math.random()) * locationRange
                        , (-0.5 + Math.random()) * locationRange
                        , -5.0
                    );

                    this.taskManager.addTask(task1);
                }
            }
            else {

                let task2 = this.sampleTask2Pool.get();

                if (task2 != null) {

                    task2.main = this;

                    let locationRange = 30.0;
                    task2.initialLocation = vec3.set(this.location
                        , (-0.5 + Math.random()) * locationRange
                        , (-0.5 + Math.random()) * locationRange
                        , 0.0
                    );

                    this.taskManager.addTask(task2);
                }

            }
        }

        private runTasks() {

            // Setup task execution environment variables
            this.taskManager.environment.render = this.render;
            this.taskManager.environment.renderObjectManager = this.renderObjectManager;
            this.taskManager.environment.taskManager = this.taskManager;
            this.taskManager.environment.globalAnimationTime = this.animationTime;
            this.taskManager.environment.globalAnimationTimeElapsed = 1.0;

            // Run tasks to animate objects
            this.taskManager.runTasks_run();
        }

        private calclateRenderObjectMatrix() {

            let renderObjects = this.renderObjectManager.getObjectList();

            for (let renderObject of renderObjects) {

                mat4.identity(renderObject.matrix);
                mat4.translate(renderObject.matrix, renderObject.matrix, renderObject.location);
                mat4.rotateX(renderObject.matrix, renderObject.matrix, renderObject.rotation[0]);
                mat4.rotateY(renderObject.matrix, renderObject.matrix, renderObject.rotation[1]);
                mat4.rotateZ(renderObject.matrix, renderObject.matrix, renderObject.rotation[2]);
                mat4.scale(renderObject.matrix, renderObject.matrix, renderObject.scaling);
            }
        }

        draw() {

            let aspect = this.logicalScreenWidth / this.logicalScreenHeight;
            mat4.perspective(this.projectionMatrix, 45.0 * Math.PI / 180, aspect, 0.1, 100.0);
            mat4.lookAt(this.viewMatrix, this.eyeLocation, this.lookatLocation, this.upVector);

            this.render.setDepthTest(true)
            this.render.setCulling(false);
            this.render.clearColorBufferDepthBuffer(0.0, 0.0, 0.1, 1.0);

            // Update object layer before sorting
            this.renderObjectManager.updateObjectLayers();

            // Calc value for sorting
            this.updateRenderObjectSorting();

            // Run tasks to update rendering status
            this.taskManager.runTasks_onBeforeRendering();

            // Draw layers
            this.render.setCulling(true);

            this.drawLayer(Game.RenderObjectLayerID.backGround);

            this.drawLayer(Game.RenderObjectLayerID.foreGround);
        }

        private updateRenderObjectSorting() {

            let renderObjects = this.renderObjectManager.getObjectList();

            for (let renderObject of renderObjects) {

                renderObject.sortingValue = this.renderObjectManager.calcObjectSortingValue(renderObject, this.viewMatrix, Game.RenderObjectSortingMode.z);
            }
        }

        private drawLayer(layerID: Game.RenderObjectLayerID) {

            let renderObjects = this.renderObjectManager.getZsortedObjectList(layerID)

            for (let renderObject of renderObjects) {

                this.drawRenderObject(renderObject);
            }
        }

        private drawRenderObject(renderObject: Game.RenderObject) {

            mat4.multiply(this.modelViewMatrix, this.viewMatrix, renderObject.matrix);

            this.render.setShader(this.shader);
            this.render.setProjectionMatrix(this.projectionMatrix);
            this.render.setModelViewMatrix(this.modelViewMatrix);

            this.render.setBuffers(renderObject.model, renderObject.images);

            this.render.setDepthTest(renderObject.depthTest);
            this.render.setDepthMask(renderObject.depthMask);
            this.render.setCulling(renderObject.culling);

            this.render.drawElements(renderObject.model);
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

                    this.render.initializeModelBuffer(this.model, modelData.vertex, modelData.index, 4 * modelData.vertexStride); // 4 = size of float
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
