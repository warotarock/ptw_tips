
namespace CodeConverter {

    export enum TextTokenType {
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
        Type: TextTokenType;
        Text: string;
        LineNumber: int;

        toString(): string {

            return this.LineNumber + " " + this.Type.toString() + " " + this.Text;
        }

        static joinToString(tokens: List<TextToken>): string {

            let result = new List<string>();
            for (let i = 0; i < tokens.length; i++) {
                result.push(tokens[i].Text);
            }

            return result.join('');
        }

        // Constructing methods
        static create(): TextToken {

            let token = new TextToken();
            token.Type = TextTokenType.None;

            return token;
        }

        static fromTypeText(tokenType: TextTokenType, text: string): TextToken {

            let token = new TextToken();
            token.Type = tokenType;
            token.Text = text;

            return token;
        }

        static fromTypeTextLineNumber(tokenType: TextTokenType, text: string, lineNumber): TextToken {

            let token = new TextToken();
            token.Type = tokenType;
            token.Text = text;
            token.LineNumber = lineNumber;

            return token;
        }

        // Distinguishing methods
        is(type: TextTokenType, text: string): boolean {

            return (this.Type == type || this.Text == text);
        }

        isWhitesSpace(): boolean {

            return (this.Type == TextTokenType.WhiteSpaces
                || this.Type == TextTokenType.LineEnd);
        }

        isLineEnd(): boolean {

            return (this.Type == TextTokenType.LineEnd);
        }

        isBlank(): boolean {

            return (this.Type == TextTokenType.WhiteSpaces
                || this.Type == TextTokenType.LineComment
                || this.Type == TextTokenType.BlockCommentBegin
                || this.Type == TextTokenType.BlockComment
                || this.Type == TextTokenType.BlockCommentEnd
                || this.Type == TextTokenType.LineEnd);
        }

        isComment(): boolean {

            return (this.Type == TextTokenType.LineComment
                || this.Type == TextTokenType.BlockCommentBegin
                || this.Type == TextTokenType.BlockComment
                || this.Type == TextTokenType.BlockCommentEnd);
        }

        isLineComment(): boolean {

            return (this.Type == TextTokenType.LineComment);
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

            for (let i = 0; i < textList.length; i++) {
                if (this.Text == textList[i]) {
                    return i;
                }
            }

            return -1;
        }

