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
            var result = [];
            var content_element = document.getElementById('content');
            for (var i = 0; i < 1000; i++) {
                var sampleObject = sampleObjectPool.get();
                if (sampleObject == null) {
                    return;
                }
                var logText = sampleObject.recycleIndex + ' sampleObject countA: ' + sampleObject.countA + ', countB: ' + sampleObject.countB;
                result.push(logText);
                console.log(logText);
                sampleObject.countA++;
                sampleObject.countB++;
                sampleObjectPool.recycle(sampleObject);
            }
            sampleObjectPool.free();
            content_element.innerHTML = result.join('<br/>');
        };
        return Main;
    }());
    var _Main;
    window.onload = function () {
        _Main = new Main();
        _Main.run();
    };
})(ObjectPooling || (ObjectPooling = {}));
