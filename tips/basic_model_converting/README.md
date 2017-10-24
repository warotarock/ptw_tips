# モデルデータの作成 - Basic model converting

## 概要

※作成途中です

基本的なモデルのコンバート処理です。

Collada形式(.dae)のファイルからモデル情報を抽出し、json形式(.json)で出力します。
.daeファイルのパースにはThree.jsのColladaLoaderを利用します。

実行すると画面開始時にコンバートが実行されます。再度コンバートを実行したい場合、デベロッパーツール上でF5を押してください。

ソースコード

- [サンプルプログラム（main.ts）](./main.ts)  
- [モデルのコンバート処理（model_converters.ts）](../tips_core/model_converters.ts)
- 

### Collada形式(.dae)ファイルについて

サンプルプログラムではCollada形式(.dae)のファイルからモデル情報を抽出し、json形式(.json)で出力します。daeファイルのパースにはThree.jsのColladaLoaderを利用します。

また、メッシュに関する追加の情報を取得するために、.blendファイルも参照します。これはテクスチャとＵＶマップを対応付ける情報が部分的にしか.daeファイルに無いためです。


### 入力ファイルの作成

.daeファイルはBlenderから標準のエクスポータでエクスポートしたものです。サンプルの.blendファイル中にエクスポートを実行するスクリプトを用意しましたので、Blenderのテキストエディタでスクリプトを実行すればエクスポートを実行できます。

```
import bpy

basePath = bpy.path.abspath('//')
fileName = 'sample_basic_model.dae'

bpy.ops.wm.collada_export(
    filepath = basePath + '/' + fileName
    
    , apply_modifiers = True
    , export_mesh_type_selection = 'render'
    , selected = False


    , active_uv_only = False
    , include_uv_textures = True
    , include_material_textures = True
    , use_texture_copies = True

    , deform_bones_only = False
    , open_sim = False
	
    , triangulate = True
    , use_object_instantiation = True
    , export_transformation_type_selection = 'matrix'
    , sort_by_name = True
    )
```

またメニューからもFile->Export->Colladaと選択してエクスポートを実行できます。エクスポートの設定は以下の通りです。

```
Export Data Options
    Apply Modifiers: View
      (Export mesh type selection): Render
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
    Use Object Instances: true
      (Transformation): Matrix
    Sort by Object name: true
```


### 入力データ

daeファイル内のモデル情報はBlenderのMeshを元にしてdaeファイルの構造に変換され出力されています。さらに、Three.jsのColladaLoaderはファイルを解析し、Three.jsのジオメトリの形式に変換します。

以下にColladaLoaderの返すオブジェクトの構造を簡易的に示します。このオブジェクトがサンプルプログラムの入力データとなります。

```
[ColladaLoaderの返すオブジェクト]
  dae
    geometries
      mesh
        geometry3js
          vertices      頂点の座標
          faces         面の頂点インデクス
          faceVertexUvs 面の頂点UV
```


### 出力するモデルの構造

出力するモデルの頂点データのフォーマットは次のようになります。複数ＵＶマップが存在する場合は複数のＵＶが出力されます。ＵＶマップの順番はBlenderのマテリアルに設定されているテクスチャの順番になります。

|  |内容              |型     |個数|
|:-|:-----------------|:------|:---|
|1|頂点位置 x, y, z   |float  |3   |
|2|頂点法線 x, y, z   |float  |3   |
|3|テクスチャ座標 u, v|float  |2 * UVマップの数|

以下に出力するファイル全体の構造を簡易的に示します。

```
(JSON root)
  models
    (ModelData)
      vertexStride  １頂点のサイズ(float型の個数)
      vertex        頂点データ(インターリーブ配列)
      index         面の頂点インデクス
```


## サンプルプログラム

### 処理の流れ (概要)

1. ファイルのパース (model_converters.ts)  
ColladaLoaderでdaeファイルを読み込み、用途や出力形式に依存しない構造で抽出する。

2. 必要データの抽出 (main.ts)  
上の結果から必要なデータのみを出力処理に適した構造で再構成する。

3. 出力処理 (main.ts)  
JSONファイルへの出力を行う。

コンバート処理は上記の３段階に分けて実装しています。段階に分けることにより、各段階ごとのコードの保守性と再利用性を高めることが期待できます。また、複雑になりがちなコンバート処理を整理しながら実装しやすくなると筆者は考えています。

### 処理の流れ (詳細)







## 使用外部ライブラリ

- THREE.js, colladaLoader.js
- Linq.js (Enumerable)
  

## 関連情報

- [Blendファイルからのデータ抽出](../blend_file_reader_sample/)