        findIndexStartsWithFrom(textList: List<string>): int {

            for (let i = 0; i < textList.length; i++) {
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

            let result = new List<string>();
            for (let i = 0; i < tokens.length; i++) {
                if (tokens[i].Type == TextTokenType.WhiteSpaces) {
                    result.push(tokens[i].Text);
                }
                else {
                    break;
                }
            }

            return result.join();
        }

        static trim(tokens: List<TextToken>): List<TextToken> {

            let newTokens = new List<TextToken>();

            let firstIndex = -1;
            for (let i = 0; i < tokens.length; i++) {
                let token = tokens[i];
                if (!token.isBlank()) {
                    firstIndex = i;
                    break;
                }
            }

            if (firstIndex == -1) {
                return newTokens;
            }

            let lastIndex = -1;
            for (let i = tokens.length - 1; i >= 0; i--) {
                let token = tokens[i];
                if (!token.isBlank()) {
                    lastIndex = i;
                    break;
                }
            }

            if (lastIndex == -1) {
                return newTokens;
            }

            for (let i = firstIndex; i <= lastIndex; i++) {
                newTokens.push(tokens[i]);
            }

            return newTokens;
        }

        static removeBlanks(tokens: List<TextToken>): List<TextToken> {

            let resultList = new List<TextToken>();

            for (let i = 0; i < tokens.length; i++) {
                let token = tokens[i];
                resultList.push(token);
            }

            return resultList;
        }

        static splitToLists(tokens: List<TextToken>, seperatorText: string): List<List<TextToken>> {

            let resultList = new List<List<TextToken>>();

            let innerList = new List<TextToken>();

            for (let i = 0; i < tokens.length; i++) {

                let isSeperator: boolean = (tokens[i].Text == seperatorText);

                if (!isSeperator || i == tokens.length - 1) {
                    innerList.push(tokens[i]);
                }

                if (isSeperator || i == tokens.length - 1) {
                    resultList.push(innerList);

                    if (i == tokens.length - 1) {
                        break;
                    }

                    innerList = new List<TextToken>();
                }
            }

            return resultList;
        }

        static getRange(tokens: List<TextToken>, startIndex: int, length: int): List<TextToken> {

            if (length == -1) {
                length = tokens.length - startIndex;
            }

            let result = tokens.slice(startIndex, startIndex + length);

            return result;
        }

        static findIndex(tokens: List<TextToken>, startIndex: int, endIndex: int, searchText: string): int {

            if (endIndex == -1) {
                endIndex = tokens.length - 1;
            }

            for (let i = startIndex; i < endIndex; i++) {

                if (tokens[i].Text == searchText) {
                    return i;
                }
            }

            return -1;
        }

        static findFirstNonBlankIndex(tokens: List<TextToken>, startIndex: int, endIndex: int): int {

            if (endIndex == -1) {
                endIndex = tokens.length - 1;
            }

            let resultIndex = -1;

            for (let i = startIndex; i <= endIndex; i++) {
                let token = tokens[i];

                if (!token.isBlank()) {
                    resultIndex = i;
                    break;
                }
            }

            return resultIndex;
        }

        static findLastNonBlankIndex(tokens: List<TextToken>, startIndex: int, endIndex: int): int {

            if (endIndex == -1) {
                endIndex = tokens.length - 1;
            }

            let resultIndex = -1;

            for (let i = endIndex; i >= startIndex; i--) {
                let token = tokens[i];

                if (!token.isBlank()) {
                    resultIndex = i;
                    break;
                }
            }

            return resultIndex;
        }

        static findIndexInZeroLevel(tokens: List<TextToken>, counter: ParenthesisCounter, startIndex: int, endIndex: int, searchLetter: string): int {

            counter.clear();

            let resultIndex = -1;

            if (endIndex == -1) {
                endIndex = tokens.length - 1;
            }

            for (let i = startIndex; i <= endIndex; i++) {
                let token = tokens[i];

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
        }

        static findNonWhiteSpaceIndex(tokens: List<TextToken>, startIndex: int, endIndex: int): int {

            if (endIndex == -1) {
                endIndex = tokens.length - 1;
            }

            for (let i = startIndex; i < endIndex; i++) {

                if (!tokens[i].isWhitesSpace()) {
                    return i;
                }
            }

            return -1;
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
        }
    }

    export class TextTokenCollection extends List<TextToken> {

        ParenthesisCounter: ParenthesisCounter;

        toString(): string {
            return "length: " + this.length;
        }

        static create(): TextTokenCollection {

            return TextTokenCollection.createFrom(new List<TextToken>());
        }

        static createFrom(tokens: List<TextToken>): TextTokenCollection {

            let target: any = tokens.slice(0);

            TextTokenCollection.initialize(target);

            return <TextTokenCollection>target;
        }

        static initialize(tokens: List<TextToken>) {

            let target: any = tokens;
            target.ParenthesisCounter = new ParenthesisCounter();
            target.findIndexInZeroLevel = TextTokenCollection.prototype.findIndexInZeroLevel;
            target.getRange = TextTokenCollection.prototype.getRange;

            target.__defineGetter__('endIndex', TextTokenCollection.prototype.endIndex);

            return <TextTokenCollection>target;
        }

        get endIndex(): int {
            return this.length - 1;
        }

        findIndexInZeroLevel(startIndex: int, endIndex: int, searchLetter: string): int {

            return TextToken.findIndexInZeroLevel(this, this.ParenthesisCounter, startIndex, endIndex, searchLetter);
        }

        getRange(startIndex: int, length: int): List<TextToken> {

            return TextToken.getRange(this, startIndex, length);
        }

        findNonWhiteSpaceIndex(startIndex: int, endIndex: int): int {
            return TextToken.findNonWhiteSpaceIndex(this, startIndex, endIndex);
        }
    }
}
