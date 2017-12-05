
namespace ResourceManagement {

    enum ImageResourceID {
        None = 0,
        Image00 = 1,
        Image01 = 2,
        Image02 = 3,
        Image03 = 4,
        MaxID = 4,
    }

    enum SceneResourceID {
        None = 0,
        Common = 1,
        Scene01 = 2,
        Scene02 = 3,
        MaxID = 3,
    }

    enum SceneID {
        None = 0,
        Common = 1,
        Scene01 = 2,
        Scene02 = 3,
        MaxID = 3,
    }

    class ImageResource extends Game.ResourceItem {

        filePath: string = null;
        mipmapEnabled = false;

        image: RenderImage = new RenderImage();

        weight(loadingWeight: float): ImageResource {

            this.loadingWeight = loadingWeight;
            return this;
        }

        path(filePath: string): ImageResource {

            this.filePath = filePath;
            return this;
        }

        mipmap(enable: boolean): ImageResource {

            this.mipmapEnabled = enable;
            return this;
        }
    }

    class ImageResourceLoader extends Game.ResourceLoader<ImageResource> {

        maxParallelLoadingCount = 3;

        render: WebGLRender = null;

        protected startLoadingResourceItem(resourceItem: ImageResource) {

            resourceItem.image.imageData = new Image();

            resourceItem.image.imageData.addEventListener('load',
                () => {

                    this.render.initializeImageTexture(resourceItem.image);

                    this.endLoadingResourceItem(resourceItem);
                }
            );

            resourceItem.image.imageData.src = resourceItem.filePath;
        }

        protected unloadResource(resourceItem: ImageResource) {

            this.render.releaseImageTexture(resourceItem.image);
        }
    }

    class ModelResource {

        modelName: string = null;

        model: RenderModel = new RenderModel();
        images: List<RenderImage> = null;
    }

    class SceneResource extends Game.ResourceItem {

        filePath: string = null;
        imageIDs = new List<ImageResourceID>();

        modelResources = new Dictionary<ModelResource>();

        weight(loadingWeight: float): SceneResource {

            this.loadingWeight = loadingWeight;
            return this;
        }

        path(filePath: string): SceneResource {

            this.filePath = filePath;

            return this;
        }

        image(id: ImageResourceID): SceneResource {

            this.imageIDs.push(id);

            return this;
        }
    }

    class SceneResourceLoader extends Game.ResourceLoader<SceneResource> {

        maxParallelLoadingCount = 1;

        render: WebGLRender = null;

        protected startLoadingResourceItem(resourceItem: SceneResource) {

            let xhr = new XMLHttpRequest();
            xhr.open('GET', resourceItem.filePath);
            xhr.responseType = 'json';

            xhr.addEventListener('load',
                (e: Event) => {

                    let data: any;
                    if (xhr.responseType == 'json') {
                        data = xhr.response;
                    } else {
                        data = JSON.parse(xhr.response);
                    }

                    let models = data['models'];

                    for (let modelName in models) {
                        let modelData = models[modelName];

                        let modelResource = new ModelResource();

                        this.render.initializeModelBuffer(modelResource.model
                            , modelData.vertex, modelData.index, 4 * modelData.vertexStride); // 4 = size of float

                        resourceItem.modelResources[modelName] = modelResource;

                        this.endLoadingResourceItem(resourceItem);
                    }
                }
            );

            xhr.send();
        }

        protected unloadResource(resourceItem: SceneResource) {

            for (let modelName in resourceItem.modelResources) {
                let modelResource = resourceItem.modelResources[modelName];

                this.render.releaseModelBuffer(modelResource.model);
            }
        }
    }

    class Main {

        logicalScreenWidth = 640.0;
        logicalScreenHeight = 360.0;

        drawer_canvas = HTMLCanvasElement = null;
        context2D: CanvasRenderingContext2D = null;

        render = new WebGLRender();
        shader = new SampleShaders.PlainShader();

