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

daeファイル内のモデル情報はBlenderのMeshを元にしてdaeファイルの構造に変換され出力されています。さらに、Three.jsのColladaLoaderはファイルを解析し、Three.jsのジオメトリの形式に変換します。このオブジェクトがサンプルプログラムの入力データとなります。

以下にColladaLoaderの返すオブジェクトのおおまかな構造を示します。ここで\{ \}はオブジェクト、[]は配列を表しています。

```
(ColladaLoaderの返すオブジェクト)
  dae
    geometries{}
      mesh{}
        geometry3js{}
          vertices[]      頂点の座標
          faces[]         面の頂点インデクス
          faceVertexUvs[] 面の頂点UV
```


### 出力するモデルの構造

出力するモデルの頂点データのフォーマットは次のようになります。複数ＵＶマップが存在する場合は複数のＵＶが出力されます。ＵＶマップの順番はBlenderのマテリアルに設定されているテクスチャの順番になります。

|  |内容              |型     |個数|
|:-|:-----------------|:------|:---|
|1|頂点位置 x, y, z   |float  |3   |
|2|頂点法線 x, y, z   |float  |3   |
|3|テクスチャ座標 u, v|float  |2 * UVマップの数|

### 出力ファイルの構造

以下に出力するJSONファイルの構造を示します。ここで\{ \}はオブジェクト、[]は配列を表しています。

```
(JSON root{})
  models{}
    (ModelData{})
      vertexStride  １頂点のサイズ(float型の個数)
      vertex[]      頂点データ(インターリーブ配列)
      index[        面の頂点インデクス
```


## サンプルプログラム

### プログラム構成

![プログラムの構成](basic_model_converting_fig001.png)

サンプルプログラムは画面のロード時に実行されます。メイン処理はMainクラスのexecute関数です。メイン処理ではまずThree.jsのColladaLoaderのload関数でファイルを読み込み、コンバート処理の各ステップを実行します。


### コンバート処理の段階について

1. ファイルのパース  
ColladaLoaderで読み込んだdaeファイルから、さらに用途や出力形式に依存しない構造で抽出する。

2. 必要データの抽出と再構成  
上の結果から必要なデータのみを出力処理に適した構造で再構成する。

3. 出力 
JSONファイルへの出力を行う。

コンバート処理は上記の３段階に分けて実装しています。段階に分けることにより、各段階ごとのコードの保守性と再利用性を高めることが期待できます。また、複雑になりがちなコンバート処理を整理しながら実装しやすくなると筆者は考えています。

### コンバート処理の流れ１ ファイルのパース

ここではファイルのパースの段階で行う処理の流れを説明します。なお、固定モデルのパースより細かい処理についてはソースコードを参照してください。

Main.execute関数

1. ColladaLoaderによるdaeファイルのロード
2. ロード終了イベント
    1. *パースを実行(ThreeJSColladaParser.parse関数)*
    2. 必要データの抽出と再構成の実行(Main.convert関数)
    3. 出力の実行(Main.output関数)

*ThreeJSColladaParser.parse関数*

1. 結果オブジェクト(SceneData)の作成

2. すべての固定モデルのパース (parseStaticGeometries関数)
    1. ループ：(ロード結果のオブジェクト).dae.geometries
    2. 　スキンモデルであればスキップ (isSkinGeometry関数で判定)
    3. 　固定モデルのパース (parseStaticGeometry関数)
    4. 　結果オブジェクトに固定モデルを追加
    5. ループ終了

3. すべてのスキンモデルのパース ([スキンモデルデータの作成](../skinning_model_converting/)を参照してください)

4. 結果オブジェクトを返却

### コンバート処理の流れ２ 必要データの抽出と再構成

Main.convert関数

1. 結果の配列の作成
2. ループ開始：(パース結果).staticMeshes
3. 　固定モデルの取得 => mesh
4. 　頂点データの配列（インターリーブ配列）の作成
5. 　ループ：メッシュ頂点 (mesh.vertices)
6. 　　頂点データの配列に頂点の座標値を追加(x, y, z)
7. 　　頂点データの配列に頂点の法線値を追加(x, y, z)
8. 　　頂点データの配列に頂点のテクスチャ座標値をすべて追加(u, v)
9. 　ループ終了
10. 　頂点インデクスの配列の作成
11. 　ループ：メッシュ面 (mesh.faces)
12. 　　頂点インデクスの配列に面の頂点インデクスをすべて追加
13. 　ループ終了
14. 　メッシュデータの作成
15. 　メッシュデータを結果の配列に追加
16. ループ終了
17. 結果の配列を返却

### コンバート処理の流れ３ 出力

Main.output関数

1. 結果の文字列の配列の作成（以下、出力はこの配列への追加を意味します）
2. JSONの開始 \{ の出力
3. modelsの開始 "models": \{ の出力
4. ループ：再構成結果の配列(List\<ConvertedModel\>)
5. 　モデルの開始 "モデル名" \{ の出力
6. 　１頂点のサイズの出力
7. 　頂点データ（インターリーブ配列）の出力
8. 　面の頂点インデクスデータの出力
9. 　モデルの閉じ \} の出力
10. ループ終了
11. modelsの終了 \} の出力
12. JSONの終了 \} の出力
13. 結果の文字列の配列を改行で結合し、ファイルに出力


## 使用外部ライブラリ

- THREE.js, colladaLoader.js
- Linq.js (Enumerable)
  

## 関連情報

- [Blendファイルからのデータ抽出](../blend_file_reader_sample/)