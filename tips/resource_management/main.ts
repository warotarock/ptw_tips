
namespace ResourceManagement {

    enum ImageResourceID {
        None = 0,
        Image00 = 1,
        Image01 = 2,
        Image02 = 3,
        MaxID = 3,
    }

    enum ModelResourceID {
        None = 0,
        Model00 = 1,
        Model01 = 2,
        Model02 = 3,
        MaxID = 3,
    }

    enum SceneID {
        None = 0,
        Common = 1,
        Scene01 = 2,
        Scene02 = 3,
        MaxID = 3,
    }

    export class ImageResource extends Game.ResourceItem {

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

    export class ModelResource extends Game.ResourceItem {

        maxParralelLoadingCount = 1;

        filePath: string = null;
        modelName: string = null;
        imageIDs = new List<ImageResourceID>();

        model: RenderModel = new RenderModel();
        images: List<RenderImage> = null;

        weight(loadingWeight: float): ModelResource {

            this.loadingWeight = loadingWeight;
            return this;
        }

        path(filePath: string): ModelResource {

            this.filePath = filePath;

            return this;
        }

        name(modelName: string): ModelResource {

            this.modelName = modelName;

            return this;
        }

        image(id: ImageResourceID): ModelResource {

            this.imageIDs.push(id);

            return this;
        }
    }


    class ModelResourceLoader extends Game.ResourceLoaderBase<ModelResource> {

        render: WebGLRender;

        protected startLoadingResourceItem(resourceItem: ModelResource) {

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

                    var modelData = data[resourceItem.modelName];

                    this.render.initializeModelBuffer(resourceItem.model, modelData.vertex, modelData.index, 4 * modelData.vertexStride); // 4 = size of float

                    this.endLoadingResourceItem(resourceItem);
                }
            );

            xhr.send();
        }
    }

    class Main {

        logicalScreenWidth = 640.0;
        logicalScreenHeight = 360.0;

        render = new WebGLRender();
        shader = new SampleShaders.PlainShader();

        imageResources: List<ImageResource> = null;
        modelResources: List<ModelResource> = null;
        loadingSettings: List<Game.ResourceItemLoadingSettingSet> = null;

        imageResourceLoader = new ImageResourceLoader();
        modelResourceLoader = new ModelResourceLoader();
        resourceManager = new Game.ResourceManager();

        eyeLocation = vec3.create();
        lookatLocation = vec3.create();
        upVector = vec3.create();

        location = vec3.create();

        modelMatrix = mat4.create();
        viewMatrix = mat4.create();
        pMatrix = mat4.create();
        mvMatrix = mat4.create();

        requestedSeneID = SceneID.None;
        animationTime = 0.0;

        isLoaded = false;

        initialize() {

            // Image resource settings
            var imageResources = new List<ImageResource>(ImageResourceID.MaxID + 1);

            imageResources[ImageResourceID.None] = new ImageResource();
            imageResources[ImageResourceID.Image00] = new ImageResource().path('image01.png').mipmap(true).weight(0.5);
            imageResources[ImageResourceID.Image01] = new ImageResource().path('image02.png').mipmap(true).weight(1.0);
            imageResources[ImageResourceID.Image02] = new ImageResource().path('image03.png').mipmap(true).weight(1.0);

            this.imageResources = imageResources;

            // Model resource settings
            var modelResources = new List<ModelResource>(ModelResourceID.MaxID + 1);

            modelResources[ModelResourceID.None] = new ModelResource();
            modelResources[ModelResourceID.Model00] = new ModelResource().path('model01.json').name('Cube').image(ImageResourceID.Image00).weight(0.5);
            modelResources[ModelResourceID.Model01] = new ModelResource().path('model02.json').name('Cube').image(ImageResourceID.Image01).weight(1.0);
            modelResources[ModelResourceID.Model02] = new ModelResource().path('model03.json').name('Cube').image(ImageResourceID.Image02).weight(1.0);

            this.modelResources = modelResources;

            // Scene resource settings
            var loadingSettings = new List<Game.ResourceItemLoadingSettingSet>(SceneID.MaxID + 1);

            loadingSettings[SceneID.None] = new Game.ResourceItemLoadingSettingSet();

            loadingSettings[SceneID.Common] = new Game.ResourceItemLoadingSettingSet()
                .add(imageResources[ImageResourceID.Image00])
                .add(modelResources[ModelResourceID.Model00]);

            loadingSettings[SceneID.Scene01] = new Game.ResourceItemLoadingSettingSet()
                .add(imageResources[ImageResourceID.Image01])
                .add(modelResources[ModelResourceID.Model01]);

            loadingSettings[SceneID.Scene02] = new Game.ResourceItemLoadingSettingSet()
                .add(imageResources[ImageResourceID.Image02])
                .add(modelResources[ModelResourceID.Model02]);

            this.loadingSettings = loadingSettings;

            // Resource manager setup
            this.imageResourceLoader.render = this.render;
            this.imageResourceLoader.addResourceItems(imageResources);

            this.imageResourceLoader.render = this.render;
            this.modelResourceLoader.addResourceItems(modelResources);

            this.resourceManager.addLoader(this.imageResourceLoader);
            this.resourceManager.addLoader(this.modelResourceLoader);

            // Start loading resources
            this.startSceneLoading(SceneID.Scene01);
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

            for (var i = 0; i < this.modelResources.length; i++) {
                var modelResource = this.modelResources[i];

                if (!modelResource.isUsed && modelResource.loadingState == Game.ResourceLoadingstate.finished) {

                    this.render.releaseModelBuffer(modelResource.model);
                }
            }

            // Start loading
            this.resourceManager.startLoading();

            this.isLoaded = false;
        }

        processLoading() {

            var continueLoading = this.resourceManager.processLoading();

            console.log('Loading progress: ' + (this.resourceManager.getLoadingProgress() * 100.0) + '%');

            if (continueLoading) {
                return;
            }

            // Link models and images
            this.linkResources();

            this.isLoaded = true;
        }

        private linkResources() {

            for (var i = 0; i < this.modelResources.length; i++) {
                var modelResource = this.modelResources[i];

                if (modelResource.loadingState != Game.ResourceLoadingstate.finished) {
                    continue;
                }

                if (modelResource.images == null) {
                    modelResource.images = new List<RenderImage>(modelResource.imageIDs.length);
                }

                for (var k = 0; k < modelResource.imageIDs.length; k++) {
                    var imageID = modelResource.imageIDs[k];

                    modelResource.images[k] = this.imageResources[imageID].image;
                }
            }
        }

        run() {

            if (this.requestedSeneID != SceneID.None) {
                this.startSceneLoading(this.requestedSeneID);
                this.requestedSeneID = SceneID.None;
                return;
            }
        }

        draw() {
        }
    }

    var _Main: Main;

    window.onload = () => {

        _Main = new Main();
        _Main.initialize();

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
