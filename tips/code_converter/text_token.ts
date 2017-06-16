
namespace CodeConverter {

    export enum TokenType {
        None,
        WhiteSpaces,
        LineEnd,
        LineComment,
        BlockCommentBegin,
        BlockComment,
        BlockCommentEnd,
        Seperator,
        AlphaNumeric,
        NumberLiteral,
        TextLiteral,
    }

    export class TextToken {
        Type: TokenType;
        Text: string;
        LineNumber: int;

        toString(): string {

            return this.LineNumber + " " + this.Type.toString() + " " + this.Text;
        }

        static joinToString(tokens: List<TextToken>): string {

            var result = new List<string>();
            for (var i = 0; i < tokens.length; i++) {
                result.push(tokens[i].Text);
            }

            return result.join('');
        }

        // Constructing methods
        static create(): TextToken {

            var token = new TextToken();
            token.Type = TokenType.None;

            return token;
        }

        static fromTypeText(tokenType: TokenType, text: string): TextToken {

            var token = new TextToken();
            token.Type = tokenType;
            token.Text = text;

            return token;
        }

        static fromTypeTextLineNumber(tokenType: TokenType, text: string, lineNumber): TextToken {

            var token = new TextToken();
            token.Type = tokenType;
            token.Text = text;
            token.LineNumber = lineNumber;

            return token;
        }

        // Distinguishing methods
        isWhitesSpace(): boolean {

            return (this.Type == TokenType.WhiteSpaces
                || this.Type == TokenType.LineEnd);
        }

        isLineEnd(): boolean {

            return (this.Type == TokenType.LineEnd);
        }

        isBlank(): boolean {

            return (this.Type == TokenType.WhiteSpaces
                || this.Type == TokenType.LineComment
                || this.Type == TokenType.BlockCommentBegin
                || this.Type == TokenType.BlockComment
                || this.Type == TokenType.BlockCommentEnd
                || this.Type == TokenType.LineEnd);
        }

        isComment(): boolean {

            return (this.Type == TokenType.LineComment
                || this.Type == TokenType.BlockCommentBegin
                || this.Type == TokenType.BlockComment
                || this.Type == TokenType.BlockCommentEnd);
        }

        // Scalar methods
        contains(searchText: string): boolean {

            return StringContains(this.Text, searchText);
        }

        startsWith(searchText: string): boolean {

            return StringStartsWith(this.Text, searchText);
        }

        endsWith(searchText: string): boolean {

            return (StringIndexOf(this.Text, searchText) == this.Text.length - 1);
        }

        findIndexFrom(textList: List<string>): int {

            for (var i = 0; i < textList.length; i++) {
                if (this.Text == textList[i]) {
                    return i;
                }
            }

            return -1;
        }

        findIndexStartsWithFrom(textList: List<string>): int {

            for (var i = 0; i < textList.length; i++) {
                if (this.startsWith(textList[i])) {
                    return i;
                }
            }

            return -1;
        }

        equalsAnyOf(textList: List<string>): boolean {

            return (this.findIndexFrom(textList) != -1);
        }

        startsWithAnyOf(textList: List<string>): boolean {

            return (this.findIndexStartsWithFrom(textList) != -1);
        }

        // List methods
        static getIndent(tokens: List<TextToken>): string {

            var result = new List<string>();
            for (var i = 0; i < tokens.length; i++) {
                if (tokens[i].Type == TokenType.WhiteSpaces) {
                    result.push(tokens[i].Text);
                }
                else {
                    break;
                }
            }

            return result.join();
        }

        static trim(tokens: List<TextToken>): List<TextToken> {

            var newTokens = new List<TextToken>();

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
        }

        static removeBlanks(tokens: List<TextToken>): List<TextToken> {

            var resultList = new List<TextToken>();

            for (var i = 0; i < tokens.length; i++) {
                var token = tokens[i];
                resultList.push(token);
            }

            return resultList;
        }

        static splitToLists(tokens: List<TextToken>, seperatorText: string): List<List<TextToken>> {

            var resultList = new List<List<TextToken>>();

            var innerList = new List<TextToken>();

            for (var i = 0; i < tokens.length; i++) {

                var isSeperator: boolean = (tokens[i].Text == seperatorText);

                if (!isSeperator || i == tokens.length - 1) {
                    innerList.push(tokens[i]);
                }

                if (isSeperator || i == tokens.length - 1) {
                    resultList.push(innerList);
                    innerList = new List<TextToken>();
                }
            }

            return resultList;
        }

