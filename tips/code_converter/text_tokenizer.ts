
namespace CodeConverter.TextTokenizer {

    export class TokenizerSetting {

        WhiteSpaceLetters = ' \t';
        CommentLineStartLetter = '//';
        CommentBlockStartLetter = '/*';
        CommentBlockEndLetter = '*/';

        SingleSeperatorLetters = ' [](){},?:;#.\t=!<>+-*/%^|&';
        MultiLengthSeperators: List<string> = [
            '===', '!==', '==', '!=', '<=', '>=', '+=', '-=', '*=', '/=', '%=', '^=', '|=', '&=', '&&', '||', '++', '--'
        ];

        NumberSignLetterOrSeperator = '-';
        NumberLiteralLetters = '0123456789+-';

        TextLiteralEscapeSeqLetters = '\\';
        TextLiteralSurrounders = '\'\"';
    }

    export class TokenizerResult {

        Tokens = TextTokenCollection.create();
        LineNumber = 1;

        add(tokenType: TextTokenType, lineText: string, startIndex: int, length: int): TextToken {

            let text = StringSubstring(lineText, startIndex, length);

            let token = TextToken.fromTypeTextLineNumber(tokenType, text, this.LineNumber);
            this.Tokens.push(token);

            if (tokenType == TextTokenType.LineEnd) {
                this.LineNumber++;
            }

            return token;
        }
    }

    export enum ProcessingMode {
        None,
        LineEnd,
        LineComment,
        BlockComment,
        WhiteSpaces,
        Seperator,
        AlphaNumeric,
        NumberLiteral,
        TextLiteral,
    }

    export class TokenizerState {

        Setting: TokenizerSetting = null;

        // Temporary variables for setting
        CommentStartLetters: string = null;
        SeperatorTopLetters: string = null;

        // State variables
        CurrentMode = ProcessingMode.None;
        CurrentIndex = 0;
        LineNumber = 0;
        BlockCommentStartLetter: string = null;

        // Result variables
        Result: TokenizerResult = null;

        initialize(setting: TokenizerSetting) {

            // Initialize variables for setting
            this.Setting = setting;

            this.CommentStartLetters = StringSubstring(setting.CommentLineStartLetter, 0, 1);
            this.CommentStartLetters += StringSubstring(setting.CommentBlockStartLetter, 0, 1);

            let letters = new List<string>();
            letters.push(setting.SingleSeperatorLetters);
            for (let i = 0; i < setting.MultiLengthSeperators.length; i++) {
                let seperator = setting.MultiLengthSeperators[i];
                letters.push(seperator[0]);
            }
            this.SeperatorTopLetters = letters.join();

            this.clear();
        }

        clear() {
            this.CurrentMode = ProcessingMode.None;
            this.CurrentIndex = 0;
            this.LineNumber = 1;
            this.BlockCommentStartLetter = null;
        }
    }

    export class Tokenizer {

        tokenize(result: TokenizerResult, targetText: string, state: TokenizerState) {

            state.Result = result;

            let lineTextLength = targetText.length;

            while (state.CurrentIndex < lineTextLength) {
                let mode = this.getProcessingMode(targetText, state);

                switch (mode) {
                    case ProcessingMode.LineEnd:
                        this.processLineEnd(result, targetText, state);
                        break;

                    case ProcessingMode.BlockComment:
                        this.processBlockComment(result, targetText, state);
                        break;

                    case ProcessingMode.LineComment:
                        this.processLineComment(result, targetText, state);
                        break;

                    case ProcessingMode.WhiteSpaces:
                        this.processWhiteSpaces(result, targetText, state);
                        break;

                    case ProcessingMode.TextLiteral:
                        this.processTextLiteral(result, targetText, state);
                        break;

                    case ProcessingMode.NumberLiteral:
                        this.processNumberLiteral(result, targetText, state);
                        break;

                    case ProcessingMode.AlphaNumeric:
                        this.processAlphaNumeric(result, targetText, state);
                        break;

                    case ProcessingMode.Seperator:
                        this.processSeperator(result, targetText, state);
                        break;
                }
            }
        }