        imageResources: List<ImageResource> = null;
        sceneResources: List<SceneResource> = null;
        loadingSettings: List<Game.ResourceItemLoadingSettingSet> = null;

        imageResourceLoader = new ImageResourceLoader();
        sceneResourceLoader = new SceneResourceLoader();
        resourceManager = new Game.ResourceManager();

        common_ModelResource: ModelResource = null;
        scene_ModelResource: ModelResource = null;

        eyeLocation = vec3.create();
        lookatLocation = vec3.create();
        upVector = vec3.create();

        modelMatrix = mat4.create();
        viewMatrix = mat4.create();
        modelViewMatrix = mat4.create();
        projectionMatrix = mat4.create();

        currentSceneID = SceneID.Scene01;
        requestedSeneID = SceneID.None;

        commonModel_Location = vec3.create();
        sceneModel_Location = vec3.create();
        animationTime = 0.0;

        isLoaded = false;
        loadingAnimationTime = 0.0;

        initialize(webgl_canvas: HTMLCanvasElement, drawer_canvas: HTMLCanvasElement) {

            // Initialize WebGL
            webgl_canvas.width = this.logicalScreenWidth;
            webgl_canvas.height = this.logicalScreenHeight;

            if (this.render.initializeWebGL(webgl_canvas)) {
                return;
            }

            this.render.initializeShader(this.shader);

            // Initialize Canvas2D
            drawer_canvas.width = this.logicalScreenWidth;
            drawer_canvas.height = this.logicalScreenHeight;

            this.drawer_canvas = drawer_canvas;
            this.context2D = drawer_canvas.getContext('2d');

            // Image resource settings
            let imageResources = new List<ImageResource>(ImageResourceID.MaxID + 1);

            imageResources[ImageResourceID.None] = new ImageResource();
            imageResources[ImageResourceID.Image00] = new ImageResource().path('image00.png').mipmap(true).weight(1.0);
            imageResources[ImageResourceID.Image01] = new ImageResource().path('image01.png').mipmap(true).weight(1.0);
            imageResources[ImageResourceID.Image02] = new ImageResource().path('image02.png').mipmap(true).weight(1.2);
            imageResources[ImageResourceID.Image03] = new ImageResource().path('image03.png').mipmap(true).weight(1.2);

            this.imageResources = imageResources;

            // Scene resource settings
            let sceneResources = new List<SceneResource>(SceneResourceID.MaxID + 1);

            sceneResources[SceneResourceID.None] = new SceneResource();
            sceneResources[SceneResourceID.Common] = new SceneResource().path('scene00.json').image(ImageResourceID.Image00).weight(1.0);
            sceneResources[SceneResourceID.Scene01] = new SceneResource().path('scene01.json').image(ImageResourceID.Image01).weight(1.0);
            sceneResources[SceneResourceID.Scene02] = new SceneResource().path('scene02.json').image(ImageResourceID.Image02).weight(1.0);

            this.sceneResources = sceneResources;

            // Loading settings
            let loadingSettings = new List<Game.ResourceItemLoadingSettingSet>(SceneID.MaxID + 1);

            loadingSettings[SceneID.None] = new Game.ResourceItemLoadingSettingSet();

            loadingSettings[SceneID.Common] = new Game.ResourceItemLoadingSettingSet()
                .add(sceneResources[SceneResourceID.Common])
                .add(imageResources[ImageResourceID.Image00]);

            loadingSettings[SceneID.Scene01] = new Game.ResourceItemLoadingSettingSet()
                .add(sceneResources[SceneResourceID.Scene01])
                .add(imageResources[ImageResourceID.Image01]);

            loadingSettings[SceneID.Scene02] = new Game.ResourceItemLoadingSettingSet()
                .add(sceneResources[SceneResourceID.Scene02])
                .add(imageResources[ImageResourceID.Image02])
                .add(imageResources[ImageResourceID.Image03]);   // *This line (Image03) is a sample code: SettingSet can include images which is not used by models

            this.loadingSettings = loadingSettings;

            // Loader setup
            this.imageResourceLoader.render = this.render;
            this.imageResourceLoader.addResourceItems(imageResources);

            this.sceneResourceLoader.render = this.render;
            this.sceneResourceLoader.addResourceItems(sceneResources);

            this.resourceManager.addLoader(this.imageResourceLoader);
            this.resourceManager.addLoader(this.sceneResourceLoader);

            // Start loading resources
            this.startSceneLoading(this.currentSceneID);
        }

