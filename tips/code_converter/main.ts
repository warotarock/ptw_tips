
namespace CodeConverter {

    window.onload = () => {

        let data: any = null;
        let xhr = new XMLHttpRequest();
        xhr.open('GET', '../tips_core/model_converters.ts');
        xhr.responseType = 'text';
        xhr.addEventListener('load',
            (e: Event) => {
                data = xhr.response;
            }
        );

        let ui_elem = document.getElementById('ui');
        let p_elem = document.createElement("p");
        ui_elem.appendChild(p_elem);

        let button = document.createElement('button');
        button.type = 'button';
        button.innerText = 'analyze';
        p_elem.appendChild(button);
        button.onclick = function () {
            convert(data);
        };

        xhr.send();
    };

    function convert(data: string) {

        // 単語解析
        let tokenizer = new TextTokenizer.Tokenizer();
        let tokenizerSetting = new TextTokenizer.TokenizerSetting();
        let tokenizerState = new TextTokenizer.TokenizerState();
        let tokenizerResult = new TextTokenizer.TokenizerResult();
        tokenizerState.initialize(tokenizerSetting);

        tokenizer.tokenize(tokenizerResult, data, tokenizerState);
        showTokens(tokenizerResult.Tokens);

        // ステートメント解析
        let statementAnalyzer = new StatementAnalyzer.Analyzer();
        let statementAnalyzerSetting = new StatementAnalyzer.AnalyzerSetting();
        let analyzerState = new StatementAnalyzer.AnalyzerState();
        let analyzerResult = new StatementAnalyzer.AnalyzerResult();
        analyzerState.initialize(statementAnalyzerSetting);

        statementAnalyzer.analyze(analyzerResult, tokenizerResult.Tokens, analyzerState);

    }

    function showTokens(tokens: List<TextToken>) {

        var content_element = document.getElementById('content');

        var result: List<string> = [];
        var lineTexts: List<string> = [];

        for (var i = 0; i < tokens.length; i++) {
            var token = tokens[i];

            var text = token.Text.replace(/\</g, '&lang;').replace(/\>/g, '&rang;');

            if (i == tokens.length - 1) {
                lineTexts.push(text);
                result.push(lineTexts.join(" "));
            }
            else if (token.Type == TextTokenType.LineEnd) {
                result.push(lineTexts.join(""));
                lineTexts = [];
            }
            else if (token.Type == TextTokenType.WhiteSpaces) {
                lineTexts.push(" ");
            }
            else {
                //line.push(token.LineNumber + " " + TokenType[token.Type] + " " + token.Text);
                lineTexts.push(text);
            }
        }

        content_element.innerHTML = result.join('<br/>');
    }
}
