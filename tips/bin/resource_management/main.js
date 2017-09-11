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
    var ModelResource = (function () {
        function ModelResource() {
            this.modelName = null;
            this.model = new RenderModel();
            this.images = null;
        }
        return ModelResource;
    }());
    var SceneResource = (function (_super) {
        __extends(SceneResource, _super);
        function SceneResource() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.filePath = null;
            _this.imageIDs = new List();
            _this.modelResources = new Dictionary();
            return _this;
        }
        SceneResource.prototype.weight = function (loadingWeight) {
            this.loadingWeight = loadingWeight;
            return this;
        };
        SceneResource.prototype.path = function (filePath) {
            this.filePath = filePath;
            return this;
        };
        SceneResource.prototype.image = function (id) {
            this.imageIDs.push(id);
            return this;
        };
        return SceneResource;
    }(Game.ResourceItem));
    var ModelResourceLoader = (function (_super) {
        __extends(ModelResourceLoader, _super);
        function ModelResourceLoader() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.maxParralelLoadingCount = 1;
            return _this;
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
                var models = data['models'];
                for (var modelName in data) {
                    var modelData = models[modelName];
                    var modelResource = new ModelResource();
                    _this.render.initializeModelBuffer(modelResource.model, modelData.vertex, modelData.index, 4 * modelData.vertexStride); // 4 = size of float
                    resourceItem.modelResources[modelName] = modelResource;
                    _this.endLoadingResourceItem(resourceItem);
                }
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
            this.sceneResources = null;
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
            var sceneResources = new List(ModelResourceID.MaxID + 1);
            sceneResources[ModelResourceID.None] = new SceneResource();
            sceneResources[ModelResourceID.Model00] = new SceneResource().path('model01.json').image(ImageResourceID.Image00).weight(0.5);
            sceneResources[ModelResourceID.Model01] = new SceneResource().path('model02.json').image(ImageResourceID.Image01).weight(1.0);
            sceneResources[ModelResourceID.Model02] = new SceneResource().path('model03.json').image(ImageResourceID.Image02).weight(1.0);
            this.sceneResources = sceneResources;
            // Scene resource settings
            var loadingSettings = new List(SceneID.MaxID + 1);
            loadingSettings[SceneID.None] = new Game.ResourceItemLoadingSettingSet();
            loadingSettings[SceneID.Common] = new Game.ResourceItemLoadingSettingSet()
                .add(imageResources[ImageResourceID.Image00])
                .add(sceneResources[ModelResourceID.Model00]);
            loadingSettings[SceneID.Scene01] = new Game.ResourceItemLoadingSettingSet()
                .add(imageResources[ImageResourceID.Image01])
                .add(sceneResources[ModelResourceID.Model01]);
            loadingSettings[SceneID.Scene02] = new Game.ResourceItemLoadingSettingSet()
                .add(imageResources[ImageResourceID.Image02])
                .add(sceneResources[ModelResourceID.Model02]);
            this.loadingSettings = loadingSettings;
            // Resource manager setup
            this.imageResourceLoader.render = this.render;
            this.imageResourceLoader.addResourceItems(imageResources);
            this.imageResourceLoader.render = this.render;
            this.modelResourceLoader.addResourceItems(sceneResources);
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
            for (var i = 0; i < this.sceneResources.length; i++) {
                var sceneResource = this.sceneResources[i];
                if (!sceneResource.isUsed && sceneResource.loadingState == Game.ResourceLoadingstate.finished) {
                    for (var modelName in sceneResource.modelResources) {
                        var modelResource = sceneResource.modelResources[modelName];
                        this.render.releaseModelBuffer(modelResource.model);
                    }
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
            for (var i = 0; i < this.sceneResources.length; i++) {
                var sceneResource = this.sceneResources[i];
                if (sceneResource.loadingState != Game.ResourceLoadingstate.finished) {
                    continue;
                }
                for (var modelName in sceneResource.modelResources) {
                    var modelResource = sceneResource.modelResources[modelName];
                    if (modelResource.images == null) {
                        modelResource.images = new List(sceneResource.imageIDs.length);
                    }
                    for (var k = 0; k < sceneResource.imageIDs.length; k++) {
                        var imageID = sceneResource.imageIDs[k];
                        modelResource.images[k] = this.imageResources[imageID].image;
                    }
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
