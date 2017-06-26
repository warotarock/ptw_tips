
namespace CodeConverter {

    export enum StatementType {
        None,
        WhiteSpaces,
        Comment,
        Module,
        Enum,
        EnumMember,
        Class,
        Interface,
        Function,
        AbstructFunctionDefinition,
        Variable,

        PrecompileDirective,
        SourceLanguageCodeBegin,
        SourceLanguageCodeEnd,
        TargetLanguageCode,
        ConverterAnotation,
    }

    export class CodeStatement {

        Type = StatementType.None;
        TokensList: List<TextTokenCollection> = null;
        InnerStatements: List<CodeStatement> = null;

        get LineNumber(): int {
            if (this.TokensList != null && this.TokensList.length > 0) {
                return this.TokensList[0][0].LineNumber;
            }
            else {
                return 0;
            }
        }
    }
}

namespace CodeConverter.StatementAnalyzer {

    export class AnalyzerSetting {

        TS_module = 'module';
        TS_namespace = 'namespace';
        TS_enum = 'enum';
        TS_class = 'class';
        TS_interface = 'interface';
        TS_constructor = 'constructor';
        TS_get = 'get';
        TS_set = 'set';

        TS_AccesTypes: Dictionary<string> = {
            'public': 'public',
            'private': 'private',
            'protected': 'protected',
        };

        FilePath: string = null;
    }

    export class AnalyzerResult {

        Statements = new List<CodeStatement>();

        LineNumber = 0;
        CurrentStatement = new CodeStatement();
        NeedsNewTokensBeforeAppendToken = true;

        SetCurrentStatementType(type: StatementType) {
            this.CurrentStatement.Type = type;
        }

        AppendToCurrentStatement(token: TextToken) {

            if (this.NeedsNewTokensBeforeAppendToken) {

                if (this.CurrentStatement.TokensList == null) {
                    this.CurrentStatement.TokensList = new List<TextTokenCollection>();
                }

                this.NeedsNewTokensBeforeAppendToken = false;
                this.CurrentStatement.TokensList.push(TextTokenCollection.create());
            }

            this.CurrentStatement.TokensList[this.CurrentStatement.TokensList.length - 1].push(token);
        }

        SetInnerStatementToCurrentStatement(statements: List<CodeStatement>) {

            this.CurrentStatement.InnerStatements = statements;
        }

        FlushCurrentStatementTokens() {
            this.NeedsNewTokensBeforeAppendToken = true;
        }

        FlushStatement() {

            this.Statements.push(this.CurrentStatement);

            this.CurrentStatement = new CodeStatement();
            this.NeedsNewTokensBeforeAppendToken = true;
        }
    }

    export enum SyntaxProcessingMode {
        None,
        Blank,
        Module,
        Enum,
        Class,
        Interface,
    }

    export enum CodeBlockProcessingMode {
        None,
        Continue,
        BlockEnd,
        SyntaxStart,
    }

    export enum TracingState {
        None,
        UnexpectedEOF,

        SearchingIdentifier,
        SearchingAfterIdentifer,

        TracingVariableTypeName,
        TracingVariableDefinitionDefaultValue,

        TracingFunctionAarguments,
        TracingFunctionGenericsArguments,
        SearchingFunctionReturnValueTypeOrBlockStart,
        TracingFunctionReturnValueType,

        SearchingEnumIdentifierName,
        SearchingEnumBlockStart,
        EnumDefinitionDetected,

        VariableDefinitionDetected,
        FunctionDefinitionDetected,
        AbstructFunctionDefinitionDetected,
    }

    export class AnalyzerState {

        Setting: AnalyzerSetting = null;
        TargetTokens: List<TextToken> = null;

        // State variables
        CurrentMode = SyntaxProcessingMode.None;
        CurrentIndex = 0;
        LastIndex = 0;
        SyntaxEnd = false;
        BlockEnd = false;

        public CurrentMode2: SyntaxProcessingMode;

