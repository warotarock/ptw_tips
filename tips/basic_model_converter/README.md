# PTWTips - Basic Model Converter Sample

基本的なモデルのコンバート処理です。

Collada形式(.dae)のファイルからモデル情報を抽出し、json形式(.json)で出力します。

.daeファイルはBlenderから標準のエクスポータで以下の設定でエクスポートしたものです。

    Export Data Options  
      Apply Modifiers: View  
      Selection Only: false  
    
    Texture Options 
      Only Selected UV Map: false  
      Include UV Textures: false  
      Incluede Material Textures: true  
      Copy: true  
    
    Armature Options  
      Deform Bone Only: false  
      Export to SL/OpenSim: false  
    
    Collada Options  
      Triangulate: true  
      Use Object Instances Transformation: Matrix  
      Sort by Object name: true  
