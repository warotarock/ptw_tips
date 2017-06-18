
namespace CodeConverter {

    export enum StatementType {
        None,
        WhiteSpaces,
        Comment,
        Module,
        Class,
        Enum,
        EnumMember,
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
        Tokens: TextTokenCollection = null;
        InnerStatements: List<CodeStatement> = null;

        get LineNumber(): int {
            if (this.Tokens.length > 0) {
                return this.Tokens[0].LineNumber;
            }
            else {
                return 0;
            }
        }
    }
}

namespace CodeConverter.StatementAnalyzer {

    export class AnalyzerSetting {

        TS_OpenBlace = '{';
        TS_CloseBlace = '}';

        TS_module = 'module';
        TS_namespace = 'namespace';
    }

    export class AnalyzerResult {

        Statements = new List<CodeStatement>();

        LineNumber = 0;

        CurrentStatement = new CodeStatement();

        SetCurrentStatementType(type: StatementType) {
            this.CurrentStatement.Type = type;
        }

        AppendToCurrentStatement(token: TextToken) {

            if (this.CurrentStatement.Tokens == null) {
                this.CurrentStatement.Tokens = TextTokenCollection.create();
            }

            this.CurrentStatement.Tokens.push(token);
        }

        SetInnerStatementToCurrentStatement(statements: List<CodeStatement>) {

            this.CurrentStatement.InnerStatements = statements;
        }

        FlushStatement() {

            this.Statements.push(this.CurrentStatement);

            this.CurrentStatement.Tokens = TextTokenCollection.create();
        }
    }

    export enum ProcessingMode {
        None,
        Blank,
        Module,
    }

    export class ProcessingState {

        Setting: AnalyzerSetting = null;

        // State variables
        CurrentMode = ProcessingMode.None;
        CurrentIndex = 0;

        // Result variables
        Result: AnalyzerResult = null;
        Erros = new List<string>();

        Initialize(setting: AnalyzerSetting) {

            this.Setting = setting;

            this.Clear();
        }

        Clear() {
            this.CurrentMode = ProcessingMode.None;
            this.CurrentIndex = 0;
            this.Result = null;
        }

        CloneForInnerState(): ProcessingState {

            var state = new ProcessingState();
            state.Setting = this.Setting;
            state.Result = this.Result;
            state.Erros = this.Erros;
            state.CurrentIndex = this.CurrentIndex;

            return state;
        }

        AddError(message: string) {

            this.Erros.push(message);
        }
    }

    export class Analyzer {

        analyze(result: AnalyzerResult, tokens: TextTokenCollection, state: ProcessingState) {

            this.processCodeBlock(result, tokens, state);
        }

        // Syntax part parsing

        private processSyntaxPart(result: AnalyzerResult, tokens: TextTokenCollection, state: ProcessingState) {

            while (state.CurrentIndex < tokens.length) {

                var mode = this.processSyntax_GetProcessingMode(tokens, state);

                switch (mode) {
                    case ProcessingMode.Module:
                        this.processSyntax_Module(result, tokens, state);
                        break;
                    case ProcessingMode.Blank:
                        this.processBlank(result, tokens, state);
                        break;
                }
            }
        }

        private processSyntax_GetProcessingMode(tokens: TextTokenCollection, state: ProcessingState): ProcessingMode {

            let token = tokens[state.CurrentIndex];
            let setting = state.Setting;

            if (token.isBlank()) {
                return ProcessingMode.Blank;
            }

            if (token.is(TextTokenType.AlphaNumeric, setting.TS_module)
                || token.is(TextTokenType.AlphaNumeric, setting.TS_namespace)) {

                return ProcessingMode.Module;
            }
        }

        private processSyntax_Module(result: AnalyzerResult, tokens: TextTokenCollection, state: ProcessingState) {

            result.SetCurrentStatementType(StatementType.Module);

            let blockPartStartIndex = tokens.findIndexInZeroLevel(state.CurrentIndex + 1, tokens.endIndex, state.Setting.TS_OpenBlace);
            if (blockPartStartIndex == -1) {
                state.AddError('(' + tokens[state.CurrentIndex].LineNumber + ') モジュールまたは名前空間の { が必要です。');
                state.CurrentIndex++;
                return;
            }

            for (let tokenIndex = state.CurrentIndex; tokenIndex <= blockPartStartIndex; tokenIndex++) {
                var token = tokens[tokenIndex];
                result.AppendToCurrentStatement(token);
            }

            var innerState = state.CloneForInnerState();
            var innerResult = new AnalyzerResult();
            innerState.CurrentIndex = blockPartStartIndex + 1;
            this.processCodeBlock(innerResult, tokens, innerState);

            result.SetInnerStatementToCurrentStatement(innerResult.Statements);
            result.FlushStatement();

            state.CurrentIndex = innerState.CurrentIndex + 1;
        }

        // Code block parsing

        private processCodeBlock(result: AnalyzerResult, tokens: TextTokenCollection, state: ProcessingState) {

            while (state.CurrentIndex < tokens.length) {

                var mode = this.processCodeBlock_GetProcessingMode(tokens, state);

                switch (mode) {
                }
            }
        }

        private processCodeBlock_GetProcessingMode(tokens: TextTokenCollection, state: ProcessingState): ProcessingMode {

            let token = tokens[state.CurrentIndex];
            let setting = state.Setting;
        }

        // Common functions

        private processBlank(result: AnalyzerResult, tokens: TextTokenCollection, state: ProcessingState) {
        }

        private processFollowingLineTokens(result: AnalyzerResult, tokens: TextTokenCollection, startIndex: int, state: ProcessingState) {

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