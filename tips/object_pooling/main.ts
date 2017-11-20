
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

            let sampleObjectPool = new RecyclePool<SampleObject>(SampleObject, 50);

            let result = [];
            let content_element = document.getElementById('content');

            for (let i = 0; i < 1000; i++) {

                let sampleObject = sampleObjectPool.get();

                if (sampleObject == null) {
                    return;
                }

                let logText = sampleObject.recycleIndex + ' sampleObject countA: ' + sampleObject.countA + ', countB: ' + sampleObject.countB;
                result.push(logText);
                console.log(logText);

                sampleObject.countA++;
                sampleObject.countB++;

                sampleObjectPool.recycle(sampleObject);
            }

            sampleObjectPool.free();

            content_element.innerHTML = result.join('<br/>');
        }
    }

    let _Main: Main;

    window.onload = () => {

        _Main = new Main();
        _Main.run();
    };
}
