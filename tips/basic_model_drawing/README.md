# モデルデータの作成 - Basic model converting

## 概要
基本的なモデルのコンバート処理です。

Collada形式(.dae)のファイルからモデル情報を抽出し、json形式(.json)で出力します。
.daeファイルのパースにはThree.jsのColladaLoaderを利用します。

一部でBlendFileReader.tsも使用しています。

## .daeファイルの作成方法
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
	  
- [Blendファイルからのデータ抽出](../blend_file_reader_sample/)