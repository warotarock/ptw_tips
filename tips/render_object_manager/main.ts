
namespace RenderObjectAndManager {

    class Main {

        logicalScreenWidth = 640.0;
        logicalScreenHeight = 360.0;

        canvas: HTMLCanvasElement = null;
        gl: WebGLRenderingContext = null;

        render = new WebGLRender();
        shader = new SampleShaders.PlainShader();
        model = new RenderModel();
        images = new List<RenderImage>();

        // x, y, z, u, v
        vertexData = [1, 1, -1, 0.3333, 0, 1, -1, -1, 0.3333, 0.3333, -1, -1, -1, 0.3333, 0.6667, -1, 1, -1, 0.3333, 0.3333, 1, 1, 1, 0, 0, 1, -1, 1, 0.3333, 0, -1, -1, 1, 0, 0.6667, -1, 1, 1, 0, 0.3333];
        indexData = [0, 1, 2, 7, 6, 5, 4, 5, 1, 5, 6, 2, 2, 6, 7, 0, 3, 7, 3, 0, 2, 4, 7, 5, 0, 4, 1, 1, 5, 2, 3, 2, 7, 4, 0, 7];

        eyeLocation = vec3.create();
        lookatLocation = vec3.create();
        upVector = vec3.create();

        direction = vec3.create();

        renderObjectManager = new RenderObjectManager();
        renderObjects = new List<RenderObject>();
        MAX_RENDER_OBJECT = 100;

        modelMatrix = mat4.create();
        viewMatrix = mat4.create();
        pMatrix = mat4.create();
        mvMatrix = mat4.create();

        animationTime = 0.0;
        layerAnimationProgress = 0;
        layerList: List<RenderObjectLayerID> = [
            RenderObjectLayerID.geometry
            , RenderObjectLayerID.foreGround
            , RenderObjectLayerID.nearGround
        ];

        isLoaded = false;

        initialize(canvas: HTMLCanvasElement) {

            this.canvas = canvas;
            this.canvas.width = this.logicalScreenWidth;
            this.canvas.height = this.logicalScreenHeight;

            try {
                var option = { preserveDrawingBuffer: true, antialias: true };

                this.gl = <WebGLRenderingContext>(
                    canvas.getContext('webgl', option)
                    || canvas.getContext('experimental-webgl', option)
                );

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

            var image = new RenderImage();
            this.loadTexture(image, './texture.png');
            this.images.push(image);

            this.renderObjectManager.allocate(this.MAX_RENDER_OBJECT);
        }

        processLading() {

            // Waiting for image data
            if (this.images[0].texture == null) {
                return;
            }

            this.isLoaded = true;
        }

        run() {

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
                    renderObject.images = this.images;
                    renderObject.layerID = RenderObjectLayerID.foreGround;

                    var locationRange = 20.0;
                    vec3.set(renderObject.location
                        , (-0.5 + Math.random()) * locationRange
                        , (-0.5 + Math.random()) * locationRange
                        , (-0.5 + Math.random()) * locationRange
                    );

                    var rotationRange = Math.PI * 2.0;
                    vec3.set(renderObject.rotation
                        , Math.random() * rotationRange
                        , Math.random() * rotationRange
                        , Math.random() * rotationRange
                    );

                    this.renderObjectManager.addObject(renderObject);

                    this.renderObjects.push(renderObject);
                }
            }

            // Object animation
            for (var i = this.renderObjects.length - 1; i >= 0; i--) {
                var renderObject = this.renderObjects[i];

                // Destroy object
                renderObject.animationTime += 1.0;
                if (renderObject.animationTime > 500.0) {

                    this.renderObjectManager.removeObject(renderObject);

                    this.renderObjects.splice(i, 1);
                }
            }

            for (var i = 0; i < this.renderObjects.length; i++) {
                var renderObject = this.renderObjects[i];

                // Rotation
                renderObject.rotation[1] += 0.05;

                // Calculate object matrix
                this.renderObjectManager.calcMatrix(renderObject);
            }
        }

        draw() {

            var aspect = this.logicalScreenWidth / this.logicalScreenHeight;
            mat4.perspective(this.pMatrix, 45.0 * Math.PI / 180, aspect, 0.1, 100.0);
            mat4.lookAt(this.viewMatrix, this.eyeLocation, this.lookatLocation, this.upVector);

            this.render.setDepthTest(true)
            this.render.setCulling(false);
            this.render.clearColorBufferDepthBuffer(0.0, 0.0, 0.1, 1.0);

            // Calc value for sorting
            for (var i = 0; i < this.renderObjects.length; i++) {
                var renderObject = this.renderObjects[i];

                this.renderObjectManager.calcObjectSortingValue(renderObject, this.viewMatrix, RenderObjectSortingMode.z);
            }

            // Draw a layer
            var objects = this.renderObjectManager.getZsortedObjectList(RenderObjectLayerID.foreGround)
            for (var i = 0; i < objects.length; i++) {
                var renderObject = objects[i];

                this.drawModel(renderObject.locationMatrix, renderObject.model, renderObject.images);
            }
        }

        private drawModel(modelMatrix: Mat4, model: RenderModel, images: List<RenderImage>) {

            mat4.multiply(this.mvMatrix, this.viewMatrix, modelMatrix);

            this.render.setShader(this.shader);
            this.render.setProjectionMatrix(this.pMatrix);
            this.render.setModelViewMatrix(this.mvMatrix);

            this.render.setBuffers(model, images);

            this.render.setDepthTest(true)
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
            _Main.processLading();
        }

        setTimeout(run, 1000 / 30);
    }
}
