# オブジェクトアニメーションデータの作成 - Object Animation Converter

## 概要
Blenderのオブジェクトアニメーションのコンバート処理です。

出力はFCurveの内容をほぼそのまま出力したものになります。

※現状ではオブジェクトアニメーションとボーンアニメーションに対応していますが、
どのデータがLocation Xなのか、Quartanion Xなのかといった対応付けが不完全です。
とりあえず登場順だけで決定しています。BlenderからPythonで出力する方がよい
かもしれません。

## 関連情報
- [Blendファイルからのデータ抽出](../blend_file_reader_sample/)
- [オブジェクトアニメーションデータの作成](../object_animation_drawing/)
