# 基本的な型の扱いについて - Basic type conversion

## 概要
TypeScriptによるWebGLプログラミングを補助するための型の扱いについて説明します。関連するコードは tips_core フォルダの conversion.ts です。サンプルプログラムはありません。

関連コード

- [conversion.ts](../tips_core/conversion.ts)


## リスト型、ディクショナリ型、詳細な数値型の追加
JavaSciprtでは一般的なプログラミング言語における固定配列、リスト、ディクショナリ（辞書）を全てArray型で扱うことができます。しかしゲーム「トリノワールド」の開発では、これらをTypeScriptの機能を利用して区別して扱いました。それには主に以下の理由がありました。

- ソースコードをC++にコンバートする必要があり、型情報が必要だった
- C++用のJSONパーサを自動生成する際に型情報が必要だった
- 可読性の向上が期待できる

そこでTypeScriptの機能を利用して、リスト型、ディクショナリ型、さらに数値型についても補助的な型を導入しました。以下は conversion.ts の抜粋です。

    var List = Array; // newによりオブジェクトを生成するためのもの
    var Dictionary = Array; // 同上

    type List<T> = Array<T>;
    type Dictionary<T> = any | Array<T>;

    type uchar = number;
    type char = number;
    type short = number;
    type int = number;
    type long = number;
    type ushort = number;
    type uint = number;
    type ulong = number;
    type float = number;
    type double = number;

## リスト、ディクショナリ、文字列操作関数の追加
JavaScriptのArrayにはパフォーマンスとして優れていても記述として分かりづらいものがあり、C++移植への対応も兼ねていくつかの関数を用意しました。また、文字列操作には一般的な方法が確立されていないものがあり、記述のブレを減らすとともに保守性を高めるため、いくつかの関数を用意しました。

- ListAddRange  
リストにリストの内容を追加します。  
Array.prototype.push.apply関数の置き換えです。

- ListRemoveAt  
リストの要素を削除します。  
splice関数を置き換えて意図が伝わりやすくするためのものです。

- DictionaryContainsKey  
ディクショナリのキーの存在の判定関数です。  
[string] in [object] というC++ではできない記述の置き換えです。

- StringIsNullOrEmpty  
空文字列とnullの判定関数です、  
(str == null || str == undefined || str == "") 等のブレが生じやすくC++ではできない記述の置き換えです。

- StringSubstring  
部分文字列の取得関数です。  
substr、substring、sliceのブレが生じやすい記述の置き換えです。

- StringStartsWith  
前方一致の判定関数です。  
indexOf、lastIndexOfを置き換えて意図が伝わりやすくするためのものです。  
（ES6なら不要？）

- StringContains  
部分一致の判定関数です。  
indexOf、lastIndexOfを置き換えて意図が伝わりやすくするためのものです。  
（ES6なら不要？）
