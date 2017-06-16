
namespace CodeConverter.TextTokenizer {

    export class Setting {

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

    export class TokenizerResult {

        Tokens = new List<TextToken>();
        LineNumber = 0;

        Add(tokenType: TokenType, lineText: string, startIndex: int, length: int): TextToken {

            let text = StringSubstring(lineText, startIndex, length);

            let token = TextToken.fromTypeTextLineNumber(tokenType, text, this.LineNumber);
            this.Tokens.push(token);

            if (tokenType == TokenType.LineEnd) {
                this.LineNumber++;
            }

            return token;
        }
    }

    export class ProcessingState extends Setting {

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

        Initialize(setting: Setting) {

            // Initialize variables for setting
            this.WhiteSpaceLetters = setting.WhiteSpaceLetters;
            this.CommentLineStartLetter = setting.CommentLineStartLetter;
            this.CommentBlockStartLetter = setting.CommentBlockStartLetter;
            this.CommentBlockEndLetter = setting.CommentBlockEndLetter;

            this.TextLiteralEscapeSeqLetters = setting.TextLiteralEscapeSeqLetters;
            this.TextLiteralSurrounders = setting.TextLiteralSurrounders;

            this.NumberSignLetterOrSeperator = setting.NumberSignLetterOrSeperator;
            this.NumberLiteralLetters = setting.NumberLiteralLetters;

            this.SingleSeperatorLetters = setting.SingleSeperatorLetters;
            this.MultiLengthSeperators = setting.MultiLengthSeperators.slice();

            this.CommentStartLetters = StringSubstring(setting.CommentLineStartLetter, 0, 1);
            this.CommentStartLetters += StringSubstring(setting.CommentBlockStartLetter, 0, 1);

            let letters = new List<string>();
            letters.push(setting.SingleSeperatorLetters);
            for (let i = 0; i < setting.MultiLengthSeperators.length; i++) {
                let letter = setting.MultiLengthSeperators[i];
                letters.push(letter[0]);
            }
            this.SeperatorTopLetters = letters.join();

            this.Clear();
        }

        Clear() {
            this.CurrentMode = ProcessingMode.None;
            this.CurrentIndex = 0;
            this.LineNumber = 1;
            this.BlockCommentStartLetter = null;
            this.Result = new TokenizerResult();
        }
    }

    export class Processer {

        Tokenize(lineText: string, state: ProcessingState): TokenizerResult {

            let lineTextLength = lineText.length;

            while (state.CurrentIndex < lineTextLength) {
                let mode = this.GetProcessingMode(lineText, state);

                switch (mode) {
                    case ProcessingMode.LineEnd:
                        this.ProcessLineEnd(lineText, state);
                        break;

                    case ProcessingMode.BlockComment:
                        this.ProcessBlockComment(lineText, state);
                        break;

                    case ProcessingMode.LineComment:
                        this.ProcessLineComment(lineText, state);
                        break;

                    case ProcessingMode.WhiteSpaces:
                        this.ProcessWhiteSpaces(lineText, state);
                        break;

                    case ProcessingMode.TextLiteral:
                        this.ProcessTextLiteral(lineText, state);
                        break;

                    case ProcessingMode.NumberLiteral:
                        this.ProcessNumberLiteral(lineText, state);
                        break;

                    case ProcessingMode.AlphaNumeric:
                        this.ProcessAlphaNumeric(lineText, state);
                        break;

                    case ProcessingMode.Seperator:
                        this.ProcessSeperator(lineText, state);
                        break;
                }
            }

            return state.Result;
        }