        static findIndex(tokens: List<TextToken>, startIndex: int, endIndex: int, searchText: string, offset: int): int {

            if (endIndex == -1) {
                endIndex = tokens.length - 1;
            }

            for (var i = startIndex; i < endIndex; i++) {

                if (tokens[i].Text == searchText) {

                    if (i + offset < tokens.length) {
                        return i + offset;
                    }
                    else {
                        return -1;
                    }
                }
            }

            return -1;
        }

        static findFirstNonBlankIndex(tokens: List<TextToken>, searchStartIndex: int): int {
            return TextToken.findNonBlankIndex(tokens, searchStartIndex, true);
        }

        static findLastNonBlankIndex(tokens: List<TextToken>, searchStartIndex: int): int {
            return TextToken.findNonBlankIndex(tokens, searchStartIndex, false);
        }

        private static findNonBlankIndex(tokens: List<TextToken>, searchStartIndex: int, forwardSearch: boolean): int {

            var resultIndex = -1;

            var i: int;
            if (forwardSearch) {
                i = searchStartIndex;
            }
            else {
                i = tokens.length - 1 - searchStartIndex;
            }

            if (i < 0 || i >= tokens.length) {
                return -1;
            }

            while (true) {
                var token = tokens[i];

                if (!token.isBlank()) {
                    resultIndex = i;
                    break;
                }

                if (forwardSearch) {
                    i++;
                    if (i >= tokens.length) {
                        break;
                    }
                }
                else {
                    i--;
                    if (i < 0) {
                        break;
                    }
                }
            }

            return resultIndex;
        }

        static findIndexInZeroLevel(tokens: List<TextToken>, counter: ParenthesisCounter, startIndex: int, endIndex: int, searchLetter: string): int {

            counter.clear();

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

            if (resultIndex == -1) {
                return -1;
            }

            if (resultIndex >= 0 && resultIndex <= endIndex) {
                return resultIndex;
            }
            else {
                return -1;
            }
        }

        static getRange(tokens: List<TextToken>, startIndex: int, length: int): List<TextToken> {

            var result = tokens.slice(startIndex, startIndex + length);

            return result;
        }
    }

    export class TextRange {

        startIndex = -1;
        endIndex = -1;

        toString(): string {
            return this.startIndex + ':' + this.endIndex + '(' + this.length + ')';
        }

        get length(): int {
            if (this.startIndex == -1 || this.endIndex == -1) {
                return 0;
            }
            else {
                return this.endIndex - this.startIndex + 1;
            }
        }

        setStartIndex(index: int) {
            this.startIndex = index;
            if (this.endIndex == -1) {
                this.endIndex = index;
            }
        }

        setEndIndex(index: int) {
            this.endIndex = index;
            if (this.startIndex == -1) {
                this.startIndex = index;
            }
        }

        exists(): boolean {
            return (this.startIndex != -1 && this.endIndex != -1 && this.length > 0);
        }
    }

    export class ParenthesisCounter {

        parenthesisNestCount: int = 0;
        braceNestCount: int = 0;
        angleNestCount: int = 0;

        toString(): string {
            return "(): " + this.parenthesisNestCount + " {}: " + this.braceNestCount + " <>: " + this.angleNestCount;
        }

        clear() {
            this.parenthesisNestCount = 0;
            this.braceNestCount = 0;
            this.angleNestCount = 0;
        }

        countParenthesis(token: TextToken) {

            if (token.Type != TokenType.Seperator) {
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
        }
    }

    export class TextTokenListView extends List<TextToken> {

        ParenthesisCounter: ParenthesisCounter;

        toString(): string {
            return "length: " + this.length;
        }

        static create(): TextTokenListView {

            return TextTokenListView.createFrom(new List<TextToken>());
        }

        static createFrom(tokens: List<TextToken>): TextTokenListView {

            var target: any = tokens.slice(0);

            TextTokenListView.initialize(target);

            return <TextTokenListView>target;
        }

        static initialize(tokens: List<TextToken>) {

            var target: any = tokens;
            target.ParenthesisCounter = new ParenthesisCounter();
            target.findIndexInZeroLevel = TextTokenListView.prototype.findIndexInZeroLevel;
            target.getRange = TextTokenListView.prototype.getRange;

            return <TextTokenListView>target;
        }

        findIndexInZeroLevel(startIndex: int, endIndex: int, searchLetter: string): int {

            return TextToken.findIndexInZeroLevel(this, this.ParenthesisCounter, startIndex, endIndex, searchLetter);
        }

        getRange(startIndex: int, length: int): List<TextToken> {

            return TextToken.getRange(this, startIndex, length);
        }

    }
}
