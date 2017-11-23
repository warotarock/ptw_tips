
namespace Game {

    // Render object

    export enum RenderObjectLayerID {

        backGround = 1,
        geometry = 2,
        foreGround = 3,
        nearGround = 4,
        ui = 5,
        invisible = 6,
        maxLayerID = 6,
    }

    export enum RenderObjectBlendType {

        blend = 1,
        add = 2,
    }

    export enum RenderObjectBillboardType {

        off = 1,
        trucking = 2,
        tree = 3,
    }

    export enum RenderObjectSortingMode {

        xyz = 1,
        z = 2,
    }

    export class RenderObject {

        recycleIndex = 0;
        recycle() {
        }

        layerID: RenderObjectLayerID = RenderObjectLayerID.foreGround;
        lastLayerID: RenderObjectLayerID = RenderObjectLayerID.foreGround;

        location: Vec3 = vec3.create();
        rotation: Vec3 = vec3.create();
        scaling: Vec3 = vec3.create();

        billboarding: RenderObjectBillboardType = RenderObjectBillboardType.off;

        matrix: Mat4 = mat4.create();
        sortingValue = 0.0;

        model: RenderModel = null;
        images: List<RenderImage> = null;

        shader = 0;
        culling = true;
        depthTest = true;
        depthMask = true;
        blendType: RenderObjectBlendType = RenderObjectBlendType.blend;

        animationTime = 0.0;

        tag = 0;
    }

    export class RenderObjectLayer {

        objects = new List<RenderObject>();
    }

    // Manager

    export class RenderObjectManager {

        private recyclePool: RecyclePool<RenderObject> = null;

        private objects = new List<RenderObject>();

        private objectLayers = new List<RenderObjectLayer>();

        // Object management

        allocate(maxRenderObjectCount: int): RenderObjectManager {

            this.recyclePool = new RecyclePool<RenderObject>(RenderObject, maxRenderObjectCount);

            let layerCount = <int>RenderObjectLayerID.maxLayerID + 1;

            for (let i = 0; i < layerCount; i++) {
                this.objectLayers.push(new RenderObjectLayer());
            }

            return this;
        }

        clearObjects() {

            for (let layer of this.objectLayers) {

                layer.objects = new List<RenderObject>();
            }

            this.recyclePool.reset();
        }

        createObject(): RenderObject {

            let renderObject = this.recyclePool.get();
            if (renderObject == null) {
                return null;
            }

            renderObject.layerID = RenderObjectLayerID.foreGround;

            vec3.set(renderObject.location, 0.0, 0.0, 0.0);
            vec3.set(renderObject.rotation, 0.0, 0.0, 0.0);
            vec3.set(renderObject.scaling, 1.0, 1.0, 1.0);

            renderObject.billboarding = RenderObjectBillboardType.off;

            mat4.identity(renderObject.matrix);
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
        }

        addObject(renderObject: RenderObject) {

            this.objects.push(renderObject);

            let layer = this.objectLayers[<int>renderObject.layerID];
            layer.objects.push(renderObject);

            renderObject.lastLayerID = renderObject.layerID;
        }

        removeObject(renderObject: RenderObject) {

            for (let i = 0; i < this.objects.length; i++) {

                if (this.objects[i] === renderObject) {

                    ListRemoveAt(this.objects, i);
                    break;
                }
            }

            let layer = this.getObjectLayer(renderObject.lastLayerID);

            for (let i = 0; i < layer.objects.length; i++) {

                if (layer.objects[i] === renderObject) {

                    ListRemoveAt(layer.objects, i);
                    break;
                }
            }

            this.recyclePool.recycle(renderObject);
        }

        getObjectList(): List<RenderObject> {

            return this.objects;
        }

        // Layer management

        getObjectLayer(layerID: RenderObjectLayerID): RenderObjectLayer {

            return this.objectLayers[<int>layerID];
        }

        getLayerObjectList(layerID: RenderObjectLayerID): List<RenderObject> {

            return this.getObjectLayer(layerID).objects;
        }

        // Object sorting

        private matrixTranslation: Vec3 = vec3.create();
        private localLocation: Vec3 = vec3.create();

        calcObjectSortingValue(renderObject: RenderObject, inverseCameraMatrix: Mat4, sortingMode: RenderObjectSortingMode): float {

            vec3.set(this.matrixTranslation, renderObject.matrix[12], renderObject.matrix[13], renderObject.matrix[14]);

            vec3.transformMat4(this.localLocation, this.matrixTranslation, inverseCameraMatrix);

            if (sortingMode == RenderObjectSortingMode.xyz) {

                let x = this.localLocation[0] / 128.0;
                let y = this.localLocation[1] / 128.0;
                let z = this.localLocation[2] / 128.0;

                return Math.sqrt(x * x + y * y + z * z) * 128.0;
            }
            else {

                let z = this.localLocation[2] / 128.0;

                return Math.sqrt(z * z) * 128.0;
            }
        }

        getZsortedObjectList(layerID: RenderObjectLayerID): List<RenderObject> {

            let layer = this.getObjectLayer(layerID);

            layer.objects.sort(this.objectSortingFunction);

            return layer.objects;
        }

        private objectSortingFunction(a: RenderObject, b: RenderObject): float {

            return b.sortingValue - a.sortingValue;
        }

        // Updating methods for each frame execution

        updateObjectLayers() {

            for (let layer of this.objectLayers) {

                for (let i = layer.objects.length - 1; i >= 0; i--) {
                    let obj = layer.objects[i];

                    if (obj.layerID != obj.lastLayerID) {

                        let destLayer = this.getObjectLayer(obj.layerID);
                        destLayer.objects.push(obj);

                        ListRemoveAt(layer.objects, i);

                        obj.lastLayerID = obj.layerID;
                    }
                }
            }
        }
    }
}
