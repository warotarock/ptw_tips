# オブジェクト・プーリング - Object pooling

## 概要
メモリ管理手法であるオブジェクト・プーリングのTypeScriptでの実装について説明します。

[サンプルコード main.ts](./main.ts)

## オブジェクト・プーリング
オブジェクト・プーリングは、メモリの断片化やガーベージコレクションの発生によるパフォーマンスの低下を解決したり軽減するための手法です。ゲーム「トリノワールド」では描画オブジェクトや弾、エフェクト等のために使用しています。

基本的な考え方は、オブジェクトを再利用することでオブジェクトの生成や解放を減らすことです。アルゴリズムとしては次のようになります。

- 先に必要数のオブジェクトをまとめて生成し、プール（リストや配列）に入れておく
- 新しいオブジェクトはプールから取得する
- 不要になったオブジェクトはプールに返却する
- プールを破棄するときプールのオブジェクトをまとめて破棄する

## TypeScriptによる実装
TypeScriptのジェネリクスの機能を利用した基本クラス RecyclePool&lt;T&gt; を [recycling.ts](../tips_core/recycling.ts) に作成しました。このクラスを使うと、クラスと個数を指定してプールを作成できます。

```recycling.ts
var sampleObjectPool = new RecyclePool<SampleObject>(SampleObject, 50);
```

RecyclePool&lt;T&gt; の T には IRecyclableObject インターフェースを実装したクラスを指定できます。
そのため recycleIndex と recycle関数 を持つクラスであれば、どんなクラスでも指定できます。

```ts:recycling.ts
interface IRecyclableObject {
    recycleIndex: int;
    recycle();
}
```


recycleIndex は RecyclePool が再利用処理を素早く行うための変数です。この変数を再利用処理以外の何かの目的に使用することはできません。

recycle関数はオブジェクトを初期化するために RecyclePool から実行される関数です。

## サンプルコード
サンプルコードでは次のクラスをオブジェクト・プーリングの対象としています。

```ts:main.ts
class SampleObject implements IRecyclableObject {

    recycleIndex: int;
    recycle() {

        this.count = 0;
    }

    count = 0;
}
```

recycle関数はオブジェクトを初期化するために実行されます。サンプルコードではrecycle関数でcountメンバ変数を0に初期化しています。countメンバ変数はMainクラスで値が変更されますが、オブジェクトが再利用されるたびにrecycle関数内で0に初期化されるため、コンソールには常に0が出力されます。

```ts:main.ts
class Main {

    run() {

        var sampleObjectPool = new RecyclePool<SampleObject>(SampleObject, 50);

        for (var i = 0; i < 1000; i++) {

            var sampleObject1 = sampleObjectPool.get();

            if (sampleObject1 == null) {
                return;
            }

            console.log("sampleObject1.count = " + sampleObject1.count);

            sampleObject1.count++;

            sampleObjectPool.recycle(sampleObject1);
        }

        sampleObjectPool.free();
    }
}
```
