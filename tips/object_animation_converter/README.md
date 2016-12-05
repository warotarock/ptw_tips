# PTWTips - Skinning Model Converter Sample

スキンモデルのコンバート処理です。
実行すると画面開始時にコンバートが実行されます。
再度コンバートを実行したい場合、デベロッパーツール上でF5を押してください。

Collada形式(.dae)のファイルからモデル情報を抽出し、json形式(.json)で出力します。
.daeファイルのパースにはThree.jsのColladaLoaderを利用します。
また、メッシュに関する追加の情報を取得するために、.blendファイルも参照します。
これはテクスチャとＵＶマップを対応付ける情報が一部しか.daeファイルに無いためです。

モデルは４つ以下のボーンとマテリアル１つの組み合わせごとにパーツ分けされます。
頂点データには、ボーンごとにウェイト値とボーンのローカル座標での位置が出力されます。
ＵＶ座標も出力されます。（複数ＵＶマップ対応）テクスチャとＵＶマップはインデックスが対応します。

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
