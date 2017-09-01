var Game;
(function (Game) {
    // Render object
    var RenderObjectLayerID;
    (function (RenderObjectLayerID) {
        RenderObjectLayerID[RenderObjectLayerID["backGround"] = 1] = "backGround";
        RenderObjectLayerID[RenderObjectLayerID["geometry"] = 2] = "geometry";
        RenderObjectLayerID[RenderObjectLayerID["foreGround"] = 3] = "foreGround";
        RenderObjectLayerID[RenderObjectLayerID["nearGround"] = 4] = "nearGround";
        RenderObjectLayerID[RenderObjectLayerID["ui"] = 5] = "ui";
        RenderObjectLayerID[RenderObjectLayerID["invisible"] = 6] = "invisible";
        RenderObjectLayerID[RenderObjectLayerID["maxLayerCount"] = 6] = "maxLayerCount";
    })(RenderObjectLayerID = Game.RenderObjectLayerID || (Game.RenderObjectLayerID = {}));
    var RenderObjectBlendType;
    (function (RenderObjectBlendType) {
        RenderObjectBlendType[RenderObjectBlendType["blend"] = 1] = "blend";
        RenderObjectBlendType[RenderObjectBlendType["add"] = 2] = "add";
    })(RenderObjectBlendType = Game.RenderObjectBlendType || (Game.RenderObjectBlendType = {}));
    var RenderObjectBillboardType;
    (function (RenderObjectBillboardType) {
        RenderObjectBillboardType[RenderObjectBillboardType["off"] = 1] = "off";
        RenderObjectBillboardType[RenderObjectBillboardType["trucking"] = 2] = "trucking";
        RenderObjectBillboardType[RenderObjectBillboardType["tree"] = 3] = "tree";
    })(RenderObjectBillboardType = Game.RenderObjectBillboardType || (Game.RenderObjectBillboardType = {}));
    var RenderObjectSortingMode;
    (function (RenderObjectSortingMode) {
        RenderObjectSortingMode[RenderObjectSortingMode["xyz"] = 1] = "xyz";
        RenderObjectSortingMode[RenderObjectSortingMode["z"] = 2] = "z";
    })(RenderObjectSortingMode = Game.RenderObjectSortingMode || (Game.RenderObjectSortingMode = {}));
    var RenderObject = (function () {
        function RenderObject() {
            this.recycleIndex = 0;
            this.layerID = RenderObjectLayerID.foreGround;
            this.lastLayerID = RenderObjectLayerID.foreGround;
            this.location = vec3.create();
            this.rotation = vec3.create();
            this.scaling = vec3.create();
            this.billboarding = RenderObjectBillboardType.off;
            this.locationMatrix = mat4.create();
            this.rotationMatrix = mat4.create();
            this.sortingValue = 0.0;
            this.model = null;
            this.images = null;
            this.shader = 0;
            this.culling = true;
            this.depthTest = true;
            this.depthMask = true;
            this.blendType = RenderObjectBlendType.blend;
            this.animationTime = 0.0;
            this.tag = 0;
        }
        RenderObject.prototype.recycle = function () {
        };
        return RenderObject;
    }());
    Game.RenderObject = RenderObject;
    var RenderObjectLayer = (function () {
        function RenderObjectLayer() {
            this.objects = new List();
        }
        return RenderObjectLayer;
    }());
    Game.RenderObjectLayer = RenderObjectLayer;
    // Manager
    var RenderObjectManager = (function () {
        function RenderObjectManager() {
            this.recyclePool = null;
            this.objects = new List();
            this.objectLayers = new List();
            // Object sorting
            this.matrixTranslation = vec3.create();
            this.localLocation = vec3.create();
        }
        // Object management
        RenderObjectManager.prototype.allocate = function (maxRenderObjectCount) {
            this.recyclePool = new RecyclePool(RenderObject, maxRenderObjectCount);
            for (var i = 0; i < RenderObjectLayerID.maxLayerCount + 1; i++) {
                this.objectLayers.push(new RenderObjectLayer());
            }
            return this;
        };
        RenderObjectManager.prototype.clearObjects = function () {
            for (var k = 0; k < this.objectLayers.length; k++) {
                var layer = this.objectLayers[k];
                layer.objects = new List();
            }
            this.recyclePool.reset();
        };
        RenderObjectManager.prototype.createObject = function () {
            var renderObject = this.recyclePool.get();
            if (renderObject == null) {
                return null;
            }
            renderObject.layerID = RenderObjectLayerID.foreGround;
            vec3.set(renderObject.location, 0.0, 0.0, 0.0);
            vec3.set(renderObject.rotation, 0.0, 0.0, 0.0);
            vec3.set(renderObject.scaling, 1.0, 1.0, 1.0);
            renderObject.billboarding = RenderObjectBillboardType.off;
            mat4.identity(renderObject.locationMatrix);
            mat4.identity(renderObject.rotationMatrix);
            renderObject.sortingValue = 0.0;
            renderObject.model = null;
            renderObject.images = null;
            renderObject.shader = 0;
            renderObject.culling = true;
            renderObject.depthMask = true;
            renderObject.depthTest = true;
            renderObject.blendType = RenderObjectBlendType.blend;
            renderObject.animationTime = 0.0;
            renderObject.tag = 0;
            return renderObject;
        };
        RenderObjectManager.prototype.addObject = function (renderObject) {
            this.objects.push(renderObject);
            var layer = this.objectLayers[renderObject.layerID];
            layer.objects.push(renderObject);
            renderObject.lastLayerID = renderObject.layerID;
        };
        RenderObjectManager.prototype.removeObject = function (renderObject) {
            for (var i = 0; i < this.objects.length; i++) {
                if (this.objects[i] === renderObject) {
                    this.objects.splice(i, 1);
                    break;
                }
            }
            var layer = this.getObjectLayer(renderObject.lastLayerID);
            for (var i = 0; i < layer.objects.length; i++) {
                if (layer.objects[i] === renderObject) {
                    layer.objects.splice(i, 1);
                    break;
                }
            }
            this.recyclePool.recycle(renderObject);
        };
        RenderObjectManager.prototype.getObjectList = function () {
            return this.objects;
        };
        // Layer management
        RenderObjectManager.prototype.getObjectLayer = function (layerID) {
            return this.objectLayers[layerID];
        };
        RenderObjectManager.prototype.getLayerObjectList = function (layerID) {
            return this.getObjectLayer(layerID).objects;
        };
        // Basic caluclation support
        RenderObjectManager.prototype.calcMatrix = function (renderObject) {
            mat4.identity(renderObject.locationMatrix);
            mat4.translate(renderObject.locationMatrix, renderObject.locationMatrix, renderObject.location);
            mat4.rotateX(renderObject.locationMatrix, renderObject.locationMatrix, renderObject.rotation[0]);
            mat4.rotateY(renderObject.locationMatrix, renderObject.locationMatrix, renderObject.rotation[1]);
            mat4.rotateZ(renderObject.locationMatrix, renderObject.locationMatrix, renderObject.rotation[2]);
            mat4.scale(renderObject.locationMatrix, renderObject.locationMatrix, renderObject.scaling);
        };
        RenderObjectManager.prototype.calcObjectSortingValue = function (renderObject, inverseCameraMatrix, sortingMode) {
            vec3.set(this.matrixTranslation, renderObject.locationMatrix[12], renderObject.locationMatrix[13], renderObject.locationMatrix[14]);
            vec3.transformMat4(this.localLocation, this.matrixTranslation, inverseCameraMatrix);
            if (sortingMode == RenderObjectSortingMode.xyz) {
                var x = this.localLocation[0] / 128.0;
                var y = this.localLocation[1] / 128.0;
                var z = this.localLocation[2] / 128.0;
                renderObject.sortingValue = Math.sqrt(x * x + y * y + z * z) * 128.0;
            }
            else {
                var z = this.localLocation[2] / 128.0;
                renderObject.sortingValue = Math.sqrt(z * z) * 128.0;
            }
        };
        RenderObjectManager.prototype.getZsortedObjectList = function (layerID) {
            var layer = this.getObjectLayer(layerID);
            layer.objects.sort(this.objectSortingFunction);
            return layer.objects;
        };
        RenderObjectManager.prototype.objectSortingFunction = function (a, b) {
            return b.sortingValue - a.sortingValue;
        };
        // Updating methods for each frame execution
        RenderObjectManager.prototype.updateObjectLayers = function () {
            for (var k = 0; k < this.objectLayers.length; k++) {
                var layer = this.objectLayers[k];
                for (var i = layer.objects.length - 1; i >= 0; i--) {
                    var obj = layer.objects[i];
                    if (obj.layerID != obj.lastLayerID) {
                        var destLayer = this.getObjectLayer(obj.layerID);
                        destLayer.objects.push(obj);
                        layer.objects.splice(i, 1);
                        obj.lastLayerID = obj.layerID;
                    }
                }
            }
        };
        return RenderObjectManager;
    }());
    Game.RenderObjectManager = RenderObjectManager;
})(Game || (Game = {}));