        // Getting processing mode sub
        private getProcessingMode(text: string, state: TokenizerState): ProcessingMode {

            let i = state.CurrentIndex;
            let textLength = text.length;
            let letter = StringSubstring(text, i, 1);

            // Line end letter
            if (this.isLineEndStartLetter(letter[0])) {
                return ProcessingMode.LineEnd;
            }

            // Commnent
            if (i <= textLength - 2 && StringContains(state.CommentStartLetters, letter)) {
                let nextTwoLetters = StringSubstring(text, i, 2);

                if (state.Setting.CommentBlockStartLetter == nextTwoLetters) {
                    return ProcessingMode.BlockComment;
                }
                else if (state.Setting.CommentLineStartLetter == nextTwoLetters) {
                    return ProcessingMode.LineComment;
                }
            }

            // White spaces
            if (StringContains(state.Setting.WhiteSpaceLetters, letter)) {
                return ProcessingMode.WhiteSpaces;
            }

            // Text literal
            if (StringContains(state.Setting.TextLiteralSurrounders, letter)) {
                return ProcessingMode.TextLiteral;
            }

            // All seperators
            if (StringContains(state.SeperatorTopLetters, letter)) {
                if (letter == state.Setting.NumberSignLetterOrSeperator && i + 1 < textLength) {
                    // Check hyphen of negative number
                    // TODO: Check more than 1 letter after
                    let nextLetter = StringSubstring(text, i + 1, 1);
                    if (!StringContains(state.Setting.NumberLiteralLetters, letter)) {
                        return ProcessingMode.Seperator;
                    }
                }
                else {
                    return ProcessingMode.Seperator;
                }
            }

            // Number seperators
            if (StringContains(state.Setting.NumberLiteralLetters, letter)) {
                return ProcessingMode.NumberLiteral;
            }

            // Others (alphaNumeric)
            return ProcessingMode.AlphaNumeric;
        }

        // Processing sub
        private processLineEnd(result: TokenizerResult, lineText: string, state: TokenizerState) {

            let i = state.CurrentIndex;
            let lineTextLength = lineText.length;
            let letter = StringSubstring(lineText, i, 1);

            let lineEndLetterLength = this.getLineEndLetterLength(lineText, i);
            result.add(TextTokenType.LineEnd, lineText, i, lineEndLetterLength);

            state.CurrentIndex = i + lineEndLetterLength;
        }

        private processLineComment(result: TokenizerResult, lineText: string, state: TokenizerState) {

            let i = state.CurrentIndex;
            let topIndex = i;
            let lineTextLength = lineText.length;

            while (true) {
                // 改行コード
                if (this.isLineEndStartLetter(lineText[i])) {
                    if (i - topIndex > 0) {
                        // 改行コードの前までを対象とする
                        result.add(TextTokenType.LineComment, lineText, topIndex, i - topIndex);
                    }

                    break;
                }

                // テキストの終了
                if (i == lineTextLength - 1) {
                    result.add(TextTokenType.LineComment, lineText, topIndex, lineTextLength - topIndex);
                    i = lineTextLength;
                    break;
                }

                i++;
                if (i >= lineTextLength) {
                    break;
                }
            }

            state.CurrentIndex = i;
        }

        private processBlockComment(result: TokenizerResult, lineText: string, state: TokenizerState) {

            let i = state.CurrentIndex;
            let topIndex = i;
            let lineTextLength = lineText.length;
            let currentTokenType = TextTokenType.BlockCommentBegin;

            let commentBlockEndLetter0 = state.Setting.CommentBlockEndLetter[0];
            let commentBlockEndLetter1 = state.Setting.CommentBlockEndLetter[1];

            // コメントの開始文字を記憶
            state.BlockCommentStartLetter = StringSubstring(lineText, i, 2);

            // コメントの開始文字はすでに認識されているので飛ばします。
            i += state.BlockCommentStartLetter.length;

            while (true) {
                // 改行コード
                if (this.isLineEndStartLetter(lineText[i])) {
                    // 改行コードの前までを出力
                    if (i - topIndex > 0) {
                        result.add(currentTokenType, lineText, topIndex, i - topIndex);
                    }

                    if (currentTokenType == TextTokenType.BlockCommentBegin) {
                        currentTokenType = TextTokenType.BlockComment;
                    }

                    // 改行コードを出力
                    let lineEndLetterLength = this.getLineEndLetterLength(lineText, i);
                    result.add(TextTokenType.LineEnd, lineText, i, lineEndLetterLength);

                    i += lineEndLetterLength;
                    topIndex = i;

                    continue;
                }

                // ブロックコメントの終了
                if (i < lineTextLength - 1) {
                    if (commentBlockEndLetter0 == lineText[i] && commentBlockEndLetter1 == lineText[i + 1]) {
                        result.add(TextTokenType.BlockCommentEnd, lineText, topIndex, i + 2 - topIndex);
                        i += 2;
                        break;
                    }
                }

                // テキストの終了
                if (i == lineTextLength - 1) {
                    result.add(TextTokenType.BlockCommentEnd, lineText, topIndex, lineTextLength - topIndex);
                    i = lineTextLength;
                    break;
                }

                i++;
                if (i >= lineTextLength) {
                    break;
                }
            }

            state.CurrentIndex = i;
        }

