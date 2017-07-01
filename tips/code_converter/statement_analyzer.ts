﻿
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
        TS_extends = 'extends';
        TS_implements = 'implements';
        TS_constructor = 'constructor';
        TS_get = 'get';
        TS_set = 'set';

        TS_AccesTypes: Dictionary<string> = {
            'public': 'public',
            'private': 'private',
            'protected': 'protected',
            'export': 'export',
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

        SearchingIdentifierName,
        SearchingAfterIdentifer,

        SearchingModuleIdentifierName,
        SearchingModuleBodyStart,

        SearchingEnumIdentifierName,
        SearchingEnumBlockStart,
        EnumDefinitionDetected,

        SearchingClassIdentifierName,
        SearchingClassBlockStart,

        TracingFunctionArguments,
        TracingFunctionGenericsArguments,
        SearchingFunctionReturnValueTypeOrBlockStart,
        TracingFunctionReturnValueType,

        TracingVariableTypeName,
        TracingVariableDefinitionDefaultValue,

        TracingPropertyBody,

        ModuleDefinitionDetected,
        ClassDefinitionDetected,
        FunctionDefinitionDetected,
        AbstructFunctionDefinitionDetected,
        VariableDefinitionDetected,
    }

    export class AnalyzerState {

        Setting: AnalyzerSetting = null;
        TargetTokens: List<TextToken> = null;

        // State variables
        CurrentMode = SyntaxProcessingMode.None;
        CurrentIndex = 0;
        LastIndex = 0;
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
            this.TracingState = TracingState.SearchingIdentifierName;
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

        // Syntax part parsing ////////////////

        private processSyntaxPart(result: AnalyzerResult, tokens: TextTokenCollection, state: AnalyzerState): boolean {

            let currentIndex = state.CurrentIndex;

            // searching start
            while (state.CurrentIndex < tokens.length) {

                let token = tokens[state.CurrentIndex];

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
                    // module or namespace
                    else if (token.isAlphaNumericOf(state.Setting.TS_module) || token.isAlphaNumericOf(state.Setting.TS_namespace)) {
                        return this.processSyntax_TraceModule(result, tokens, state);
                    }
                    // class
                    else if (token.isAlphaNumericOf(state.Setting.TS_class)) {
                        return this.processSyntax_TraceClass(result, tokens, state);
                    }
                    // interface
                    else if (token.isAlphaNumericOf(state.Setting.TS_interface)) {
                        return this.processSyntax_TraceInterface(result, tokens, state);
                    }
                    // enum
                    else if (token.isAlphaNumericOf(state.Setting.TS_enum)) {
                        return this.processSyntax_TraceEnum(result, tokens, state);
                    }
                    else {
                        // identifier detected... to next step
                        state.Trace_IdentifierDetected = true;
                        state.CurrentIndex++;
                        break;
                    }
                }
                else if (!token.isBlank()) {
                    state.addError('Unexpected token. A constructor, method, accessor, or property was expected.');
                    state.CurrentIndex++;
                }
                else {
                    state.CurrentIndex++;
                }

                if (this.checkEOF(tokens, state)) {
                    return false;
                }
            }

            // after identifier... branchs to variable, function or property syntax
            while (state.CurrentIndex < tokens.length) {

                let token = tokens[state.CurrentIndex];

                if (token.isSeperatorOf(':')) {
                    state.Trace_TypeNameSeperatorDeteced = true;
                    return this.processSyntax_TraceVariable(result, TracingState.TracingVariableTypeName, tokens, state);
                }
                else if (token.isSeperatorOf('=')) {
                    state.Trace_AsignmentDeteced = true;
                    return this.processSyntax_TraceVariable(result, TracingState.TracingVariableDefinitionDefaultValue, tokens, state);
                }
                else if (token.isSeperatorOf('(')) {
                    return this.processSyntax_TraceFunction(result, TracingState.TracingFunctionArguments, tokens, state);
                }
                else if (token.isSeperatorOf('<')) {
                    state.Trace_FunctionGenericsArgumentDeteced = true;
                    return this.processSyntax_TraceFunction(result, TracingState.TracingFunctionGenericsArguments, tokens, state);
                }
                else if (token.isSeperatorOf('{')) {
                    return this.processSyntax_TraceProperty(result, tokens, state);
                }
                else if (!token.isBlank()) {
                    state.addError('= or : or function argument expected.');
                    state.CurrentIndex++;
                }
                else {
                    state.CurrentIndex++;
                }

                if (this.checkEOF(tokens, state)) {
                    return false;
                }
            }

            return false;
        }

        private checkEOF(tokens: TextTokenCollection, state: AnalyzerState): boolean {

            if (state.CurrentIndex >= tokens.length) {
                state.TracingState = TracingState.UnexpectedEOF;
                return true;
            }
            else {
                return false;
            }
        }

        private processSyntax_TraceModule(result: AnalyzerResult, tokens: TextTokenCollection, state: AnalyzerState): boolean {

            let currentIndex = state.CurrentIndex;

            // set statement type
            result.SetCurrentStatementType(StatementType.Module);

            // now current indes on "module" or "namescpace"
            state.CurrentIndex++;

            // serching module name
            let indentiferNameToken: TextToken = null;

            while (state.CurrentIndex < tokens.length) {

                let token = tokens[state.CurrentIndex];

                if (token.isAlphaNumeric()) {
                    indentiferNameToken = token;
                    state.CurrentIndex++;
                    break;
                }
                else if (!token.isBlank()) {
                    state.addError('Identifier name expected.');
                    state.CurrentIndex++;
                }
                else {
                    state.CurrentIndex++;
                }

                if (this.checkEOF(tokens, state)) {
                    return false;
                }
            }

            // serching module body start
            while (state.CurrentIndex < tokens.length) {

                let token = tokens[state.CurrentIndex];

                if (token.isSeperatorOf('{')) {
                    state.CurrentIndex++;
                    break;
                }
                else if (!token.isBlank()) {
                    state.addError('{ expected.');
                    state.CurrentIndex++;
                }
                else {
                    state.CurrentIndex++;
                }

                if (this.checkEOF(tokens, state)) {
                    return false;
                }
            }

            // Add tokens
            this.processSyntax_AppendToResultTillCurrent(result, tokens, state);

            // process module code
            return this.processSyntax_GeneralBlockFormSyntax(result, StatementType.Enum, tokens, state);
        }

        private processSyntax_TraceEnum(result: AnalyzerResult, tokens: TextTokenCollection, state: AnalyzerState): boolean {

            let currentIndex = state.CurrentIndex;

            // set statement type
            result.SetCurrentStatementType(StatementType.Enum);

            // now current indes on "enum"
            state.CurrentIndex++;

            // serching enum name
            let indentiferNameToken: TextToken = null;

            while (state.CurrentIndex < tokens.length) {

                let token = tokens[state.CurrentIndex];

                if (token.isAlphaNumeric()) {
                    indentiferNameToken = token;
                    state.CurrentIndex++;
                    break;
                }
                else if (!token.isBlank()) {
                    state.addError('Identifier name expected.');
                    state.CurrentIndex++;
                }
                else {
                    state.CurrentIndex++;
                }

                if (this.checkEOF(tokens, state)) {
                    return false;
                }
            }

            // serching enum body start
            while (state.CurrentIndex < tokens.length) {

                let token = tokens[state.CurrentIndex];

                if (token.isSeperatorOf('{')) {
                    state.CurrentIndex++;
                    break;
                }
                else if (!token.isBlank()) {
                    state.addError('{ expected.');
                    state.CurrentIndex++;
                }
                else {
                    state.CurrentIndex++;
                }

                if (this.checkEOF(tokens, state)) {
                    return false;
                }
            }

            // Add tokens
            this.processSyntax_AppendToResultTillCurrent(result, tokens, state);

            // process enum items
            return this.processSyntax_GeneralListFormStatement(result, tokens, state);
        }

        private processSyntax_TraceClass(result: AnalyzerResult, tokens: TextTokenCollection, state: AnalyzerState): boolean {

            let currentIndex = state.CurrentIndex;

            // set statement type
            result.SetCurrentStatementType(StatementType.Class);

            // now current indes on "class"
            state.CurrentIndex++;

            // serching module name
            let indentiferNameToken: TextToken = null;

            while (state.CurrentIndex < tokens.length) {

                let token = tokens[state.CurrentIndex];

                if (token.isAlphaNumeric()) {
                    indentiferNameToken = token;
                    state.CurrentIndex++;
                    break;
                }
                else if (!token.isBlank()) {
                    state.addError('Identifier name expected.');
                    state.CurrentIndex++;
                }
                else {
                    state.CurrentIndex++;
                }
            }

            // serching module body start
            while (state.CurrentIndex < tokens.length) {

                let token = tokens[state.CurrentIndex];

                if (token.isSeperatorOf(state.Setting.TS_extends)) {
                    state.CurrentIndex++;
                }
                if (token.isSeperatorOf(state.Setting.TS_implements)) {
                    state.CurrentIndex++;
                }
                else if (token.isSeperatorOf('{')) {
                    state.CurrentIndex++;
                }
                else if (!token.isBlank()) {
                    state.addError('{ expected.');
                    state.CurrentIndex++;
                }
                else {
                    state.CurrentIndex++;
                }

                if (this.checkEOF(tokens, state)) {
                    return false;
                }
            }

            // Add tokens
            this.processSyntax_AppendToResultTillCurrent(result, tokens, state);

            // process class code
            return this.processSyntax_GeneralBlockFormSyntax(result, StatementType.Enum, tokens, state);
        }

        private processSyntax_TraceInterface(result: AnalyzerResult, tokens: TextTokenCollection, state: AnalyzerState): boolean {

            let currentIndex = state.CurrentIndex;

            // now current indes on "interface"
            state.CurrentIndex++;
            state.TracingState = TracingState.SearchingClassIdentifierName;

            while (state.CurrentIndex < tokens.length) {

                let token = tokens[state.CurrentIndex];

                if (state.TracingState == TracingState.SearchingEnumIdentifierName) {

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

                if (this.checkEOF(tokens, state)) {
                    return false;
                }
            }

            // Add tokens
            this.processSyntax_AppendToResultTillCurrent(result, tokens, state);

            // process interface code
            return this.processSyntax_GeneralBlockFormSyntax(result, StatementType.Enum, tokens, state);
        }

        private processSyntax_TraceVariable(result: AnalyzerResult, startingTracingState: TracingState, tokens: TextTokenCollection, state: AnalyzerState): boolean {

            let currentIndex = state.CurrentIndex;

            // start with specified state
            state.TracingState = startingTracingState;

            if (startingTracingState == TracingState.TracingVariableTypeName
                || startingTracingState == TracingState.TracingVariableTypeName) {

                state.CurrentIndex++;
            }

            while (state.CurrentIndex < tokens.length) {

                let token = tokens[state.CurrentIndex];

                if (state.TracingState == TracingState.TracingVariableTypeName) {

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

                if (this.checkEOF(tokens, state)) {
                    return false;
                }
            }

            return true;
        }

        private processSyntax_TraceFunction(result: AnalyzerResult, startingTracingState: TracingState, tokens: TextTokenCollection, state: AnalyzerState): boolean {

            let currentIndex = state.CurrentIndex;

            // start with specified state
            state.TracingState = startingTracingState;

            if (startingTracingState == TracingState.TracingFunctionArguments
                || startingTracingState == TracingState.TracingFunctionGenericsArguments) {

                state.CurrentIndex++;
            }

            while (state.CurrentIndex < tokens.length) {

                let token = tokens[state.CurrentIndex];

                if (state.TracingState == TracingState.TracingFunctionGenericsArguments) {

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
                else if (state.TracingState == TracingState.TracingFunctionArguments) {

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

                if (this.checkEOF(tokens, state)) {
                    return false;
                }
            }

            return true;
        }

        private processSyntax_TraceProperty(result: AnalyzerResult, tokens: TextTokenCollection, state: AnalyzerState): boolean {

            let currentIndex = state.CurrentIndex;

            // now current indes on "{" of start of property body
            state.TracingState = TracingState.TracingPropertyBody;
            state.CurrentIndex++;

            while (state.CurrentIndex < tokens.length) {

                let token = tokens[state.CurrentIndex];

                if (this.checkEOF(tokens, state)) {
                    return false;
                }
            }

            return true;
        }

        private processSyntax_AppendToResultTillCurrent(result: AnalyzerResult, tokens: TextTokenCollection, state: AnalyzerState) {

            for (let tokenIndex = state.LastIndex; tokenIndex < state.CurrentIndex; tokenIndex++) {

                result.AppendToCurrentStatement(tokens[tokenIndex]);
            }
        }

        private processSyntax_GeneralBlockFormSyntax(result: AnalyzerResult, statementType: StatementType, tokens: TextTokenCollection, state: AnalyzerState): boolean {

            let currentIndex = state.CurrentIndex;

            // process inner statements
            var innerState = state.cloneForInnerState();
            var innerResult = new AnalyzerResult();
            this.processCodeBlock(innerResult, tokens, innerState);

            // set inner statement result
            result.SetInnerStatementToCurrentStatement(innerResult.Statements);
            result.FlushCurrentStatementTokens();

            state.CurrentIndex = innerState.CurrentIndex;
            
            // }
            result.AppendToCurrentStatement(tokens[state.CurrentIndex]);
            result.FlushStatement();

            state.CurrentIndex = innerState.CurrentIndex + 1;

            return true;
        }

        private processSyntax_GeneralListFormStatement(result: AnalyzerResult, tokens: TextTokenCollection, state: AnalyzerState): boolean {

            let currentIndex = state.CurrentIndex;

            // parse array members
            var innerResult = new AnalyzerResult();
            var counter = new NestingCounter();
            while (state.CurrentIndex < tokens.length) {
                let token = tokens[state.CurrentIndex];

                let isItemEndLetter = (token.isSeperatorOf(',') || token.isSeperatorOf('}'));

                let isZeroLevel = !counter.isInNest();

                let isArrayEnd = (
                    (state.CurrentIndex == tokens.length - 1)
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
                    state.CurrentIndex++;
                    break;
                }

                counter.countParenthesis(token);

                state.CurrentIndex++;

                if (this.checkEOF(tokens, state)) {
                    return false;
                }
            }

            // set inner statement result
            result.SetInnerStatementToCurrentStatement(innerResult.Statements);
            result.FlushCurrentStatementTokens();

            return true;
        }

        // Code block parsing /////////////

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