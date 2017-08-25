
enum RenderObjectLayerID {

    backGround = 1,
    geometry = 2,
    foreGround = 3,
    nearGround = 4,
    ui = 5,
    invisible = 6,
    maxLayer = 6,
}

enum RenderObjectBlendType {

    blend = 1,
    add = 2,
}

enum RenderObjectBillboardType {

    off = 1,
    trucking = 2,
    tree = 3,
}

enum RenderObjectSortingMode {

    xyz = 1,
    z = 2,
}

class RenderObject {

    recycleIndex = 0;
    recycle() {
    }

    layerID: RenderObjectLayerID = RenderObjectLayerID.foreGround;
    lastLayerID: RenderObjectLayerID = RenderObjectLayerID.foreGround;

    location: Vec3 = vec3.create();
    rotation: Vec3 = vec3.create();
    scaling: Vec3 = vec3.create();

    billboarding: RenderObjectBillboardType = RenderObjectBillboardType.off;

    locationMatrix: Mat4 = mat4.create();
    rotationMatrix: Mat4 = mat4.create();
    sortingValue = 0.0;

    model: RenderModel = null;
    images: List<RenderImage> = null;

    shader = 0;
    culling = true;
    depthTest = true;
    depthMask = true;
    blendType: RenderObjectBlendType = RenderObjectBlendType.blend;

    animationTime: float;
}

class RenderObjectLayer {

    objectList = new List<RenderObject>();
}

class RenderObjectManager {

    private recyclePool: RecyclePool<RenderObject> = null;

    private layerList = new List<RenderObjectLayer>();

    // Object management

    allocate(maxRenderObjectCount: int): RenderObjectManager {

        this.recyclePool = new RecyclePool<RenderObject>(RenderObject, maxRenderObjectCount);

        for (var i = 0; i < <int>RenderObjectLayerID.maxLayer + 1; i++) {
            this.layerList.push(new RenderObjectLayer());
        }

        return this;
    }

    createObject(): RenderObject {

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
    }

    addObject(obj: RenderObject) {

        var layer: RenderObjectLayer = this.layerList[<int>obj.layerID];
        layer.objectList.push(obj);

        obj.lastLayerID = obj.layerID;
    }

    clearObjects() {

        for (var k = 0; k < this.layerList.length; k++) {
            var layer: RenderObjectLayer = this.layerList[k];

            layer.objectList = new List<RenderObject>();
        }

        this.recyclePool.reset();
    }

    removeObject(obj: RenderObject) {

        var layer: RenderObjectLayer = this.getObjectLayer(obj.lastLayerID);

        for (var i = 0; i < layer.objectList.length; i++) {
            if (layer.objectList[i] === obj) {
                layer.objectList.splice(i, 1);
                break;
            }
        }

        this.recyclePool.recycle(obj);
    }

    // Layer management

    updateObjectLayers() {

        for (var k = 0; k < this.layerList.length; k++) {
            var layer: RenderObjectLayer = this.layerList[k];

            for (var i = layer.objectList.length - 1; i >= 0; i--) {
                var obj = layer.objectList[i];

                if (obj.layerID != obj.lastLayerID) {

                    var destLayer: RenderObjectLayer = this.getObjectLayer(obj.layerID);
                    destLayer.objectList.push(obj);

                    layer.objectList.splice(i, 1);

                    obj.lastLayerID = obj.layerID;
                }
            }
        }
    }

    getObjectLayer(layerID: RenderObjectLayerID): RenderObjectLayer {

        return this.layerList[<int>layerID];
    }

    getObjectList(layerID: RenderObjectLayerID): List<RenderObject> {

        return this.getObjectLayer(layerID).objectList;
    }

    // Basic caluclation support

    calcMatrix(obj: RenderObject) {

        mat4.identity(obj.locationMatrix);
        mat4.translate(obj.locationMatrix, obj.locationMatrix, obj.location);
        mat4.rotateX(obj.locationMatrix, obj.locationMatrix, obj.rotation[0]);
        mat4.rotateY(obj.locationMatrix, obj.locationMatrix, obj.rotation[1]);
        mat4.rotateZ(obj.locationMatrix, obj.locationMatrix, obj.rotation[2]);
        mat4.scale(obj.locationMatrix, obj.locationMatrix, obj.scaling);
    }

    // Object sorting

    private matrixTranslation: Vec3 = vec3.create();
    private localLocation: Vec3 = vec3.create();

    calcObjectSortingValue(obj: RenderObject, inverseCameraMatrix: Mat4, sortingMode: RenderObjectSortingMode) {

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
    }

    getZsortedObjectList(layerID: RenderObjectLayerID): List<RenderObject> {

        var layer = this.getObjectLayer(layerID);

        layer.objectList.sort(this.objectSortingFunction);

        return layer.objectList;
    }

    private objectSortingFunction(a: RenderObject, b: RenderObject): float {

        return b.sortingValue - a.sortingValue;
    }
}
