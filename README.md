# PTW Tips

これはWebGL製の３Ｄシューティングゲーム「ファンタスティック トリノワールド」を制作する過程で蓄積されたであろうコードや知識のまとめ作業をしてみる取り組みです。

[ファンタスティック トリノワールド 公式ＨＰ
![ファンタスティック　トリノワールド](https://raw.github.com/wiki/warotarock/ptw_tips/images/ptw_beta_ban016.jpg)  ](http://www.geocities.jp/warotarock/ptw_beta/)

初Gitのためしばらく試行錯誤のコミットが続くと思われます。
ブレークしてお待ちください。


# 開発環境
## Visual Studio 2015 Community を使う場合
[Visual Studio 2015 Community](https://www.visualstudio.com/ja-jp/products/visual-studio-community-vs.aspx)は個人ならある程度まで無料で使用できます。インストーラがありますのでＨＤＤの容量に気を付ければ簡単に導入できます。ただし対応ＯＳはWindowsのみとなります。
インストーラで忘れずにTypeScripyにチェックを入れてインストールしてください。


プロジェクトを開くにはptw_tips.slnをダブルクリックするか、Visual Studioから開きます。
全てのソースコードが一度にビルドできるTypeScriptプロジェクトが開きます。

## Atomエディタを使う場合
[Atom](https://atom.io/)を使うと、ほとんどのＯＳでTypeScriptの開発環境が簡単に構築できます。ただし作者はがテストしているのはWindows環境のみです。

Atomをインストール後、メニューから

　`File -> Settings -> Install`

と画面を進み、検索欄で

　`atom-typescript`

で検索するとatom-typescriptがあるはずですので、それをInstallボタンでインストールします。しばらく時間がかかります。インストール完了後、念のためAtomを再起動するとTypeScriptが使用可能になります。

プロジェクトを開くには、メニューから

　`File -> Open Flolder`

でtsconfig.jsonが入っているフォルダを開くと、プロジェクトを開いた状態になります。F6またはファイル保存でtsファイルがコンパイルされます。

# 実行環境
## Electronのインストール
Electronを使うとGoogle Chromeとほとんど同じ実行環境が用意できます。node.jsの機能も使用可能です。
インストールするにはElectronのホームページからzipをダウンロードして解凍します。
この文章の作成時ではトップページ ([http://electron.atom.io/](http://electron.atom.io/))から

　`Release -> 1.4.2 -> electron-v1.4.2-win32-x64.zip`

とリンクをたどるとダウンロード可能です。リンクがたくさんあるので迷いますが50MBくらいのサイズのファイルがそれです。

インストールはzipを解凍すれば完了です。

## 実行
基本はコマンドラインから実行ですが、Windowsの場合ショートカットを作っておくと便利です。package.json が含まれるフォルダを指定するとプログラムを実行できます。

![ショートカットの設定](https://raw.github.com/wiki/warotarock/ptw_tips/images/shortcut_setting001.jpg)  

MacやLinuxの場合については、環境がないため試せていません。おそらく同じようなことが可能に違いないと信じて進めております。

## ゲームの実行
作者はApacheでローカルにWebサーバを立てています。Electronで実行できますので必須ではありませんが、ネット上での公開に近い環境でテストするためにおすすめします。

おすすめしますが、解説サイトが既に多数ありますので、Apacheの設定等についてはここでは省略します。

なお推奨ブラウザはGoogle Chromeです。

# 今後書くかもしれないことのメモ
- オブジェクトプーリング
- 便利な計算用関数（補間、減速）
- タスクマネージャ
- 描画オブジェクトマネージャ
- サウンドマネージャ
- インプットマネージャ
- キャンバス描画（テキスト描画）



