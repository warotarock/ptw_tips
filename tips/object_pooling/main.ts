
namespace ObjectPooling {

    class SampleObject implements IRecyclableObject {

        recycleIndex: int;
        recycle() {

            this.countA = 0;
        }

        countA = 0;
        countB = 0;
    }

    class Main {

        run() {

            var sampleObjectPool = new RecyclePool<SampleObject>(SampleObject, 50);

            for (var i = 0; i < 1000; i++) {

                var sampleObject = sampleObjectPool.get();

                if (sampleObject == null) {
                    return;
                }

                console.log(sampleObject.recycleIndex + ' sampleObject1.countA: ' + sampleObject.countA + ', countB: ' + sampleObject.countB);

                sampleObject.countA++;
                sampleObject.countB++;

                sampleObjectPool.recycle(sampleObject);
            }

            sampleObjectPool.free();
        }
    }

    var _Main: Main;

    window.onload = () => {

        _Main = new Main();
        _Main.run();
    };
}
