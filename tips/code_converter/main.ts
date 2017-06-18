
namespace CodeConverter {

    window.onload = () => {

        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'C:/pg/web/ptw/017/ts/game_framework.ts');
        xhr.responseType = 'text';
        xhr.addEventListener('load',
            (e: Event) => {
                convert(xhr.response);
            }
        );
        xhr.send();
    };

    function convert(data: string) {

        // 単語解析
        var tokenizer = new TextTokenizer.Tokenizer();
        var tokenizerSetting = new TextTokenizer.TokenizerSetting();
        var tokenizerState = new TextTokenizer.ProcessingState();
        var tokenizerResult = new TextTokenizer.TokenizerResult();
        tokenizerState.initialize(tokenizerSetting);

        var tokenizerResult = tokenizer.tokenize(tokenizerResult, data, tokenizerState);
        showTokens(tokenizerResult.Tokens);
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