        TracingState = TracingState.None;
        Trace_NestingCounter = new NestingCounter();
        Trace_DetectedAccesibilityTypeToken: TextToken = null;
        Trace_AccessTypeDetected = false;
        Trace_IdentifierDetected = false;
        Trace_TypeNameSeperatorDeteced = false;
        Trace_TypeNameDeteced = false;
        Trace_AsignmentDeteced = false;
        Trace_FunctioArgumentDeteced = false;
        Trace_FunctionGenericsArgumentDeteced = false;

        // Result variables
        Result: AnalyzerResult = null;
        Erros = new List<string>();

        initialize(setting: AnalyzerSetting) {
            this.Setting = setting;
            this.clear();
        }

        clear() {
            this.CurrentMode = SyntaxProcessingMode.None;
            this.CurrentIndex = 0;
            this.LastIndex = 0;
            this.BlockEnd = false;
            this.TargetTokens = null;

            this.Result = null;
        }

        startTracing() {
            this.TracingState = TracingState.SearchingIdentifier;
            this.Trace_NestingCounter.reset();
            this.Trace_DetectedAccesibilityTypeToken = null;
            this.Trace_AccessTypeDetected = false;
            this.Trace_IdentifierDetected = false;
            this.Trace_TypeNameSeperatorDeteced = false;
            this.Trace_TypeNameDeteced = false;
            this.Trace_AsignmentDeteced = false;
            this.Trace_FunctioArgumentDeteced = false;
            this.Trace_FunctionGenericsArgumentDeteced = false;
        }

        cloneForInnerState(): AnalyzerState {

            var state = new AnalyzerState();
            state.Setting = this.Setting;
            state.TargetTokens = this.TargetTokens;
            state.Result = this.Result;
            state.Erros = this.Erros;
            state.CurrentIndex = this.CurrentIndex;

            return state;
        }

        addError(message: string) {

            this.Erros.push(this.Setting.FilePath
                + '(' + this.TargetTokens[this.CurrentIndex].LineNumber + '): '
                + message);
        }
    }

    export class Analyzer {

        analyze(result: AnalyzerResult, tokens: TextTokenCollection, state: AnalyzerState) {

            state.Result = result;
            state.TargetTokens = tokens;

            this.processCodeBlock(result, tokens, state);
        }

        // Syntax part parsing

        private processSyntaxPart(result: AnalyzerResult, tokens: TextTokenCollection, state: AnalyzerState) {

            let currentIndex = state.CurrentIndex;

            state.SyntaxEnd = false;

            while (state.CurrentIndex < tokens.length) {

                this.processSyntax_TraceSyntax(tokens, state);

                var mode = this.processSyntax_GetProcessingMode(tokens, state);

                switch (mode) {

                    case SyntaxProcessingMode.Module:
                        this.processSyntax_GeneralBlockFormSyntax(StatementType.Module, result, tokens, state);
                        break;

                    case SyntaxProcessingMode.Enum:
                        this.processSyntax_GeneralListFormStatement(StatementType.Enum, result, tokens, state);
                        break;

                    case SyntaxProcessingMode.Class:
                        this.processSyntax_GeneralBlockFormSyntax(StatementType.Class, result, tokens, state);
                        break;

                    case SyntaxProcessingMode.Interface:
                        this.processSyntax_GeneralBlockFormSyntax(StatementType.Interface, result, tokens, state);
                        break;

                    case SyntaxProcessingMode.None:
                    case SyntaxProcessingMode.Blank:
                        state.CurrentIndex++;
                        break;
                }

                if (state.SyntaxEnd) {
                    break;
                }
            }
        }

