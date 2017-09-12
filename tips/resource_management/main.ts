
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

    class ImageResourceLoader extends Game.ResourceLoaderBase<ImageResource> {

        maxParralelLoadingCount = 5;

        render: WebGLRender;

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

    class SceneResourceLoader extends Game.ResourceLoaderBase<SceneResource> {

        maxParralelLoadingCount = 1;

        render: WebGLRender;

        protected startLoadingResourceItem(resourceItem: SceneResource) {

            var xhr = new XMLHttpRequest();
            xhr.open('GET', resourceItem.filePath);
            xhr.responseType = 'json';

            xhr.addEventListener('load',
                (e: Event) => {

                    var data: any;
                    if (xhr.responseType == 'json') {
                        data = xhr.response;
                    } else {
                        data = JSON.parse(xhr.response);
                    }

                    var models = data['models'];

                    for (var modelName in models) {
                        var modelData = models[modelName];

                        var modelResource = new ModelResource();

                        this.render.initializeModelBuffer(modelResource.model
                            , modelData.vertex, modelData.index, 4 * modelData.vertexStride); // 4 = size of float

                        resourceItem.modelResources[modelName] = modelResource;

                        this.endLoadingResourceItem(resourceItem);
                    }
                }
            );

            xhr.send();
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

        commonModel_Location = vec3.create();
        sceneModel_Location = vec3.create();

        modelMatrix = mat4.create();
        viewMatrix = mat4.create();
        pMatrix = mat4.create();
        mvMatrix = mat4.create();

        currentSceneID = SceneID.None;
        requestedSeneID = SceneID.None;
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
            var imageResources = new List<ImageResource>(ImageResourceID.MaxID + 1);

            imageResources[ImageResourceID.None] = new ImageResource();
            imageResources[ImageResourceID.Image00] = new ImageResource().path('image00.png').mipmap(true).weight(1.0);
            imageResources[ImageResourceID.Image01] = new ImageResource().path('image01.png').mipmap(true).weight(1.0);
            imageResources[ImageResourceID.Image02] = new ImageResource().path('image02.png').mipmap(true).weight(1.2);
            imageResources[ImageResourceID.Image03] = new ImageResource().path('image03.png').mipmap(true).weight(1.2);

            this.imageResources = imageResources;

            // Scene resource settings
            var sceneResources = new List<SceneResource>(SceneResourceID.MaxID + 1);

            sceneResources[SceneResourceID.None] = new SceneResource();
            sceneResources[SceneResourceID.Common] = new SceneResource().path('scene00.json').image(ImageResourceID.Image00).weight(1.0);
            sceneResources[SceneResourceID.Scene01] = new SceneResource().path('scene01.json').image(ImageResourceID.Image01).weight(1.0);
            sceneResources[SceneResourceID.Scene02] = new SceneResource().path('scene02.json').image(ImageResourceID.Image02).weight(1.0);

            this.sceneResources = sceneResources;

            // Loading settings
            var loadingSettings = new List<Game.ResourceItemLoadingSettingSet>(SceneID.MaxID + 1);

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

            // Resource manager setup
            this.imageResourceLoader.render = this.render;
            this.imageResourceLoader.addResourceItems(imageResources);

            this.sceneResourceLoader.render = this.render;
            this.sceneResourceLoader.addResourceItems(sceneResources);

            this.resourceManager.addLoader(this.imageResourceLoader);
            this.resourceManager.addLoader(this.sceneResourceLoader);

            // Start loading resources
            this.currentSceneID = SceneID.Scene02;
            this.startSceneLoading(this.currentSceneID);
        }

        private startSceneLoading(sceneID: SceneID) {

            // Target resource setup
            this.resourceManager.resetLoadingTargets();

            this.resourceManager.addLoadingTarget(this.loadingSettings[SceneID.Common]);
            this.resourceManager.addLoadingTarget(this.loadingSettings[sceneID]);

            // Unload unused resources
            for (var i = 0; i < this.imageResources.length; i++) {
                var imageResource = this.imageResources[i];

                if (!imageResource.isUsed && imageResource.loadingState == Game.ResourceLoadingstate.finished) {

                    this.render.releaseImageTexture(imageResource.image);
                }
            }

            for (var i = 0; i < this.sceneResources.length; i++) {
                var sceneResource = this.sceneResources[i];

                if (!sceneResource.isUsed && sceneResource.loadingState == Game.ResourceLoadingstate.finished) {

                    for (var modelName in sceneResource.modelResources) {
                        var modelResource: ModelResource = sceneResource.modelResources[modelName];

                        this.render.releaseModelBuffer(modelResource.model);
                    }
                }
            }

            // Start loading
            this.resourceManager.startLoading();

            this.isLoaded = false;
            this.loadingAnimationTime = 0.0;
        }

        processLoading() {

            // Process loading
            var continueLoading = this.resourceManager.processLoading();

            // Draw Progress
            this.showLoadingProgress();

            if (continueLoading || this.loadingAnimationTime < 1.0) {
                return;
            }

            // Loading finished
            this.drawer_canvas.style.display = 'none';

            // Link models and images
            this.linkResources();

            // Start scene
            this.initializeScene();

            this.isLoaded = true;
        }

        private showLoadingProgress() {
            
            // Calculate animation
            var loadingProgress = this.resourceManager.getLoadingProgress();

            this.loadingAnimationTime += (loadingProgress - this.loadingAnimationTime) * 0.3;

            if (this.loadingAnimationTime >= 0.999) {
                this.loadingAnimationTime = 1.0;
            }

            // Draw
            var centerX = this.logicalScreenWidth * 0.5;
            var centerY = this.logicalScreenHeight * 0.5;
            var size = Math.min(this.logicalScreenWidth, this.logicalScreenHeight);

            this.context2D.clearRect(0, 0, this.logicalScreenWidth, this.logicalScreenHeight);

            this.context2D.beginPath();
            this.context2D.arc(
                centerX
                , centerY
                , size * 0.3
                , Math.PI * 1.5
                , Math.PI * 1.5 + this.loadingAnimationTime * Math.PI * 2.0
                , false);
            this.context2D.stroke();

            var percentage = this.loadingAnimationTime * 100.0;
            if (percentage >= 99.0) {
                // Shows 100% virtualy...
                percentage = 100.0;
            }
            this.context2D.font = "bold 16px";
            this.context2D.textAlign = 'center';
            this.context2D.fillText(percentage.toFixed(2) + '%', centerX, centerY);

            console.log('Loading progress: ' + (loadingProgress * 100.0).toFixed(2) + '%');
        }

        private linkResources() {

            for (var i = 0; i < this.sceneResources.length; i++) {
                var sceneResource = this.sceneResources[i];

                if (sceneResource.loadingState != Game.ResourceLoadingstate.finished) {
                    continue;
                }

                for (var modelName in sceneResource.modelResources) {
                    var modelResource: ModelResource = sceneResource.modelResources[modelName];

                    if (modelResource.images == null) {
                        modelResource.images = new List<RenderImage>(sceneResource.imageIDs.length);
                    }

                    for (var k = 0; k < sceneResource.imageIDs.length; k++) {
                        var imageID = sceneResource.imageIDs[k];

                        modelResource.images[k] = this.imageResources[imageID].image;
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

            var aspect = this.logicalScreenWidth / this.logicalScreenHeight;
            mat4.perspective(this.pMatrix, 45.0 * Math.PI / 180, aspect, 0.1, 100.0);
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

            mat4.multiply(this.mvMatrix, this.viewMatrix, modelMatrix);

            this.render.setShader(this.shader);
            this.render.setProjectionMatrix(this.pMatrix);
            this.render.setModelViewMatrix(this.mvMatrix);

            this.render.setBuffers(modelResource.model, modelResource.images);

            this.render.setDepthTest(true)
            this.render.setCulling(false);
            this.render.drawElements(modelResource.model);
        }
    }

    var _Main: Main;

    window.onload = () => {

        var webgl_canvas = <HTMLCanvasElement>document.getElementById('webgl_canvas');
        var drawer_canvas = <HTMLCanvasElement>document.getElementById('drawer_canvas');
        _Main = new Main();
        _Main.initialize(webgl_canvas, drawer_canvas);

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
