
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

        TS_var = 'var';
        TS_if = 'if';
        TS_else = 'else';
        TS_switch = 'switch';
        TS_case = 'case';
        TS_break = 'break';

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
        Trace_AbstructFunctionDeteced = false;

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
            this.Trace_AbstructFunctionDeteced = false;
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

            this.processClassBlock(result, tokens, state);
        }

        // Module or class level syntax analyzing ///////////////////

        private processClassSyntax(result: AnalyzerResult, tokens: TextTokenCollection, state: AnalyzerState): boolean {

            let currentIndex = state.CurrentIndex;
            state.LastIndex = state.CurrentIndex;

            // Searching start
            while (state.CurrentIndex < tokens.length) {

                let token = tokens[state.CurrentIndex];

                if (token.isAlphaNumeric()) {

                    // Accesibility
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
                        return this.classSyntax_ProcessModule(result, tokens, state);
                    }
                    // class
                    else if (token.isAlphaNumericOf(state.Setting.TS_class)) {
                        return this.classSyntax_ProcessClass(result, tokens, state);
                    }
                    // interface
                    else if (token.isAlphaNumericOf(state.Setting.TS_interface)) {
                        return this.classSyntax_ProcessInterface(result, tokens, state);
                    }
                    // enum
                    else if (token.isAlphaNumericOf(state.Setting.TS_enum)) {
                        return this.classSyntax_ProcessEnum(result, tokens, state);
                    }
                    // property
                    else if (token.isAlphaNumericOf(state.Setting.TS_get) || token.isAlphaNumericOf(state.Setting.TS_set)) {
                        return this.classSyntax_ProcessProperty(result, tokens, state);
                    }
                    else {
                        // Identifier detected... to next step
                        state.Trace_IdentifierDetected = true;
                        state.CurrentIndex++;
                        break;
                    }
                }
                else if (!token.isBlank()) {
                    state.addError('Expected a constructor, method, accessor, or property.');
                    state.CurrentIndex++;
                }
                else {
                    state.CurrentIndex++;
                }

                if (this.classSyntax_CheckEOF(tokens, state)) {
                    return false;
                }
            }

            // After identifier... branchs to variable or function definition
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

                if (this.classSyntax_CheckEOF(tokens, state)) {
                    return false;
                }
            }

            return false;
        }

        private classSyntax_CheckEOF(tokens: TextTokenCollection, state: AnalyzerState): boolean {

            if (state.CurrentIndex >= tokens.length) {
                state.TracingState = TracingState.UnexpectedEOF;
                return true;
            }
            else {
                return false;
            }
        }

        private classSyntax_ProcessModule(result: AnalyzerResult, tokens: TextTokenCollection, state: AnalyzerState): boolean {

            let currentIndex = state.CurrentIndex;

            // Set statement type
            result.SetCurrentStatementType(StatementType.Module);

            // Now current index on "module" or "namescpace"
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

                if (this.classSyntax_CheckEOF(tokens, state)) {
                    return false;
                }
            }

            // Serching module body start
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

                if (this.classSyntax_CheckEOF(tokens, state)) {
                    return false;
                }
            }

            // Add tokens
            this.appendToResultTillCurrent(result, tokens, state);

            // Process module code
            return this.classSyntax_ProcessGeneralClasstBlock(result, StatementType.Enum, tokens, state);
        }

        private classSyntax_ProcessEnum(result: AnalyzerResult, tokens: TextTokenCollection, state: AnalyzerState): boolean {

            let currentIndex = state.CurrentIndex;

            // Set statement type
            result.SetCurrentStatementType(StatementType.Enum);

            // Now current index on "enum"
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

                if (this.classSyntax_CheckEOF(tokens, state)) {
                    return false;
                }
            }

            // Serching enum body start
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

                if (this.classSyntax_CheckEOF(tokens, state)) {
                    return false;
                }
            }

            // Add tokens
            this.appendToResultTillCurrent(result, tokens, state);

            // Process enum items
            return this.classSyntax_ProcessGeneraListingSyntax(result, tokens, state);
        }

        private classSyntax_ProcessClass(result: AnalyzerResult, tokens: TextTokenCollection, state: AnalyzerState): boolean {

            let currentIndex = state.CurrentIndex;

            // Set statement type
            result.SetCurrentStatementType(StatementType.Class);

            // Now current index on "class"
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

            // Serching module body start
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
                    break;
                }
                else if (!token.isBlank()) {
                    state.addError('{ expected.');
                    state.CurrentIndex++;
                }
                else {
                    state.CurrentIndex++;
                }

                if (this.classSyntax_CheckEOF(tokens, state)) {
                    return false;
                }
            }

            // Add tokens
            this.appendToResultTillCurrent(result, tokens, state);

            // Process class code
            return this.classSyntax_ProcessGeneralClasstBlock(result, StatementType.Enum, tokens, state);
        }

        private classSyntax_ProcessInterface(result: AnalyzerResult, tokens: TextTokenCollection, state: AnalyzerState): boolean {

            let currentIndex = state.CurrentIndex;

            // Set statement type
            result.SetCurrentStatementType(StatementType.Interface);

            // Now current index on "interface"
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

            // Serching module body start
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
                    break;
                }
                else if (!token.isBlank()) {
                    state.addError('{ expected.');
                    state.CurrentIndex++;
                }
                else {
                    state.CurrentIndex++;
                }

                if (this.classSyntax_CheckEOF(tokens, state)) {
                    return false;
                }
            }

            // Add tokens
            this.appendToResultTillCurrent(result, tokens, state);

            // Process class code
            return this.classSyntax_ProcessGeneralClasstBlock(result, StatementType.Enum, tokens, state);
        }

        private classSyntax_ProcessVariable(result: AnalyzerResult, startingTracingState: TracingState, tokens: TextTokenCollection, state: AnalyzerState): boolean {

            let currentIndex = state.CurrentIndex;

            // Set statement type
            result.SetCurrentStatementType(StatementType.Variable);

            // Start with specified state
            state.TracingState = startingTracingState;

            if (startingTracingState == TracingState.TracingVariableTypeName
                || startingTracingState == TracingState.TracingVariableTypeName) {

                state.CurrentIndex++;
            }

            // Process variable
            this.traceVariable(result, tokens, state);

            // Add tokens
            this.appendToResultTillCurrent(result, tokens, state);

            // End statement
            result.FlushStatement();

            return true;
        }

        private classSyntax_ProcessFunction(result: AnalyzerResult, startingTracingState: TracingState, tokens: TextTokenCollection, state: AnalyzerState): boolean {

            let currentIndex = state.CurrentIndex;

            // Set statement type
            result.SetCurrentStatementType(StatementType.Function);

            // Start with specified state
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
                else if (state.TracingState == TracingState.SearchingAfterIdentifer) {

                    if (token.isSeperatorOf('(')) {
                        state.TracingState = TracingState.TracingFunctionArguments;
                        state.CurrentIndex++;
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

                    if (!state.Trace_NestingCounter.isInNest()) {
                        if (token.isSeperatorOf('{')) {
                            state.CurrentIndex++;
                            break;
                        }
                    }

                    state.Trace_NestingCounter.countParenthesis(token);

                    if (!state.Trace_NestingCounter.isInNest()) {
                        if (token.isSeperatorOf(':')) {
                            state.TracingState = TracingState.TracingFunctionReturnValueType;
                            state.CurrentIndex++;
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

                    if (!state.Trace_NestingCounter.isInNest()) {
                        if (token.isSeperatorOf('{')) {
                            state.CurrentIndex++;
                            break;
                        }
                    }

                    state.Trace_NestingCounter.countParenthesis(token);

                    if (!state.Trace_NestingCounter.isInNest()) {
                        if (token.isSeperatorOf(';')) {
                            // TODO: Supprt only for interface
                            state.Trace_AbstructFunctionDeteced = true;
                            state.CurrentIndex++;
                            break;
                        }
                        else if (!token.isBlank()) {
                            // TODO: Change error message whether class or interface
                            state.addError('{ or ; expected.');
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

                if (this.classSyntax_CheckEOF(tokens, state)) {
                    return false;
                }
            }

            // Add tokens
            this.appendToResultTillCurrent(result, tokens, state);

            // Process class code
            if (!state.Trace_AbstructFunctionDeteced) {
                return this.processClassBlock(result, tokens, state);
            }
            else {
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

            // Now current index on "get" or "set"
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

                if (this.classSyntax_CheckEOF(tokens, state)) {
                    return false;
                }
            }

            // Serching argument part
            while (state.CurrentIndex < tokens.length) {

                let token = tokens[state.CurrentIndex];

                if (token.isSeperatorOf('(')) {
                    state.CurrentIndex++;
                    break;
                }
                else if (!token.isBlank()) {
                    state.addError('( expected.');
                    state.CurrentIndex++;
                }
                else {
                    state.CurrentIndex++;
                }

                if (this.classSyntax_CheckEOF(tokens, state)) {
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

                if (this.classSyntax_CheckEOF(tokens, state)) {
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

                if (this.classSyntax_CheckEOF(tokens, state)) {
                    return false;
                }
            }

            // Tracing return type
            if (existsTypeName) {
                while (state.CurrentIndex < tokens.length) {

                    let token = tokens[state.CurrentIndex];

                    if (!state.Trace_NestingCounter.isInNest()) {
                        if (token.isSeperatorOf('{')) {
                            state.CurrentIndex++;
                            break;
                        }
                    }

                    state.Trace_NestingCounter.countParenthesis(token);

                    state.CurrentIndex++;
                }
            }

            // Add tokens
            this.appendToResultTillCurrent(result, tokens, state);

            // Process class code
            return this.classSyntax_ProcessGeneralClasstBlock(result, StatementType.Enum, tokens, state);
        }

        private classSyntax_ProcessGeneralClasstBlock(result: AnalyzerResult, statementType: StatementType, tokens: TextTokenCollection, state: AnalyzerState): boolean {

            let currentIndex = state.CurrentIndex;

            // Process inner statements
            var innerState = state.cloneForInnerState();
            var innerResult = new AnalyzerResult();
            this.processClassBlock(innerResult, tokens, innerState);

            // Set inner statement result
            result.SetInnerStatementToCurrentStatement(innerResult.Statements);
            result.FlushCurrentStatementTokens();

            state.CurrentIndex = innerState.CurrentIndex;
            
            // }
            result.AppendToCurrentStatement(tokens[state.CurrentIndex]);
            result.FlushStatement();

            state.CurrentIndex++;

            return true;
        }

        private classSyntax_ProcessGeneraListingSyntax(result: AnalyzerResult, tokens: TextTokenCollection, state: AnalyzerState): boolean {

            let currentIndex = state.CurrentIndex;

            // Parse array members
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

                if (this.classSyntax_CheckEOF(tokens, state)) {
                    return false;
                }
            }

            // Set inner statement result
            result.SetInnerStatementToCurrentStatement(innerResult.Statements);
            result.FlushCurrentStatementTokens();

            return true;
        }

        // Module or class level block analyzing ////////////////////

        private processClassBlock(result: AnalyzerResult, tokens: TextTokenCollection, state: AnalyzerState) {

            let currentIndex = state.CurrentIndex;

            state.LastIndex = state.CurrentIndex;

            // Searching a syntax
            while (state.CurrentIndex < tokens.length) {

                let token = tokens[currentIndex];

                // Block End
                if (token.isAlphaNumericOf('}')) {
                    break;
                }
                // Start of a syntax
                else if (!token.isBlank()) {
                    result.FlushStatement();
                    this.processClassSyntax(result, tokens, state);
                }
                // Contine searching
                else {
                    result.AppendToCurrentStatement(token);
                    state.CurrentIndex++;
                }

                if (this.classSyntax_CheckEOF(tokens, state)) {
                    return false;
                }
            }

            return true;
        }

        // Statement level syntax analyzing /////////////////////////

        private processStatementSyntax(result: AnalyzerResult, tokens: TextTokenCollection, state: AnalyzerState): boolean {

            let currentIndex = state.CurrentIndex;
            state.LastIndex = state.CurrentIndex;

            // Searching start
            while (state.CurrentIndex < tokens.length) {

                let token = tokens[state.CurrentIndex];

                if (token.isAlphaNumeric()) {

                    if (token.isAlphaNumericOf(state.Setting.TS_var)) {
                        return this.statementSyntax_ProcessVariable(result, tokens, state);
                    }
                    else if (token.isAlphaNumericOf(state.Setting.TS_if)) {
                        return this.statementSyntax_ProcessIf(result, tokens, state);
                    }
                    else if (token.isSeperatorOf(';')) {
                        return this.statementSyntax_ProcessGeneralStatment(result, tokens, state);
                    }
                    else {
                        state.CurrentIndex++;
                    }
                }
            }

            return true;
        }

        private statementSyntax_ProcessGeneralStatment(result: AnalyzerResult, tokens: TextTokenCollection, state: AnalyzerState): boolean {

            let currentIndex = state.CurrentIndex;

            // Set statement type
            result.SetCurrentStatementType(StatementType.GeneralStatement);

            // Now current index on ";"
            state.CurrentIndex++;

            // Add tokens
            this.appendToResultTillCurrent(result, tokens, state);

            // End statement
            result.FlushStatement();

            return true;
        }

        private statementSyntax_ProcessVariable(result: AnalyzerResult, tokens: TextTokenCollection, state: AnalyzerState): boolean {

            let currentIndex = state.CurrentIndex;

            // Set statement type
            result.SetCurrentStatementType(StatementType.Variable);

            // Now current index on "var"
            state.CurrentIndex++;

            // Process variable
            this.traceVariable(result, tokens, state);

            // Add tokens
            this.appendToResultTillCurrent(result, tokens, state);

            // End statement
            result.FlushStatement();

            return true;
        }

        private statementSyntax_ProcessIf(result: AnalyzerResult, tokens: TextTokenCollection, state: AnalyzerState): boolean {

            let currentIndex = state.CurrentIndex;

            // Set statement type
            result.SetCurrentStatementType(StatementType.If);

            // Now current index on "if"
            state.CurrentIndex++;

            // Searching argument (
            let indentiferNameToken: TextToken = null;

            while (state.CurrentIndex < tokens.length) {

                let token = tokens[state.CurrentIndex];

                if (token.isSeperatorOf('(')) {
                    indentiferNameToken = token;
                    state.CurrentIndex++;
                    break;
                }
                else if (!token.isBlank()) {
                    state.addError('( expected.');
                    state.CurrentIndex++;
                }
                else {
                    state.CurrentIndex++;
                }

                if (this.classSyntax_CheckEOF(tokens, state)) {
                    return false;
                }
            }

            // Tracing argument
            while (state.CurrentIndex < tokens.length) {

                let token = tokens[state.CurrentIndex];

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

                state.Trace_NestingCounter.countParenthesis(token);

                if (this.classSyntax_CheckEOF(tokens, state)) {
                    return false;
                }
            }

            if (currentIndex == 1)
                currentIndex = currentIndex;
            else
                currentIndex = currentIndex;

            // Searching block start or single sttatement
            let existsBrace = false;
            while (state.CurrentIndex < tokens.length) {

                let token = tokens[state.CurrentIndex];

                if (token.isSeperatorOf('{')) {
                    existsBrace = true;
                    state.CurrentIndex++;
                    break;
                }
                else if (!token.isBlank()) {
                    break;
                }
                else {
                    state.CurrentIndex++;
                }

                if (this.classSyntax_CheckEOF(tokens, state)) {
                    return false;
                }

            }

            // Add tokens
            this.appendToResultTillCurrent(result, tokens, state);

            // Process if block statements
            let singleStatement = !existsBrace;
            this.processStatementBlock(result, tokens, singleStatement, state)

            // }
            if (existsBrace) {
                result.AppendToCurrentStatement(tokens[state.CurrentIndex]);
                result.FlushStatement();
                state.CurrentIndex++;
            }

            return true;
        }

        // Statement level block analyzing //////////////////////////

        private processStatementBlock(result: AnalyzerResult, tokens: TextTokenCollection, singleStatement: boolean, state: AnalyzerState): boolean {

            let currentIndex = state.CurrentIndex;

            state.LastIndex = state.CurrentIndex;

            // Searching a syntax
            while (state.CurrentIndex < tokens.length) {

                let token = tokens[currentIndex];

                // Block End
                if (token.isAlphaNumericOf('}')) {
                    break;
                }
                else if (token.isAlphaNumericOf(state.Setting.TS_else)
                    || token.isAlphaNumericOf(state.Setting.TS_else)
                    || token.isAlphaNumericOf(state.Setting.TS_case)
                    || token.isAlphaNumericOf(state.Setting.TS_break)) {

                    break;
                }
                else if (singleStatement && token.isSeperatorOf(';')) {
                    state.CurrentIndex++;
                    break;
                } 
                // Start of a syntax
                else if (!token.isBlank()) {
                    result.FlushStatement();
                    this.processStatementSyntax(result, tokens, state);
                }
                // Contine searching
                else {
                    result.AppendToCurrentStatement(token);
                    state.CurrentIndex++;
                }

                if (this.classSyntax_CheckEOF(tokens, state)) {
                    return false;
                }
            }

            return true;
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

        private traceVariable(result: AnalyzerResult, tokens: TextTokenCollection, state: AnalyzerState) {

            while (state.CurrentIndex < tokens.length) {

                let token = tokens[state.CurrentIndex];

                if (state.TracingState == TracingState.TracingVariableTypeName) {

                    state.Trace_NestingCounter.countParenthesis(token);

                    if (!state.Trace_NestingCounter.isInNest()) {

                        if (token.isSeperatorOf('=')) {
                            state.Trace_AsignmentDeteced = true;
                            state.TracingState = TracingState.TracingVariableDefinitionDefaultValue;
                        }
                        else if (token.isSeperatorOf(';')) {
                            state.CurrentIndex++;
                            break;
                        }
                        else if (token.isLineEnd()) {
                            state.addError('; expected.');
                            break;
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
                            state.CurrentIndex++;
                            break;
                        }
                        else if (token.isLineEnd()) {
                            state.addError('; expected.');
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

                if (this.classSyntax_CheckEOF(tokens, state)) {
                    return false;
                }
            }
        }

        private appendToResultTillCurrent(result: AnalyzerResult, tokens: TextTokenCollection, state: AnalyzerState) {

            for (let tokenIndex = state.LastIndex; tokenIndex < state.CurrentIndex; tokenIndex++) {

                result.AppendToCurrentStatement(tokens[tokenIndex]);
            }

            state.LastIndex = state.CurrentIndex;
        }

    }
}