        // Getting processing mode sub
        GetProcessingMode(lineText: string, state: ProcessingState): ProcessingMode {
            let i = state.CurrentIndex;
            let lineTextLength = lineText.length;
            let letter = StringSubstring(lineText, i, 1);

            // Line end letter
            if (this.IsLineEndStartLetter(letter[0])) {
                return ProcessingMode.LineEnd;
            }

            // Commnent
            if (i <= lineTextLength - 2 && StringContains(state.CommentStartLetters, letter)) {
                let nextTwoLetters = StringSubstring(lineText, i, 2);

                if (state.CommentBlockStartLetter == nextTwoLetters) {
                    return ProcessingMode.BlockComment;
                }
                else if (state.CommentLineStartLetter == nextTwoLetters) {
                    return ProcessingMode.LineComment;
                }
            }

            // White spaces
            if (StringContains(state.WhiteSpaceLetters, letter)) {
                return ProcessingMode.WhiteSpaces;
            }

            // Text literal
            if (StringContains(state.TextLiteralSurrounders, letter)) {
                return ProcessingMode.TextLiteral;
            }

            // All seperators
            if (StringContains(state.SeperatorTopLetters, letter)) {
                if (letter == state.NumberSignLetterOrSeperator && i + 1 < lineTextLength) {
                    // Check hyphen of negative number
                    // TODO: Check more than 1 letter after
                    let nextLetter = StringSubstring(lineText, i + 1, 1);
                    if (!StringContains(state.NumberLiteralLetters, letter)) {
                        return ProcessingMode.Seperator;
                    }
                }
                else {
                    return ProcessingMode.Seperator;
                }
            }

            // Number seperators
            if (StringContains(state.NumberLiteralLetters, letter)) {
                return ProcessingMode.NumberLiteral;
            }

            // Others (alphaNumeric)
            return ProcessingMode.AlphaNumeric;
        }

        // Processing sub
        ProcessLineEnd(lineText: string, state: ProcessingState) {

            let i = state.CurrentIndex;
            let lineTextLength = lineText.length;
            let letter = StringSubstring(lineText, i, 1);

            let lineEndLetterLength = this.GetLineEndLetterLength(lineText, i);
            state.Result.Add(TokenType.LineEnd, lineText, i, lineEndLetterLength);

            state.CurrentIndex = i + lineEndLetterLength;
        }

