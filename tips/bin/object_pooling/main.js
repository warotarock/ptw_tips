var ObjectPooling;
(function (ObjectPooling) {
    var SampleObject = (function () {
        function SampleObject() {
            this.count = 0;
        }
        SampleObject.prototype.recycle = function () {
            this.count = 0;
        };
        return SampleObject;
    }());
    var Main = (function () {
        function Main() {
        }
        Main.prototype.run = function () {
            var sampleObjectPool = new RecyclePool(SampleObject, 50);
            for (var i = 0; i < 1000; i++) {
                var sampleObject1 = sampleObjectPool.get();
                if (sampleObject1 == null) {
                    return;
                }
                console.log(i + " sampleObject1.count = " + sampleObject1.count);
                sampleObject1.count++;
                sampleObjectPool.recycle(sampleObject1);
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
