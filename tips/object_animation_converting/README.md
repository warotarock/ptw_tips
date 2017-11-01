# スキンモデルのアニメーションデータの作成 - Skin model animation data converting

## 概要
Blenderのオブジェクトアニメーションのコンバート処理です。.blendファイルを解析してFCurveの内容を取得し、ファイルに出力します。.blendファイルの解析にはBlendFileReader.tsを使用します。

出力はFCurveの内容をほぼそのまま出力したものになります。

ソースコード

- [サンプルプログラム（main.ts）](./main.ts)  
- [BlendFileReader.ts（blend_file_reader.ts）](../tips_core/blend_file_reader.ts)  


## 関連情報

- [.blendファイルからのデータ抽出](../blend_file_reader_sample/)
- [スキンモデルの描画](./skinning_model_drawing/)
- [スキンモデルのアニメーションの再生](../skin_model_animation_playing/)
