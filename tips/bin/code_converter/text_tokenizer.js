var CodeConverter;
(function (CodeConverter) {
    var TextTokenizer;
    (function (TextTokenizer) {
        var TokenizerSetting = (function () {
            function TokenizerSetting() {
                this.WhiteSpaceLetters = ' \t';
                this.CommentLineStartLetter = '//';
                this.CommentBlockStartLetter = '/*';
                this.CommentBlockEndLetter = '*/';
                this.SingleSeperatorLetters = ' [](){},?:;#.\t=!<>+-*/%^|&';
                this.MultiLengthSeperators = [
                    '===', '!==', '==', '!=', '<=', '>=', '+=', '-=', '*=', '/=', '%=', '^=', '|=', '&=', '&&', '||', '++', '--'
                ];
                this.NumberSignLetterOrSeperator = '-';
                this.NumberLiteralLetters = '0123456789+-';
                this.TextLiteralEscapeSeqLetters = '\\';
                this.TextLiteralSurrounders = '\'\"';
            }
            return TokenizerSetting;
        }());
        TextTokenizer.TokenizerSetting = TokenizerSetting;
        var TokenizerResult = (function () {
            function TokenizerResult() {
                this.Tokens = CodeConverter.TextTokenCollection.create();
                this.LineNumber = 1;
            }
            TokenizerResult.prototype.add = function (tokenType, lineText, startIndex, length) {
                var text = StringSubstring(lineText, startIndex, length);
                var token = CodeConverter.TextToken.fromTypeTextLineNumber(tokenType, text, this.LineNumber);
                this.Tokens.push(token);
                if (tokenType == CodeConverter.TextTokenType.LineEnd) {
                    this.LineNumber++;
                }
                return token;
            };
            return TokenizerResult;
        }());
        TextTokenizer.TokenizerResult = TokenizerResult;
        var ProcessingMode;
        (function (ProcessingMode) {
            ProcessingMode[ProcessingMode["None"] = 0] = "None";
            ProcessingMode[ProcessingMode["LineEnd"] = 1] = "LineEnd";
            ProcessingMode[ProcessingMode["LineComment"] = 2] = "LineComment";
            ProcessingMode[ProcessingMode["BlockComment"] = 3] = "BlockComment";
            ProcessingMode[ProcessingMode["WhiteSpaces"] = 4] = "WhiteSpaces";
            ProcessingMode[ProcessingMode["Seperator"] = 5] = "Seperator";
            ProcessingMode[ProcessingMode["AlphaNumeric"] = 6] = "AlphaNumeric";
            ProcessingMode[ProcessingMode["NumberLiteral"] = 7] = "NumberLiteral";
            ProcessingMode[ProcessingMode["TextLiteral"] = 8] = "TextLiteral";
        })(ProcessingMode = TextTokenizer.ProcessingMode || (TextTokenizer.ProcessingMode = {}));
        var TokenizerState = (function () {
            function TokenizerState() {
                this.Setting = null;
                // Temporary variables for setting
                this.CommentStartLetters = null;
                this.SeperatorTopLetters = null;
                // State variables
                this.CurrentMode = ProcessingMode.None;
                this.CurrentIndex = 0;
                this.LineNumber = 0;
                this.BlockCommentStartLetter = null;
                // Result variables
                this.Result = null;
            }
            TokenizerState.prototype.initialize = function (setting) {
                // Initialize variables for setting
                this.Setting = setting;
                this.CommentStartLetters = StringSubstring(setting.CommentLineStartLetter, 0, 1);
                this.CommentStartLetters += StringSubstring(setting.CommentBlockStartLetter, 0, 1);
                var letters = new List();
                letters.push(setting.SingleSeperatorLetters);
                for (var i = 0; i < setting.MultiLengthSeperators.length; i++) {
                    var seperator = setting.MultiLengthSeperators[i];
                    letters.push(seperator[0]);
                }
                this.SeperatorTopLetters = letters.join();
                this.clear();
            };
            TokenizerState.prototype.clear = function () {
                this.CurrentMode = ProcessingMode.None;
                this.CurrentIndex = 0;
                this.LineNumber = 1;
                this.BlockCommentStartLetter = null;
            };
            return TokenizerState;
        }());
        TextTokenizer.TokenizerState = TokenizerState;
        var Tokenizer = (function () {
            function Tokenizer() {
            }
            Tokenizer.prototype.tokenize = function (result, targetText, state) {
                state.Result = result;
                var lineTextLength = targetText.length;
                while (state.CurrentIndex < lineTextLength) {
                    var mode = this.getProcessingMode(targetText, state);
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
            };
            // Getting processing mode sub
            Tokenizer.prototype.getProcessingMode = function (text, state) {
                var i = state.CurrentIndex;
                var textLength = text.length;
                var letter = StringSubstring(text, i, 1);
                // Line end letter
                if (this.isLineEndStartLetter(letter[0])) {
                    return ProcessingMode.LineEnd;
                }
                // Commnent
                if (i <= textLength - 2 && StringContains(state.CommentStartLetters, letter)) {
                    var nextTwoLetters = StringSubstring(text, i, 2);
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
                        var nextLetter = StringSubstring(text, i + 1, 1);
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
            };
            // Processing sub
            Tokenizer.prototype.processLineEnd = function (result, lineText, state) {
                var i = state.CurrentIndex;
                var lineTextLength = lineText.length;
                var letter = StringSubstring(lineText, i, 1);
                var lineEndLetterLength = this.getLineEndLetterLength(lineText, i);
                result.add(CodeConverter.TextTokenType.LineEnd, lineText, i, lineEndLetterLength);
                state.CurrentIndex = i + lineEndLetterLength;
            };
            Tokenizer.prototype.processLineComment = function (result, lineText, state) {
                var i = state.CurrentIndex;
                var topIndex = i;
                var lineTextLength = lineText.length;
                while (true) {
                    // 改行コード
                    if (this.isLineEndStartLetter(lineText[i])) {
                        if (i - topIndex > 0) {
                            // 改行コードの前までを対象とする
                            result.add(CodeConverter.TextTokenType.LineComment, lineText, topIndex, i - topIndex);
                        }
                        break;
                    }
                    // テキストの終了
                    if (i == lineTextLength - 1) {
                        result.add(CodeConverter.TextTokenType.LineComment, lineText, topIndex, lineTextLength - topIndex);
                        i = lineTextLength;
                        break;
                    }
                    i++;
                    if (i >= lineTextLength) {
                        break;
                    }
                }
                state.CurrentIndex = i;
            };
            Tokenizer.prototype.processBlockComment = function (result, lineText, state) {
                var i = state.CurrentIndex;
                var topIndex = i;
                var lineTextLength = lineText.length;
                var currentTokenType = CodeConverter.TextTokenType.BlockCommentBegin;
                var commentBlockEndLetter0 = state.Setting.CommentBlockEndLetter[0];
                var commentBlockEndLetter1 = state.Setting.CommentBlockEndLetter[1];
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
                        if (currentTokenType == CodeConverter.TextTokenType.BlockCommentBegin) {
                            currentTokenType = CodeConverter.TextTokenType.BlockComment;
                        }
                        // 改行コードを出力
                        var lineEndLetterLength = this.getLineEndLetterLength(lineText, i);
                        result.add(CodeConverter.TextTokenType.LineEnd, lineText, i, lineEndLetterLength);
                        i += lineEndLetterLength;
                        topIndex = i;
                        continue;
                    }
                    // ブロックコメントの終了
                    if (i < lineTextLength - 1) {
                        if (commentBlockEndLetter0 == lineText[i] && commentBlockEndLetter1 == lineText[i + 1]) {
                            result.add(CodeConverter.TextTokenType.BlockCommentEnd, lineText, topIndex, i + 2 - topIndex);
                            i += 2;
                            break;
                        }
                    }
                    // テキストの終了
                    if (i == lineTextLength - 1) {
                        result.add(CodeConverter.TextTokenType.BlockCommentEnd, lineText, topIndex, lineTextLength - topIndex);
                        i = lineTextLength;
                        break;
                    }
                    i++;
                    if (i >= lineTextLength) {
                        break;
                    }
                }
                state.CurrentIndex = i;
            };
            Tokenizer.prototype.processWhiteSpaces = function (result, lineText, state) {
                var i = state.CurrentIndex;
                var topIndex = i;
                var lineTextLength = lineText.length;
                for (; i < lineTextLength; i++) {
                    var letter = StringSubstring(lineText, i, 1);
                    if (!StringContains(state.Setting.WhiteSpaceLetters, letter)) {
                        result.add(CodeConverter.TextTokenType.WhiteSpaces, lineText, topIndex, i - topIndex);
                        break;
                    }
                    else if (i == lineTextLength - 1) {
                        result.add(CodeConverter.TextTokenType.WhiteSpaces, lineText, topIndex, lineTextLength - topIndex);
                        i = lineTextLength;
                        break;
                    }
                }
                state.CurrentIndex = i;
            };
            Tokenizer.prototype.processTextLiteral = function (result, lineText, state) {
                var i = state.CurrentIndex;
                var topIndex = i;
                var lineTextLength = lineText.length;
                var lastLetter = '';
                i++; // 文字列の開始文字はすでに認識されているので飛ばします
                for (; i < lineTextLength; i++) {
                    var letter = StringSubstring(lineText, i, 1);
                    if (StringContains(state.Setting.TextLiteralSurrounders, letter)
                        && (StringIsNullOrEmpty(lastLetter) || !StringContains(state.Setting.TextLiteralEscapeSeqLetters, lastLetter))) {
                        result.add(CodeConverter.TextTokenType.TextLiteral, lineText, topIndex, i + 1 - topIndex);
                        i = i + 1;
                        break;
                    }
                    else if (i == lineTextLength - 1) {
                        // TODO: 文字列の途中で行末に達した場合、例外にするか続行できるか検討する。
                        result.add(CodeConverter.TextTokenType.TextLiteral, lineText, topIndex, lineTextLength - topIndex);
                        i = lineTextLength;
                        break;
                    }
                    lastLetter = letter;
                }
                state.CurrentIndex = i;
            };
            Tokenizer.prototype.processNumberLiteral = function (result, lineText, state) {
                var i = state.CurrentIndex;
                var topIndex = i;
                var lineTextLength = lineText.length;
                for (; i < lineTextLength; i++) {
                    var letter = StringSubstring(lineText, i, 1);
                    if (!StringContains(state.Setting.NumberLiteralLetters, letter)
                        && letter != '.') {
                        result.add(CodeConverter.TextTokenType.NumberLiteral, lineText, topIndex, i - topIndex);
                        break;
                    }
                    if (i == lineTextLength - 1) {
                        result.add(CodeConverter.TextTokenType.NumberLiteral, lineText, topIndex, lineTextLength - topIndex);
                        i = lineTextLength;
                        break;
                    }
                }
                state.CurrentIndex = i;
            };
            Tokenizer.prototype.processAlphaNumeric = function (result, lineText, state) {
                var i = state.CurrentIndex;
                var topIndex = i;
                var lineTextLength = lineText.length;
                for (; i < lineTextLength; i++) {
                    var letter = StringSubstring(lineText, i, 1);
                    if (StringContains(state.SeperatorTopLetters, letter)
                        || this.isLineEndStartLetter(letter[0])) {
                        result.add(CodeConverter.TextTokenType.AlphaNumeric, lineText, topIndex, i - topIndex);
                        break;
                    }
                    else if (i == lineTextLength - 1) {
                        result.add(CodeConverter.TextTokenType.AlphaNumeric, lineText, topIndex, lineTextLength - topIndex);
                        i = lineTextLength;
                        break;
                    }
                }
                state.CurrentIndex = i;
            };
            Tokenizer.prototype.processSeperator = function (result, lineText, state) {
                var i = state.CurrentIndex;
                var topIndex = i;
                var lineTextLength = lineText.length;
                // Check multi-length-seperator and process letters
                var isMultiLengthSeperator = false;
                for (i = 0; i < state.Setting.MultiLengthSeperators.length; i++) {
                    var seperator = state.Setting.MultiLengthSeperators[i];
                    var seperatorLength = seperator.length;
                    if (topIndex <= lineTextLength - seperatorLength
                        && seperator == StringSubstring(lineText, topIndex, seperatorLength)) {
                        result.add(CodeConverter.TextTokenType.Seperator, lineText, topIndex, seperatorLength);
                        i = topIndex + seperatorLength;
                        isMultiLengthSeperator = true;
                        break;
                    }
                }
                // If not multi-length, process as a single letter
                if (!isMultiLengthSeperator) {
                    result.add(CodeConverter.TextTokenType.Seperator, lineText, topIndex, 1);
                    i = topIndex + 1;
                    topIndex = i;
                }
                state.CurrentIndex = i;
            };
            // Detail analyzing functions
            Tokenizer.prototype.isLineEndStartLetter = function (letter) {
                return (letter == '\n') || (letter == '\r');
            };
            Tokenizer.prototype.getLineEndLetterLength = function (lineText, index) {
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
            };
            return Tokenizer;
        }());
        TextTokenizer.Tokenizer = Tokenizer;
    })(TextTokenizer = CodeConverter.TextTokenizer || (CodeConverter.TextTokenizer = {}));
})(CodeConverter || (CodeConverter = {}));
