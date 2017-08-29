var CodeConverter;
(function (CodeConverter) {
    window.onload = function () {
        //let filePath = './statement_analyzer.ts';
        var filePath = '../skinning_model_drawing/main.ts';
        var data = null;
        var xhr = new XMLHttpRequest();
        xhr.open('GET', filePath);
        xhr.responseType = 'text';
        xhr.addEventListener('load', function (e) {
            data = xhr.response;
        });
        var ui_elem = document.getElementById('ui');
        var p_elem = document.createElement("p");
        ui_elem.appendChild(p_elem);
        var button = document.createElement('button');
        button.type = 'button';
        button.innerText = 'analyze';
        p_elem.appendChild(button);
        button.onclick = function () {
            convert(data, filePath);
        };
        xhr.send();
    };
    function convert(data, filePath) {
        // 単語解析
        var tokenizer = new CodeConverter.TextTokenizer.Tokenizer();
        var tokenizerSetting = new CodeConverter.TextTokenizer.TokenizerSetting();
        var tokenizerState = new CodeConverter.TextTokenizer.TokenizerState();
        var tokenizerResult = new CodeConverter.TextTokenizer.TokenizerResult();
        tokenizerState.initialize(tokenizerSetting);
        tokenizer.tokenize(tokenizerResult, data, tokenizerState);
        //showTokens(tokenizerResult.Tokens);
        // ステートメント解析
        var statementAnalyzer = new CodeConverter.StatementAnalyzer.Analyzer();
        var statementAnalyzerSetting = new CodeConverter.StatementAnalyzer.AnalyzerSetting();
        var analyzerState = new CodeConverter.StatementAnalyzer.AnalyzerState();
        var analyzerResult = new CodeConverter.StatementAnalyzer.AnalyzerResult();
        statementAnalyzerSetting.FilePath = filePath;
        analyzerState.initialize(statementAnalyzerSetting);
        statementAnalyzer.analyze(analyzerResult, tokenizerResult.Tokens, analyzerState);
        showStatements(analyzerResult.Statements);
    }
    function convertTokensToHTML(result, tokens, topLetter) {
        var lineTexts = [];
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
            else if (token.Type == CodeConverter.TextTokenType.LineEnd) {
                lineTexts.push('↓');
                result.push(lineTexts.join(""));
                lineTexts = [];
            }
            else if (token.Type == CodeConverter.TextTokenType.WhiteSpaces) {
                lineTexts.push(text);
            }
            else {
                //line.push(token.LineNumber + " " + TokenType[token.Type] + " " + token.Text);
                lineTexts.push(text);
            }
        }
    }
    function showTokens(tokens) {
        var content_element = document.getElementById('content');
        var result = [];
        convertTokensToHTML(result, tokens, null);
        content_element.innerHTML = result.join('<br/>');
    }
    function convertStatementToHTMLRecursive(result, statement) {
        var isFirstLine = true;
        for (var _i = 0, _a = statement.TokensList; _i < _a.length; _i++) {
            var tokens = _a[_i];
            convertTokensToHTML(result, tokens, isFirstLine ? '#' : ' ');
            isFirstLine = false;
        }
        if (statement.InnerStatements != null) {
            for (var _b = 0, _c = statement.InnerStatements; _b < _c.length; _b++) {
                var innerStatement = _c[_b];
                convertStatementToHTMLRecursive(result, innerStatement);
            }
        }
    }
    function showStatements(statements) {
        var content_element = document.getElementById('content');
        var result = [];
        for (var _i = 0, statements_1 = statements; _i < statements_1.length; _i++) {
            var statement = statements_1[_i];
            convertStatementToHTMLRecursive(result, statement);
        }
        content_element.innerHTML = result.join('<br/>');
    }
})(CodeConverter || (CodeConverter = {}));