        private processSyntax_TraceSyntax(tokens: TextTokenCollection, state: AnalyzerState) {

            let currentIndex = state.CurrentIndex;

            state.startTracing();

            while (state.CurrentIndex < tokens.length) {

                let token = tokens[currentIndex];

                if (state.TracingState == TracingState.SearchingIdentifier) {

                    if (token.isAlphaNumeric()) {

                        // detection accesibility
                        if (DictionaryContainsKey(state.Setting.TS_AccesTypes, token.Text)) {
                            if (!state.Trace_AccessTypeDetected) {
                                state.Trace_AccessTypeDetected = true;
                                state.Trace_DetectedAccesibilityTypeToken = token;
                            }
                            else {
                                state.addError('Accessibility modifier already seen.');
                            }
                            state.CurrentIndex++;
                        }
                        else if (token.isAlphaNumericOf(state.Setting.TS_enum)) {
                            state.TracingState = TracingState.SearchingEnumIdentifierName;
                        }
                        else {
                            // detect identifier
                            state.Trace_IdentifierDetected = true;
                            state.TracingState = TracingState.SearchingAfterIdentifer;
                            state.CurrentIndex++;
                        }
                    }
                    else if (!token.isBlank()) {
                        state.addError('Unexpected token. A constructor, method, accessor, or property was expected.');
                        state.CurrentIndex++;
                    }
                    else {
                        state.CurrentIndex++;
                    }
                }
                else if (state.TracingState == TracingState.SearchingAfterIdentifer) {

                    if (token.isSeperatorOf(':')) {
                        state.Trace_TypeNameSeperatorDeteced = true;
                        state.TracingState = TracingState.TracingVariableTypeName;
                        state.CurrentIndex++;
                    }
                    else if (token.isSeperatorOf('=')) {
                        state.Trace_AsignmentDeteced = true;
                        state.TracingState = TracingState.TracingVariableDefinitionDefaultValue;
                        state.CurrentIndex++;
                    }
                    else if (token.isSeperatorOf('(')) {
                        state.Trace_AsignmentDeteced = true;
                        state.TracingState = TracingState.TracingFunctionAarguments;
                    }
                    else if (token.isSeperatorOf('<')) {
                        state.Trace_FunctionGenericsArgumentDeteced = true;
                        state.TracingState = TracingState.TracingFunctionGenericsArguments;
                    }
                    else if (!token.isBlank()) {
                        state.addError('= or : or function argument expected.');
                        state.CurrentIndex++;
                    }
                    else {
                        state.CurrentIndex++;
                    }
                }

                // variable
                else if (state.TracingState == TracingState.TracingVariableTypeName) {

                    state.Trace_NestingCounter.countParenthesis(token);

                    if (!state.Trace_NestingCounter.isInNest()) {

                        if (token.isSeperatorOf('=')) {
                            state.TracingState = TracingState.TracingVariableDefinitionDefaultValue;
                        }
                        else if (token.isSeperatorOf(';')) {
                            state.TracingState = TracingState.VariableDefinitionDetected;
                        }
                        else if (token.isLineEnd()) {
                            state.addError('; expected.');
                            state.TracingState = TracingState.VariableDefinitionDetected;
                        }
                        else if (token.isBlank()) {
                            state.CurrentIndex++;
                        }
                        else {
                            state.addError('= or ; expected.');
                            state.CurrentIndex++;
                        }
                    }
                    else {
                        state.CurrentIndex++;
                    }
                }
                else if (state.TracingState == TracingState.TracingVariableDefinitionDefaultValue) {

                    state.Trace_NestingCounter.countParenthesis(token);

                    if (!state.Trace_NestingCounter.isInNest()) {
                        if (token.isSeperatorOf(';')) {
                            state.TracingState = TracingState.VariableDefinitionDetected;
                        }
                        else if (token.isLineEnd()) {
                            state.addError('; expected.');
                            state.TracingState = TracingState.VariableDefinitionDetected;
                        }
                        else {
                            state.CurrentIndex++;
                        }
                    }
                    else {
                        state.CurrentIndex++;
                    }
                }

                // function
                else if (state.TracingState == TracingState.TracingFunctionGenericsArguments) {

                    state.Trace_NestingCounter.countParenthesis(token);

                    if (!state.Trace_NestingCounter.isInNest()) {
                        if (token.isSeperatorOf('>')) {
                            state.TracingState = TracingState.SearchingAfterIdentifer;
                            state.CurrentIndex++;
                        }
                        else {
                            state.CurrentIndex++;
                        }
                    }
                    else {
                        state.CurrentIndex++;
                    }
                }
                else if (state.TracingState == TracingState.TracingFunctionAarguments) {

                    state.Trace_NestingCounter.countParenthesis(token);

                    if (!state.Trace_NestingCounter.isInNest()) {
                        if (token.isSeperatorOf(')')) {
                            state.TracingState = TracingState.SearchingFunctionReturnValueTypeOrBlockStart;
                            state.CurrentIndex++;
                        }
                        else {
                            state.CurrentIndex++;
                        }
                    }
                    else {
                        state.CurrentIndex++;
                    }
                }
                else if (state.TracingState == TracingState.SearchingFunctionReturnValueTypeOrBlockStart) {

                    state.Trace_NestingCounter.countParenthesis(token);

                    if (!state.Trace_NestingCounter.isInNest()) {
                        if (token.isSeperatorOf(':')) {
                            state.TracingState = TracingState.TracingFunctionReturnValueType;
                            state.CurrentIndex++;
                        }
                        else if (token.isSeperatorOf('{')) {
                            state.TracingState = TracingState.FunctionDefinitionDetected;
                        }
                        else if (!token.isBlank()) {
                            state.addError(': or { expected.');
                            state.CurrentIndex++;
                        }
                        else {
                            state.CurrentIndex++;
                        }
                    }
                    else {
                        state.CurrentIndex++;
                    }
                }
                else if (state.TracingState == TracingState.TracingFunctionReturnValueType) {

                    state.Trace_NestingCounter.countParenthesis(token);

                    if (!state.Trace_NestingCounter.isInNest()) {
                        if (token.isSeperatorOf('{')) {
                            state.TracingState = TracingState.FunctionDefinitionDetected;
                            state.CurrentIndex++;
                        }
                        else if (token.isSeperatorOf(';')) {
                            // TODO: supprt only for interface
                            state.TracingState = TracingState.AbstructFunctionDefinitionDetected;
                            state.CurrentIndex++;
                        }
                        else if (!token.isBlank()) {
                            // TODO: change error message whether class or interface
                            state.addError('{ or ; expected.');
                            state.TracingState = TracingState.VariableDefinitionDetected;
                        }
                        else {
                            state.CurrentIndex++;
                        }
                    }
                    else {
                        state.CurrentIndex++;
                    }
                }

                // enum
                else if (state.TracingState == TracingState.SearchingEnumIdentifierName) {

                    if (token.isAlphaNumeric()) {
                        state.TracingState = TracingState.SearchingEnumBlockStart;
                        state.CurrentIndex++;
                    }
                    else if (!token.isBlank()) {
                        state.addError('Identifier name for enum expected.');
                        state.CurrentIndex++;
                    }
                    else {
                        state.CurrentIndex++;
                    }
                }
                else if (state.TracingState == TracingState.SearchingEnumBlockStart) {

                    if (token.isSeperatorOf('{')) {
                        state.TracingState = TracingState.EnumDefinitionDetected;
                        state.CurrentIndex++;
                    }
                    else if (!token.isBlank()) {
                        state.addError('{ expected.');
                        state.CurrentIndex++;
                    }
                    else {
                        state.CurrentIndex++;
                    }
                }

                if (state.TracingState == TracingState.VariableDefinitionDetected
                    || state.TracingState == TracingState.FunctionDefinitionDetected
                    || state.TracingState == TracingState.EnumDefinitionDetected) {
                    break;
                }

                if (state.CurrentIndex >= tokens.length) {
                    state.TracingState = TracingState.UnexpectedEOF;
                    break;
                }
            }
        }

