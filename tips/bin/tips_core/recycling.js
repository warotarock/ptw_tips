var RecyclePool = (function () {
    function RecyclePool(objectType, poolSize) {
        this.objectList = null;
        this.objectType = objectType;
        this.allocate(poolSize);
        return this;
    }
    RecyclePool.prototype.allocate = function (poolSize) {
        this.objectList = new List(poolSize);
        for (var i = 0; i < poolSize; i++) {
            var obj = (new this.objectType());
            obj.recycleIndex = i;
            obj.recycle();
            this.objectList[i] = obj;
        }
        this.reset();
    };
    RecyclePool.prototype.free = function () {
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
    RecyclePool.prototype.getAt = function (index) {
        return this.objectList[index];
    };
    return RecyclePool;
}());