        private processWhiteSpaces(result: TokenizerResult, lineText: string, state: TokenizerState) {

            let i = state.CurrentIndex;
            let topIndex = i;
            let lineTextLength = lineText.length;

            for (; i < lineTextLength; i++) {
                let letter = StringSubstring(lineText, i, 1);

                if (!StringContains(state.Setting.WhiteSpaceLetters, letter)) {
                    result.add(TextTokenType.WhiteSpaces, lineText, topIndex, i - topIndex);
                    break;
                }
                else if (i == lineTextLength - 1) {
                    result.add(TextTokenType.WhiteSpaces, lineText, topIndex, lineTextLength - topIndex);
                    i = lineTextLength;
                    break;
                }
            }

            state.CurrentIndex = i;
        }

        private processTextLiteral(result: TokenizerResult, lineText: string, state: TokenizerState) {

            let i = state.CurrentIndex;
            let topIndex = i;
            let lineTextLength = lineText.length;

            let lastLetter = '';

            i++;// 文字列の開始文字はすでに認識されているので飛ばします

            for (; i < lineTextLength; i++) {
                let letter = StringSubstring(lineText, i, 1);

                if (StringContains(state.Setting.TextLiteralSurrounders, letter)
                    && (StringIsNullOrEmpty(lastLetter) || !StringContains(state.Setting.TextLiteralEscapeSeqLetters, lastLetter))) {
                    result.add(TextTokenType.TextLiteral, lineText, topIndex, i + 1 - topIndex);
                    i = i + 1;
                    break;
                }
                else if (i == lineTextLength - 1) {
                    // TODO: 文字列の途中で行末に達した場合、例外にするか続行できるか検討する。
                    result.add(TextTokenType.TextLiteral, lineText, topIndex, lineTextLength - topIndex);
                    i = lineTextLength;
                    break;
                }

                lastLetter = letter;
            }

            state.CurrentIndex = i;
        }

        private processNumberLiteral(result: TokenizerResult, lineText: string, state: TokenizerState) {

            let i = state.CurrentIndex;
            let topIndex = i;
            let lineTextLength = lineText.length;

            for (; i < lineTextLength; i++) {
                let letter = StringSubstring(lineText, i, 1);

                if (!StringContains(state.Setting.NumberLiteralLetters, letter)
                    && letter != '.') // TODO: 0-1 のような書き方で正しく動かないので対応する
                {
                    result.add(TextTokenType.NumberLiteral, lineText, topIndex, i - topIndex);
                    break;
                }
                if (i == lineTextLength - 1) {
                    result.add(TextTokenType.NumberLiteral, lineText, topIndex, lineTextLength - topIndex);
                    i = lineTextLength;
                    break;
                }
            }

            state.CurrentIndex = i;
        }

        private processAlphaNumeric(result: TokenizerResult, lineText: string, state: TokenizerState) {

            let i = state.CurrentIndex;
            let topIndex = i;
            let lineTextLength = lineText.length;

            for (; i < lineTextLength; i++) {
                let letter = StringSubstring(lineText, i, 1);

                if (StringContains(state.SeperatorTopLetters, letter)
                    || this.isLineEndStartLetter(letter[0])) {
                    result.add(TextTokenType.AlphaNumeric, lineText, topIndex, i - topIndex);
                    break;
                }
                else if (i == lineTextLength - 1) {
                    result.add(TextTokenType.AlphaNumeric, lineText, topIndex, lineTextLength - topIndex);
                    i = lineTextLength;
                    break;
                }
            }

            state.CurrentIndex = i;
        }

        private processSeperator(result: TokenizerResult, lineText: string, state: TokenizerState) {

            let i = state.CurrentIndex;
            let topIndex = i;
            let lineTextLength = lineText.length;

            // Check multi-length-seperator and process letters
            let isMultiLengthSeperator = false;

            for (i = 0; i < state.Setting.MultiLengthSeperators.length; i++) {
                let seperator = state.Setting.MultiLengthSeperators[i];
                let seperatorLength = seperator.length;

                if (topIndex <= lineTextLength - seperatorLength
                    && seperator == StringSubstring(lineText, topIndex, seperatorLength)) {
                    result.add(TextTokenType.Seperator, lineText, topIndex, seperatorLength);
                    i = topIndex + seperatorLength;
                    isMultiLengthSeperator = true;
                    break;
                }
            }

            // If not multi-length, process as a single letter
            if (!isMultiLengthSeperator) {
                result.add(TextTokenType.Seperator, lineText, topIndex, 1);
                i = topIndex + 1;
                topIndex = i;
            }

            state.CurrentIndex = i;
        }

        // Detail analyzing functions
        private isLineEndStartLetter(letter: string): boolean {
            return (letter == '\n') || (letter == '\r');
        }

        private getLineEndLetterLength(lineText: string, index: int): int {

            if (lineText[index] == '\n') {
                return 1;
            }

            if (lineText[index] == '\r') {
                if (index + 1 < lineText.length && lineText[index + 1] == '\n') {
                    return 2;
                }
                else {
                    return 1;
                }
            }

            return 0;
        }
    }
}
