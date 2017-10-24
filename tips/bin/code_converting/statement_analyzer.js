var CodeConverter;
(function (CodeConverter) {
    var StatementType;
    (function (StatementType) {
        StatementType[StatementType["None"] = 0] = "None";
        StatementType[StatementType["WhiteSpaces"] = 1] = "WhiteSpaces";
        StatementType[StatementType["Comment"] = 2] = "Comment";
        StatementType[StatementType["Module"] = 3] = "Module";
        StatementType[StatementType["Enum"] = 4] = "Enum";
        StatementType[StatementType["EnumMember"] = 5] = "EnumMember";
        StatementType[StatementType["Class"] = 6] = "Class";
        StatementType[StatementType["Interface"] = 7] = "Interface";
        StatementType[StatementType["Function"] = 8] = "Function";
        StatementType[StatementType["AbstructFunctionDefinition"] = 9] = "AbstructFunctionDefinition";
        StatementType[StatementType["Property_Get"] = 10] = "Property_Get";
        StatementType[StatementType["Property_Set"] = 11] = "Property_Set";
        StatementType[StatementType["Variable"] = 12] = "Variable";
        StatementType[StatementType["GeneralStatement"] = 13] = "GeneralStatement";
        StatementType[StatementType["If"] = 14] = "If";
        StatementType[StatementType["Else"] = 15] = "Else";
        StatementType[StatementType["ElseIf"] = 16] = "ElseIf";
        StatementType[StatementType["For"] = 17] = "For";
        StatementType[StatementType["Try"] = 18] = "Try";
        StatementType[StatementType["Catch"] = 19] = "Catch";
        StatementType[StatementType["PrecompileDirective"] = 20] = "PrecompileDirective";
        StatementType[StatementType["SourceLanguageCodeBegin"] = 21] = "SourceLanguageCodeBegin";
        StatementType[StatementType["SourceLanguageCodeEnd"] = 22] = "SourceLanguageCodeEnd";
        StatementType[StatementType["TargetLanguageCode"] = 23] = "TargetLanguageCode";
        StatementType[StatementType["ConverterAnotation"] = 24] = "ConverterAnotation";
    })(StatementType = CodeConverter.StatementType || (CodeConverter.StatementType = {}));
    var CodeStatementLine = (function () {
        function CodeStatementLine() {
            this.indentTokens = CodeConverter.TextTokenCollection.create();
            this.tokens = CodeConverter.TextTokenCollection.create();
            this.followingTokens = CodeConverter.TextTokenCollection.create();
        }
        Object.defineProperty(CodeStatementLine.prototype, "lineNumber", {
            get: function () {
                if (this.indentTokens.length > 0) {
                    return this.tokens[0].LineNumber;
                }
                else {
                    return 0;
                }
            },
            enumerable: true,
            configurable: true
        });
        return CodeStatementLine;
    }());
    CodeConverter.CodeStatementLine = CodeStatementLine;
    var CodeStatement = (function () {
        function CodeStatement() {
            this.Type = StatementType.None;
            this.StatementLines = null;
            this.InnerStatements = null;
        }
        Object.defineProperty(CodeStatement.prototype, "LineNumber", {
            get: function () {
                if (this.StatementLines != null && this.StatementLines.length > 0) {
                    return this.StatementLines[0].lineNumber;
                }
                else {
                    return 0;
                }
            },
            enumerable: true,
            configurable: true
        });
        return CodeStatement;
    }());
    CodeConverter.CodeStatement = CodeStatement;
})(CodeConverter || (CodeConverter = {}));
(function (CodeConverter) {
    var StatementAnalyzer;
    (function (StatementAnalyzer) {
        var AnalyzerSetting = (function () {
            function AnalyzerSetting() {
                this.TS_module = 'module';
                this.TS_namespace = 'namespace';
                this.TS_enum = 'enum';
                this.TS_class = 'class';
                this.TS_interface = 'interface';
                this.TS_extends = 'extends';
                this.TS_implements = 'implements';
                this.TS_constructor = 'constructor';
                this.TS_get = 'get';
                this.TS_set = 'set';
                this.TS_var = 'var';
                this.TS_function = 'function';
                this.TS_if = 'if';
                this.TS_else = 'else';
                this.TS_for = 'for';
                this.TS_switch = 'switch';
                this.TS_case = 'case';
                this.TS_break = 'break';
                this.TS_try = 'try';
                this.TS_catch = 'catch';
                this.TS_AccesTypes = {
                    'public': 'public',
                    'private': 'private',
                    'protected': 'protected',
                    'export': 'export',
                };
                this.FilePath = null;
            }
            return AnalyzerSetting;
        }());
        StatementAnalyzer.AnalyzerSetting = AnalyzerSetting;
        var AnalyzerResult = (function () {
            function AnalyzerResult() {
                this.Statements = new List();
                this.LineNumber = 0;
                this.CurrentStatement = new CodeConverter.CodeStatement();
                this.NeedsNewTokensBeforeAppendToken = true;
            }
            AnalyzerResult.prototype.SetCurrentStatementType = function (type) {
                this.CurrentStatement.Type = type;
            };
            AnalyzerResult.prototype.AppendToken = function (token) {
                this.processNewLine();
                var line = this.getCurrentStatementLastLine();
                line.tokens.push(token);
            };
            AnalyzerResult.prototype.AppendIndentToken = function (token) {
                this.processNewLine();
                var line = this.getCurrentStatementLastLine();
                line.indentTokens.push(token);
            };
            AnalyzerResult.prototype.AppendFollowingToken = function (token) {
                var line = this.getCurrentStatementLastLine();
                line.followingTokens.push(token);
            };
            AnalyzerResult.prototype.getCurrentStatement = function () {
                return this.CurrentStatement;
            };
            AnalyzerResult.prototype.getLastStatement = function () {
                return this.Statements[this.Statements.length - 1];
            };
            AnalyzerResult.prototype.getLastLine = function (statement) {
                var line = statement.StatementLines[statement.StatementLines.length - 1];
                return line;
            };
            AnalyzerResult.prototype.getCurrentStatementLastLine = function () {
                var line = this.getLastLine(this.CurrentStatement);
                return line;
            };
            AnalyzerResult.prototype.processNewLine = function () {
                if (this.NeedsNewTokensBeforeAppendToken) {
                    if (this.CurrentStatement.StatementLines == null) {
                        this.CurrentStatement.StatementLines = new List();
                    }
                    this.NeedsNewTokensBeforeAppendToken = false;
                    this.CurrentStatement.StatementLines.push(new CodeConverter.CodeStatementLine());
                }
            };
            AnalyzerResult.prototype.SetInnerStatementToCurrentStatement = function (statements) {
                this.CurrentStatement.InnerStatements = statements;
            };
            AnalyzerResult.prototype.FlushCurrentStatementTokens = function () {
                this.NeedsNewTokensBeforeAppendToken = true;
            };
            AnalyzerResult.prototype.FlushStatement = function () {
                this.Statements.push(this.CurrentStatement);
                // DEBUG
                //for (let tokens of this.CurrentStatement.TokensList) {
                //    if (tokens.length > 0) {
                //        console.debug(tokens[0].LineNumber + ' ' + TextToken.joinToString(tokens));
                //    }
                //}
                this.CurrentStatement = new CodeConverter.CodeStatement();
                this.NeedsNewTokensBeforeAppendToken = true;
            };
            return AnalyzerResult;
        }());
        StatementAnalyzer.AnalyzerResult = AnalyzerResult;
        var ScopeLevel;
        (function (ScopeLevel) {
            ScopeLevel[ScopeLevel["None"] = 0] = "None";
            ScopeLevel[ScopeLevel["Global"] = 1] = "Global";
            ScopeLevel[ScopeLevel["Module"] = 2] = "Module";
            ScopeLevel[ScopeLevel["Class"] = 3] = "Class";
            ScopeLevel[ScopeLevel["Function"] = 4] = "Function";
        })(ScopeLevel = StatementAnalyzer.ScopeLevel || (StatementAnalyzer.ScopeLevel = {}));
        var SyntaxProcessingMode;
        (function (SyntaxProcessingMode) {
            SyntaxProcessingMode[SyntaxProcessingMode["None"] = 0] = "None";
            SyntaxProcessingMode[SyntaxProcessingMode["Blank"] = 1] = "Blank";
            SyntaxProcessingMode[SyntaxProcessingMode["Module"] = 2] = "Module";
            SyntaxProcessingMode[SyntaxProcessingMode["Enum"] = 3] = "Enum";
            SyntaxProcessingMode[SyntaxProcessingMode["Class"] = 4] = "Class";
            SyntaxProcessingMode[SyntaxProcessingMode["Interface"] = 5] = "Interface";
        })(SyntaxProcessingMode = StatementAnalyzer.SyntaxProcessingMode || (StatementAnalyzer.SyntaxProcessingMode = {}));
        var CodeBlockProcessingMode;
        (function (CodeBlockProcessingMode) {
            CodeBlockProcessingMode[CodeBlockProcessingMode["None"] = 0] = "None";
            CodeBlockProcessingMode[CodeBlockProcessingMode["Continue"] = 1] = "Continue";
            CodeBlockProcessingMode[CodeBlockProcessingMode["BlockEnd"] = 2] = "BlockEnd";
            CodeBlockProcessingMode[CodeBlockProcessingMode["SyntaxStart"] = 3] = "SyntaxStart";
        })(CodeBlockProcessingMode = StatementAnalyzer.CodeBlockProcessingMode || (StatementAnalyzer.CodeBlockProcessingMode = {}));
        var TracingState;
        (function (TracingState) {
            TracingState[TracingState["None"] = 0] = "None";
            TracingState[TracingState["UnexpectedEOF"] = 1] = "UnexpectedEOF";
            TracingState[TracingState["SearchingStatementStart"] = 2] = "SearchingStatementStart";
            TracingState[TracingState["SearchingIdentifierName"] = 3] = "SearchingIdentifierName";
            TracingState[TracingState["SearchingAfterIdentifer"] = 4] = "SearchingAfterIdentifer";
            TracingState[TracingState["SearchingModuleIdentifierName"] = 5] = "SearchingModuleIdentifierName";
            TracingState[TracingState["SearchingModuleBodyStart"] = 6] = "SearchingModuleBodyStart";
            TracingState[TracingState["SearchingEnumIdentifierName"] = 7] = "SearchingEnumIdentifierName";
            TracingState[TracingState["SearchingEnumBlockStart"] = 8] = "SearchingEnumBlockStart";
            TracingState[TracingState["EnumDefinitionDetected"] = 9] = "EnumDefinitionDetected";
            TracingState[TracingState["SearchingClassIdentifierName"] = 10] = "SearchingClassIdentifierName";
            TracingState[TracingState["SearchingClassBlockStart"] = 11] = "SearchingClassBlockStart";
            TracingState[TracingState["TracingFunctionArguments"] = 12] = "TracingFunctionArguments";
            TracingState[TracingState["TracingFunctionGenericsArguments"] = 13] = "TracingFunctionGenericsArguments";
            TracingState[TracingState["SearchingFunctionReturnValueTypeOrBlockStart"] = 14] = "SearchingFunctionReturnValueTypeOrBlockStart";
            TracingState[TracingState["TracingFunctionReturnValueType"] = 15] = "TracingFunctionReturnValueType";
            TracingState[TracingState["TracingVariableTypeName"] = 16] = "TracingVariableTypeName";
            TracingState[TracingState["TracingVariableDefinitionDefaultValue"] = 17] = "TracingVariableDefinitionDefaultValue";
            TracingState[TracingState["TracingVariableFinished"] = 18] = "TracingVariableFinished";
            TracingState[TracingState["TracingPropertyBody"] = 19] = "TracingPropertyBody";
            TracingState[TracingState["ModuleDefinitionDetected"] = 20] = "ModuleDefinitionDetected";
            TracingState[TracingState["ClassDefinitionDetected"] = 21] = "ClassDefinitionDetected";
            TracingState[TracingState["FunctionDefinitionDetected"] = 22] = "FunctionDefinitionDetected";
            TracingState[TracingState["AbstructFunctionDefinitionDetected"] = 23] = "AbstructFunctionDefinitionDetected";
            TracingState[TracingState["VariableDefinitionDetected"] = 24] = "VariableDefinitionDetected";
        })(TracingState = StatementAnalyzer.TracingState || (StatementAnalyzer.TracingState = {}));
        var AnalyzerState = (function () {
            function AnalyzerState() {
                this.Setting = null;
                this.TargetTokens = null;
                // State variables
                this.CurrentMode = SyntaxProcessingMode.None;
                this.CurrentIndex = 0;
                this.LastIndex = 0;
                this.TracingState = TracingState.None;
                this.Trace_NestingCounter = new CodeConverter.NestingCounter();
                this.Trace_DetectedAccesibilityTypeToken = null;
                this.Trace_AccessTypeDetected = false;
                this.Trace_IdentifierDetected = false;
                this.Trace_TypeNameSeperatorDeteced = false;
                this.Trace_TypeNameDeteced = false;
                this.Trace_AsignmentDeteced = false;
                this.Trace_FunctioArgumentDeteced = false;
                this.Trace_FunctionGenericsArgumentDeteced = false;
                this.Trace_AbstructFunctionDeteced = false;
                // Result variables
                this.Result = null;
                this.Erros = new List();
            }
            AnalyzerState.prototype.initialize = function (setting) {
                this.Setting = setting;
                this.clear();
            };
            AnalyzerState.prototype.clear = function () {
                this.CurrentMode = SyntaxProcessingMode.None;
                this.CurrentIndex = 0;
                this.LastIndex = 0;
                this.TargetTokens = null;
                this.Result = null;
            };
            AnalyzerState.prototype.startTracing = function (startingTracingState) {
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
            };
            AnalyzerState.prototype.setTracingState = function (tracingState) {
                this.TracingState = tracingState;
            };
            AnalyzerState.prototype.cloneForInnerState = function () {
                var state = new AnalyzerState();
                state.Setting = this.Setting;
                state.TargetTokens = this.TargetTokens;
                state.Result = this.Result;
                state.Erros = this.Erros;
                state.CurrentIndex = this.CurrentIndex;
                return state;
            };
            AnalyzerState.prototype.addError = function (message) {
                this.Erros.push(this.Setting.FilePath
                    + '(' + this.TargetTokens[this.CurrentIndex].LineNumber + '): '
                    + message);
            };
            return AnalyzerState;
        }());
        StatementAnalyzer.AnalyzerState = AnalyzerState;
        var Analyzer = (function () {
            function Analyzer() {
            }
            Analyzer.prototype.analyze = function (result, tokens, state) {
                state.Result = result;
                state.TargetTokens = tokens;
                this.analyzeStatementsRecursive(ScopeLevel.Global, result, tokens, state);
            };
            Analyzer.prototype.analyzeStatementsRecursive = function (scopeLevel, result, tokens, state) {
                var currentIndex = state.CurrentIndex;
                state.LastIndex = state.CurrentIndex;
                // Searching a syntax
                while (state.CurrentIndex < tokens.length) {
                    var token = tokens[state.CurrentIndex];
                    // Block End
                    if (token.isSeperatorOf('}')) {
                        // TODO: ブロックの終わりがここで検出されるが、この時点でほとんどの場合は改行とインデントがCurrentStatementに入っている。
                        //しかしこのまま関数を抜けると、CurrentStatementが確定されていない。
                        //関数を抜けた先ではここでのresultはinnerResultで、innerResult.statementsだけが確定される。なので改行とインデントが消えてしまう。
                        break;
                    }
                    else if (token.isBlank()) {
                        this.processContinueingWhitespaces(result, tokens, state);
                    }
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
                    if (this.checkEOF(tokens, state)) {
                        return false;
                    }
                }
                return true;
            };
            // Global level statement analyzing /////////////////////////
            Analyzer.prototype.processGlobalLevelSyntax = function (result, tokens, state) {
                var currentIndex = state.CurrentIndex;
                state.LastIndex = state.CurrentIndex;
                state.startTracing(TracingState.SearchingStatementStart);
                while (state.CurrentIndex < tokens.length) {
                    var token = tokens[state.CurrentIndex];
                    // Blank
                    if (token.isBlank()) {
                        state.CurrentIndex++;
                    }
                    else if (this.isAccessibilityToken(token, state)) {
                        this.processAccessibility(token, state);
                    }
                    else if (token.isAlphaNumericOf(state.Setting.TS_module) || token.isAlphaNumericOf(state.Setting.TS_namespace)) {
                        return this.processModule(result, tokens, state);
                    }
                    else if (token.isAlphaNumericOf(state.Setting.TS_class)) {
                        return this.processClass(result, tokens, state);
                    }
                    else if (token.isAlphaNumericOf(state.Setting.TS_interface)) {
                        return this.processInterface(result, tokens, state);
                    }
                    else if (token.isAlphaNumericOf(state.Setting.TS_enum)) {
                        return this.processEnum(result, tokens, state);
                    }
                    else if (token.isAlphaNumericOf(state.Setting.TS_var)) {
                        return this.statementSyntax_ProcessVariable(result, tokens, state);
                    }
                    else if (token.isAlphaNumericOf(state.Setting.TS_function)) {
                        return this.statementSyntax_ProcessFunction(result, tokens, state);
                    }
                    else {
                        return this.statementSyntax_ProcessGeneralStatement(result, tokens, state);
                    }
                    if (this.checkEOF(tokens, state)) {
                        return false;
                    }
                }
                return false;
            };
            // Module level statement analyzing /////////////////////////
            Analyzer.prototype.processModuleLevelSyntax = function (result, tokens, state) {
                var currentIndex = state.CurrentIndex;
                state.LastIndex = state.CurrentIndex;
                state.startTracing(TracingState.SearchingStatementStart);
                while (state.CurrentIndex < tokens.length) {
                    var token = tokens[state.CurrentIndex];
                    // Blank
                    if (token.isBlank()) {
                        state.CurrentIndex++;
                    }
                    else if (this.isAccessibilityToken(token, state)) {
                        this.processAccessibility(token, state);
                    }
                    else if (token.isAlphaNumericOf(state.Setting.TS_class)) {
                        return this.processClass(result, tokens, state);
                    }
                    else if (token.isAlphaNumericOf(state.Setting.TS_interface)) {
                        return this.processInterface(result, tokens, state);
                    }
                    else if (token.isAlphaNumericOf(state.Setting.TS_enum)) {
                        return this.processEnum(result, tokens, state);
                    }
                    else if (token.isAlphaNumericOf(state.Setting.TS_var)) {
                        return this.statementSyntax_ProcessVariable(result, tokens, state);
                    }
                    else if (token.isAlphaNumericOf(state.Setting.TS_function)) {
                        return this.statementSyntax_ProcessFunction(result, tokens, state);
                    }
                    else {
                        return this.statementSyntax_ProcessGeneralStatement(result, tokens, state);
                    }
                    if (this.checkEOF(tokens, state)) {
                        return false;
                    }
                }
                return false;
            };
            // Class level statement analyzing //////////////////////////
            Analyzer.prototype.processClassLevelSyntax = function (result, tokens, state) {
                var currentIndex = state.CurrentIndex;
                state.LastIndex = state.CurrentIndex;
                state.startTracing(TracingState.None);
                var isUnexpectedTokenDetected = false;
                // Searching start
                state.setTracingState(TracingState.SearchingIdentifierName);
                while (state.CurrentIndex < tokens.length) {
                    var token = tokens[state.CurrentIndex];
                    // Blank
                    if (token.isBlank()) {
                        state.CurrentIndex++;
                    }
                    else if (this.isAccessibilityToken(token, state)) {
                        this.processAccessibility(token, state);
                    }
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
                    var token = tokens[state.CurrentIndex];
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
            };
            // Grobal or module or class level structure analyzing //////
            Analyzer.prototype.processModule = function (result, tokens, state) {
                var currentIndex = state.CurrentIndex;
                // Set statement type
                result.SetCurrentStatementType(CodeConverter.StatementType.Module);
                // Now current index is on "module" or "namescpace"
                state.CurrentIndex++;
                // Serching module name
                var indentiferNameToken = null;
                while (state.CurrentIndex < tokens.length) {
                    var token = tokens[state.CurrentIndex];
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
                // Serching module body start
                while (state.CurrentIndex < tokens.length) {
                    var token = tokens[state.CurrentIndex];
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
                // Process module code
                return this.processModuleOrClassBody(ScopeLevel.Module, result, tokens, state);
            };
            Analyzer.prototype.processEnum = function (result, tokens, state) {
                var currentIndex = state.CurrentIndex;
                // Set statement type
                result.SetCurrentStatementType(CodeConverter.StatementType.Enum);
                // Now current index is on "enum"
                state.CurrentIndex++;
                // Serching enum name
                var indentiferNameToken = null;
                while (state.CurrentIndex < tokens.length) {
                    var token = tokens[state.CurrentIndex];
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
                    var token = tokens[state.CurrentIndex];
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
            };
            Analyzer.prototype.processClass = function (result, tokens, state) {
                var currentIndex = state.CurrentIndex;
                // Set statement type
                result.SetCurrentStatementType(CodeConverter.StatementType.Class);
                // Now current index is on "class"
                state.CurrentIndex++;
                // Serching module name
                var indentiferNameToken = null;
                while (state.CurrentIndex < tokens.length) {
                    var token = tokens[state.CurrentIndex];
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
                    var token = tokens[state.CurrentIndex];
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
            };
            Analyzer.prototype.processInterface = function (result, tokens, state) {
                var currentIndex = state.CurrentIndex;
                // Set statement type
                result.SetCurrentStatementType(CodeConverter.StatementType.Interface);
                // Now current index is on "interface"
                state.CurrentIndex++;
                // Serching module name
                var indentiferNameToken = null;
                while (state.CurrentIndex < tokens.length) {
                    var token = tokens[state.CurrentIndex];
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
                    var token = tokens[state.CurrentIndex];
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
            };
            Analyzer.prototype.processModuleOrClassBody = function (scopeLevel, result, tokens, state) {
                var currentIndex = state.CurrentIndex;
                // Process following tokens right side of {
                this.processFollowingTokens(result, tokens, state);
                // Process inner statements
                var innerState = state.cloneForInnerState();
                var innerResult = new AnalyzerResult();
                this.analyzeStatementsRecursive(scopeLevel, innerResult, tokens, innerState);
                // Set inner statement result
                result.SetInnerStatementToCurrentStatement(innerResult.Statements);
                state.CurrentIndex = innerState.CurrentIndex;
                // }
                result.FlushCurrentStatementTokens();
                result.AppendToken(tokens[state.CurrentIndex]);
                result.FlushStatement();
                state.CurrentIndex++;
                return true;
            };
            Analyzer.prototype.processListingSyntaxBody = function (result, tokens, state) {
                var currentIndex = state.CurrentIndex;
                // Process following tokens right side of {
                this.processFollowingTokens(result, tokens, state);
                // Parse array members
                var innerResult = new AnalyzerResult();
                var counter = new CodeConverter.NestingCounter();
                while (state.CurrentIndex < tokens.length) {
                    var token = tokens[state.CurrentIndex];
                    var isItemEndLetter = (token.isSeperatorOf(',') || token.isSeperatorOf('}'));
                    var isZeroLevel = !counter.isInNest();
                    var isArrayEnd = ((state.CurrentIndex == tokens.length - 1)
                        || (isZeroLevel && token.isSeperatorOf('}')));
                    var isItemEnd = (isArrayEnd || (isZeroLevel && isItemEndLetter));
                    if (isItemEnd) {
                        innerResult.FlushCurrentStatementTokens();
                        innerResult.FlushStatement();
                    }
                    else {
                        innerResult.AppendToken(token);
                    }
                    if (isArrayEnd) {
                        break;
                    }
                    counter.countParenthesis(token);
                    state.CurrentIndex++;
                    if (this.checkEOF(tokens, state)) {
                        return false;
                    }
                }
                // Set inner statement result
                result.SetInnerStatementToCurrentStatement(innerResult.Statements);
                // }
                result.FlushCurrentStatementTokens();
                result.AppendToken(tokens[state.CurrentIndex]);
                state.CurrentIndex++;
                result.FlushStatement();
                return true;
            };
            // Class level statement analyzing //////////////////////////
            Analyzer.prototype.classSyntax_ProcessVariable = function (result, startingTracingState, tokens, state) {
                var currentIndex = state.CurrentIndex;
                // Set statement type
                result.SetCurrentStatementType(CodeConverter.StatementType.Variable);
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
            };
            Analyzer.prototype.classSyntax_ProcessFunction = function (result, startingTracingState, tokens, state) {
                var currentIndex = state.CurrentIndex;
                // Set statement type
                result.SetCurrentStatementType(CodeConverter.StatementType.Function);
                // Start with specified state
                state.startTracing(startingTracingState);
                if (startingTracingState == TracingState.TracingFunctionArguments
                    || startingTracingState == TracingState.TracingFunctionGenericsArguments) {
                    // Skip "(", "<"
                    state.CurrentIndex++;
                }
                if (state.TracingState == TracingState.TracingFunctionGenericsArguments) {
                    while (state.CurrentIndex < tokens.length) {
                        var token = tokens[state.CurrentIndex];
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
                        var token = tokens[state.CurrentIndex];
                        if (token.isSeperatorOf('(')) {
                            state.setTracingState(TracingState.TracingFunctionArguments);
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
                }
                if (state.TracingState == TracingState.TracingFunctionArguments) {
                    while (state.CurrentIndex < tokens.length) {
                        var token = tokens[state.CurrentIndex];
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
                        var token = tokens[state.CurrentIndex];
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
                        var token = tokens[state.CurrentIndex];
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
            };
            Analyzer.prototype.classSyntax_ProcessProperty = function (result, tokens, state) {
                var currentIndex = state.CurrentIndex;
                // Set statement type
                if (tokens[state.CurrentIndex].isAlphaNumericOf(state.Setting.TS_get)) {
                    result.SetCurrentStatementType(CodeConverter.StatementType.Property_Get);
                }
                else {
                    result.SetCurrentStatementType(CodeConverter.StatementType.Property_Set);
                }
                // Now current index is on "get" or "set"
                state.CurrentIndex++;
                // Serching property name
                var indentiferNameToken = null;
                while (state.CurrentIndex < tokens.length) {
                    var token = tokens[state.CurrentIndex];
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
                    var token = tokens[state.CurrentIndex];
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
                    if (this.checkEOF(tokens, state)) {
                        return false;
                    }
                }
                // Tracing argument part
                while (state.CurrentIndex < tokens.length) {
                    var token = tokens[state.CurrentIndex];
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
                var existsTypeName = false;
                while (state.CurrentIndex < tokens.length) {
                    var token = tokens[state.CurrentIndex];
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
                        var token = tokens[state.CurrentIndex];
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
            };
            // Statement level syntax analyzing /////////////////////////
            Analyzer.prototype.processStatementBlockBody = function (result, tokens, state) {
                // Now current index is before "{" of a block or first token of single statement.
                // And this function sets result to current statement.
                var currentIndex = state.CurrentIndex;
                state.LastIndex = state.CurrentIndex;
                // Searching block start or single statement
                var existsLeftBrace = false;
                while (state.CurrentIndex < tokens.length) {
                    var token = tokens[state.CurrentIndex];
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
                var isImplicitBlock = !existsLeftBrace;
                if (existsLeftBrace) {
                    result.AppendToken(tokens[state.CurrentIndex]);
                    state.CurrentIndex++;
                }
                // Process following tokens right side of {
                this.processFollowingTokens(result, tokens, state);
                // Process bolock-inner statements till block end. It will process multiple statement.
                var innerState = state.cloneForInnerState();
                var innerResult = new AnalyzerResult();
                while (innerState.CurrentIndex < tokens.length) {
                    var token = tokens[innerState.CurrentIndex];
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
                            || token.isAlphaNumericOf(innerState.Setting.TS_break))) {
                        break;
                    }
                    else if (token.isBlank()) {
                        this.processContinueingWhitespaces(innerResult, tokens, innerState);
                    }
                    else {
                        this.processStatementLevelSyntax(innerResult, tokens, innerState);
                    }
                    if (this.checkEOF(tokens, innerState)) {
                        return false;
                    }
                }
                // Set block-inner statement result
                result.SetInnerStatementToCurrentStatement(innerResult.Statements);
                state.CurrentIndex = innerState.CurrentIndex;
                // }
                if (!isImplicitBlock) {
                    result.FlushCurrentStatementTokens();
                    result.AppendToken(tokens[state.CurrentIndex]);
                    state.CurrentIndex++;
                }
                return true;
            };
            Analyzer.prototype.processStatementLevelSyntax = function (result, tokens, state) {
                var currentIndex = state.CurrentIndex;
                state.LastIndex = state.CurrentIndex;
                state.startTracing(TracingState.SearchingStatementStart);
                while (state.CurrentIndex < tokens.length) {
                    var token = tokens[state.CurrentIndex];
                    // Blank
                    if (token.isBlank()) {
                        state.CurrentIndex++;
                    }
                    else if (token.isAlphaNumericOf(state.Setting.TS_var)) {
                        return this.statementSyntax_ProcessVariable(result, tokens, state);
                    }
                    else if (token.isAlphaNumericOf(state.Setting.TS_function)) {
                        return this.statementSyntax_ProcessFunction(result, tokens, state);
                    }
                    else if (token.isAlphaNumericOf(state.Setting.TS_if)) {
                        return this.statementSyntax_ProcessIf(result, tokens, state);
                    }
                    else if (token.isAlphaNumericOf(state.Setting.TS_else)) {
                        if (state.CurrentIndex + 2 < tokens.length
                            && tokens[state.CurrentIndex + 2].isAlphaNumericOf(state.Setting.TS_if)) {
                            return this.statementSyntax_ProcessElseIf(result, tokens, state);
                        }
                        else {
                            return this.statementSyntax_ProcessElse(result, tokens, state);
                        }
                    }
                    else if (token.isAlphaNumericOf(state.Setting.TS_for)) {
                        return this.statementSyntax_ProcessFor(result, tokens, state);
                    }
                    else if (token.isAlphaNumericOf(state.Setting.TS_try)) {
                        return this.statementSyntax_ProcessTry(result, tokens, state);
                    }
                    else if (token.isAlphaNumericOf(state.Setting.TS_catch)) {
                        return this.statementSyntax_ProcessChatch(result, tokens, state);
                    }
                    else {
                        return this.statementSyntax_ProcessGeneralStatement(result, tokens, state);
                    }
                    if (this.checkEOF(tokens, state)) {
                        return false;
                    }
                }
                return true;
            };
            Analyzer.prototype.statementSyntax_ProcessGeneralStatement = function (result, tokens, state) {
                var currentIndex = state.CurrentIndex;
                // Set statement type
                result.SetCurrentStatementType(CodeConverter.StatementType.GeneralStatement);
                // Trace statement till ";"
                while (state.CurrentIndex < tokens.length) {
                    var token = tokens[state.CurrentIndex];
                    state.Trace_NestingCounter.countParenthesis(token);
                    if (state.Trace_NestingCounter.isInNest()) {
                        state.CurrentIndex++;
                    }
                    else {
                        if (token.isSeperatorOf(';')) {
                            state.CurrentIndex++;
                            break;
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
                // Process following tokens right side of the statement
                this.processFollowingTokens(result, tokens, state);
                // End statement
                result.FlushStatement();
                return true;
            };
            Analyzer.prototype.statementSyntax_ProcessVariable = function (result, tokens, state) {
                var currentIndex = state.CurrentIndex;
                // Set statement type
                result.SetCurrentStatementType(CodeConverter.StatementType.Variable);
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
            };
            Analyzer.prototype.statementSyntax_ProcessFunction = function (result, tokens, state) {
                var currentIndex = state.CurrentIndex;
                // Set statement type
                result.SetCurrentStatementType(CodeConverter.StatementType.Function);
                // Now current index is on "function"
                state.CurrentIndex++;
                // Search function name
                while (state.CurrentIndex < tokens.length) {
                    var token = tokens[state.CurrentIndex];
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
            };
            Analyzer.prototype.statementSyntax_ProcessIf = function (result, tokens, state) {
                var currentIndex = state.CurrentIndex;
                // Set statement type
                result.SetCurrentStatementType(CodeConverter.StatementType.If);
                // Now current index is on "if"
                state.CurrentIndex++;
                // Trace the argument
                if (!this.statementSyntax_ProcessStatementBlockArgument(result, tokens, state)) {
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
            };
            Analyzer.prototype.statementSyntax_ProcessElseIf = function (result, tokens, state) {
                // Set statement type
                result.SetCurrentStatementType(CodeConverter.StatementType.ElseIf);
                // Now current index is on "else"
                state.CurrentIndex += 2;
                // Trace the argument
                if (!this.statementSyntax_ProcessStatementBlockArgument(result, tokens, state)) {
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
            };
            Analyzer.prototype.statementSyntax_ProcessElse = function (result, tokens, state) {
                // Set statement type
                result.SetCurrentStatementType(CodeConverter.StatementType.Else);
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
            };
            Analyzer.prototype.statementSyntax_ProcessFor = function (result, tokens, state) {
                var currentIndex = state.CurrentIndex;
                // Set statement type
                result.SetCurrentStatementType(CodeConverter.StatementType.For);
                // Now current index is on "for"
                state.CurrentIndex++;
                // Trace the argument
                if (!this.statementSyntax_ProcessStatementBlockArgument(result, tokens, state)) {
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
            };
            Analyzer.prototype.statementSyntax_ProcessStatementBlockArgument = function (result, tokens, state) {
                // Searching argument (
                while (state.CurrentIndex < tokens.length) {
                    var token = tokens[state.CurrentIndex];
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
                    if (this.checkEOF(tokens, state)) {
                        return false;
                    }
                }
                // Tracing argument
                while (state.CurrentIndex < tokens.length) {
                    var token = tokens[state.CurrentIndex];
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
                    if (this.checkEOF(tokens, state)) {
                        return false;
                    }
                }
                return true;
            };
            Analyzer.prototype.statementSyntax_ProcessTry = function (result, tokens, state) {
                var currentIndex = state.CurrentIndex;
                // Set statement type
                result.SetCurrentStatementType(CodeConverter.StatementType.Try);
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
            };
            Analyzer.prototype.statementSyntax_ProcessChatch = function (result, tokens, state) {
                var currentIndex = state.CurrentIndex;
                // Set statement type
                result.SetCurrentStatementType(CodeConverter.StatementType.Catch);
                // Now current index is on "try"
                state.CurrentIndex++;
                // Trace the argument
                if (!this.statementSyntax_ProcessStatementBlockArgument(result, tokens, state)) {
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
            };
            // Common functions /////////////////////////////////////////
            Analyzer.prototype.checkEOF = function (tokens, state) {
                if (state.CurrentIndex >= tokens.length) {
                    state.setTracingState(TracingState.UnexpectedEOF);
                    return true;
                }
                else {
                    return false;
                }
            };
            Analyzer.prototype.isAccessibilityToken = function (token, state) {
                return DictionaryContainsKey(state.Setting.TS_AccesTypes, token.Text);
            };
            Analyzer.prototype.processAccessibility = function (token, state) {
                if (!state.Trace_AccessTypeDetected) {
                    state.Trace_AccessTypeDetected = true;
                    state.Trace_DetectedAccesibilityTypeToken = token;
                }
                else {
                    state.addError('Accessibility modifier already seen.');
                }
                state.CurrentIndex++;
                return false;
            };
            Analyzer.prototype.appendToResultTillCurrent = function (result, tokens, state) {
                for (var tokenIndex = state.LastIndex; tokenIndex < state.CurrentIndex; tokenIndex++) {
                    var token = tokens[tokenIndex];
                    result.AppendToken(token);
                }
                state.LastIndex = state.CurrentIndex;
            };
            Analyzer.prototype.processContinueingWhitespaces = function (result, tokens, state) {
                var currentIndex = state.CurrentIndex;
                // Trace tokens to determine index
                var endIndex = -1;
                var lastLineEndIndex = -1;
                for (var i = state.CurrentIndex; i < tokens.length; i++) {
                    var token = tokens[i];
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
                    for (var i = state.CurrentIndex; i <= lastLineEndIndex; i++) {
                        var token = tokens[i];
                        result.AppendToken(token);
                    }
                    result.FlushStatement();
                }
                // Indent tokens for next statement
                var startIndex;
                if (lastLineEndIndex != -1) {
                    startIndex = lastLineEndIndex + 1;
                    if (startIndex > endIndex) {
                        startIndex = -1; // When only line end, this occurs. No indent tokens.
                    }
                }
                else {
                    startIndex = state.CurrentIndex;
                }
                if (endIndex == -1) {
                    endIndex = tokens.length - 1;
                }
                if (startIndex != -1) {
                    for (var i = startIndex; i <= endIndex; i++) {
                        var token = tokens[i];
                        result.AppendIndentToken(token);
                    }
                }
                state.CurrentIndex = endIndex + 1;
                state.LastIndex = state.CurrentIndex;
            };
            Analyzer.prototype.processFollowingTokens = function (result, tokens, state) {
                var existsFollowingTokens = false;
                var endIndex = -1;
                for (var tokenIndex = state.CurrentIndex; tokenIndex <= tokens.endIndex; tokenIndex++) {
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
                for (var tokenIndex = state.CurrentIndex; tokenIndex <= endIndex; tokenIndex++) {
                    result.AppendFollowingToken(tokens[tokenIndex]);
                }
                state.CurrentIndex = endIndex + 1;
                state.LastIndex = state.CurrentIndex;
            };
            Analyzer.prototype.processVariable = function (result, tokens, state) {
                if (state.TracingState == TracingState.SearchingIdentifierName) {
                    while (state.CurrentIndex < tokens.length) {
                        var token = tokens[state.CurrentIndex];
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
                        var token = tokens[state.CurrentIndex];
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
                        var token = tokens[state.CurrentIndex];
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
                        var token = tokens[state.CurrentIndex];
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
                        if (this.checkEOF(tokens, state)) {
                            return false;
                        }
                    }
                }
                // Unexpected end
                return false;
            };
            Analyzer.prototype.processTypeName = function (result, tokens, state) {
                // Search start token
                while (state.CurrentIndex < tokens.length) {
                    var token = tokens[state.CurrentIndex];
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
                    var token = tokens[state.CurrentIndex];
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
            };
            return Analyzer;
        }());
        StatementAnalyzer.Analyzer = Analyzer;
    })(StatementAnalyzer = CodeConverter.StatementAnalyzer || (CodeConverter.StatementAnalyzer = {}));
})(CodeConverter || (CodeConverter = {}));
