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
var ResourceManagement;
(function (ResourceManagement) {
    var ImageResourceID;
    (function (ImageResourceID) {
        ImageResourceID[ImageResourceID["None"] = 0] = "None";
        ImageResourceID[ImageResourceID["Image00"] = 1] = "Image00";
        ImageResourceID[ImageResourceID["Image01"] = 2] = "Image01";
        ImageResourceID[ImageResourceID["Image02"] = 3] = "Image02";
        ImageResourceID[ImageResourceID["MaxID"] = 3] = "MaxID";
    })(ImageResourceID || (ImageResourceID = {}));
    var ModelResourceID;
    (function (ModelResourceID) {
        ModelResourceID[ModelResourceID["None"] = 0] = "None";
        ModelResourceID[ModelResourceID["Model00"] = 1] = "Model00";
        ModelResourceID[ModelResourceID["Model01"] = 2] = "Model01";
        ModelResourceID[ModelResourceID["Model02"] = 3] = "Model02";
        ModelResourceID[ModelResourceID["MaxID"] = 3] = "MaxID";
    })(ModelResourceID || (ModelResourceID = {}));
    var SceneID;
    (function (SceneID) {
        SceneID[SceneID["None"] = 0] = "None";
        SceneID[SceneID["Common"] = 1] = "Common";
        SceneID[SceneID["Scene01"] = 2] = "Scene01";
        SceneID[SceneID["Scene02"] = 3] = "Scene02";
        SceneID[SceneID["MaxID"] = 3] = "MaxID";
    })(SceneID || (SceneID = {}));
    var ImageResource = (function (_super) {
        __extends(ImageResource, _super);
        function ImageResource() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.filePath = null;
            _this.mipmapEnabled = false;
            _this.image = new RenderImage();
            return _this;
        }
        ImageResource.prototype.weight = function (loadingWeight) {
            this.loadingWeight = loadingWeight;
            return this;
        };
        ImageResource.prototype.path = function (filePath) {
            this.filePath = filePath;
            return this;
        };
        ImageResource.prototype.mipmap = function (enable) {
            this.mipmapEnabled = enable;
            return this;
        };
        return ImageResource;
    }(Game.ResourceItem));
    ResourceManagement.ImageResource = ImageResource;
    var ImageResourceLoader = (function (_super) {
        __extends(ImageResourceLoader, _super);
        function ImageResourceLoader() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.maxParralelLoadingCount = 5;
            return _this;
        }
        ImageResourceLoader.prototype.startLoadingResourceItem = function (resourceItem) {
            var _this = this;
            resourceItem.image.imageData = new Image();
            resourceItem.image.imageData.addEventListener('load', function () {
                _this.render.initializeImageTexture(resourceItem.image);
                _this.endLoadingResourceItem(resourceItem);
            });
            resourceItem.image.imageData.src = resourceItem.filePath;
        };
        return ImageResourceLoader;
    }(Game.ResourceLoaderBase));
    var ModelResource = (function (_super) {
        __extends(ModelResource, _super);
        function ModelResource() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.maxParralelLoadingCount = 1;
            _this.filePath = null;
            _this.modelName = null;
            _this.imageIDs = new List();
            _this.model = new RenderModel();
            _this.images = null;
            return _this;
        }
        ModelResource.prototype.weight = function (loadingWeight) {
            this.loadingWeight = loadingWeight;
            return this;
        };
        ModelResource.prototype.path = function (filePath) {
            this.filePath = filePath;
            return this;
        };
        ModelResource.prototype.name = function (modelName) {
            this.modelName = modelName;
            return this;
        };
        ModelResource.prototype.image = function (id) {
            this.imageIDs.push(id);
            return this;
        };
        return ModelResource;
    }(Game.ResourceItem));
    ResourceManagement.ModelResource = ModelResource;
    var ModelResourceLoader = (function (_super) {
        __extends(ModelResourceLoader, _super);
        function ModelResourceLoader() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ModelResourceLoader.prototype.startLoadingResourceItem = function (resourceItem) {
            var _this = this;
            var xhr = new XMLHttpRequest();
            xhr.open('GET', resourceItem.filePath);
            xhr.responseType = 'json';
            xhr.addEventListener('load', function (e) {
                var data;
                if (xhr.responseType == 'json') {
                    data = xhr.response;
                }
                else {
                    data = JSON.parse(xhr.response);
                }
                var modelData = data[resourceItem.modelName];
                _this.render.initializeModelBuffer(resourceItem.model, modelData.vertex, modelData.index, 4 * modelData.vertexStride); // 4 = size of float
                _this.endLoadingResourceItem(resourceItem);
            });
            xhr.send();
        };
        return ModelResourceLoader;
    }(Game.ResourceLoaderBase));
    var Main = (function () {
        function Main() {
            this.logicalScreenWidth = 640.0;
            this.logicalScreenHeight = 360.0;
            this.render = new WebGLRender();
            this.shader = new SampleShaders.PlainShader();
            this.imageResources = null;
            this.modelResources = null;
            this.loadingSettings = null;
            this.imageResourceLoader = new ImageResourceLoader();
            this.modelResourceLoader = new ModelResourceLoader();
            this.resourceManager = new Game.ResourceManager();
            this.eyeLocation = vec3.create();
            this.lookatLocation = vec3.create();
            this.upVector = vec3.create();
            this.location = vec3.create();
            this.modelMatrix = mat4.create();
            this.viewMatrix = mat4.create();
            this.pMatrix = mat4.create();
            this.mvMatrix = mat4.create();
            this.requestedSeneID = SceneID.None;
            this.animationTime = 0.0;
            this.isLoaded = false;
        }
        Main.prototype.initialize = function () {
            // Image resource settings
            var imageResources = new List(ImageResourceID.MaxID + 1);
            imageResources[ImageResourceID.None] = new ImageResource();
            imageResources[ImageResourceID.Image00] = new ImageResource().path('image01.png').mipmap(true).weight(0.5);
            imageResources[ImageResourceID.Image01] = new ImageResource().path('image02.png').mipmap(true).weight(1.0);
            imageResources[ImageResourceID.Image02] = new ImageResource().path('image03.png').mipmap(true).weight(1.0);
            this.imageResources = imageResources;
            // Model resource settings
            var modelResources = new List(ModelResourceID.MaxID + 1);
            modelResources[ModelResourceID.None] = new ModelResource();
            modelResources[ModelResourceID.Model00] = new ModelResource().path('model01.json').name('Cube').image(ImageResourceID.Image00).weight(0.5);
            modelResources[ModelResourceID.Model01] = new ModelResource().path('model02.json').name('Cube').image(ImageResourceID.Image01).weight(1.0);
            modelResources[ModelResourceID.Model02] = new ModelResource().path('model03.json').name('Cube').image(ImageResourceID.Image02).weight(1.0);
            this.modelResources = modelResources;
            // Scene resource settings
            var loadingSettings = new List(SceneID.MaxID + 1);
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
        };
        Main.prototype.startSceneLoading = function (sceneID) {
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
        };
        Main.prototype.processLoading = function () {
            var continueLoading = this.resourceManager.processLoading();
            console.log('Loading progress: ' + (this.resourceManager.getLoadingProgress() * 100.0) + '%');
            if (continueLoading) {
                return;
            }
            // Link models and images
            this.linkResources();
            this.isLoaded = true;
        };
        Main.prototype.linkResources = function () {
            for (var i = 0; i < this.modelResources.length; i++) {
                var modelResource = this.modelResources[i];
                if (modelResource.loadingState != Game.ResourceLoadingstate.finished) {
                    continue;
                }
                if (modelResource.images == null) {
                    modelResource.images = new List(modelResource.imageIDs.length);
                }
                for (var k = 0; k < modelResource.imageIDs.length; k++) {
                    var imageID = modelResource.imageIDs[k];
                    modelResource.images[k] = this.imageResources[imageID].image;
                }
            }
        };
        Main.prototype.run = function () {
            if (this.requestedSeneID != SceneID.None) {
                this.startSceneLoading(this.requestedSeneID);
                this.requestedSeneID = SceneID.None;
                return;
            }
        };
        Main.prototype.draw = function () {
        };
        return Main;
    }());
    var _Main;
    window.onload = function () {
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
})(ResourceManagement || (ResourceManagement = {}));
