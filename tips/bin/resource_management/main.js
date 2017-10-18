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
        ImageResourceID[ImageResourceID["Image03"] = 4] = "Image03";
        ImageResourceID[ImageResourceID["MaxID"] = 4] = "MaxID";
    })(ImageResourceID || (ImageResourceID = {}));
    var SceneResourceID;
    (function (SceneResourceID) {
        SceneResourceID[SceneResourceID["None"] = 0] = "None";
        SceneResourceID[SceneResourceID["Common"] = 1] = "Common";
        SceneResourceID[SceneResourceID["Scene01"] = 2] = "Scene01";
        SceneResourceID[SceneResourceID["Scene02"] = 3] = "Scene02";
        SceneResourceID[SceneResourceID["MaxID"] = 3] = "MaxID";
    })(SceneResourceID || (SceneResourceID = {}));
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
            _this.maxParallelLoadingCount = 5;
            _this.render = null;
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
        ImageResourceLoader.prototype.unloadResource = function (resourceItem) {
            this.render.releaseImageTexture(resourceItem.image);
        };
        return ImageResourceLoader;
    }(Game.ResourceLoader));
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
    var SceneResourceLoader = (function (_super) {
        __extends(SceneResourceLoader, _super);
        function SceneResourceLoader() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.maxParallelLoadingCount = 1;
            _this.render = null;
            return _this;
        }
        SceneResourceLoader.prototype.startLoadingResourceItem = function (resourceItem) {
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
                for (var modelName in models) {
                    var modelData = models[modelName];
                    var modelResource = new ModelResource();
                    _this.render.initializeModelBuffer(modelResource.model, modelData.vertex, modelData.index, 4 * modelData.vertexStride); // 4 = size of float
                    resourceItem.modelResources[modelName] = modelResource;
                    _this.endLoadingResourceItem(resourceItem);
                }
            });
            xhr.send();
        };
        SceneResourceLoader.prototype.unloadResource = function (resourceItem) {
            for (var modelName in resourceItem.modelResources) {
                var modelResource = resourceItem.modelResources[modelName];
                this.render.releaseModelBuffer(modelResource.model);
            }
        };
        return SceneResourceLoader;
    }(Game.ResourceLoader));
    var Main = (function () {
        function Main() {
            this.logicalScreenWidth = 640.0;
            this.logicalScreenHeight = 360.0;
            this.drawer_canvas = HTMLCanvasElement = null;
            this.context2D = null;
            this.render = new WebGLRender();
            this.shader = new SampleShaders.PlainShader();
            this.imageResources = null;
            this.sceneResources = null;
            this.loadingSettings = null;
            this.imageResourceLoader = new ImageResourceLoader();
            this.sceneResourceLoader = new SceneResourceLoader();
            this.resourceManager = new Game.ResourceManager();
            this.common_ModelResource = null;
            this.scene_ModelResource = null;
            this.eyeLocation = vec3.create();
            this.lookatLocation = vec3.create();
            this.upVector = vec3.create();
            this.modelMatrix = mat4.create();
            this.viewMatrix = mat4.create();
            this.modelViewMatrix = mat4.create();
            this.projectionMatrix = mat4.create();
            this.currentSceneID = SceneID.Scene01;
            this.requestedSeneID = SceneID.None;
            this.commonModel_Location = vec3.create();
            this.sceneModel_Location = vec3.create();
            this.animationTime = 0.0;
            this.isLoaded = false;
            this.loadingAnimationTime = 0.0;
        }
        Main.prototype.initialize = function (webgl_canvas, drawer_canvas) {
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
            var imageResources = new List(ImageResourceID.MaxID + 1);
            imageResources[ImageResourceID.None] = new ImageResource();
            imageResources[ImageResourceID.Image00] = new ImageResource().path('image00.png').mipmap(true).weight(1.0);
            imageResources[ImageResourceID.Image01] = new ImageResource().path('image01.png').mipmap(true).weight(1.0);
            imageResources[ImageResourceID.Image02] = new ImageResource().path('image02.png').mipmap(true).weight(1.2);
            imageResources[ImageResourceID.Image03] = new ImageResource().path('image03.png').mipmap(true).weight(1.2);
            this.imageResources = imageResources;
            // Scene resource settings
            var sceneResources = new List(SceneResourceID.MaxID + 1);
            sceneResources[SceneResourceID.None] = new SceneResource();
            sceneResources[SceneResourceID.Common] = new SceneResource().path('scene00.json').image(ImageResourceID.Image00).weight(1.0);
            sceneResources[SceneResourceID.Scene01] = new SceneResource().path('scene01.json').image(ImageResourceID.Image01).weight(1.0);
            sceneResources[SceneResourceID.Scene02] = new SceneResource().path('scene02.json').image(ImageResourceID.Image02).weight(1.0);
            this.sceneResources = sceneResources;
            // Loading settings
            var loadingSettings = new List(SceneID.MaxID + 1);
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
                .add(imageResources[ImageResourceID.Image03]); // *This line (Image03) is a sample code: SettingSet can include images which is not used by models
            this.loadingSettings = loadingSettings;
            // Resource manager setup
            this.imageResourceLoader.render = this.render;
            this.imageResourceLoader.addResourceItems(imageResources);
            this.sceneResourceLoader.render = this.render;
            this.sceneResourceLoader.addResourceItems(sceneResources);
            this.resourceManager.addLoader(this.imageResourceLoader);
            this.resourceManager.addLoader(this.sceneResourceLoader);
            // Start loading resources
            this.startSceneLoading(this.currentSceneID);
        };
        Main.prototype.startSceneLoading = function (sceneID) {
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
            this.drawer_canvas.style.display = 'block';
            this.showLoadingProgress();
        };
        Main.prototype.requestSwitchingScene = function (nextSceneID) {
            if (!this.isLoaded) {
                return;
            }
            this.requestedSeneID = nextSceneID;
        };
        Main.prototype.processLoading = function () {
            // Process loading
            var continueLoading = this.resourceManager.processLoading();
            // Draw Progress
            this.animateLoadingProgress();
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
        };
        Main.prototype.animateLoadingProgress = function () {
            var loadingProgress = this.resourceManager.getLoadingProgress();
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
        };
        Main.prototype.showLoadingProgress = function () {
            // Draw
            var centerX = this.logicalScreenWidth * 0.5;
            var centerY = this.logicalScreenHeight * 0.5;
            var size = Math.min(this.logicalScreenWidth, this.logicalScreenHeight);
            this.context2D.clearRect(0, 0, this.logicalScreenWidth, this.logicalScreenHeight);
            this.context2D.fillStyle = 'rgba(255, 255, 255, 0.5)';
            this.context2D.fillRect(0, 0, this.logicalScreenWidth, this.logicalScreenHeight);
            this.context2D.fillStyle = 'rgba(0, 0, 0, 1.0)';
            this.context2D.beginPath();
            this.context2D.arc(centerX, centerY, size * 0.3, Math.PI * 1.5, Math.PI * 1.5 + this.loadingAnimationTime * Math.PI * 2.0, false);
            this.context2D.stroke();
            var percentage = this.loadingAnimationTime * 100.0;
            if (percentage >= 99.0) {
                // Shows 100% virtualy...
                percentage = 100.0;
            }
            this.context2D.font = "bold 16px";
            this.context2D.textAlign = 'center';
            this.context2D.fillText(percentage.toFixed(2) + '%', centerX, centerY);
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
        Main.prototype.initializeScene = function () {
            this.common_ModelResource = this.sceneResources[SceneResourceID.Common].modelResources['Cube'];
            vec3.set(this.commonModel_Location, 2.0, 0.0, 0.0);
            if (this.currentSceneID == SceneID.Scene01) {
                this.scene_ModelResource = this.sceneResources[SceneResourceID.Scene01].modelResources['Cube'];
            }
            else {
                this.scene_ModelResource = this.sceneResources[SceneResourceID.Scene02].modelResources['Cube'];
            }
            vec3.set(this.sceneModel_Location, -2.0, 0.0, 0.0);
        };
        Main.prototype.run = function () {
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
        };
        Main.prototype.draw = function () {
            if (!this.isLoaded) {
                return;
            }
            var aspect = this.logicalScreenWidth / this.logicalScreenHeight;
            mat4.perspective(this.projectionMatrix, 45.0 * Math.PI / 180, aspect, 0.1, 100.0);
            mat4.lookAt(this.viewMatrix, this.eyeLocation, this.lookatLocation, this.upVector);
            this.render.setDepthTest(true);
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
        };
        Main.prototype.drawModel = function (modelMatrix, modelResource) {
            mat4.multiply(this.modelViewMatrix, this.viewMatrix, modelMatrix);
            this.render.setShader(this.shader);
            this.render.setProjectionMatrix(this.projectionMatrix);
            this.render.setModelViewMatrix(this.modelViewMatrix);
            this.render.setBuffers(modelResource.model, modelResource.images);
            this.render.setDepthTest(true);
            this.render.setCulling(false);
            this.render.drawElements(modelResource.model);
        };
        return Main;
    }());
    var _Main;
    window.onload = function () {
        var webgl_canvas = document.getElementById('webgl_canvas');
        var drawer_canvas = document.getElementById('drawer_canvas');
        _Main = new Main();
        _Main.initialize(webgl_canvas, drawer_canvas);
        document.getElementById('scene01').onclick = function () {
            _Main.requestSwitchingScene(SceneID.Scene01);
        };
        document.getElementById('scene02').onclick = function () {
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
})(ResourceManagement || (ResourceManagement = {}));