        private processSyntax_GetProcessingMode(tokens: TextTokenCollection, state: AnalyzerState): SyntaxProcessingMode {

            let token = tokens[state.CurrentIndex];
            let setting = state.Setting;

            if (state.TracingState == TracingState.FunctionDefinitionDetected) {
                return SyntaxProcessingMode.Function;
            }

            if (state.TracingState == TracingState.VariableDefinitionDetected) {
                return SyntaxProcessingMode.Variable;
            }

            if (state.TracingState == TracingState.EnumDefinitionDetected) {

                return SyntaxProcessingMode.Enum;
            }

            if (token.isAlphaNumericOf(setting.TS_module)
                || token.isAlphaNumericOf(setting.TS_namespace)) {

                return SyntaxProcessingMode.Module;
            }

            if (token.isAlphaNumericOf(setting.TS_class)) {

                return SyntaxProcessingMode.Class;
            }

            if (token.isAlphaNumericOf(setting.TS_interface)) {

                return SyntaxProcessingMode.Interface;
            }

            // クラスメンバを検出する

            return SyntaxProcessingMode.None;
        }

        private processSyntax_GeneralBlockFormSyntax(statementType: StatementType, result: AnalyzerResult, tokens: TextTokenCollection, state: AnalyzerState) {

            let currentIndex = state.CurrentIndex;

            result.SetCurrentStatementType(statementType);

            // search block start
            let blockPartStartIndex = tokens.findIndexInZeroLevel(currentIndex + 1, tokens.endIndex, '{');

            if (blockPartStartIndex == -1) {
                state.addError('モジュールまたは名前空間の { が必要です。');
                let nextIndex = tokens.findNonWhiteSpaceIndex(currentIndex + 1, tokens.length - 1);
                if (nextIndex == -1) {
                    state.addError('モジュールまたは名前空間には名称が必要です。');
                    return;
                }
                blockPartStartIndex = nextIndex + 1;
            }

            // module [symbol name] {
            for (let tokenIndex = state.LastIndex; tokenIndex <= blockPartStartIndex; tokenIndex++) {
                var token = tokens[tokenIndex];
                result.AppendToCurrentStatement(token);
            }

            // inner statements
            var innerState = state.cloneForInnerState();
            var innerResult = new AnalyzerResult();
            innerState.CurrentIndex = blockPartStartIndex + 1;
            this.processCodeBlock(innerResult, tokens, innerState);

            result.SetInnerStatementToCurrentStatement(innerResult.Statements);

            state.CurrentIndex = innerState.CurrentIndex;
            
            // }
            result.FlushCurrentStatementTokens();
            result.AppendToCurrentStatement(token);

            result.FlushStatement();

            state.CurrentIndex = innerState.CurrentIndex + 1;
        }

