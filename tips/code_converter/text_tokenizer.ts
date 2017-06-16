
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
        ResultList: List<TextToken> = null;

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

            var letters = new List<string>();
            letters.push(setting.SingleSeperatorLetters);
            for (var i = 0; i < setting.MultiLengthSeperators.length; i++) {
                var letter = setting.MultiLengthSeperators[i];
                letters.push(letter[0]);
            }
            this.SeperatorTopLetters = letters.join();

            this.ClearResult();
        }

        ClearResult() {
            this.CurrentMode = ProcessingMode.None;
            this.CurrentIndex = 0;
            this.LineNumber = 1;
            this.BlockCommentStartLetter = null;
            this.ResultList = new List<TextToken>();
        }

        AddToResult(lineText: string, startIndex: int, length: int, tokenType: TokenType) {

            var text = StringSubstring(lineText, startIndex, length);
            if (text.length > 0) {
                var textToken = TextToken.fromTypeTextLineNumber(tokenType, text, this.LineNumber);
                this.ResultList.push(textToken);
            }

            if (tokenType == TokenType.LineEnd) {
                this.LineNumber++;
            }
        }
    }

    export class TextTokenizer {

        Tokenize(lineText: string, state: ProcessingState): List<TextToken> {
            var lineTextLength = lineText.length;

            while (state.CurrentIndex < lineTextLength) {
                var mode = this.GetProcessingMode(lineText, state);

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

            return state.ResultList;
        }

        // Getting processing mode sub
        GetProcessingMode(lineText: string, state: ProcessingState): ProcessingMode {
            var i = state.CurrentIndex;
            var lineTextLength = lineText.length;
            var letter = StringSubstring(lineText, i, 1);

            // Line end letter
            if (this.IsLineEndStartLetter(letter[0])) {
                return ProcessingMode.LineEnd;
            }

            // Commnent
            if (i <= lineTextLength - 2 && StringContains(state.CommentStartLetters, letter)) {
                var nextTwoLetters = StringSubstring(lineText, i, 2);

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
                    var nextLetter = StringSubstring(lineText, i + 1, 1);
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

            var i = state.CurrentIndex;
            var lineTextLength = lineText.length;
            var letter = StringSubstring(lineText, i, 1);

            var lineEndLetterLength = this.GetLineEndLetterLength(lineText, i);
            state.AddToResult(lineText, i, lineEndLetterLength, TokenType.LineEnd);

            state.CurrentIndex = i + lineEndLetterLength;
        }

        ProcessLineComment(lineText: string, state: ProcessingState) {

            var i = state.CurrentIndex;
            var topIndex = i;
            var lineTextLength = lineText.length;

            while (true) {
                // 改行コード
                if (this.IsLineEndStartLetter(lineText[i])) {
                    if (i - topIndex > 0) {
                        // 改行コードの前までを対象とする
                        state.AddToResult(lineText, topIndex, i - topIndex, TokenType.LineComment);
                    }

                    break;
                }

                // テキストの終了
                if (i == lineTextLength - 1) {
                    state.AddToResult(lineText, topIndex, lineTextLength - topIndex, TokenType.LineComment);
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

            var i = state.CurrentIndex;
            var topIndex = i;
            var lineTextLength = lineText.length;
            var currentTokenType = TokenType.BlockCommentBegin;

            var commentBlockEndLetter0 = state.CommentBlockEndLetter[0];
            var commentBlockEndLetter1 = state.CommentBlockEndLetter[1];

            // コメントの開始文字を記憶
            state.BlockCommentStartLetter = StringSubstring(lineText, i, 2);

            // コメントの開始文字はすでに認識されているので飛ばします。
            i += state.BlockCommentStartLetter.length;

            while (true) {
                // 改行コード
                if (this.IsLineEndStartLetter(lineText[i])) {
                    // 改行コードの前までを出力
                    if (i - topIndex > 0) {
                        state.AddToResult(lineText, topIndex, i - topIndex, currentTokenType);
                    }

                    if (currentTokenType == TokenType.BlockCommentBegin) {
                        currentTokenType = TokenType.BlockComment;
                    }

                    // 改行コードを出力
                    var lineEndLetterLength = this.GetLineEndLetterLength(lineText, i);
                    state.AddToResult(lineText, i, lineEndLetterLength, TokenType.LineEnd);

                    i += lineEndLetterLength;
                    topIndex = i;

                    continue;
                }

                // ブロックコメントの終了
                if (i < lineTextLength - 1) {
                    if (commentBlockEndLetter0 == lineText[i] && commentBlockEndLetter1 == lineText[i + 1]) {
                        state.AddToResult(lineText, topIndex, i + 2 - topIndex, TokenType.BlockCommentEnd);
                        i += 2;
                        break;
                    }
                }

                // テキストの終了
                if (i == lineTextLength - 1) {
                    state.AddToResult(lineText, topIndex, lineTextLength - topIndex, TokenType.BlockCommentEnd);
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

            var i = state.CurrentIndex;
            var topIndex = i;
            var lineTextLength = lineText.length;

            for (; i < lineTextLength; i++) {
                var letter = StringSubstring(lineText, i, 1);

                if (!StringContains(state.WhiteSpaceLetters, letter)) {
                    state.AddToResult(lineText, topIndex, i - topIndex, TokenType.WhiteSpaces);
                    break;
                }
                else if (i == lineTextLength - 1) {
                    state.AddToResult(lineText, topIndex, lineTextLength - topIndex, TokenType.WhiteSpaces);
                    i = lineTextLength;
                    break;
                }
            }

            state.CurrentIndex = i;
        }

        ProcessTextLiteral(lineText: string, state: ProcessingState) {

            var i = state.CurrentIndex;
            var topIndex = i;
            var lineTextLength = lineText.length;

            var lastLetter = '';

            i++;// 文字列の開始文字はすでに認識されているので飛ばします

            for (; i < lineTextLength; i++) {
                var letter = StringSubstring(lineText, i, 1);

                if (StringContains(state.TextLiteralSurrounders, letter)
                    && (StringIsNullOrEmpty(lastLetter) || !StringContains(state.TextLiteralEscapeSeqLetters, lastLetter))) {
                    state.AddToResult(lineText, topIndex, i + 1 - topIndex, TokenType.TextLiteral);
                    i = i + 1;
                    break;
                }
                else if (i == lineTextLength - 1) {
                    // TODO: 文字列の途中で行末に達した場合、例外にするか続行できるか検討する。
                    state.AddToResult(lineText, topIndex, lineTextLength - topIndex, TokenType.TextLiteral);
                    i = lineTextLength;
                    break;
                }

                lastLetter = letter;
            }

            state.CurrentIndex = i;
        }

        ProcessNumberLiteral(lineText: string, state: ProcessingState) {

            var i = state.CurrentIndex;
            var topIndex = i;
            var lineTextLength = lineText.length;

            for (; i < lineTextLength; i++) {
                var letter = StringSubstring(lineText, i, 1);

                if (!StringContains(state.NumberLiteralLetters, letter)
                    && letter != '.') // TODO: 0-1 のような書き方で正しく動かないので対応する
                {
                    state.AddToResult(lineText, topIndex, i - topIndex, TokenType.NumberLiteral);
                    break;
                }
                if (i == lineTextLength - 1) {
                    state.AddToResult(lineText, topIndex, lineTextLength - topIndex, TokenType.NumberLiteral);
                    i = lineTextLength;
                    break;
                }
            }

            state.CurrentIndex = i;
        }

        ProcessAlphaNumeric(lineText: string, state: ProcessingState) {

            var i = state.CurrentIndex;
            var topIndex = i;
            var lineTextLength = lineText.length;

            for (; i < lineTextLength; i++) {
                var letter = StringSubstring(lineText, i, 1);

                if (StringContains(state.SeperatorTopLetters, letter)
                    || this.IsLineEndStartLetter(letter[0])) {
                    state.AddToResult(lineText, topIndex, i - topIndex, TokenType.AlphaNumeric);
                    break;
                }
                else if (i == lineTextLength - 1) {
                    state.AddToResult(lineText, topIndex, lineTextLength - topIndex, TokenType.AlphaNumeric);
                    i = lineTextLength;
                    break;
                }
            }

            state.CurrentIndex = i;
        }

        ProcessSeperator(lineText: string, state: ProcessingState) {

            var i = state.CurrentIndex;
            var topIndex = i;
            var lineTextLength = lineText.length;

            // Check multi-length-seperator and process letters
            var isMultiLengthSeperator = false;

            for (i = 0; i < state.MultiLengthSeperators.length; i++) {
                var seperator = state.MultiLengthSeperators[i];
                var seperatorLength = seperator.length;

                if (topIndex <= lineTextLength - seperatorLength
                    && seperator == StringSubstring(lineText, topIndex, seperatorLength)) {
                    state.AddToResult(lineText, topIndex, seperatorLength, TokenType.Seperator);
                    i = topIndex + seperatorLength;
                    isMultiLengthSeperator = true;
                    break;
                }
            }

            // If not multi-length, process as a single letter
            if (!isMultiLengthSeperator) {
                state.AddToResult(lineText, topIndex, 1, TokenType.Seperator);
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
