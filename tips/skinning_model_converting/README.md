# PTWTips - Skinning model converting

## 概要
スキンモデルのコンバート処理です。
実行すると画面開始時にコンバートが実行されます。
再度コンバートを実行したい場合、デベロッパーツール上でF5を押してください。

Collada形式(.dae)のファイルからモデル情報を抽出し、json形式(.json)で出力します。
.daeファイルのパースにはThree.jsのColladaLoaderを利用します。
また、メッシュに関する追加の情報を取得するために、.blendファイルも参照します。
これはテクスチャとＵＶマップを対応付ける情報が一部しか.daeファイルに無いためです。

モデルは２つまたは４つのボーンとマテリアルの組み合わせごとにパーツ分けされます。
頂点データには、ボーンごとにウェイト値とボーンのローカル座標での位置が出力されます。

ＵＶ座標も出力されます。
複数ＵＶマップが存在する場合は頂点データのフォーマットのＵＶの部分に追加されます。
ＵＶマップの順番はBlenderのマテリアルに設定されているテクスチャの順番になります。

.daeファイルはBlenderから標準のエクスポータで以下の設定でエクスポートしたものです。

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

## メモ
エクスポートの段階でいくつか注意点があります。

- ウェイトが設定されている頂点グループがあるメッシュだけが出力の対象となります
- メッシュに頂点グループが存在するボーンだけが出力されます

また、データを作成する際に役に立つかもしれない点もメモも記載します。

- モーション（=Action）はBlenderのドープシートエディタでアクションエディタを使うか、NLAエディタでNキーを押すと表示されるメニューで選択できます。
- ファイルのエクスポート時は、Armatureのポーズの状態により、正しくボーンの状態が再現できない場合があるようです。アニメーションの最初のフレームなどにデフォルトのポーズを保存しておくなどして、Armatureが動いていない状態でエクスポートを実行すると改善されるかもしれません。

## 外部ライブラリ
- THREE.js, colladaLoader.js
- Linq.js (Enumerableという記述がそれです)
