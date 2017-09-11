
namespace ResourceManagement {

    enum ImageResourceID {
        None = 0,
        Image00 = 1,
        Image01 = 2,
        Image02 = 3,
        MaxID = 3,
    }

    enum SceneResourceID {
        None = 0,
        Scene00 = 1,
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

        render = new WebGLRender();
        shader = new SampleShaders.PlainShader();

        imageResources: List<ImageResource> = null;
        sceneResources: List<SceneResource> = null;
        loadingSettings: List<Game.ResourceItemLoadingSettingSet> = null;

        imageResourceLoader = new ImageResourceLoader();
        sceneResourceLoader = new SceneResourceLoader();
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

        initialize(canvas: HTMLCanvasElement) {

            canvas.width = this.logicalScreenWidth;
            canvas.height = this.logicalScreenHeight;

            if (this.render.initializeWebGL(canvas)) {
                return;
            }

            // Image resource settings
            var imageResources = new List<ImageResource>(ImageResourceID.MaxID + 1);

            imageResources[ImageResourceID.None] = new ImageResource();
            imageResources[ImageResourceID.Image00] = new ImageResource().path('image01.png').mipmap(true).weight(1.0);
            imageResources[ImageResourceID.Image01] = new ImageResource().path('image02.png').mipmap(true).weight(1.0);
            imageResources[ImageResourceID.Image02] = new ImageResource().path('image03.png').mipmap(true).weight(1.2);

            this.imageResources = imageResources;

            // Scene resource settings
            var sceneResources = new List<SceneResource>(SceneResourceID.MaxID + 1);

            sceneResources[SceneResourceID.None] = new SceneResource();
            sceneResources[SceneResourceID.Scene00] = new SceneResource().path('scene01.json').image(ImageResourceID.Image00).weight(1.0);
            sceneResources[SceneResourceID.Scene01] = new SceneResource().path('scene02.json').image(ImageResourceID.Image01).weight(1.0);
            sceneResources[SceneResourceID.Scene02] = new SceneResource().path('scene03.json').image(ImageResourceID.Image02).weight(1.2);

            this.sceneResources = sceneResources;

            // Scene resource settings
            var loadingSettings = new List<Game.ResourceItemLoadingSettingSet>(SceneID.MaxID + 1);

            loadingSettings[SceneID.None] = new Game.ResourceItemLoadingSettingSet();

            loadingSettings[SceneID.Common] = new Game.ResourceItemLoadingSettingSet()
                .add(imageResources[ImageResourceID.Image00])
                .add(sceneResources[SceneResourceID.Scene00]);

            loadingSettings[SceneID.Scene01] = new Game.ResourceItemLoadingSettingSet()
                .add(imageResources[ImageResourceID.Image01])
                .add(sceneResources[SceneResourceID.Scene01]);

            loadingSettings[SceneID.Scene02] = new Game.ResourceItemLoadingSettingSet()
                .add(imageResources[ImageResourceID.Image02])
                .add(sceneResources[SceneResourceID.Scene02]);

            this.loadingSettings = loadingSettings;

            // Resource manager setup
            this.imageResourceLoader.render = this.render;
            this.imageResourceLoader.addResourceItems(imageResources);

            this.sceneResourceLoader.render = this.render;
            this.sceneResourceLoader.addResourceItems(sceneResources);

            this.resourceManager.addLoader(this.imageResourceLoader);
            this.resourceManager.addLoader(this.sceneResourceLoader);

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
        }

        processLoading() {

            var continueLoading = this.resourceManager.processLoading();

            console.log('Loading progress: ' + (this.resourceManager.getLoadingProgress() * 100.0).toFixed(2) + '%');

            if (continueLoading) {
                return;
            }

            // Link models and images
            this.linkResources();

            this.isLoaded = true;
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
