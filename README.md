# PTW Tips

これは筆者がWebGL製の３Ｄシューティングゲーム「ファンタスティック トリノワールド」を制作する過程で蓄積されたであろうコードや知識のまとめ作業をしてみる取り組みです。内容はサンプルプログラムと解説のコレクションです。


![ファンタスティック　トリノワールド](https://raw.github.com/wiki/warotarock/ptw_tips/images/ptw_beta_ban016.jpg)  
[ファンタスティック トリノワールド](https://play.google.com/store/apps/details?id=com.warotarock.games.ptw001pro)

なお、読者にはある程度WebGLプログラミングの経験がある方を想定しております。WebGLで簡単なゲームまたはサイトを作ったことがあるか、ある程度ストーリー性のあるデモを作成した経験があれば（たぶん）問題なく読んでいただけると思います。

初Gitのためしばらく試行錯誤のコミットが続くと思われます。
ブレークしてお待ちください。

筆者：柏崎ワロタロ
<br />
<br />

## ソースコード

[./tips](./tips/) 以下に各ソースコードのフォルダがあります。フォルダを開くか、同フォルダの README.md のリンクからアクセスできます。使用言語はTypeScriptです。

ソースコードを先にご覧になる場合は、以下の点のみお読みください。

- 数値の型を明確にするためTypeScriptの機能でfloatなどを記述できるようにしています
- Arrayの使用目的を明確にするためにList<T>、Dictionary<T>を定義しています。
- 上記はtips/conversion.tsに記述してあります。
<br />

## ライブデモ

[Github Pages](https://warotarock.github.io/ptw_tips/) でライブデモを実行できます。

※ソースコードのリポジトリがそのままページになっていますので、ファイル書き込みなどElectronの機能を使用しているデモは動作しない場合があります。
<br />
<br />

## 開発環境

### Visual Studio 2017 Community を使う場合

[Visual Studio 2017 Community](https://www.visualstudio.com/ja-jp/products/visual-studio-community-vs.aspx)は個人ならある程度まで無料で使用できます。インストーラがありますので簡単に導入できます。ただし対応ＯＳはWindowsのみとなります。

インストーラで「ASP.NET と Web開発」を選択すればASP.NETなどとともにTypeScriptの開発環境もインストールされます。

プロジェクトを開くにはptw_tips.slnをダブルクリックするか、Visual Studioから開きます。
全てのソースコードが一度にビルドできるTypeScriptプロジェクトが開きます。
<br />
<br />

### Visual Studio 2015 Community を使う場合

[Visual Studio 2015 Community](https://www.visualstudio.com/ja/vs/older-downloads/)からダウンロード可能です。

インストーラでTypeScriptにチェックを入れてインストールしてください。
<br />
<br />

### Atomエディタを使う場合

[Atom](https://atom.io/)を使うと、ほとんどのＯＳでTypeScriptの開発環境が簡単に構築できます。ただし筆者はがテストしているのはWindows環境のみです。

Atomをインストール後、メニューから

　`File -> Settings -> Install`

と画面を進み、検索欄で

　`atom-typescript`

で検索するとatom-typescriptがあるはずですので、それをInstallボタンでインストールします。数分ほど時間がかかります。画面の変化が少ないため不安になりますが待ちましょう。インストール完了後、念のためAtomを再起動するとTypeScriptが使用可能になります。

プロジェクトを開くには、メニューから

　`File -> Open Flolder`

でtsconfig.jsonが入っているフォルダを開くと、プロジェクトを開いた状態になります。F6またはファイル保存でtsファイルがコンパイルされます。

プロジェクトを閉じるには、画面左のプロジェクトのツリーのルートにあたる項目でコンテキストメニュー（右クリック）から閉じることができます。
<br />
<br />

# 実行環境

### Electronのインストール

Electronを使うとGoogle Chromeとほとんど同じ実行環境が用意できます。node.jsの機能も使用可能です。
インストールするにはElectronのホームページからzipをダウンロードして解凍します。
この文章の作成時ではトップページ ([http://electron.atom.io/](http://electron.atom.io/))から

　`Release -> 1.4.2 -> electron-v1.4.2-win32-x64.zip`

とリンクをたどるとダウンロード可能です。リンクがたくさんあるので迷いますが50MBくらいのサイズのファイルがそれです。

インストールはzipを解凍すれば完了です。

### 実行

基本はコマンドラインから実行ですが、Windowsの場合ショートカットを作っておくと便利です。package.json が含まれるフォルダを指定するとプログラムを実行できます。

![ショートカットの設定](https://raw.github.com/wiki/warotarock/ptw_tips/images/shortcut_setting001.jpg)  

MacやLinuxの場合については、環境がないため試せていません。おそらく同じようなことが可能に違いないと信じて進めております。

### ネット公開のためのテスト環境について

筆者はApacheでローカルにWebサーバを立てています。Electronで実行できますので必須ではありませんが、ネット上での公開に近い環境でテストするためにおすすめします。

解説サイトが既に多数ありますのでApache等についてはここでは説明しません。

なお推奨ブラウザはGoogle Chromeです。
