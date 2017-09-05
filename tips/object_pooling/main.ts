
namespace ObjectPooling {

    class SampleObject implements IRecyclableObject {

        recycleIndex: int;
        recycle() {

            this.count = 0;
        }

        count = 0;
    }

    class Main {

        run() {

            var sampleObjectPool = new RecyclePool<SampleObject>(SampleObject, 50);

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
        }
    }

    var _Main: Main;

    window.onload = () => {

        _Main = new Main();
        _Main.run();
    };
}