        private startSceneLoading(sceneID: SceneID) {

            // Target resource setup
            this.resourceManager.resetLoadingTargets();

            this.resourceManager.addLoadingTarget(this.loadingSettings[SceneID.Common]);
            this.resourceManager.addLoadingTarget(this.loadingSettings[sceneID]);

            // Unload unused resources -> calls unloadResource of ImageResourceLoader and SceneResourceLoader
            this.resourceManager.unloadUnusedResources();

            // Start loading -> calls startLoadingResourceItem of ImageResourceLoader and SceneResourceLoader
            this.resourceManager.startLoading();

            this.isLoaded = false;
            this.loadingAnimationTime = 0.0;

            this.drawer_canvas.style.display = 'block'; // Show canvas
            this.showLoadingProgress();
        }

        requestSwitchingScene(nextSceneID: SceneID) {

            if (!this.isLoaded) {
                return;
            }

            this.requestedSeneID = nextSceneID;
        }

        processLoading() {

            // Process loading
            let continueLoading = this.resourceManager.processLoading();

            // Draw Progress
            this.animateLoadingProgress();
            this.showLoadingProgress();

            if (continueLoading || this.loadingAnimationTime < 1.0) {
                return;
            }

            // Loading finished
            this.drawer_canvas.style.display = 'none'; // Hide canvas

            // Link models and images
            this.linkResources();

            // Start scene
            this.initializeScene();

            this.isLoaded = true;
        }

        private animateLoadingProgress() {

            let loadingProgress = this.resourceManager.getLoadingProgress();

            if (loadingProgress == -1.0) {
                // Already loaded
                loadingProgress = 1.0;
                this.loadingAnimationTime = 1.0;
            }

            this.loadingAnimationTime += (loadingProgress - this.loadingAnimationTime) * 0.3;

            if (this.loadingAnimationTime >= 0.999) {
                // Finish
                this.loadingAnimationTime = 1.0;
            }

            console.log('Loading progress: ' + (loadingProgress * 100.0).toFixed(2) + '%');
        }

        private showLoadingProgress() {

            // Draw
            let centerX = this.logicalScreenWidth * 0.5;
            let centerY = this.logicalScreenHeight * 0.5;
            let size = Math.min(this.logicalScreenWidth, this.logicalScreenHeight);

            this.context2D.clearRect(0, 0, this.logicalScreenWidth, this.logicalScreenHeight);

            this.context2D.fillStyle = 'rgba(255, 255, 255, 0.5)';
            this.context2D.fillRect(0, 0, this.logicalScreenWidth, this.logicalScreenHeight);

            this.context2D.fillStyle = 'rgba(0, 0, 0, 1.0)';
            this.context2D.beginPath();
            this.context2D.arc(
                centerX
                , centerY
                , size * 0.3
                , Math.PI * 1.5
                , Math.PI * 1.5 + this.loadingAnimationTime * Math.PI * 2.0
                , false);
            this.context2D.stroke();

            let percentage = this.loadingAnimationTime * 100.0;
            if (percentage >= 99.0) {
                // Shows 100% virtualy...
                percentage = 100.0;
            }
            this.context2D.font = 'bold 16px';
            this.context2D.textAlign = 'center';
            this.context2D.fillText(percentage.toFixed(2) + '%', centerX, centerY);
        }

