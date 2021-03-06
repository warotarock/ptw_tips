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
        Property_Get,
        Property_Set,
        Variable,

        GeneralStatement,
        If,
        Else,
        ElseIf,
        For,
        While,
        Switch,

        Try,
        Catch,

        PrecompileDirective,
        SourceLanguageCodeBegin,
        SourceLanguageCodeEnd,
        TargetLanguageCode,
        ConverterAnotation,
    }

    export class CodeStatementLine {

        indentTokens = TextTokenCollection.create();
        tokens = TextTokenCollection.create();
        followingTokens = TextTokenCollection.create();

        get lineNumber(): int {

            if (this.indentTokens.length > 0) {

                return this.tokens[0].LineNumber;
            }
            else {

                return 0;
            }
        }
    }

    export class CodeStatement {

        Type = StatementType.None;
        StatementLines: List<CodeStatementLine> = null;
        InnerStatements: List<CodeStatement> = null;

        get LineNumber(): int {

            if (this.StatementLines != null && this.StatementLines.length > 0) {

                return this.StatementLines[0].lineNumber;
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

        TS_var = 'var';
        TS_function = 'function';
        TS_if = 'if';
        TS_else = 'else';
        TS_for = 'for';
        TS_while = 'while';
        TS_switch = 'switch';
        TS_case = 'case';
        TS_break = 'break';
        TS_try = 'try';
        TS_catch = 'catch';

        TS_AccesTypes: Dictionary<string> = {
            'public': 'public',
            'private': 'private',
            'protected': 'protected',
            'export': 'export',
        };
    }

    export class AnalyzerResult {

        Statements = new List<CodeStatement>();

        LineNumber = 0;
        CurrentStatement = new CodeStatement();
        NeedsNewTokensBeforeAppendToken = true;

        SetCurrentStatementType(type: StatementType) {

            this.CurrentStatement.Type = type;
        }

        AppendToken(token: TextToken) {

            this.processNewLine();

            let line = this.getCurrentStatementLastLine();

            line.tokens.push(token);
        }

        AppendIndentToken(token: TextToken) {

            this.processNewLine();

            let line = this.getCurrentStatementLastLine();

            line.indentTokens.push(token);
        }

        AppendFollowingToken(token: TextToken) {

            let line = this.getCurrentStatementLastLine();

            line.followingTokens.push(token);
        }

        getCurrentStatement(): CodeStatement {

            return this.CurrentStatement;
        }

        getLastStatement(): CodeStatement {

            return this.Statements[this.Statements.length - 1];
        }

        private getLastLine(statement: CodeStatement): CodeStatementLine {

            let line = statement.StatementLines[statement.StatementLines.length - 1];

            return line;
        }

        private getCurrentStatementLastLine() {

            let line = this.getLastLine(this.CurrentStatement);

            return line;
        }

        private processNewLine() {

            if (this.NeedsNewTokensBeforeAppendToken) {

                if (this.CurrentStatement.StatementLines == null) {
                    this.CurrentStatement.StatementLines = new List<CodeStatementLine>();
                }

                this.NeedsNewTokensBeforeAppendToken = false;
                this.CurrentStatement.StatementLines.push(new CodeStatementLine());
            }
        }

        AppendInnerStatementResult(innerResult: AnalyzerResult) {

            this.CurrentStatement.InnerStatements = innerResult.Statements;

            // Append remaining tokens
            if (innerResult.CurrentStatement.Type == StatementType.None
                && innerResult.CurrentStatement.StatementLines != null) {

                for (let line of innerResult.CurrentStatement.StatementLines) {

                    for (let token of line.indentTokens) {

                        this.AppendIndentToken(token);
                    }
                }
            }
        }

        FlushCurrentStatementTokens() {

            this.NeedsNewTokensBeforeAppendToken = true;
        }

        FlushStatement() {

            this.Statements.push(this.CurrentStatement);

            // DEBUG
            //for (let tokens of this.CurrentStatement.TokensList) {
            //    if (tokens.length > 0) {
            //        console.debug(tokens[0].LineNumber + ' ' + TextToken.joinToString(tokens));
            //    }
            //}

            this.CurrentStatement = new CodeStatement();
            this.NeedsNewTokensBeforeAppendToken = true;
        }
    }

    export enum ScopeLevel {

        None,
        Global,
        Module,
        Class,
        Function,
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

        SearchingStatementStart,
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
        TracingVariableFinished,

        TracingPropertyBody,

        ModuleDefinitionDetected,
        ClassDefinitionDetected,
        FunctionDefinitionDetected,
        AbstructFunctionDefinitionDetected,
        VariableDefinitionDetected,
    }

    export class AnalyzerState {

        Setting: AnalyzerSetting = null;
        TargetTokens: TextTokenCollection = null;
        FilePath: string = '';

        // State variables
        CurrentIndex = 0;
        LastIndex = 0;

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
        Trace_AbstructFunctionDeteced = false;

        // Result variables
        Result: AnalyzerResult = null;
        Erros = new List<string>();

        initialize() {
        }

        clear() {

            this.CurrentIndex = 0;
            this.LastIndex = 0;
            this.TargetTokens = null;

            this.Result = null;

            if (this.Erros.length > 0) {

                this.Erros = new List<string>();
            }
        }

        startTracing(startingTracingState: TracingState) {

            this.TracingState = startingTracingState;
            this.Trace_NestingCounter.reset();
            this.Trace_DetectedAccesibilityTypeToken = null;
            this.Trace_AccessTypeDetected = false;
            this.Trace_IdentifierDetected = false;
            this.Trace_TypeNameSeperatorDeteced = false;
            this.Trace_TypeNameDeteced = false;
            this.Trace_AsignmentDeteced = false;
            this.Trace_FunctioArgumentDeteced = false;
            this.Trace_FunctionGenericsArgumentDeteced = false;
            this.Trace_AbstructFunctionDeteced = false;
        }

        setTracingState(tracingState: TracingState) {

            this.TracingState = tracingState;
        }

        cloneForInnerState(): AnalyzerState {

            var state = new AnalyzerState();
            state.Setting = this.Setting;
            state.FilePath = this.FilePath;
            state.TargetTokens = this.TargetTokens;
            state.Result = this.Result;
            state.Erros = this.Erros;
            state.CurrentIndex = this.CurrentIndex;

            return state;
        }

        addError(message: string) {

            this.Erros.push(this.FilePath
                + '(' + this.TargetTokens[this.CurrentIndex].LineNumber + '): '
                + message);
        }
    }

    export class Analyzer {

        analyze(state: AnalyzerState) {

            this.analyzeStatementsRecursive(ScopeLevel.Global, state.Result, state.TargetTokens, state);
        }

        private analyzeStatementsRecursive(scopeLevel: ScopeLevel, result: AnalyzerResult, tokens: TextTokenCollection, state: AnalyzerState): boolean {

            let currentIndex = state.CurrentIndex;

            state.LastIndex = state.CurrentIndex;

            // Searching a syntax
            while (state.CurrentIndex < tokens.length) {

                if (this.checkEOF(tokens, state)) {
                    return false;
                }

                let token = tokens[state.CurrentIndex];

                // Block End
                if (token.isSeperatorOf('}')) {
                    // TODO: ブロックの終わりがここで検出されるが、この時点でほとんどの場合インデントがCurrentStatementに入っている。
                    //しかしこのまま関数を抜けると、CurrentStatementが確定されていない。
                    //関数を抜けた先ではここでのresultはinnerResultで、innerResult.statementsだけが確定される。なのでインデントが消えてしまう。
                    break;
                }
                // Whitespaces
                else if (token.isBlank()) {

                    this.processContinueingBlankTokens(result, tokens, state);
                }
                // Start of a syntax
                else {

                    switch (scopeLevel) {
                        case ScopeLevel.Global:
                            this.processGlobalLevelSyntax(result, tokens, state);
                            break;
                        case ScopeLevel.Module:
                            this.processModuleLevelSyntax(result, tokens, state);
                            break;
                        case ScopeLevel.Class:
                            this.processClassLevelSyntax(result, tokens, state);
                            break;
                    }
                }
            }

            return true;
        }

        // Global level statement analyzing /////////////////////////

        private processGlobalLevelSyntax(result: AnalyzerResult, tokens: TextTokenCollection, state: AnalyzerState): boolean {

            let currentIndex = state.CurrentIndex;
            state.LastIndex = state.CurrentIndex;

            state.startTracing(TracingState.SearchingStatementStart);

            while (state.CurrentIndex < tokens.length) {

                let token = tokens[state.CurrentIndex];

                // Blank
                if (token.isBlank()) {

                    state.CurrentIndex++;
                }
                // Accesibility
                else if (this.isAccessibilityToken(token, state)) {

                    this.processAccessibility(token, state)
                }
                // module or namespace
                else if (token.isAlphaNumericOf(state.Setting.TS_module) || token.isAlphaNumericOf(state.Setting.TS_namespace)) {

                    return this.processModule(result, tokens, state);
                }
                // class
                else if (token.isAlphaNumericOf(state.Setting.TS_class)) {

                    return this.processClass(result, tokens, state);
                }
                // interface
                else if (token.isAlphaNumericOf(state.Setting.TS_interface)) {

                    return this.processInterface(result, tokens, state);
                }
                // enum
                else if (token.isAlphaNumericOf(state.Setting.TS_enum)) {

                    return this.processEnum(result, tokens, state);
                }
                // var
                else if (token.isAlphaNumericOf(state.Setting.TS_var)) {

                    return this.statementSyntax_ProcessVariable(result, tokens, state);
                }
                // function
                else if (token.isAlphaNumericOf(state.Setting.TS_function)) {

                    return this.statementSyntax_ProcessFunction(result, tokens, state);
                }
                // Ggeneral statement
                else {

                    return this.statementSyntax_ProcessGeneralStatement(result, tokens, state);
                }

                if (this.checkEOF(tokens, state)) {

                    return false;
                }
            }

            return false;
        }

        // Module level statement analyzing /////////////////////////

        private processModuleLevelSyntax(result: AnalyzerResult, tokens: TextTokenCollection, state: AnalyzerState): boolean {

            let currentIndex = state.CurrentIndex;
            state.LastIndex = state.CurrentIndex;

            state.startTracing(TracingState.SearchingStatementStart);

            while (state.CurrentIndex < tokens.length) {

                let token = tokens[state.CurrentIndex];

                // Blank
                if (token.isBlank()) {

                    state.CurrentIndex++;
                }
                // Accesibility
                else if (this.isAccessibilityToken(token, state)) {

                    this.processAccessibility(token, state);
                }
                // class
                else if (token.isAlphaNumericOf(state.Setting.TS_class)) {

                    return this.processClass(result, tokens, state);
                }
                // interface
                else if (token.isAlphaNumericOf(state.Setting.TS_interface)) {

                    return this.processInterface(result, tokens, state);
                }
                // enum
                else if (token.isAlphaNumericOf(state.Setting.TS_enum)) {

                    return this.processEnum(result, tokens, state);
                }
                // var
                else if (token.isAlphaNumericOf(state.Setting.TS_var)) {

                    return this.statementSyntax_ProcessVariable(result, tokens, state);
                }
                // function
                else if (token.isAlphaNumericOf(state.Setting.TS_function)) {

                    return this.statementSyntax_ProcessFunction(result, tokens, state);
                }
                // Ggeneral statement
                else {

                    return this.statementSyntax_ProcessGeneralStatement(result, tokens, state);
                }

                if (this.checkEOF(tokens, state)) {

                    return false;
                }
            }

            return false;
        }

        // Class level statement analyzing //////////////////////////

        private processClassLevelSyntax(result: AnalyzerResult, tokens: TextTokenCollection, state: AnalyzerState): boolean {

            let currentIndex = state.CurrentIndex;
            state.LastIndex = state.CurrentIndex;

            state.startTracing(TracingState.None);

            let isUnexpectedTokenDetected = false;

            // Searching start
            state.setTracingState(TracingState.SearchingIdentifierName);
            while (state.CurrentIndex < tokens.length) {

                let token = tokens[state.CurrentIndex];

                // Blank
                if (token.isBlank()) {

                    state.CurrentIndex++;
                }
                // Accesibility
                else if (this.isAccessibilityToken(token, state)) {

                    this.processAccessibility(token, state);
                }
                // Property
                else if (token.isAlphaNumericOf(state.Setting.TS_get) || token.isAlphaNumericOf(state.Setting.TS_set)) {

                    return this.classSyntax_ProcessProperty(result, tokens, state);
                }
                else if (token.isAlphaNumeric()) {

                    // Identifier detected... to next step
                    state.Trace_IdentifierDetected = true;
                    state.CurrentIndex++;
                    break;
                }
                else {

                    if (!isUnexpectedTokenDetected) {

                        state.addError('Expected a class, interface, enum or variable.');
                        isUnexpectedTokenDetected = true;
                    }
                    state.CurrentIndex++;
                }

                if (this.checkEOF(tokens, state)) {

                    return false;
                }
            }

            // After identifier... branchs to variable or function definition
            state.setTracingState(TracingState.SearchingAfterIdentifer);
            while (state.CurrentIndex < tokens.length) {

                let token = tokens[state.CurrentIndex];

                if (token.isSeperatorOf(':')) {

                    state.Trace_TypeNameSeperatorDeteced = true;
                    return this.classSyntax_ProcessVariable(result, TracingState.TracingVariableTypeName, tokens, state);
                }
                else if (token.isSeperatorOf('=')) {

                    state.Trace_AsignmentDeteced = true;
                    return this.classSyntax_ProcessVariable(result, TracingState.TracingVariableDefinitionDefaultValue, tokens, state);
                }
                else if (token.isSeperatorOf('(')) {

                    return this.classSyntax_ProcessFunction(result, TracingState.TracingFunctionArguments, tokens, state);
                }
                else if (token.isSeperatorOf('<')) {

                    state.Trace_FunctionGenericsArgumentDeteced = true;
                    return this.classSyntax_ProcessFunction(result, TracingState.TracingFunctionGenericsArguments, tokens, state);
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

        // Grobal or module or class level structure analyzing //////

        private processModule(result: AnalyzerResult, tokens: TextTokenCollection, state: AnalyzerState): boolean {

            let currentIndex = state.CurrentIndex;

            // Set statement type
            result.SetCurrentStatementType(StatementType.Module);

            // Now current index is on "module" or "namescpace"
            state.CurrentIndex++;

            // Serching module name
            let indentiferNameStartIndex = -1;
            let indentiferNameEndIndex = -1;

            while (state.CurrentIndex < tokens.length) {

                let token = tokens[state.CurrentIndex];

                if (token.isAlphaNumeric()) {

                    indentiferNameStartIndex = state.CurrentIndex;
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

            // Serching module body start
            while (state.CurrentIndex < tokens.length) {

                let token = tokens[state.CurrentIndex];

                if (token.isSeperatorOf('{')) {

                    break;
                }
                else if (!token.isBlank()) {

                    indentiferNameEndIndex = state.CurrentIndex;
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
            state.CurrentIndex++;
            this.appendToResultTillCurrent(result, tokens, state);

            // Process module code
            return this.processModuleOrClassBody(ScopeLevel.Module, result, tokens, state);
        }

        private processEnum(result: AnalyzerResult, tokens: TextTokenCollection, state: AnalyzerState): boolean {

            let currentIndex = state.CurrentIndex;

            // Set statement type
            result.SetCurrentStatementType(StatementType.Enum);

            // Now current index is on "enum"
            state.CurrentIndex++;

            // Serching enum name
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

            // Serching enum body start
            while (state.CurrentIndex < tokens.length) {

                let token = tokens[state.CurrentIndex];

                if (token.isSeperatorOf('{')) {

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
            state.CurrentIndex++;
            this.appendToResultTillCurrent(result, tokens, state);

            // Process enum items
            return this.processListingSyntaxBody(result, tokens, state);
        }

        private processClass(result: AnalyzerResult, tokens: TextTokenCollection, state: AnalyzerState): boolean {

            let currentIndex = state.CurrentIndex;

            // Set statement type
            result.SetCurrentStatementType(StatementType.Class);

            // Now current index is on "class"
            state.CurrentIndex++;

            // Serching module name
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

            // Serching class body start
            while (state.CurrentIndex < tokens.length) {

                let token = tokens[state.CurrentIndex];

                if (token.isAlphaNumericOf(state.Setting.TS_extends)) {
                    state.CurrentIndex++;
                    if (!this.processTypeName(result, tokens, state)) {
                        return false;
                    }
                }
                else if (token.isAlphaNumericOf(state.Setting.TS_implements)) {
                    state.CurrentIndex++;
                    if (!this.processTypeName(result, tokens, state)) {
                        return false;
                    }
                }
                else if (token.isSeperatorOf('{')) {
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
            state.CurrentIndex++;
            this.appendToResultTillCurrent(result, tokens, state);

            // Process class code
            return this.processModuleOrClassBody(ScopeLevel.Class, result, tokens, state);
        }

        private processInterface(result: AnalyzerResult, tokens: TextTokenCollection, state: AnalyzerState): boolean {

            let currentIndex = state.CurrentIndex;

            // Set statement type
            result.SetCurrentStatementType(StatementType.Interface);

            // Now current index is on "interface"
            state.CurrentIndex++;

            // Serching module name
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

            // Serching interface body start
            while (state.CurrentIndex < tokens.length) {

                let token = tokens[state.CurrentIndex];

                if (token.isAlphaNumericOf(state.Setting.TS_extends)) {
                    state.CurrentIndex++;
                }
                if (token.isAlphaNumericOf(state.Setting.TS_implements)) {
                    state.CurrentIndex++;
                }
                else if (token.isSeperatorOf('{')) {
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
            state.CurrentIndex++;
            this.appendToResultTillCurrent(result, tokens, state);

            // Process class code
            return this.processModuleOrClassBody(ScopeLevel.Class, result, tokens, state);
        }

        private processModuleOrClassBody(scopeLevel: ScopeLevel, result: AnalyzerResult, tokens: TextTokenCollection, state: AnalyzerState): boolean {

            let currentIndex = state.CurrentIndex;

            // Process following tokens right side of {
            this.processFollowingTokens(result, tokens, state);

            result.FlushCurrentStatementTokens();

            // Process inner statements
            var innerState = state.cloneForInnerState();
            var innerResult = new AnalyzerResult();
            this.analyzeStatementsRecursive(scopeLevel, innerResult, tokens, innerState);

            // Set inner statement result
            result.AppendInnerStatementResult(innerResult);

            state.CurrentIndex = innerState.CurrentIndex;

            // }
            result.AppendToken(tokens[state.CurrentIndex]);
            state.CurrentIndex++;

            // Process following tokens right side of }
            this.processFollowingTokens(result, tokens, state);

            result.FlushStatement();

            return true;
        }

        private processListingSyntaxBody(result: AnalyzerResult, tokens: TextTokenCollection, state: AnalyzerState): boolean {

            let currentIndex = state.CurrentIndex;

            // Process following tokens right side of {
            this.processFollowingTokens(result, tokens, state);

            result.FlushCurrentStatementTokens();

            // Parse array members
            var innerResult = new AnalyzerResult();
            var counter = new NestingCounter();
            while (state.CurrentIndex < tokens.length) {

                this.processContinueingBlankTokens(innerResult, tokens, state);

                let token = tokens[state.CurrentIndex];

                let isItemEndLetter = (token.isSeperatorOf(',') || token.isSeperatorOf('}'));

                let isZeroLevel = !counter.isInNest();

                let isArrayEnd = (isZeroLevel && token.isSeperatorOf('}'));

                let isItemEnd = (isArrayEnd || (isZeroLevel && isItemEndLetter));

                if (!isArrayEnd) {

                    counter.countParenthesis(token);
                }

                if (isItemEnd) {

                    if (isItemEndLetter && token.isSeperatorOf(',')) {

                        innerResult.AppendFollowingToken(token);
                        state.CurrentIndex++;
                    }

                    this.processFollowingTokens(innerResult, tokens, state);

                    innerResult.FlushCurrentStatementTokens();
                    innerResult.FlushStatement();
                }
                else {

                    innerResult.AppendToken(token);
                    state.CurrentIndex++;
                }

                if (this.checkEOF(tokens, state)) {

                    return false;
                }

                if (isArrayEnd) {

                    break;
                }
            }

            // Set inner statement result
            result.AppendInnerStatementResult(innerResult);

            // }
            result.AppendToken(tokens[state.CurrentIndex]);
            state.CurrentIndex++;

            result.FlushStatement();

            return true;
        }

        // Class level statement analyzing //////////////////////////

        private classSyntax_ProcessVariable(result: AnalyzerResult, startingTracingState: TracingState, tokens: TextTokenCollection, state: AnalyzerState): boolean {

            let currentIndex = state.CurrentIndex;

            // Set statement type
            result.SetCurrentStatementType(StatementType.Variable);

            // Start with specified state
            state.startTracing(startingTracingState);

            if (startingTracingState == TracingState.TracingVariableTypeName
                || startingTracingState == TracingState.TracingVariableDefinitionDefaultValue) {

                // Skip ":", "="
                state.CurrentIndex++;
            }

            // Process variable
            this.processVariable(result, tokens, state);

            // Add tokens
            this.appendToResultTillCurrent(result, tokens, state);

            // Process following tokens right side of the statement
            this.processFollowingTokens(result, tokens, state);

            // End statement
            result.FlushStatement();

            return true;
        }

        private classSyntax_ProcessFunction(result: AnalyzerResult, startingTracingState: TracingState, tokens: TextTokenCollection, state: AnalyzerState): boolean {

            let currentIndex = state.CurrentIndex;

            // Set statement type
            result.SetCurrentStatementType(StatementType.Function);

            // Start with specified state
            state.startTracing(startingTracingState);

            if (state.TracingState == TracingState.TracingFunctionGenericsArguments) {

                while (state.CurrentIndex < tokens.length) {

                    let token = tokens[state.CurrentIndex];

                    state.Trace_NestingCounter.countParenthesis(token);

                    if (!state.Trace_NestingCounter.isInNest()) {

                        if (token.isSeperatorOf('>')) {

                            state.setTracingState(TracingState.SearchingAfterIdentifer);
                            state.CurrentIndex++;
                            break;
                        }
                        else {

                            state.CurrentIndex++;
                        }
                    }
                    else {

                        state.CurrentIndex++;
                    }

                    if (this.checkEOF(tokens, state)) {

                        return false;
                    }
                }
            }

            if (state.TracingState == TracingState.SearchingAfterIdentifer) {

                while (state.CurrentIndex < tokens.length) {

                    let token = tokens[state.CurrentIndex];

                    if (token.isSeperatorOf('(')) {

                        state.setTracingState(TracingState.TracingFunctionArguments);
                        break;
                    }
                    else {

                        state.CurrentIndex++;
                    }

                    if (this.checkEOF(tokens, state)) {

                        return false;
                    }
                }
            }

            if (state.TracingState == TracingState.TracingFunctionArguments) {

                while (state.CurrentIndex < tokens.length) {

                    let token = tokens[state.CurrentIndex];

                    state.Trace_NestingCounter.countParenthesis(token);

                    if (!state.Trace_NestingCounter.isInNest()) {

                        if (token.isSeperatorOf(')')) {

                            state.setTracingState(TracingState.SearchingFunctionReturnValueTypeOrBlockStart);
                            state.CurrentIndex++;
                            break;
                        }
                        else {

                            state.CurrentIndex++;
                        }
                    }
                    else {

                        state.CurrentIndex++;
                    }

                    if (this.checkEOF(tokens, state)) {

                        return false;
                    }
                }
            }

            if (state.TracingState == TracingState.SearchingFunctionReturnValueTypeOrBlockStart) {

                while (state.CurrentIndex < tokens.length) {

                    let token = tokens[state.CurrentIndex];

                    if (token.isSeperatorOf('{')) {

                        break;
                    }

                    if (token.isSeperatorOf(':')) {

                        state.setTracingState(TracingState.TracingFunctionReturnValueType);
                        state.CurrentIndex++;
                        break;
                    }
                    else if (!token.isBlank()) {

                        state.addError(': or { expected.');
                        state.CurrentIndex++;
                    }
                    else {

                        state.CurrentIndex++;
                    }

                    if (this.checkEOF(tokens, state)) {

                        return false;
                    }
                }
            }

            if (state.TracingState == TracingState.TracingFunctionReturnValueType) {

                while (state.CurrentIndex < tokens.length) {

                    let token = tokens[state.CurrentIndex];

                    if (!state.Trace_NestingCounter.isInNest()) {

                        if (token.isSeperatorOf('{')) {

                            break;
                        }
                    }

                    state.Trace_NestingCounter.countParenthesis(token);

                    if (!state.Trace_NestingCounter.isInNest()) {

                        if (token.isSeperatorOf(';')) {

                            // TODO: Supprt only for interface
                            state.Trace_AbstructFunctionDeteced = true;
                            break;
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

            // Add tokens
            this.appendToResultTillCurrent(result, tokens, state);

            // Process inner code
            if (!state.Trace_AbstructFunctionDeteced) {

                if (!this.processStatementBlockBody(result, tokens, state)) {

                    return false;
                }

                result.FlushStatement();

                return true;
            }
            else {

                state.CurrentIndex++;
                return true;
            }
        }

        private classSyntax_ProcessProperty(result: AnalyzerResult, tokens: TextTokenCollection, state: AnalyzerState): boolean {

            let currentIndex = state.CurrentIndex;

            // Set statement type
            if (tokens[state.CurrentIndex].isAlphaNumericOf(state.Setting.TS_get)) {
                result.SetCurrentStatementType(StatementType.Property_Get);
            }
            else {
                result.SetCurrentStatementType(StatementType.Property_Set);
            }

            // Now current index is on "get" or "set"
            state.CurrentIndex++;

            // Serching property name
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

            // Serching argument part
            while (state.CurrentIndex < tokens.length) {

                let token = tokens[state.CurrentIndex];

                if (token.isSeperatorOf('(')) {

                    break;
                }
                else if (!token.isBlank()) {

                    state.addError('( expected. Detected ' + token.Text);
                    state.CurrentIndex++;
                }
                else {

                    state.CurrentIndex++;
                }

                if (this.checkEOF(tokens, state)) {

                    return false;
                }
            }

            // Tracing argument part
            while (state.CurrentIndex < tokens.length) {

                let token = tokens[state.CurrentIndex];

                state.Trace_NestingCounter.countParenthesis(token);

                if (!state.Trace_NestingCounter.isInNest()) {

                    if (token.isSeperatorOf(')')) {

                        state.CurrentIndex++;
                        break;
                    }
                    else {

                        state.CurrentIndex++;
                    }
                }
                else {

                    state.CurrentIndex++;
                }

                if (this.checkEOF(tokens, state)) {

                    return false;
                }
            }

            // Serching return value or property body
            let existsTypeName = false;
            while (state.CurrentIndex < tokens.length) {

                let token = tokens[state.CurrentIndex];

                if (token.isSeperatorOf(':')) {

                    state.CurrentIndex++;
                    existsTypeName = true;
                    break;
                }
                else if (token.isSeperatorOf('{')) {

                    break;
                }
                else if (!token.isBlank()) {

                    state.addError(': or { expected.');
                    state.CurrentIndex++;
                }
                else {

                    state.CurrentIndex++;
                }

                if (this.checkEOF(tokens, state)) {

                    return false;
                }
            }

            // Tracing return type
            if (existsTypeName) {

                while (state.CurrentIndex < tokens.length) {

                    let token = tokens[state.CurrentIndex];

                    if (!state.Trace_NestingCounter.isInNest()) {

                        if (token.isSeperatorOf('{')) {

                            break;
                        }
                    }

                    state.Trace_NestingCounter.countParenthesis(token);

                    state.CurrentIndex++;
                }
            }

            // Add tokens
            this.appendToResultTillCurrent(result, tokens, state);

            // Process inner code
            if (!this.processStatementBlockBody(result, tokens, state)) {

                return false;
            }

            result.FlushStatement();

            return true;
        }

        // Statement level syntax analyzing /////////////////////////

        private processStatementBlockBody(result: AnalyzerResult, tokens: TextTokenCollection, state: AnalyzerState): boolean {

            // Now current index is before "{" of a block or first token of single statement.
            // And this function sets result to current statement.

            let currentIndex = state.CurrentIndex;

            state.LastIndex = state.CurrentIndex;

            // Searching block start or single statement
            let existsLeftBrace = false;
            while (state.CurrentIndex < tokens.length) {

                let token = tokens[state.CurrentIndex];

                state.Trace_NestingCounter.countParenthesis(token);

                if (token.isSeperatorOf('{')) {

                    existsLeftBrace = true;
                    break;
                }
                else if (!token.isBlank()) {

                    break;
                }
                else {

                    state.CurrentIndex++;
                }

                if (this.checkEOF(tokens, state)) {

                    return false;
                }
            }

            let isImplicitBlock = !existsLeftBrace;

            if (existsLeftBrace) {

                result.AppendToken(tokens[state.CurrentIndex]);
                state.CurrentIndex++;
            }

            // Process following tokens right side of {
            this.processFollowingTokens(result, tokens, state);

            result.FlushCurrentStatementTokens();

            // Process bolock-inner statements till block end. It will process multiple statement.
            var innerState = state.cloneForInnerState();
            var innerResult = new AnalyzerResult();

            while (innerState.CurrentIndex < tokens.length) {

                let token = tokens[innerState.CurrentIndex];

                state.Trace_NestingCounter.countParenthesis(token);

                // Block End
                if (token.isSeperatorOf('}')) {

                    break;
                }
                else if (isImplicitBlock && token.isSeperatorOf(';')) {

                    innerState.CurrentIndex++;
                    break;
                }
                else if (isImplicitBlock
                    && (token.isAlphaNumericOf(innerState.Setting.TS_else)
                    || token.isAlphaNumericOf(innerState.Setting.TS_case)
                    || token.isAlphaNumericOf(innerState.Setting.TS_break))
                    ) {

                    break;
                } 
                // Whitespaces
                else if (token.isBlank()) {

                    this.processContinueingBlankTokens(innerResult, tokens, innerState);
                }
                // Continue searching
                else {

                    this.processStatementLevelSyntax(innerResult, tokens, innerState);
                }

                if (this.checkEOF(tokens, innerState)) {

                    return false;
                }
            }

            // Set block-inner statement result
            result.AppendInnerStatementResult(innerResult);

            state.CurrentIndex = innerState.CurrentIndex;

            // }
            if (!isImplicitBlock) {

                result.AppendToken(tokens[state.CurrentIndex]);
                state.CurrentIndex++;
            }

            // Process following tokens right side of }
            this.processFollowingTokens(result, tokens, state);

            return true;
        }

        private processStatementLevelSyntax(result: AnalyzerResult, tokens: TextTokenCollection, state: AnalyzerState): boolean {

            let currentIndex = state.CurrentIndex;
            state.LastIndex = state.CurrentIndex;

            state.startTracing(TracingState.SearchingStatementStart);

            while (state.CurrentIndex < tokens.length) {

                let token = tokens[state.CurrentIndex];

                // Blank
                if (token.isBlank()) {

                    state.CurrentIndex++;
                }
                // var
                else if (token.isAlphaNumericOf(state.Setting.TS_var)) {

                    return this.statementSyntax_ProcessVariable(result, tokens, state);
                }
                // function
                else if (token.isAlphaNumericOf(state.Setting.TS_function)) {

                    return this.statementSyntax_ProcessFunction(result, tokens, state);
                }
                // if
                else if (token.isAlphaNumericOf(state.Setting.TS_if)) {

                    return this.statementSyntax_ProcessIf(result, tokens, state);
                }
                // else, else if
                else if (token.isAlphaNumericOf(state.Setting.TS_else)) {


                    if (state.CurrentIndex + 2 < tokens.length
                        && tokens[state.CurrentIndex + 2].isAlphaNumericOf(state.Setting.TS_if)) {

                        return this.statementSyntax_ProcessElseIf(result, tokens, state);
                    }
                    else {

                        return this.statementSyntax_ProcessElse(result, tokens, state);
                    }
                }
                // for
                else if (token.isAlphaNumericOf(state.Setting.TS_for)) {

                    return this.statementSyntax_ProcessForWhileSwitch(result, StatementType.For, tokens, state);
                }
                // while
                else if (token.isAlphaNumericOf(state.Setting.TS_while)) {

                    return this.statementSyntax_ProcessForWhileSwitch(result, StatementType.While, tokens, state);
                }
                // switch
                else if (token.isAlphaNumericOf(state.Setting.TS_switch)) {

                    return this.statementSyntax_ProcessForWhileSwitch(result, StatementType.Switch, tokens, state);
                }
                // try
                else if (token.isAlphaNumericOf(state.Setting.TS_try)) {

                    return this.statementSyntax_ProcessTry(result, tokens, state);
                }
                // catch
                else if (token.isAlphaNumericOf(state.Setting.TS_catch)) {

                    return this.statementSyntax_ProcessChatch(result, tokens, state);
                }
                // Ggeneral statement
                else {

                    return this.statementSyntax_ProcessGeneralStatement(result, tokens, state);
                }

                if (this.checkEOF(tokens, state)) {

                    return false;
                }
            }

            return true;
        }

        private statementSyntax_ProcessGeneralStatement(result: AnalyzerResult, tokens: TextTokenCollection, state: AnalyzerState): boolean {

            let currentIndex = state.CurrentIndex;

            // Set statement type
            result.SetCurrentStatementType(StatementType.GeneralStatement);

            // Trace statement till ";"
            while (state.CurrentIndex < tokens.length) {

                let token = tokens[state.CurrentIndex];

                if (state.Trace_NestingCounter.isInNest()) {

                    state.CurrentIndex++;
                }
                else {

                    if (token.isSeperatorOf('}')) {

                        state.addError('; expected. Detected }');
                        break;
                    }
                    else if (token.isSeperatorOf(';')) {

                        state.CurrentIndex++;
                        break;
                    }
                    else {

                        state.CurrentIndex++;
                    }
                }

                state.Trace_NestingCounter.countParenthesis(token); // must do this afer process above. for detect '}'

                if (this.checkEOF(tokens, state)) {

                    return false;
                }
            }

            // Add tokens
            this.appendToResultTillCurrent(result, tokens, state);

            // Process following tokens right side of the statement
            this.processFollowingTokens(result, tokens, state);

            // End statement
            result.FlushStatement();

            return true;
        }

        private statementSyntax_ProcessVariable(result: AnalyzerResult, tokens: TextTokenCollection, state: AnalyzerState): boolean {

            let currentIndex = state.CurrentIndex;

            // Set statement type
            result.SetCurrentStatementType(StatementType.Variable);

            // Now current index is on "var"
            state.CurrentIndex++;

            // Process variable
            state.startTracing(TracingState.SearchingIdentifierName);
            this.processVariable(result, tokens, state);

            // Add tokens
            this.appendToResultTillCurrent(result, tokens, state);

            // Process following tokens right of the statement
            this.processFollowingTokens(result, tokens, state);

            // End statement
            result.FlushStatement();

            return true;
        }

        private statementSyntax_ProcessFunction(result: AnalyzerResult, tokens: TextTokenCollection, state: AnalyzerState): boolean {

            let currentIndex = state.CurrentIndex;

            // Set statement type
            result.SetCurrentStatementType(StatementType.Function);

            // Now current index is on "function"
            state.CurrentIndex++;

            // Search function name
            while (state.CurrentIndex < tokens.length) {

                let token = tokens[state.CurrentIndex];

                if (token.isAlphaNumeric()) {

                    state.CurrentIndex++;
                    break;
                }
                else {

                    state.CurrentIndex++;
                }

                if (this.checkEOF(tokens, state)) {

                    return false;
                }
            }

            // Trace the block body
            if (!this.classSyntax_ProcessFunction(result, TracingState.SearchingAfterIdentifer, tokens, state)) {

                return false;
            }

            return true;
        }

        private statementSyntax_ProcessIf(result: AnalyzerResult, tokens: TextTokenCollection, state: AnalyzerState): boolean {

            let currentIndex = state.CurrentIndex;

            // Set statement type
            result.SetCurrentStatementType(StatementType.If);

            // Now current index is on "if"
            state.CurrentIndex++;

            // Trace the argument
            if (!this.processStatementBlockArgument(result, tokens, state)) {

                return false;
            }

            // Add tokens
            this.appendToResultTillCurrent(result, tokens, state);

            // Trace the block body
            if (!this.processStatementBlockBody(result, tokens, state)) {

                return false;
            }

            result.FlushStatement();

            return true;
        }

        private statementSyntax_ProcessElseIf(result: AnalyzerResult, tokens: TextTokenCollection, state: AnalyzerState): boolean {

            // Set statement type
            result.SetCurrentStatementType(StatementType.ElseIf);

            // Now current index is on "else"
            state.CurrentIndex += 3;

            // Trace the argument
            if (!this.processStatementBlockArgument(result, tokens, state)) {

                return false;
            }

            // Add tokens
            this.appendToResultTillCurrent(result, tokens, state);

            // Trace the block body
            if (!this.processStatementBlockBody(result, tokens, state)) {

                return false;
            }

            result.FlushStatement();

            return true;
        }

        private statementSyntax_ProcessElse(result: AnalyzerResult, tokens: TextTokenCollection, state: AnalyzerState): boolean {

            // Set statement type
            result.SetCurrentStatementType(StatementType.Else);

            // Now current index is on "else"
            state.CurrentIndex++;

            // Add tokens
            this.appendToResultTillCurrent(result, tokens, state);

            // Trace the block body
            if (!this.processStatementBlockBody(result, tokens, state)) {

                return false;
            }

            result.FlushStatement();

            return true;
        }

        private statementSyntax_ProcessForWhileSwitch(result: AnalyzerResult, statementType: StatementType, tokens: TextTokenCollection, state: AnalyzerState): boolean {

            let currentIndex = state.CurrentIndex;

            // Set statement type
            result.SetCurrentStatementType(statementType);

            // Now current index is on "for"
            state.CurrentIndex++;

            // Trace the argument
            if (!this.processStatementBlockArgument(result, tokens, state)) {

                return false;
            }

            // Add tokens
            this.appendToResultTillCurrent(result, tokens, state);

            // Trace the block body
            if (!this.processStatementBlockBody(result, tokens, state)) {

                return false;
            }

            result.FlushStatement();

            return true;
        }

        private statementSyntax_ProcessTry(result: AnalyzerResult, tokens: TextTokenCollection, state: AnalyzerState): boolean {

            let currentIndex = state.CurrentIndex;

            // Set statement type
            result.SetCurrentStatementType(StatementType.Try);

            // Now current index is on "try"
            state.CurrentIndex++;

            // Add tokens
            this.appendToResultTillCurrent(result, tokens, state);

            // Trace the block body
            if (!this.processStatementBlockBody(result, tokens, state)) {

                return false;
            }

            result.FlushStatement();

            return true;
        }

        private statementSyntax_ProcessChatch(result: AnalyzerResult, tokens: TextTokenCollection, state: AnalyzerState): boolean {

            let currentIndex = state.CurrentIndex;

            // Set statement type
            result.SetCurrentStatementType(StatementType.Catch);

            // Now current index is on "try"
            state.CurrentIndex++;

            // Trace the argument
            if (!this.processStatementBlockArgument(result, tokens, state)) {

                return false;
            }

            // Add tokens
            this.appendToResultTillCurrent(result, tokens, state);

            // Trace the block body
            if (!this.processStatementBlockBody(result, tokens, state)) {

                return false;
            }

            result.FlushStatement();

            return true;
        }

        // Common functions /////////////////////////////////////////

        private checkEOF(tokens: TextTokenCollection, state: AnalyzerState): boolean {

            if (state.CurrentIndex >= tokens.length) {

                state.setTracingState(TracingState.UnexpectedEOF);
                return true;
            }
            else {

                return false;
            }
        }

        private isAccessibilityToken(token: TextToken, state: AnalyzerState): boolean {

            return DictionaryContainsKey(state.Setting.TS_AccesTypes, token.Text);
        }

        private processAccessibility(token: TextToken, state: AnalyzerState): boolean {

            if (!state.Trace_AccessTypeDetected) {

                state.Trace_AccessTypeDetected = true;
                state.Trace_DetectedAccesibilityTypeToken = token;
            }
            else {

                state.addError('Accessibility modifier already seen.');
            }

            state.CurrentIndex++;

            return false;
        }

        private appendToResultTillCurrent(result: AnalyzerResult, tokens: TextTokenCollection, state: AnalyzerState) {

            for (let tokenIndex = state.LastIndex; tokenIndex < state.CurrentIndex; tokenIndex++) {

                let token = tokens[tokenIndex];

                result.AppendToken(token);
            }

            state.LastIndex = state.CurrentIndex;
        }

        private processContinueingBlankTokens(result: AnalyzerResult, tokens: TextTokenCollection, state: AnalyzerState) {

            let currentIndex = state.CurrentIndex;

            // Trace tokens to determine index
            let endIndex = -1;
            let lastLineEndIndex = -1;
            for (let i = state.CurrentIndex; i < tokens.length; i++) {
                let token = tokens[i];

                if (token.isLineEnd()) {

                    lastLineEndIndex = i;
                }

                if (!token.isBlank()) {

                    endIndex = i - 1;
                    break;
                }
            }

            // Whitespace statement
            if (lastLineEndIndex != -1) {

                for (let i = state.CurrentIndex; i <= lastLineEndIndex; i++) {
                    let token = tokens[i];

                    result.AppendToken(token);
                }

                result.SetCurrentStatementType(StatementType.WhiteSpaces);
                result.FlushStatement();
            }

            // Indent tokens for next statement
            let startIndex: int;
            if (lastLineEndIndex != -1) {

                startIndex = lastLineEndIndex + 1;

                if (startIndex > endIndex) {

                    startIndex = -1;// When only line end, this occurs. No indent tokens.
                }
            }
            else {

                startIndex = state.CurrentIndex;
            }

            if (endIndex == -1) {

                endIndex = tokens.length - 1;
            }

            if (startIndex != -1) {

                for (let i = startIndex; i <= endIndex; i++) {
                    let token = tokens[i];

                    result.AppendIndentToken(token);
                }
            }

            state.CurrentIndex = endIndex + 1;
            state.LastIndex = state.CurrentIndex;
        }

        private processFollowingTokens(result: AnalyzerResult, tokens: TextTokenCollection, state: AnalyzerState) {

            let currentIndex = state.CurrentIndex;

            let existsFollowingTokens = false;
            let endIndex = -1;

            for (let tokenIndex = state.CurrentIndex; tokenIndex <= tokens.endIndex; tokenIndex++) {
                var token = tokens[tokenIndex];

                if (token.isLineEnd()) {

                    endIndex = tokenIndex;
                    existsFollowingTokens = true;
                    break;
                }
                else if (token.isComment() || token.isBlank()) {

                    existsFollowingTokens = true;
                    endIndex = tokenIndex;
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

            for (let tokenIndex = state.CurrentIndex; tokenIndex <= endIndex; tokenIndex++) {

                result.AppendFollowingToken(tokens[tokenIndex]);
            }

            state.CurrentIndex = endIndex + 1;
            state.LastIndex = state.CurrentIndex;
        }

        private processVariable(result: AnalyzerResult, tokens: TextTokenCollection, state: AnalyzerState) {

            let currentIndex = state.CurrentIndex;

            if (state.TracingState == TracingState.SearchingIdentifierName) {

                while (state.CurrentIndex < tokens.length) {

                    let token = tokens[state.CurrentIndex];

                    if (token.isAlphaNumeric()) {

                        state.Trace_IdentifierDetected = true;
                        state.setTracingState(TracingState.SearchingAfterIdentifer);
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
            }

            if (state.TracingState == TracingState.SearchingAfterIdentifer) {

                while (state.CurrentIndex < tokens.length) {

                    let token = tokens[state.CurrentIndex];

                    if (token.isSeperatorOf(':')) {

                        state.Trace_TypeNameSeperatorDeteced = true;
                        state.setTracingState(TracingState.TracingVariableTypeName);
                        state.CurrentIndex++;
                        break;
                    }
                    else if (token.isSeperatorOf('=')) {

                        state.Trace_AsignmentDeteced = true;
                        state.setTracingState(TracingState.TracingVariableDefinitionDefaultValue);
                        state.CurrentIndex++;
                        break;
                    }
                    else if (token.isSeperatorOf(';')) {

                        state.setTracingState(TracingState.TracingVariableFinished);
                        state.CurrentIndex++;
                        break;
                    }
                    else if (!token.isBlank()) {

                        state.addError('= or : expected.');
                        state.CurrentIndex++;
                    }
                    else {

                        state.CurrentIndex++;
                    }

                    if (this.checkEOF(tokens, state)) {

                        return false;
                    }
                }
            }

            if (state.TracingState == TracingState.TracingVariableTypeName) {

                // Tracing type name by common function
                if (!this.processTypeName(result, tokens, state)) {

                    return false;
                }

                // After type name
                while (state.CurrentIndex < tokens.length) {

                    let token = tokens[state.CurrentIndex];

                    state.Trace_NestingCounter.countParenthesis(token);

                    if (token.isSeperatorOf('=')) {

                        state.Trace_AsignmentDeteced = true;
                        state.setTracingState(TracingState.TracingVariableDefinitionDefaultValue);
                        state.CurrentIndex++;
                        break;
                    }
                    else if (token.isSeperatorOf(';')) {

                        state.setTracingState(TracingState.TracingVariableFinished);
                        state.CurrentIndex++;
                        break;
                    }
                    else if (!token.isBlank()) {

                        state.addError('= or : expected.');
                        state.CurrentIndex++;
                    }
                    else {

                        state.CurrentIndex++;
                    }

                    if (this.checkEOF(tokens, state)) {

                        return false;
                    }
                }
            }

            if (state.TracingState == TracingState.TracingVariableDefinitionDefaultValue) {

                while (state.CurrentIndex < tokens.length) {

                    let token = tokens[state.CurrentIndex];

                    state.Trace_NestingCounter.countParenthesis(token);

                    if (!state.Trace_NestingCounter.isInNest()) {

                        if (token.isSeperatorOf(';')) {

                            state.CurrentIndex++;
                            break;
                        }
                        else if (token.isLineEnd()) {

                            state.addError('; expected. Detected line end.');
                            break;
                        }
                        else {

                            state.CurrentIndex++;
                        }
                    }
                    else {

                        state.CurrentIndex++;
                    }

                    if (this.checkEOF(tokens, state)) {

                        return false;
                    }
                }
            }

            // Unexpected end
            return false;
        }

        private processTypeName(result: AnalyzerResult, tokens: TextTokenCollection, state: AnalyzerState): boolean {

            let currentIndex = state.CurrentIndex;

            // Search start token
            while (state.CurrentIndex < tokens.length) {

                let token = tokens[state.CurrentIndex];

                if (token.isAlphaNumeric()) {

                    break;
                }
                else if (!token.isBlank()) {

                    state.addError('Type name expected.');
                    return false;
                }
                else {

                    state.CurrentIndex++;
                }
            }

            // Now current index is on alphanumeric token
            state.CurrentIndex++;

            // Trace type name
            // Result index: +1 index after last index of token of the type name 
            // TODO: support spaces between first alphanumeric token and generics argument "<"
            while (state.CurrentIndex < tokens.length) {

                let token = tokens[state.CurrentIndex];

                state.Trace_NestingCounter.countParenthesis(token);

                if (!state.Trace_NestingCounter.isInNest()) {

                    if (token.isBlank()) {

                        state.CurrentIndex++;
                        break;
                    }
                    else if (token.isSeperatorOf(';')) {

                        break;
                    }
                    else {

                        state.CurrentIndex++;
                    }
                }
                else {

                    state.CurrentIndex++;
                }

                if (this.checkEOF(tokens, state)) {

                    return false;
                }
            }

            return true;
        }

        private processStatementBlockArgument(result: AnalyzerResult, tokens: TextTokenCollection, state: AnalyzerState): boolean {

            let currentIndex = state.CurrentIndex;

            // Searching argument (
            while (state.CurrentIndex < tokens.length) {

                let token = tokens[state.CurrentIndex];

                state.Trace_NestingCounter.countParenthesis(token);

                if (token.isSeperatorOf('(')) {

                    state.CurrentIndex++;
                    break;
                }
                else if (!token.isBlank()) {

                    state.addError('( expected. Detected ' + token.Text);
                    state.CurrentIndex++;
                }
                else {

                    state.CurrentIndex++;
                }

                if (this.checkEOF(tokens, state)) {

                    return false;
                }
            }

            // Tracing argument
            while (state.CurrentIndex < tokens.length) {

                let token = tokens[state.CurrentIndex];

                state.Trace_NestingCounter.countParenthesis(token);

                if (!state.Trace_NestingCounter.isInNest()) {

                    if (token.isSeperatorOf(')')) {
                        state.CurrentIndex++;
                        break;
                    }
                    else {

                        state.CurrentIndex++;
                    }
                }
                else {

                    state.CurrentIndex++;
                }

                if (this.checkEOF(tokens, state)) {

                    return false;
                }
            }

            return true;
        }
    }
}