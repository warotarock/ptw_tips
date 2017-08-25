var RenderObjectLayerID;
(function (RenderObjectLayerID) {
    RenderObjectLayerID[RenderObjectLayerID["backGround"] = 1] = "backGround";
    RenderObjectLayerID[RenderObjectLayerID["geometry"] = 2] = "geometry";
    RenderObjectLayerID[RenderObjectLayerID["foreGround"] = 3] = "foreGround";
    RenderObjectLayerID[RenderObjectLayerID["nearGround"] = 4] = "nearGround";
    RenderObjectLayerID[RenderObjectLayerID["ui"] = 5] = "ui";
    RenderObjectLayerID[RenderObjectLayerID["invisible"] = 6] = "invisible";
    RenderObjectLayerID[RenderObjectLayerID["maxLayer"] = 6] = "maxLayer";
})(RenderObjectLayerID || (RenderObjectLayerID = {}));
var RenderObjectBlendType;
(function (RenderObjectBlendType) {
    RenderObjectBlendType[RenderObjectBlendType["blend"] = 1] = "blend";
    RenderObjectBlendType[RenderObjectBlendType["add"] = 2] = "add";
})(RenderObjectBlendType || (RenderObjectBlendType = {}));
var RenderObjectBillboardType;
(function (RenderObjectBillboardType) {
    RenderObjectBillboardType[RenderObjectBillboardType["off"] = 1] = "off";
    RenderObjectBillboardType[RenderObjectBillboardType["trucking"] = 2] = "trucking";
    RenderObjectBillboardType[RenderObjectBillboardType["tree"] = 3] = "tree";
})(RenderObjectBillboardType || (RenderObjectBillboardType = {}));
var RenderObjectSortingMode;
(function (RenderObjectSortingMode) {
    RenderObjectSortingMode[RenderObjectSortingMode["xyz"] = 1] = "xyz";
    RenderObjectSortingMode[RenderObjectSortingMode["z"] = 2] = "z";
})(RenderObjectSortingMode || (RenderObjectSortingMode = {}));
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
    }
    RenderObject.prototype.recycle = function () {
    };
    return RenderObject;
}());
var RenderObjectLayer = (function () {
    function RenderObjectLayer() {
        this.objectList = new List();
    }
    return RenderObjectLayer;
}());
var RenderObjectManager = (function () {
    function RenderObjectManager() {
        this.recyclePool = null;
        this.layerList = new List();
        // Object sorting
        this.matrixTranslation = vec3.create();
        this.localLocation = vec3.create();
    }
    // Object management
    RenderObjectManager.prototype.allocate = function (maxRenderObjectCount) {
        this.recyclePool = new RecyclePool(RenderObject, maxRenderObjectCount);
        for (var i = 0; i < RenderObjectLayerID.maxLayer + 1; i++) {
            this.layerList.push(new RenderObjectLayer());
        }
        return this;
    };
    RenderObjectManager.prototype.createObject = function () {
        var obj = this.recyclePool.get();
        if (obj == null) {
            return null;
        }
        obj.layerID = RenderObjectLayerID.foreGround;
        vec3.set(obj.location, 0.0, 0.0, 0.0);
        vec3.set(obj.rotation, 0.0, 0.0, 0.0);
        vec3.set(obj.scaling, 1.0, 1.0, 1.0);
        obj.billboarding = RenderObjectBillboardType.off;
        mat4.identity(obj.locationMatrix);
        mat4.identity(obj.rotationMatrix);
        obj.sortingValue = 0.0;
        obj.model = null;
        obj.images = null;
        obj.shader = 0;
        obj.culling = true;
        obj.depthMask = true;
        obj.depthTest = true;
        obj.blendType = RenderObjectBlendType.blend;
        obj.animationTime = 0.0;
        return obj;
    };
    RenderObjectManager.prototype.addObject = function (obj) {
        var layer = this.layerList[obj.layerID];
        layer.objectList.push(obj);
        obj.lastLayerID = obj.layerID;
    };
    RenderObjectManager.prototype.clearObjects = function () {
        for (var k = 0; k < this.layerList.length; k++) {
            var layer = this.layerList[k];
            layer.objectList = new List();
        }
        this.recyclePool.reset();
    };
    RenderObjectManager.prototype.removeObject = function (obj) {
        var layer = this.getObjectLayer(obj.lastLayerID);
        for (var i = 0; i < layer.objectList.length; i++) {
            if (layer.objectList[i] === obj) {
                layer.objectList.splice(i, 1);
                break;
            }
        }
        this.recyclePool.recycle(obj);
    };
    // Layer management
    RenderObjectManager.prototype.updateObjectLayers = function () {
        for (var k = 0; k < this.layerList.length; k++) {
            var layer = this.layerList[k];
            for (var i = layer.objectList.length - 1; i >= 0; i--) {
                var obj = layer.objectList[i];
                if (obj.layerID != obj.lastLayerID) {
                    var destLayer = this.getObjectLayer(obj.layerID);
                    destLayer.objectList.push(obj);
                    layer.objectList.splice(i, 1);
                    obj.lastLayerID = obj.layerID;
                }
            }
        }
    };
    RenderObjectManager.prototype.getObjectLayer = function (layerID) {
        return this.layerList[layerID];
    };
    RenderObjectManager.prototype.getObjectList = function (layerID) {
        return this.getObjectLayer(layerID).objectList;
    };
    // Basic caluclation support
    RenderObjectManager.prototype.calcMatrix = function (obj) {
        mat4.identity(obj.locationMatrix);
        mat4.translate(obj.locationMatrix, obj.locationMatrix, obj.location);
        mat4.rotateX(obj.locationMatrix, obj.locationMatrix, obj.rotation[0]);
        mat4.rotateY(obj.locationMatrix, obj.locationMatrix, obj.rotation[1]);
        mat4.rotateZ(obj.locationMatrix, obj.locationMatrix, obj.rotation[2]);
        mat4.scale(obj.locationMatrix, obj.locationMatrix, obj.scaling);
    };
    RenderObjectManager.prototype.calcObjectSortingValue = function (obj, inverseCameraMatrix, sortingMode) {
        vec3.set(this.matrixTranslation, obj.locationMatrix[12], obj.locationMatrix[13], obj.locationMatrix[14]);
        vec3.transformMat4(this.localLocation, this.matrixTranslation, inverseCameraMatrix);
        if (sortingMode == RenderObjectSortingMode.xyz) {
            var x = this.localLocation[0] / 128.0;
            var y = this.localLocation[1] / 128.0;
            var z = this.localLocation[2] / 128.0;
            obj.sortingValue = Math.sqrt(x * x + y * y + z * z) * 128.0;
        }
        else {
            var z = this.localLocation[2] / 128.0;
            obj.sortingValue = Math.sqrt(z * z) * 128.0;
        }
    };
    RenderObjectManager.prototype.getZsortedObjectList = function (layerID) {
        var layer = this.getObjectLayer(layerID);
        layer.objectList.sort(this.objectSortingFunction);
        return layer.objectList;
    };
    RenderObjectManager.prototype.objectSortingFunction = function (a, b) {
        return b.sortingValue - a.sortingValue;
    };
    return RenderObjectManager;
}());
