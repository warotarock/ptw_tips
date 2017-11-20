
interface IRecyclableObject {
    recycleIndex: int;
    recycle();
}

class RecyclePool<T extends IRecyclableObject> {

    protected objectType: any;
    protected objectList: List<T> = null;
    protected objectCount: int;

    constructor(objectType: any, poolSize: int) {

        this.objectType = objectType;

        this.allocate(poolSize);

        return this;
    }

    allocate(poolSize: int) {

        this.objectList = new List<T>(poolSize);

        for (let i = 0; i < poolSize; i++) {

            let obj = <T>(new this.objectType());
            obj.recycleIndex = i;
            obj.recycle();

            this.objectList[i] = obj;
        }

        this.reset();
    }

    free() {
        this.objectList = null;
    }

    get(): T {

        if (this.objectCount >= this.objectList.length) {
            return null;
        }

        let obj = this.objectList[this.objectCount];
        this.objectCount++;

        obj.recycle();

        return obj;
    }

    recycle(obj: T) {

        let index1 = obj.recycleIndex;
        let index2 = this.objectCount - 1;
        let obj1 = this.objectList[index1];
        let obj2 = this.objectList[index2];
        obj1.recycleIndex = index2;
        obj2.recycleIndex = index1;
        this.objectList[index1] = obj2;
        this.objectList[index2] = obj1;
        this.objectCount--;
    }

    reset() {

        this.objectCount = 0;
    }

    getCount(): int {
        return this.objectCount;
    }

    getAt(index: int): T {
        return this.objectList[index];
    }
}
