var RenderObjectLayerID;
(function (RenderObjectLayerID) {
    RenderObjectLayerID[RenderObjectLayerID["backGround"] = 1] = "backGround";
    RenderObjectLayerID[RenderObjectLayerID["geometry"] = 2] = "geometry";
    RenderObjectLayerID[RenderObjectLayerID["foreGround"] = 3] = "foreGround";
    RenderObjectLayerID[RenderObjectLayerID["nearGround"] = 4] = "nearGround";
    RenderObjectLayerID[RenderObjectLayerID["ui"] = 5] = "ui";
    RenderObjectLayerID[RenderObjectLayerID["maxLayer"] = 5] = "maxLayer";
    RenderObjectLayerID[RenderObjectLayerID["invisible"] = 99999] = "invisible";
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
        this.LayerID = RenderObjectLayerID.foreGround;
        this.LastLayerID = RenderObjectLayerID.foreGround;
        this.Location = vec3.create();
        this.Rotation = vec3.create();
        this.Scaling = vec3.create();
        this.Billboarding = RenderObjectBillboardType.off;
        this.LocationMatrix = mat4.create();
        this.RotationMatrix = mat4.create();
        this.SoringValue = 0.0;
        this.ModelResource = null;
        this.Shader = 0;
        this.Culling = true;
        this.DepthMask = true;
        this.DepthTest = true;
        this.BlendType = RenderObjectBlendType.blend;
    }
    RenderObject.prototype.recycle = function () {
    };
    return RenderObject;
}());
var RenderObjectLayer = (function () {
    function RenderObjectLayer() {
        this.ObjectList = new List();
    }
    return RenderObjectLayer;
}());
var RenderObjectManager = (function () {
    function RenderObjectManager() {
        this.recyclePool = null;
        this.LayerList = new List();
        // Object sorting
        this.matrixTranslation = vec3.create();
        this.localLocation = vec3.create();
    }
    RenderObjectManager.prototype.initialize = function (maxRenderObjectCount) {
        this.recyclePool = new RecyclePool(RenderObject, maxRenderObjectCount);
        for (var i = 0; i <= RenderObjectLayerID.maxLayer; i++) {
            this.LayerList.push(new RenderObjectLayer());
        }
    };
    // Object management
    RenderObjectManager.prototype.createObject = function () {
        var obj = this.recyclePool.get();
        obj.LayerID = RenderObjectLayerID.foreGround;
        vec3.set(obj.Location, 0.0, 0.0, 0.0);
        vec3.set(obj.Rotation, 0.0, 0.0, 0.0);
        vec3.set(obj.Scaling, 1.0, 1.0, 1.0);
        obj.Billboarding = RenderObjectBillboardType.off;
        mat4.identity(obj.LocationMatrix);
        mat4.identity(obj.RotationMatrix);
        obj.SoringValue = 0.0;
        obj.ModelResource = null;
        obj.Shader = 0;
        obj.Culling = true;
        obj.DepthMask = true;
        obj.DepthTest = true;
        obj.BlendType = RenderObjectBlendType.blend;
        return obj;
    };
    RenderObjectManager.prototype.addObject = function (obj) {
        var layer = this.LayerList[obj.LayerID];
        layer.ObjectList.push(obj);
        obj.LastLayerID = obj.LayerID;
    };
    RenderObjectManager.prototype.clearObjects = function () {
        for (var k = 0; k < this.LayerList.length; k++) {
            var layer = this.LayerList[k];
            layer.ObjectList = new List();
        }
        this.recyclePool.reset();
    };
    RenderObjectManager.prototype.removeObject = function (obj) {
        var layer = this.getObjectLayer(obj.LastLayerID);
        for (var i = 0; i < layer.ObjectList.length; i++) {
            if (layer.ObjectList[i] === obj) {
                layer.ObjectList.splice(i, 1);
                break;
            }
        }
        this.recyclePool.recycle(obj);
    };
    // Layer management
    RenderObjectManager.prototype.updateObjectLayers = function () {
        for (var k = 0; k < this.LayerList.length; k++) {
            var layer = this.LayerList[k];
            for (var i = layer.ObjectList.length - 1; i >= 0; i--) {
                var obj = layer.ObjectList[i];
                if (obj.LayerID != obj.LastLayerID) {
                    var destLayer = this.getObjectLayer(obj.LayerID);
                    destLayer.ObjectList.push(obj);
                    layer.ObjectList.splice(i, 1);
                    obj.LastLayerID = obj.LayerID;
                }
            }
        }
    };
    RenderObjectManager.prototype.getObjectLayer = function (layerID) {
        return this.LayerList[layerID];
        ;
    };
    RenderObjectManager.prototype.getObjectList = function (layerID) {
        return this.getObjectLayer(layerID).ObjectList;
    };
    // Basic caluclation support
    RenderObjectManager.prototype.calcMatrix = function (obj) {
        mat4.identity(obj.LocationMatrix);
        mat4.translate(obj.LocationMatrix, obj.LocationMatrix, obj.Location);
        mat4.rotateX(obj.LocationMatrix, obj.LocationMatrix, obj.Rotation[0]);
        mat4.rotateY(obj.LocationMatrix, obj.LocationMatrix, obj.Rotation[1]);
        mat4.rotateZ(obj.LocationMatrix, obj.LocationMatrix, obj.Rotation[2]);
        mat4.scale(obj.LocationMatrix, obj.LocationMatrix, obj.Scaling);
    };
    RenderObjectManager.prototype.calcObjectSortingValue = function (obj, inverseCameraMatrix, sortingMode) {
        vec3.set(this.matrixTranslation, obj.LocationMatrix[12], obj.LocationMatrix[13], obj.LocationMatrix[14]);
        vec3.transformMat4(this.localLocation, this.matrixTranslation, inverseCameraMatrix);
        if (sortingMode == RenderObjectSortingMode.xyz) {
            var x = this.localLocation[0] / 128.0;
            var y = this.localLocation[1] / 128.0;
            var z = this.localLocation[2] / 128.0;
            obj.SoringValue = Math.sqrt(x * x + y * y + z * z) * 128.0;
        }
        else {
            var z = this.localLocation[2] / 128.0;
            obj.SoringValue = Math.sqrt(z * z) * 128.0;
        }
    };
    RenderObjectManager.prototype.getZsortedObjectList = function (layerID) {
        var layer = this.getObjectLayer(layerID);
        layer.ObjectList.sort(this.objectSortingFunction);
        return layer.ObjectList;
    };
    RenderObjectManager.prototype.objectSortingFunction = function (a, b) {
        return b.SoringValue - a.SoringValue;
    };
    return RenderObjectManager;
}());