        private linkResources() {

            for (let sceneResource of this.sceneResources) {

                if (sceneResource.loadingState != Game.ResourceLoadingstate.finished) {
                    continue;
                }

                for (let modelName in sceneResource.modelResources) {
                    let modelResource: ModelResource = sceneResource.modelResources[modelName];

                    if (modelResource.images == null) {
                        modelResource.images = new List<RenderImage>(sceneResource.imageIDs.length);
                    }

                    for (let i = 0; i < sceneResource.imageIDs.length; i++) {
                        let imageID = sceneResource.imageIDs[i];

                        modelResource.images[i] = this.imageResources[imageID].image;
                    }
                }
            }
        }

        private initializeScene() {

            this.common_ModelResource = this.sceneResources[SceneResourceID.Common].modelResources['Cube'];

            vec3.set(this.commonModel_Location, 2.0, 0.0, 0.0);

            if (this.currentSceneID == SceneID.Scene01) {

                this.scene_ModelResource = this.sceneResources[SceneResourceID.Scene01].modelResources['Cube'];
            }
            else {

                this.scene_ModelResource = this.sceneResources[SceneResourceID.Scene02].modelResources['Cube'];
            }

            vec3.set(this.sceneModel_Location, -2.0, 0.0, 0.0);
        }

        run() {

            // Scene switching
            if (this.requestedSeneID != SceneID.None) {

                this.startSceneLoading(this.requestedSeneID);

                this.currentSceneID = this.requestedSeneID;
                this.requestedSeneID = SceneID.None;

                return;
            }

            this.animationTime += 1.0;

            // Camera position
            vec3.set(this.eyeLocation, 0.0, 8.0, 3.0);
            vec3.set(this.lookatLocation, 0.0, 0.0, 0.0);
            vec3.set(this.upVector, 0.0, 0.0, 1.0);
        }

        draw() {

            if (!this.isLoaded) {
                return;
            }

            let aspect = this.logicalScreenWidth / this.logicalScreenHeight;
            mat4.perspective(this.projectionMatrix, 45.0 * Math.PI / 180, aspect, 0.1, 100.0);
            mat4.lookAt(this.viewMatrix, this.eyeLocation, this.lookatLocation, this.upVector);

            this.render.setDepthTest(true)
            this.render.setCulling(false);
            this.render.clearColorBufferDepthBuffer(0.0, 0.0, 0.1, 1.0);

            // Common model
            mat4.identity(this.modelMatrix);
            mat4.translate(this.modelMatrix, this.modelMatrix, this.commonModel_Location);
            mat4.rotateZ(this.modelMatrix, this.modelMatrix, this.animationTime * 0.02);

            this.drawModel(this.modelMatrix, this.common_ModelResource);

            // Scene model
            mat4.identity(this.modelMatrix);
            mat4.translate(this.modelMatrix, this.modelMatrix, this.sceneModel_Location);
            mat4.rotateZ(this.modelMatrix, this.modelMatrix, this.animationTime * 0.02);

            this.drawModel(this.modelMatrix, this.scene_ModelResource);
        }

        private drawModel(modelMatrix: Mat4, modelResource: ModelResource) {

            mat4.multiply(this.modelViewMatrix, this.viewMatrix, modelMatrix);

            this.render.setShader(this.shader);

            this.shader.setProjectionMatrix(this.projectionMatrix);
            this.shader.setModelViewMatrix(this.modelViewMatrix);
            this.shader.setBuffers(modelResource.model, modelResource.images);

            this.render.setDepthTest(true)
            this.render.setCulling(false);
            this.render.drawElements(modelResource.model);
        }
    }

    let _Main: Main;

    window.onload = () => {

        let webgl_canvas = <HTMLCanvasElement>document.getElementById('webgl_canvas');
        let drawer_canvas = <HTMLCanvasElement>document.getElementById('drawer_canvas');
        _Main = new Main();
        _Main.initialize(webgl_canvas, drawer_canvas);

        document.getElementById('scene01').onclick = () => {
            _Main.requestSwitchingScene(SceneID.Scene01);
        };

        document.getElementById('scene02').onclick = () => {
            _Main.requestSwitchingScene(SceneID.Scene02);
        };

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
