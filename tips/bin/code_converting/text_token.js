var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var CodeConverter;
(function (CodeConverter) {
    var TextTokenType;
    (function (TextTokenType) {
        TextTokenType[TextTokenType["None"] = 0] = "None";
        TextTokenType[TextTokenType["WhiteSpaces"] = 1] = "WhiteSpaces";
        TextTokenType[TextTokenType["LineEnd"] = 2] = "LineEnd";
        TextTokenType[TextTokenType["LineComment"] = 3] = "LineComment";
        TextTokenType[TextTokenType["BlockCommentBegin"] = 4] = "BlockCommentBegin";
        TextTokenType[TextTokenType["BlockComment"] = 5] = "BlockComment";
        TextTokenType[TextTokenType["BlockCommentEnd"] = 6] = "BlockCommentEnd";
        TextTokenType[TextTokenType["Seperator"] = 7] = "Seperator";
        TextTokenType[TextTokenType["AlphaNumeric"] = 8] = "AlphaNumeric";
        TextTokenType[TextTokenType["NumberLiteral"] = 9] = "NumberLiteral";
        TextTokenType[TextTokenType["TextLiteral"] = 10] = "TextLiteral";
    })(TextTokenType = CodeConverter.TextTokenType || (CodeConverter.TextTokenType = {}));
    var TextToken = (function () {
        function TextToken() {
        }
        TextToken.prototype.toString = function () {
            return this.LineNumber + ' ' + this.Type.toString() + ' ' + this.Text;
        };
        TextToken.joinToString = function (tokens) {
            var result = new List();
            for (var i = 0; i < tokens.length; i++) {
                result.push(tokens[i].Text);
            }
            return result.join('');
        };
        // Constructing methods
        TextToken.create = function () {
            var token = new TextToken();
            token.Type = TextTokenType.None;
            return token;
        };
        TextToken.fromTypeText = function (tokenType, text) {
            var token = new TextToken();
            token.Type = tokenType;
            token.Text = text;
            return token;
        };
        TextToken.fromTypeTextLineNumber = function (tokenType, text, lineNumber) {
            var token = new TextToken();
            token.Type = tokenType;
            token.Text = text;
            token.LineNumber = lineNumber;
            return token;
        };
        // Distinguishing methods
        TextToken.prototype.is = function (type, text) {
            return (this.Type == type && this.Text == text);
        };
        TextToken.prototype.isAlphaNumericOf = function (text) {
            return (this.Type == TextTokenType.AlphaNumeric && this.Text == text);
        };
        TextToken.prototype.isSeperatorOf = function (text) {
            return (this.Type == TextTokenType.Seperator && this.Text == text);
        };
        TextToken.prototype.isWhitesSpace = function () {
            return (this.Type == TextTokenType.WhiteSpaces);
        };
        TextToken.prototype.isLineEnd = function () {
            return (this.Type == TextTokenType.LineEnd);
        };
        TextToken.prototype.isBlank = function () {
            return (this.Type == TextTokenType.WhiteSpaces
                || this.Type == TextTokenType.LineComment
                || this.Type == TextTokenType.BlockCommentBegin
                || this.Type == TextTokenType.BlockComment
                || this.Type == TextTokenType.BlockCommentEnd
                || this.Type == TextTokenType.LineEnd);
        };
        TextToken.prototype.isComment = function () {
            return (this.Type == TextTokenType.LineComment
                || this.Type == TextTokenType.BlockCommentBegin
                || this.Type == TextTokenType.BlockComment
                || this.Type == TextTokenType.BlockCommentEnd);
        };
        TextToken.prototype.isLineComment = function () {
            return (this.Type == TextTokenType.LineComment);
        };
        TextToken.prototype.isAlphaNumeric = function () {
            return (this.Type == TextTokenType.AlphaNumeric);
        };
        // Scalar methods
        TextToken.prototype.contains = function (searchText) {
            return StringContains(this.Text, searchText);
        };
        TextToken.prototype.startsWith = function (searchText) {
            return StringStartsWith(this.Text, searchText);
        };
        TextToken.prototype.endsWith = function (searchText) {
            return (StringIndexOf(this.Text, searchText, 0) == this.Text.length - 1);
        };
        TextToken.prototype.findIndexFrom = function (textList) {
            for (var i = 0; i < textList.length; i++) {
                if (this.Text == textList[i]) {
                    return i;
                }
            }
            return -1;
        };
        TextToken.prototype.findIndexStartsWithFrom = function (textList) {
            for (var i = 0; i < textList.length; i++) {
                if (this.startsWith(textList[i])) {
                    return i;
                }
            }
            return -1;
        };
        TextToken.prototype.equalsAnyOf = function (textList) {
            return (this.findIndexFrom(textList) != -1);
        };
        TextToken.prototype.startsWithAnyOf = function (textList) {
            return (this.findIndexStartsWithFrom(textList) != -1);
        };
        // List methods
        TextToken.getIndent = function (tokens) {
            var result = new List();
            for (var i = 0; i < tokens.length; i++) {
                if (tokens[i].Type == TextTokenType.WhiteSpaces) {
                    result.push(tokens[i].Text);
                }
                else {
                    break;
                }
            }
            return result.join();
        };
        TextToken.trim = function (tokens) {
            var newTokens = new List();
            var firstIndex = -1;
            for (var i = 0; i < tokens.length; i++) {
                var token = tokens[i];
                if (!token.isBlank()) {
                    firstIndex = i;
                    break;
                }
            }
            if (firstIndex == -1) {
                return newTokens;
            }
            var lastIndex = -1;
            for (var i = tokens.length - 1; i >= 0; i--) {
                var token = tokens[i];
                if (!token.isBlank()) {
                    lastIndex = i;
                    break;
                }
            }
            if (lastIndex == -1) {
                return newTokens;
            }
            for (var i = firstIndex; i <= lastIndex; i++) {
                newTokens.push(tokens[i]);
            }
            return newTokens;
        };
        TextToken.removeBlanks = function (tokens) {
            var resultList = new List();
            for (var i = 0; i < tokens.length; i++) {
                var token = tokens[i];
                resultList.push(token);
            }
            return resultList;
        };
        TextToken.splitToLists = function (tokens, seperatorText) {
            var resultList = new List();
            var innerList = new List();
            for (var i = 0; i < tokens.length; i++) {
                var isSeperator = (tokens[i].Text == seperatorText);
                if (!isSeperator || i == tokens.length - 1) {
                    innerList.push(tokens[i]);
                }
                if (isSeperator || i == tokens.length - 1) {
                    resultList.push(innerList);
                    if (i == tokens.length - 1) {
                        break;
                    }
                    innerList = new List();
                }
            }
            return resultList;
        };
        TextToken.getRange = function (tokens, startIndex, length) {
            if (length == -1) {
                length = tokens.length - startIndex;
            }
            var result = tokens.slice(startIndex, startIndex + length);
            return result;
        };
        TextToken.findIndex = function (tokens, startIndex, endIndex, searchText) {
            if (endIndex == -1) {
                endIndex = tokens.length - 1;
            }
            for (var i = startIndex; i < endIndex; i++) {
                if (tokens[i].Text == searchText) {
                    return i;
                }
            }
            return -1;
        };
        TextToken.findFirstNonBlankIndex = function (tokens, startIndex, endIndex) {
            if (endIndex == -1) {
                endIndex = tokens.length - 1;
            }
            var resultIndex = -1;
            for (var i = startIndex; i <= endIndex; i++) {
                var token = tokens[i];
                if (!token.isBlank()) {
                    resultIndex = i;
                    break;
                }
            }
            return resultIndex;
        };
        TextToken.findLastNonBlankIndex = function (tokens, startIndex, endIndex) {
            if (endIndex == -1) {
                endIndex = tokens.length - 1;
            }
            var resultIndex = -1;
            for (var i = endIndex; i >= startIndex; i--) {
                var token = tokens[i];
                if (!token.isBlank()) {
                    resultIndex = i;
                    break;
                }
            }
            return resultIndex;
        };
        TextToken.findIndexInZeroLevel = function (tokens, counter, startIndex, endIndex, searchLetter) {
            counter.reset();
            var resultIndex = -1;
            if (endIndex == -1) {
                endIndex = tokens.length - 1;
            }
            for (var i = startIndex; i <= endIndex; i++) {
                var token = tokens[i];
                if (counter.parenthesisNestCount == 0 && counter.braceNestCount == 0 && counter.angleNestCount == 0
                    && token.Text == searchLetter) {
                    resultIndex = i;
                    break;
                }
                counter.countParenthesis(token);
                if (counter.parenthesisNestCount == 0 && counter.braceNestCount == 0 && counter.angleNestCount == 0
                    && token.Text == searchLetter) {
                    resultIndex = i;
                    break;
                }
            }
            if (resultIndex >= 0 && resultIndex <= endIndex) {
                return resultIndex;
            }
            else {
                return -1;
            }
        };
        TextToken.findNonWhiteSpaceIndex = function (tokens, startIndex, endIndex) {
            if (endIndex == -1) {
                endIndex = tokens.length - 1;
            }
            for (var i = startIndex; i < endIndex; i++) {
                if (!tokens[i].isWhitesSpace()) {
                    return i;
                }
            }
            return -1;
        };
        return TextToken;
    }());
    CodeConverter.TextToken = TextToken;
    var TextRange = (function () {
        function TextRange() {
            this.startIndex = -1;
            this.endIndex = -1;
        }
        TextRange.prototype.toString = function () {
            return this.startIndex + ':' + this.endIndex + '(' + this.length + ')';
        };
        Object.defineProperty(TextRange.prototype, "length", {
            get: function () {
                if (this.startIndex == -1 || this.endIndex == -1) {
                    return 0;
                }
                else {
                    return this.endIndex - this.startIndex + 1;
                }
            },
            enumerable: true,
            configurable: true
        });
        TextRange.prototype.setStartIndex = function (index) {
            this.startIndex = index;
            if (this.endIndex == -1) {
                this.endIndex = index;
            }
        };
        TextRange.prototype.setEndIndex = function (index) {
            this.endIndex = index;
            if (this.startIndex == -1) {
                this.startIndex = index;
            }
        };
        TextRange.prototype.exists = function () {
            return (this.startIndex != -1 && this.endIndex != -1 && this.length > 0);
        };
        return TextRange;
    }());
    CodeConverter.TextRange = TextRange;
    var NestingCounter = (function () {
        function NestingCounter() {
            this.parenthesisNestCount = 0;
            this.braceNestCount = 0;
            this.angleNestCount = 0;
        }
        NestingCounter.prototype.toString = function () {
            return '(): ' + this.parenthesisNestCount + ' {}: ' + this.braceNestCount + ' <>: ' + this.angleNestCount;
        };
        NestingCounter.prototype.reset = function () {
            this.parenthesisNestCount = 0;
            this.braceNestCount = 0;
            this.angleNestCount = 0;
        };
        NestingCounter.prototype.countParenthesis = function (token) {
            if (token.Type != TextTokenType.Seperator) {
                return;
            }
            if (token.Text == '(') {
                this.parenthesisNestCount++;
            }
            else if (token.Text == ')') {
                this.parenthesisNestCount--;
            }
            else if (token.Text == '{') {
                this.braceNestCount++;
            }
            else if (token.Text == '}') {
                this.braceNestCount--;
            }
            else if (token.Text == '<') {
                this.angleNestCount++;
            }
            else if (token.Text == '>' && this.angleNestCount > 0) {
                this.angleNestCount--;
            }
            // Easy way to distinguish between comparison operator < > and generics < >
            // by detecting not-used letter in type specifying
            if (this.angleNestCount > 0) {
                if (token.Text != '.' && token.Text != ',' && token.Text != '<' && token.Text != '>') {
                    this.angleNestCount = 0;
                }
            }
        };
        NestingCounter.prototype.isInNest = function () {
            return (this.parenthesisNestCount > 0 || this.braceNestCount > 0 || this.angleNestCount > 0);
        };
        return NestingCounter;
    }());
    CodeConverter.NestingCounter = NestingCounter;
    var TextTokenCollection = (function (_super) {
        __extends(TextTokenCollection, _super);
        function TextTokenCollection() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        TextTokenCollection.prototype.toString = function () {
            return 'length: ' + this.length;
        };
        TextTokenCollection.create = function () {
            return TextTokenCollection.createFrom(new List());
        };
        TextTokenCollection.createFrom = function (tokens) {
            var target = tokens.slice(0);
            return TextTokenCollection.initialize(target);
        };
        TextTokenCollection.initialize = function (tokens) {
            var target = tokens;
            target.ParenthesisCounter = null;
            target.findIndexInZeroLevel = TextTokenCollection.prototype.findIndexInZeroLevel;
            target.getRange = TextTokenCollection.prototype.getRange;
            Object.defineProperty(target, 'endIndex', Object.getOwnPropertyDescriptor(TextTokenCollection.prototype, 'endIndex'));
            return target;
        };
        Object.defineProperty(TextTokenCollection.prototype, "endIndex", {
            get: function () {
                return this.length - 1;
            },
            enumerable: true,
            configurable: true
        });
        TextTokenCollection.prototype.findIndexInZeroLevel = function (startIndex, endIndex, searchLetter) {
            if (this.NestingCounter == null) {
                this.NestingCounter = new NestingCounter();
            }
            return TextToken.findIndexInZeroLevel(this, this.NestingCounter, startIndex, endIndex, searchLetter);
        };
        TextTokenCollection.prototype.getRange = function (startIndex, length) {
            return TextToken.getRange(this, startIndex, length);
        };
        TextTokenCollection.prototype.findNonWhiteSpaceIndex = function (startIndex, endIndex) {
            return TextToken.findNonWhiteSpaceIndex(this, startIndex, endIndex);
        };
        return TextTokenCollection;
    }(List));
    CodeConverter.TextTokenCollection = TextTokenCollection;
})(CodeConverter || (CodeConverter = {}));
