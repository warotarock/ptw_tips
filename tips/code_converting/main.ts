
namespace CodeConverter {

    window.onload = () => {

        //let filePath = './statement_analyzer.ts';
        let filePath = '../skinning_model_drawing/main.ts';

        let data: any = null;
        let xhr = new XMLHttpRequest();
        xhr.open('GET', filePath);
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
            convert(data, filePath);
        };

        xhr.send();
    };

    function convert(data: string, filePath: string) {

        // 単語解析
        let tokenizer = new TextTokenizer.Tokenizer();
        let tokenizerSetting = new TextTokenizer.TokenizerSetting();
        let tokenizerState = new TextTokenizer.TokenizerState();
        let tokenizerResult = new TextTokenizer.TokenizerResult();
        tokenizerState.initialize(tokenizerSetting);

        tokenizer.tokenize(tokenizerResult, data, tokenizerState);
        //showTokens(tokenizerResult.Tokens);

        // ステートメント解析
        let statementAnalyzer = new StatementAnalyzer.Analyzer();
        let statementAnalyzerSetting = new StatementAnalyzer.AnalyzerSetting();
        let analyzerState = new StatementAnalyzer.AnalyzerState();
        let analyzerResult = new StatementAnalyzer.AnalyzerResult();
        statementAnalyzerSetting.FilePath = filePath;
        analyzerState.initialize(statementAnalyzerSetting);

        statementAnalyzer.analyze(analyzerResult, tokenizerResult.Tokens, analyzerState);
        showStatements(analyzerResult.Statements);
    }

    function convertTokensToHTML(result: List<string>, tokens: TextTokenCollection, topLetter: string) {

        var lineTexts: List<string> = [];

        if (!StringIsNullOrEmpty(topLetter)) {
            lineTexts.push(topLetter);
        }

        for (var i = 0; i < tokens.length; i++) {
            var token = tokens[i];

            var text = token.Text.replace(/\</g, '&lang;').replace(/\>/g, '&rang;');

            if (i == tokens.length - 1) {
                lineTexts.push(text);
                result.push(lineTexts.join(""));
            }
            else if (token.Type == TextTokenType.LineEnd) {
                lineTexts.push('↓');
                result.push(lineTexts.join(""));
                lineTexts = [];
            }
            else if (token.Type == TextTokenType.WhiteSpaces) {
                lineTexts.push(text);
            }
            else {
                //line.push(token.LineNumber + " " + TokenType[token.Type] + " " + token.Text);
                lineTexts.push(text);
            }
        }
    }

    function showTokens(tokens: TextTokenCollection) {

        var content_element = document.getElementById('content');

        var result: List<string> = [];

        convertTokensToHTML(result, tokens, null);

        content_element.innerHTML = result.join('<br/>');
    }

    function convertStatementToHTMLRecursive(result: List<string>, statement: CodeStatement) {

        let isFirstLine = true;
        for (let tokens of statement.TokensList) {

            convertTokensToHTML(result, tokens, isFirstLine ? '#' : ' ');
            isFirstLine = false;
        }

        if (statement.InnerStatements != null) {

            for (let innerStatement of statement.InnerStatements) {

                convertStatementToHTMLRecursive(result, innerStatement);
            }
        }
    }

    function showStatements(statements: List<CodeStatement>) {

        var content_element = document.getElementById('content');

        var result: List<string> = [];

        for (let statement of statements) {

            convertStatementToHTMLRecursive(result, statement);
        }

        content_element.innerHTML = result.join('<br/>');
    }
}
