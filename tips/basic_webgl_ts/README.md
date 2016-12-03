# PTWTips - Basic TypeScript WebGL Sample

TypeScriptによる基本的なWebGL(1.0系)プログラム実装のサンプルです。  
ここでは同じフォルダにある render.ts の各クラスをもとに説明します。

## RenderModel クラス

- ３Ｄモデルのバッファオブジェクトを保持する
- 描画時に必要なバッファ関連の情報を保持する

RenderModelクラスの主な目的は３Ｄモデルの頂点とインデックスのバッファオブジェクトを保持することです。これにより、３Ｄモデルを利用する側でそれぞれのバッファへの参照を一つずつ持たずに済みます。バッファを解放しても３Ｄモデルへの参照を保持することができ、再度バッファを作成しても参照を更新する必要がなくなります。初歩的なことではありますが、リソースの確保と解放を行うプログラム（ある程度以上の規模のゲームなど）ではあらかじめ考慮しておくべきことでしょう。

RenderModelクラスは描画の際に必要となる、バッファに関連する情報も保持します。たとえば、頂点データの全体の要素数や１要素のサイズなどです。またバッファにセットした元データは後に利用する必要がなければ無くてもよいのですが、利用する場合もあるため保持するようにしました。

なお、WebGLを学習するためのサンプルプログラムの多くでは頂点座標、法線、ＵＶといった頂点情報に別々のバッファを作成する方法を取っています。それには種々の理由があると思われますが、このサンプルでは全ての頂点情報を一つのインターリーブ配列にまとめ、一つのバッファを作成します。その理由は、パフォーマンス面の理由もありますが、描画の際に必要な情報は３Ｄモデルの内容ではなくシェーダの内容によって確定されることが多いという事情によるものです。そのためいっそのことRenderModelクラスはできるだけシンプルな形にしておき、シェーダに重要な実装を集中させるスタンスをとっています。

また筆者は、将来的にRenderModelに機能を追加するとしても、RenderModelには描画に直結する情報だけを持たせるべきだと考えます。たとえば３Ｄモデルのファイル名などの情報はこのクラスに持たせるべきではありません。ファイル名は描画に直接関係がない情報だからです。そういった情報は、他のtipsで説明する予定ですが、RenderModelを内包するModelResourceのような名称のクラスに持たせるべきでしょう。

## RenderImage クラス

- テクスチャオブジェクトを保持する

RenderModelクラスの目的はWebGLのテクスチャオブジェクトを保持することです。対象がテクスチャであること以外、基本的な考え方はRenderModelと同じです。

## RenderShader クラス

- WebGLProgramなどシェーダに関するオブジェクトを保持する
- 疑似差分プログラミングを可能にする
- attribute変数の補助機能
- 接頭辞をつけた変数名とする

RenderModelクラスの主な目的は三つあります。一つめはシェーダなどのオブジェクトを保持すること。二つめはシェーダに依存するパラメータを受け取り、WebGLコンテキストに設定すること。三つめはTypeScriptのオブジェクト指向の機能を使ってシェーダプログラムの疑似的な差分プログラミングを可能にすることです。

シェーダの実装方針について、下記のサンプルをもとに説明します。これが最善ということではなく、筆者はたまたまこのようにしているとお考え下さい。