        private processSyntax_GeneralListFormStatement(statementType: StatementType, result: AnalyzerResult, tokens: TextTokenCollection, state: AnalyzerState) {

            let currentIndex = state.CurrentIndex;

            // current index is at "enum"

            // search block start
            let blockPartStartIndex = tokens.findIndexInZeroLevel(currentIndex + 1, tokens.endIndex, '{');

            if (blockPartStartIndex == -1) {
                state.addError('列挙型の開始の { が必要です。');
                let nextIndex = tokens.findNonWhiteSpaceIndex(currentIndex + 1, tokens.length - 1);
                if (nextIndex == -1) {
                    state.addError('列挙型の開始には名称が必要です。');
                    return;
                }
                blockPartStartIndex = nextIndex + 1;
            }

            result.SetCurrentStatementType(statementType);

            // parse till {
            for (let tokenIndex = state.LastIndex; tokenIndex <= blockPartStartIndex; tokenIndex++) {
                var token = tokens[tokenIndex];
                result.AppendToCurrentStatement(token);
            }

            // parse array members
            var innerResult = new AnalyzerResult();
            var counter = new NestingCounter();
            for (let tokenIndex = blockPartStartIndex + 1; tokenIndex < tokens.length; tokenIndex++) {
                let token = tokens[tokenIndex];

                let isItemEndLetter = (token.isSeperatorOf(',') || token.isSeperatorOf('}'));

                let isZeroLevel = !counter.isInNest();

                let isArrayEnd = (
                    (tokenIndex == tokens.length - 1)
                    || (isZeroLevel && token.isSeperatorOf('}'))
                );

                let isItemEnd = (isArrayEnd || (isZeroLevel && isItemEndLetter));

                if (isItemEnd) {
                    innerResult.FlushCurrentStatementTokens();
                    innerResult.FlushStatement();
                }
                else {
                    innerResult.AppendToCurrentStatement(token);
                }

                if (isArrayEnd) {
                    state.CurrentIndex = tokenIndex + 1;
                    break;
                }

                counter.countParenthesis(token);
            }

            state.SyntaxEnd = true;
        }

