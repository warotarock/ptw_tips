# スキンモデルデータの作成 - Skinning model data converting

## 概要

スキンモデルのコンバート処理です。実行すると画面開始時にコンバートが実行されます。再度コンバートを実行したい場合、デベロッパーツール上でF5を押してください。

ソースコード

- [サンプルプログラム（main.ts）](./main.ts)  
- [モデルのコンバート処理（model_converters.ts）](../tips_core/model_converters.ts)


## コンバート処理

### Collada形式(.dae)ファイルについて

サンプルプログラムではCollada形式(.dae)のファイルからモデル情報を抽出し、json形式(.json)で出力します。daeファイルのパースにはThree.jsのColladaLoaderを利用します。

また、メッシュに関する追加の情報を取得するために、.blendファイルも参照します。これはテクスチャとＵＶマップを対応付ける情報が部分的にしか.daeファイルに無いためです。

### daeファイルの作成

サンプルのdaeファイルはBlenderから標準のエクスポータで以下の設定でエクスポートしたものです。

```
Export Data Options  
    Apply Modifiers: View  
    Selection Only: false  

Texture Options
    Only Selected UV Map: false  
    Include UV Textures: true  
    Incluede Material Textures: true  
    Copy: true  

Armature Options  
    Deform Bone Only: false  
    Export to SL/OpenSim: false  

Collada Options  
    Triangulate: true  
    Use Object Instances Transformation: Matrix  
    Sort by Object name: true  
```

エクスポートの段階でいくつか注意点があります。

- ウェイトが設定されている頂点グループがあるメッシュだけが出力の対象となります
- メッシュに頂点グループが存在するボーンだけが出力されます

また、データを作成する際に役に立つかもしれない点のメモも記載します。

- モーション（=Action）はBlenderのドープシートエディタでアクションエディタを使うか、NLAエディタでNキーを押すと表示されるメニューで選択できます。
- ファイルのエクスポート時は、Armatureのポーズの状態により、正しくボーンの状態が再現できない場合があるようです。アニメーションの最初のフレームなどにデフォルトのポーズを保存しておくなどして、Armatureが動いていない状態でエクスポートを実行すると改善されるかもしれません。



### 入力するモデルの構造

daeファイル内のモデル情報はBlenderのMeshとArmatureを元にして構成され、daeファイルの構造に合わせて出力されています。また、Three.jsのColladaLoaderはファイルを解析し、Three.jsのジオメトリの形式に変換します。この状態がサンプルプログラムでの最初の入力となります。

以下にColladaLoaderの返すオブジェクトの構造を簡易的に示します。

```
[ColladaLoaderの返すオブジェクト]
  dae
    geometries
      mesh
        geometry3js
          vertices      頂点の座標
          faces         面の頂点インデクス
          faceVertexUvs 面の頂点UV
          bones         ボーン情報
          skinIndices   頂点ごとの関連するボーン(ボーンの最大数は４つまででx, y, z, wにボーンのインデクスが保存されています)
          skinWeights   頂点ごとの関連するボーンのウェイト値(同上)
```

### 出力するモデルの構造

モデルは２つまたは４つのボーンとマテリアルの組み合わせごとにパーツ分けします。頂点データには、ボーンごとにウェイト値とボーンのローカル座標での位置を出力します。

ＵＶ座標も出力します。複数ＵＶマップが存在する場合は頂点データのＵＶの部分に追加されます。ＵＶマップの順番はBlenderのマテリアルに設定されているテクスチャの順番になります。

なお、マテリアルの情報は今回のサンプルプログラムでは出力しません。

以下に出力するモデルの構造を簡易的に示します。

```
models
  skinningModel
    images          画像のファイル名のリスト

    bones           ボーン情報のリスト
      [ボーン情報]
        name          ボーンの名前
        parent        親ボーンのインデクス
        matrix        ボーン行列

    parts           パーツ情報のリスト
      [パーツ情報]
        bone          パーツのボーンのインデクス(最大４つまで)
        material      マテリアルのインデクス
        vertexStride  １頂点のサイズ(float型の個数)
        vertex        頂点データ(インターリーブ配列)
        index         面の頂点インデクス
```


## サンプルプログラム

### 処理の流れ

1. ファイルのパース  
ColladaLoaderでdaeファイルを読み込み、できるだけ多くの情報を抽出しまとめる。用途や出力形式に依存しない構造にする。(model_converters.ts)

2. 必要データの抽出  
上の結果から必要なデータのみを抽出し、出力処理に適した構造を作成する。(main.ts)

3. 出力処理  
JSONファイルへの出力を行う。(main.ts)

コンバート処理は上記の３段階に分けて実装しています。段階に分けることにより、各段階ごとのコードの保守性と再利用性を高め、複雑になりがちなコンバート処理を整理しながら実装しやすくなると筆者は考えています。


## 外部ライブラリ

- THREE.js, colladaLoader.js
- Linq.js (Enumerableという記述がそれです)


## 関連情報

- [モデルデータの作成](./basic_model_converting/)
