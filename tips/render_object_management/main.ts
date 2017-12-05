
namespace RenderObjectManagement {

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

            // Create an object for background layer (set RenderObject.tag to 1)
            let renderObject = this.renderObjectManager.createObject();
            if (renderObject != null) {

                renderObject.model = this.model;
                renderObject.images = this.images2;
                renderObject.layerID = Game.RenderObjectLayerID.backGround;

                vec3.set(renderObject.location, 0.0, 0.0, 0.0);
                vec3.set(renderObject.scaling, 5.0, 5.0, 5.0);

                renderObject.tag = 1;

                this.renderObjectManager.addObject(renderObject);
            }
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
            vec3.set(this.eyeLocation, -20.0, 0.0, 0.0);
            vec3.set(this.lookatLocation, 0.0, 0.0, 0.0);
            vec3.set(this.upVector, 0.0, 0.0, 1.0);

            // Create objects time by time
            this.processGeneratingObject();

            // Object animation
            this.updateRenderObjects();

            // Calculate object matrix
            this.calclateRenderObjectMatrix();

            this.destroyFinishedObjects();
        }

        private processGeneratingObject() {

            this.animationTime += 1.0;

            if (this.animationTime < 3.0) {
                return;
            }

            this.animationTime = 0.0;

            let renderObject = this.renderObjectManager.createObject();
            if (renderObject != null) {

                renderObject.model = this.model;
                renderObject.images = this.images1;
                renderObject.layerID = Game.RenderObjectLayerID.foreGround;

                let locationRange = 20.0;
                vec3.set(renderObject.location
                    , (1.00 + Math.random()) * locationRange
                    , (-0.5 + Math.random()) * locationRange
                    , (-0.5 + Math.random()) * locationRange
                );

                let rotationRange = Math.PI * 2.0;
                vec3.set(renderObject.rotation
                    , Math.random() * rotationRange
                    , Math.random() * rotationRange
                    , Math.random() * rotationRange
                );

                this.renderObjectManager.addObject(renderObject);
            }
        }

        private updateRenderObjects() {

            let renderObjects = this.renderObjectManager.getObjectList();

            for (let renderObject of renderObjects) {

                if (renderObject.tag == 0) {
                    renderObject.location[0] -= 0.1;
                    renderObject.rotation[1] += 0.01;
                }
                else {
                    renderObject.rotation[1] += 0.005;
                    renderObject.rotation[2] += 0.005;
                }
            }
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

        private destroyFinishedObjects() {

            let renderObjects = this.renderObjectManager.getObjectList();

            for (let i = renderObjects.length - 1; i >= 0; i--) {
                let renderObject = renderObjects[i];

                if (renderObject.tag == 0) {
                    renderObject.animationTime += 1.0;
                    if (renderObject.animationTime > 400.0) {

                        this.renderObjectManager.removeObject(renderObject);
                    }
                }
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

            // Draw first layer
            this.render.setCulling(true);
            this.drawLayer(Game.RenderObjectLayerID.backGround);

            // Clear depth buffer
            this.render.clearDepthBuffer();

            // Draw second layer
            this.render.setCulling(true);
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

            this.shader.setProjectionMatrix(this.projectionMatrix);
            this.shader.setModelViewMatrix(this.modelViewMatrix);
            this.shader.setBuffers(renderObject.model, renderObject.images);

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
