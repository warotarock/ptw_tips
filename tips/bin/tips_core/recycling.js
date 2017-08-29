var RecyclePool = (function () {
    function RecyclePool(objectType, poolSize) {
        this.objectType = objectType;
        this.objectList = null;
        this.allocate(poolSize);
        this.reset();
        return this;
    }
    RecyclePool.prototype.allocate = function (poolSize) {
        this.objectList = new List(poolSize);
        for (var i = 0; i < poolSize; i++) {
            this.objectList[i] = this.createObject(i);
        }
        this.reset();
    };
    RecyclePool.prototype.createObject = function (recycleIndex) {
        var obj = (new this.objectType());
        obj.recycleIndex = recycleIndex;
        obj.recycle();
        return obj;
    };
    RecyclePool.prototype.free = function () {
        for (var i = 0; i < this.objectList.length; i++) {
            delete (this.objectList[i]);
        }
        this.objectList = null;
    };
    RecyclePool.prototype.get = function () {
        if (this.objectCount >= this.objectList.length) {
            return null;
        }
        var obj = this.objectList[this.objectCount];
        this.objectCount++;
        obj.recycle();
        return obj;
    };
    RecyclePool.prototype.recycle = function (obj) {
        var index1 = obj.recycleIndex;
        var index2 = this.objectCount - 1;
        var obj1 = this.objectList[index1];
        var obj2 = this.objectList[index2];
        obj1.recycleIndex = index2;
        obj2.recycleIndex = index1;
        this.objectList[index1] = obj2;
        this.objectList[index2] = obj1;
        this.objectCount--;
    };
    RecyclePool.prototype.reset = function () {
        this.objectCount = 0;
    };
    RecyclePool.prototype.getCount = function () {
        return this.objectCount;
    };
    return RecyclePool;
}());