TypeScript

    class BasicShader extends RenderShader {

        aPosition = 0;
        aTexCoord = 0;

        uTexture0: WebGLUniformLocation = null;

        initializeVertexSourceCode() {

            this.vertexShaderSourceCode = ""
                + this.floatPrecisionDefinitionCode

                + "attribute vec3 aPosition;"
                + "attribute vec2 aTexCoord;"

                + "uniform mat4 uPMatrix;"
                + "uniform mat4 uMVMatrix;"

                + "varying vec2 vTexCoord;"

                + "void main(void) {"
                + "	   gl_Position = uPMatrix * uMVMatrix * vec4(aPosition, 1.0);"
                + "    vTexCoord = aTexCoord;"
                + "}";
        }

        initializeFragmentSourceCode() {

            this.fragmentShaderSourceCode = ""
                + this.floatPrecisionDefinitionCode

                + "varying vec2 vTexCoord;"

                + "uniform sampler2D uTexture0;"

                + "void main(void) {"
                + "    gl_FragColor = texture2D(uTexture0, vTexCoord);"
                + "}";
        }

        initializeAttributes(gl: WebGLRenderingContext) {

            this.initializeAttributes_RenderShader(gl);
            this.initializeAttributes_BasicShader(gl);
        }

        initializeAttributes_BasicShader(gl: WebGLRenderingContext) {

            this.aPosition = this.getAttribute("aPosition", gl);
            this.aTexCoord = this.getAttribute("aTexCoord", gl);

            this.uTexture0 = this.getUniform("uTexture0", gl);
        }

    	setBuffers(model: RenderModel, images: List<RenderImage>, gl: WebGLRenderingContext) {

            gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);

            gl.enableVertexAttribArray(this.aPosition);
            gl.enableVertexAttribArray(this.aTexCoord);

            gl.vertexAttribPointer(this.aPosition, 3, gl.FLOAT, false, 4 * 5, 0);
            gl.vertexAttribPointer(this.aTexCoord, 2, gl.FLOAT, false, 4 * 5, 12);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, images[0].texture);
            gl.uniform1i(this.uTexture0, 0);
    	}
    }

#### 疑似差分プログラミングについて
ＧＰＵに渡されるソースコードまで差分プログラミングを行うことはできませんので、疑似的な方法です。シェーダクラスではinitializeVertexSourceCode関数とinitializeFragmentSourceCode関数でそれぞれ頂点シェーダとフラグメントシェーダのソースコード文字列を初期化しています。クラスのメンバ関数にすることで、将来的に継承先クラスで差分だけを記述して新たなソースコードを作ることができます。継承元ソースコードの一部を生成する関数を用意してオーバーライドしたり、パラメータを渡す形にすることも考えられます。

また、TypeScript側のattribute変数やuniform変数の取得をinitializeAttributes関数で行います。こちらもシェーダのソースコードと同様に、差分だけを記述することができます。筆者は上記のサンプルコードのように継承元クラスと継承先クラスの関数をそれぞれ呼ぶのが単純でよいのではないかと考えています

#### attribute変数の扱いについて
attribute変数は、変数ごとにenableVertexAttribArray関数を使ってＧＰＵのレジスタを有効化する必要があります。また、必要がなくなればdisableVertexAttribArray関数を使って無効化する必要があります。この処理はRenderShaderクラスの基本機能として用意しています。  

#### （余談）接頭辞について
筆者は以下のように接頭辞を付けた変数名を使用しています。

- uniform変数は u から始める
- attribute変数は a から始める
- varying変数は v から始める
- JavaScript側も同じ変数名にする

接頭辞を付ける理由は、たとえばＵＶ座標のように、attribute変数をそのままvarying変数に渡すだけで済む場合があるためです。aTexCoordとvTexCoordは本来同じものを意味するものですが、GLSLの仕様上、違う名前でそれぞれ用意する必要があります。さらに、TypeScript(JavaScript)側でも変数を持つ必要がありますので、筆者はこれらは同じものであることが分かるように、かつ簡単に区別がつくよう接頭辞を付けることにしました。

また、attribute、uniform、varyingという単語が接頭辞や接尾辞としては長すぎるということ、googleやmozillaのものをはじめとしたWebGLのチュートリアルの多くで同様の変数名が用いられていたということも、このようになった理由です。

## WebGLRender クラス
WebGLRenderクラスの主な目的はWebGLコンテキストをクラスでラップすることです。WebGLコンテキストを直接利用するのではなく、クラスでラップすることはプログラムの保守性を高める意味で有効です。

また、WebGLを扱うとき重要なこととして、WebGLがステートマシンであるという事情があります。しかも、必ずしも現在の状態の全ての情報を取得できるように設計されているわけではありません。ある程度、WebGLコンテキストやGPUの状態をプログラム側で記憶しておく必要があります。例えばこのサンプルではenableVertexAttribArray関数によって有効にされたレジスタの中で使用しないレジスタを無効にする処理をsetShader関数の中で行っています。また、現在のシェーダがどれであるかを記憶しています。レンダラにはそのような記憶場所としての目的もあります。