        ProcessLineComment(lineText: string, state: ProcessingState) {

            let i = state.CurrentIndex;
            let topIndex = i;
            let lineTextLength = lineText.length;

            while (true) {
                // 改行コード
                if (this.IsLineEndStartLetter(lineText[i])) {
                    if (i - topIndex > 0) {
                        // 改行コードの前までを対象とする
                        state.Result.Add(TokenType.LineComment, lineText, topIndex, i - topIndex);
                    }

                    break;
                }

                // テキストの終了
                if (i == lineTextLength - 1) {
                    state.Result.Add(TokenType.LineComment, lineText, topIndex, lineTextLength - topIndex);
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

        ProcessBlockComment(lineText: string, state: ProcessingState) {

            let i = state.CurrentIndex;
            let topIndex = i;
            let lineTextLength = lineText.length;
            let currentTokenType = TokenType.BlockCommentBegin;

            let commentBlockEndLetter0 = state.CommentBlockEndLetter[0];
            let commentBlockEndLetter1 = state.CommentBlockEndLetter[1];

            // コメントの開始文字を記憶
            state.BlockCommentStartLetter = StringSubstring(lineText, i, 2);

            // コメントの開始文字はすでに認識されているので飛ばします。
            i += state.BlockCommentStartLetter.length;

            while (true) {
                // 改行コード
                if (this.IsLineEndStartLetter(lineText[i])) {
                    // 改行コードの前までを出力
                    if (i - topIndex > 0) {
                        state.Result.Add(currentTokenType, lineText, topIndex, i - topIndex);
                    }

                    if (currentTokenType == TokenType.BlockCommentBegin) {
                        currentTokenType = TokenType.BlockComment;
                    }

                    // 改行コードを出力
                    let lineEndLetterLength = this.GetLineEndLetterLength(lineText, i);
                    state.Result.Add(TokenType.LineEnd, lineText, i, lineEndLetterLength);

                    i += lineEndLetterLength;
                    topIndex = i;

                    continue;
                }

                // ブロックコメントの終了
                if (i < lineTextLength - 1) {
                    if (commentBlockEndLetter0 == lineText[i] && commentBlockEndLetter1 == lineText[i + 1]) {
                        state.Result.Add(TokenType.BlockCommentEnd, lineText, topIndex, i + 2 - topIndex);
                        i += 2;
                        break;
                    }
                }

                // テキストの終了
                if (i == lineTextLength - 1) {
                    state.Result.Add(TokenType.BlockCommentEnd, lineText, topIndex, lineTextLength - topIndex);
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

        ProcessWhiteSpaces(lineText: string, state: ProcessingState) {

            let i = state.CurrentIndex;
            let topIndex = i;
            let lineTextLength = lineText.length;

            for (; i < lineTextLength; i++) {
                let letter = StringSubstring(lineText, i, 1);

                if (!StringContains(state.WhiteSpaceLetters, letter)) {
                    state.Result.Add(TokenType.WhiteSpaces, lineText, topIndex, i - topIndex);
                    break;
                }
                else if (i == lineTextLength - 1) {
                    state.Result.Add(TokenType.WhiteSpaces, lineText, topIndex, lineTextLength - topIndex);
                    i = lineTextLength;
                    break;
                }
            }

            state.CurrentIndex = i;
        }

        ProcessTextLiteral(lineText: string, state: ProcessingState) {

            let i = state.CurrentIndex;
            let topIndex = i;
            let lineTextLength = lineText.length;

            let lastLetter = '';

            i++;// 文字列の開始文字はすでに認識されているので飛ばします

            for (; i < lineTextLength; i++) {
                let letter = StringSubstring(lineText, i, 1);

                if (StringContains(state.TextLiteralSurrounders, letter)
                    && (StringIsNullOrEmpty(lastLetter) || !StringContains(state.TextLiteralEscapeSeqLetters, lastLetter))) {
                    state.Result.Add(TokenType.TextLiteral, lineText, topIndex, i + 1 - topIndex);
                    i = i + 1;
                    break;
                }
                else if (i == lineTextLength - 1) {
                    // TODO: 文字列の途中で行末に達した場合、例外にするか続行できるか検討する。
                    state.Result.Add(TokenType.TextLiteral, lineText, topIndex, lineTextLength - topIndex);
                    i = lineTextLength;
                    break;
                }

                lastLetter = letter;
            }

            state.CurrentIndex = i;
        }

        ProcessNumberLiteral(lineText: string, state: ProcessingState) {

            let i = state.CurrentIndex;
            let topIndex = i;
            let lineTextLength = lineText.length;

            for (; i < lineTextLength; i++) {
                let letter = StringSubstring(lineText, i, 1);

                if (!StringContains(state.NumberLiteralLetters, letter)
                    && letter != '.') // TODO: 0-1 のような書き方で正しく動かないので対応する
                {
                    state.Result.Add(TokenType.NumberLiteral, lineText, topIndex, i - topIndex);
                    break;
                }
                if (i == lineTextLength - 1) {
                    state.Result.Add(TokenType.NumberLiteral, lineText, topIndex, lineTextLength - topIndex);
                    i = lineTextLength;
                    break;
                }
            }

            state.CurrentIndex = i;
        }

        ProcessAlphaNumeric(lineText: string, state: ProcessingState) {

            let i = state.CurrentIndex;
            let topIndex = i;
            let lineTextLength = lineText.length;

            for (; i < lineTextLength; i++) {
                let letter = StringSubstring(lineText, i, 1);

                if (StringContains(state.SeperatorTopLetters, letter)
                    || this.IsLineEndStartLetter(letter[0])) {
                    state.Result.Add(TokenType.AlphaNumeric, lineText, topIndex, i - topIndex);
                    break;
                }
                else if (i == lineTextLength - 1) {
                    state.Result.Add(TokenType.AlphaNumeric, lineText, topIndex, lineTextLength - topIndex);
                    i = lineTextLength;
                    break;
                }
            }

            state.CurrentIndex = i;
        }

        ProcessSeperator(lineText: string, state: ProcessingState) {

            let i = state.CurrentIndex;
            let topIndex = i;
            let lineTextLength = lineText.length;

            // Check multi-length-seperator and process letters
            let isMultiLengthSeperator = false;

            for (i = 0; i < state.MultiLengthSeperators.length; i++) {
                let seperator = state.MultiLengthSeperators[i];
                let seperatorLength = seperator.length;

                if (topIndex <= lineTextLength - seperatorLength
                    && seperator == StringSubstring(lineText, topIndex, seperatorLength)) {
                    state.Result.Add(TokenType.Seperator, lineText, topIndex, seperatorLength);
                    i = topIndex + seperatorLength;
                    isMultiLengthSeperator = true;
                    break;
                }
            }

            // If not multi-length, process as a single letter
            if (!isMultiLengthSeperator) {
                state.Result.Add(TokenType.Seperator, lineText, topIndex, 1);
                i = topIndex + 1;
                topIndex = i;
            }

            state.CurrentIndex = i;
        }

        // Detail analyzing functions
        IsLineEndStartLetter(letter: string): boolean {
            return (letter == '\n') || (letter == '\r');
        }

        GetLineEndLetterLength(lineText: string, index: int): int {

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
