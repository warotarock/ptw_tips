
namespace CodeConverter {

    window.onload = () => {

        let filePath = './statement_analyzer.ts';
        //let filePath = '../skinning_model_drawing/main.ts';
        //let filePath = './sample_code.ts';

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
        let p_elem = document.createElement('p');
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

        tokenizerState.Setting = tokenizerSetting;
        tokenizerState.TargetText = data;
        tokenizerState.Result = tokenizerResult;
        tokenizerState.FilePath = filePath;
        tokenizerState.initialize();

        tokenizer.tokenize(tokenizerState);
        //showTokens(tokenizerResult.Tokens);

        // ステートメント解析
        let statementAnalyzer = new StatementAnalyzer.Analyzer();
        let statementAnalyzerSetting = new StatementAnalyzer.AnalyzerSetting();
        let analyzerState = new StatementAnalyzer.AnalyzerState();
        let analyzerResult = new StatementAnalyzer.AnalyzerResult();

        analyzerState.Setting = statementAnalyzerSetting;
        analyzerState.TargetTokens = tokenizerResult.Tokens;
        analyzerState.Result = analyzerResult;
        analyzerState.FilePath = filePath;
        analyzerState.initialize();

        statementAnalyzer.analyze(analyzerState);
        showStatements(analyzerResult.Statements);
    }

    function convertTokensToHTML(result: List<string>, tokens: TextTokenCollection, topLetter: string) {

        let lineTexts: List<string> = [];

        if (!StringIsNullOrEmpty(topLetter)) {
            lineTexts.push(topLetter);
        }

        for (var i = 0; i < tokens.length; i++) {
            var token = tokens[i];

            var text = token.Text.replace(/\</g, '&lang;').replace(/\>/g, '&rang;');

            if (token.isLineEnd()) {
                lineTexts.push('↓');
                result.push(lineTexts.join(''));
                lineTexts = [' '];

                if (i == tokens.length - 1) {
                    break;
                }
            }
            else if (token.isWhitesSpace()) {
                lineTexts.push(text);
            }
            else {
                //line.push(token.LineNumber + ' ' + TokenType[token.Type] + ' ' + token.Text);
                lineTexts.push(text);
            }

            if (i == tokens.length - 1) {
                result.push(lineTexts.join(''));
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

        let firstLineCount = 1;
        //let firstLineCount = statement.StatementLines.length;

        for (let i = 0; i < firstLineCount; i++) {
            let line = statement.StatementLines[i];

            let tokens = TextTokenCollection.create();
            ListAddRange(tokens, line.indentTokens);
            ListAddRange(tokens, line.tokens);
            ListAddRange(tokens, line.followingTokens);

            convertTokensToHTML(result, tokens, isFirstLine ? '#' : ' ');

            isFirstLine = false;
        }

        if (statement.InnerStatements != null) {

            for (let innerStatement of statement.InnerStatements) {

                convertStatementToHTMLRecursive(result, innerStatement);
            }
        }

        for (let i = firstLineCount; i < statement.StatementLines.length; i++) {
            let line = statement.StatementLines[i];

            let tokens = TextTokenCollection.create();
            ListAddRange(tokens, line.indentTokens);
            ListAddRange(tokens, line.tokens);
            ListAddRange(tokens, line.followingTokens);

            convertTokensToHTML(result, tokens, ' ');
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
