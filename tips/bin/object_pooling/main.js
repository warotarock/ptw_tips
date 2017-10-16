var ObjectPooling;
(function (ObjectPooling) {
    var SampleObject = (function () {
        function SampleObject() {
            this.countA = 0;
            this.countB = 0;
        }
        SampleObject.prototype.recycle = function () {
            this.countA = 0;
        };
        return SampleObject;
    }());
    var Main = (function () {
        function Main() {
        }
        Main.prototype.run = function () {
            var sampleObjectPool = new RecyclePool(SampleObject, 50);
            for (var i = 0; i < 1000; i++) {
                var sampleObject = sampleObjectPool.get();
                if (sampleObject == null) {
                    return;
                }
                console.log(sampleObject.recycleIndex + ' sampleObject countA: ' + sampleObject.countA + ', countB: ' + sampleObject.countB);
                sampleObject.countA++;
                sampleObject.countB++;
                sampleObjectPool.recycle(sampleObject);
            }
            sampleObjectPool.free();
        };
        return Main;
    }());
    var _Main;
    window.onload = function () {
        _Main = new Main();
        _Main.run();
    };
})(ObjectPooling || (ObjectPooling = {}));
