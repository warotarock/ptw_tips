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
            if (token.isLineEnd()) {
                lineTexts.push('↓');
                result.push(lineTexts.join(""));
                lineTexts = [];
                if (i == tokens.length - 1) {
                    break;
                }
            }
            else if (token.isWhitesSpace()) {
                lineTexts.push(text);
            }
            else {
                //line.push(token.LineNumber + " " + TokenType[token.Type] + " " + token.Text);
                lineTexts.push(text);
            }
            if (i == tokens.length - 1) {
                result.push(lineTexts.join(""));
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
        var firstLineCount = 1;
        //let firstLineCount = statement.StatementLines.length;
        for (var i = 0; i < firstLineCount; i++) {
            var line = statement.StatementLines[i];
            var tokens = CodeConverter.TextTokenCollection.create();
            ListAddRange(tokens, line.indentTokens);
            ListAddRange(tokens, line.tokens);
            ListAddRange(tokens, line.followingTokens);
            convertTokensToHTML(result, tokens, isFirstLine ? '#' : ' ');
            isFirstLine = false;
        }
        if (statement.InnerStatements != null) {
            for (var _i = 0, _a = statement.InnerStatements; _i < _a.length; _i++) {
                var innerStatement = _a[_i];
                convertStatementToHTMLRecursive(result, innerStatement);
            }
        }
        for (var i = firstLineCount; i < statement.StatementLines.length; i++) {
            var line = statement.StatementLines[i];
            var tokens = CodeConverter.TextTokenCollection.create();
            ListAddRange(tokens, line.indentTokens);
            ListAddRange(tokens, line.tokens);
            convertTokensToHTML(result, tokens, ' ');
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