        // Code block parsing

        private processCodeBlock(result: AnalyzerResult, tokens: TextTokenCollection, state: AnalyzerState) {

            let currentIndex = state.CurrentIndex;

            state.LastIndex = state.CurrentIndex;
            state.BlockEnd = false;

            while (state.CurrentIndex < tokens.length) {

                var mode = this.processCodeBlock_GetProcessingMode(tokens, state);

                switch (mode) {

                    case CodeBlockProcessingMode.Continue:
                        this.processCodeBlock_Continue(result, tokens, state);
                        break;

                    case CodeBlockProcessingMode.BlockEnd:
                        this.processCodeBlock_BlockEnd(result, tokens, state);
                        break;

                    case CodeBlockProcessingMode.SyntaxStart:
                        this.processCodeBlock_SyntaxStart(result, tokens, state);
                        break;
                }

                if (state.BlockEnd) {
                    break;
                }
            }
        }

        private processCodeBlock_GetProcessingMode(tokens: TextTokenCollection, state: AnalyzerState): CodeBlockProcessingMode {

            let currentIndex = state.CurrentIndex;
            let token = tokens[currentIndex];
            let setting = state.Setting;

            if (token.isAlphaNumericOf('}')) {
                return CodeBlockProcessingMode.BlockEnd;
            }

            if (!token.isBlank()) {
                return CodeBlockProcessingMode.SyntaxStart;
            }

            return CodeBlockProcessingMode.Continue;
        }

        private processCodeBlock_Continue(result: AnalyzerResult, tokens: TextTokenCollection, state: AnalyzerState) {

            let currentIndex = state.CurrentIndex;
            let token = tokens[currentIndex];

            result.AppendToCurrentStatement(token);

            state.CurrentIndex++;
        }

        private processCodeBlock_BlockEnd(result: AnalyzerResult, tokens: TextTokenCollection, state: AnalyzerState) {

            state.BlockEnd = true;
        }

        private processCodeBlock_SyntaxStart(result: AnalyzerResult, tokens: TextTokenCollection, state: AnalyzerState) {

            let currentIndex = state.CurrentIndex;

            result.FlushStatement();

            this.processSyntaxPart(result, tokens, state);
        }

        // Common functions

        private processFollowingLineTokens(result: AnalyzerResult, tokens: TextTokenCollection, startIndex: int, state: AnalyzerState) {

            let existsFollowingTokens = false;
            let endIndex = -1;
            for (let tokenIndex = startIndex; tokenIndex <= tokens.endIndex; tokenIndex++) {
                var token = tokens[tokenIndex];

                if (token.isLineEnd()) {
                    endIndex = tokenIndex;
                    break;
                }
                else if (token.isComment() || token.isBlank()) {
                    existsFollowingTokens = true;
                    endIndex = tokenIndex - 1;
                }
                else {
                    existsFollowingTokens = false;
                    endIndex = -1;
                    break;
                }
            }

            if (!existsFollowingTokens) {
                return;
            }

            for (let tokenIndex = startIndex; tokenIndex <= endIndex; tokenIndex++) {
                result.AppendToCurrentStatement(tokens[tokenIndex]);
            }

            state.CurrentIndex = endIndex;
        }
    }
}