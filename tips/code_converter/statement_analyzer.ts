
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

        TS_OpenBlace = '{';
        TS_CloseBlace = '}';

        TS_module = 'module';
        TS_namespace = 'namespace';
        TS_enum = 'enum';
    }

    export class AnalyzerResult {

        Statements = new List<CodeStatement>();

        LineNumber = 0;

        CurrentStatement = new CodeStatement();

        SetCurrentStatementType(type: StatementType) {
            this.CurrentStatement.Type = type;
        }

        AppendToCurrentStatement(token: TextToken) {

            if (this.CurrentStatement.TokensList == null) {
                this.CurrentStatement.TokensList = new List<TextTokenCollection>();
                this.CurrentStatement.TokensList.push(TextTokenCollection.create());
            }

            this.CurrentStatement.TokensList[this.CurrentStatement.TokensList.length - 1].push(token);
        }

        SetInnerStatementToCurrentStatement(statements: List<CodeStatement>) {

            this.CurrentStatement.InnerStatements = statements;
        }

        NewLineToCurrentStatement() {
            this.CurrentStatement.TokensList.push(TextTokenCollection.create());
        }

        FlushStatement() {

            this.Statements.push(this.CurrentStatement);

            this.CurrentStatement = new CodeStatement();
        }
    }

    export enum SyntaxProcessingMode {
        None,
        Blank,
        Module,
        Enum,
    }

    export enum CodeBlockProcessingMode {
        None,
        Continue,
        BlockEnd,
        SyntaxStart,
    }

    export class ProcessingState {

        Setting: AnalyzerSetting = null;
        TargetTokens: List<TextToken> = null;

        // State variables
        CurrentMode = SyntaxProcessingMode.None;
        CurrentIndex = 0;
        LastIndex = 0;
        BlockEnd = false;

        // Result variables
        Result: AnalyzerResult = null;
        Erros = new List<string>();

        Initialize(setting: AnalyzerSetting) {
            this.Setting = setting;
            this.Clear();
        }

        Clear() {
            this.CurrentMode = SyntaxProcessingMode.None;
            this.CurrentIndex = 0;
            this.LastIndex = 0;
            this.BlockEnd = false;
            this.TargetTokens = null;
            this.Result = null;
        }

        CloneForInnerState(): ProcessingState {

            var state = new ProcessingState();
            state.Setting = this.Setting;
            state.TargetTokens = this.TargetTokens;
            state.Result = this.Result;
            state.Erros = this.Erros;
            state.CurrentIndex = this.CurrentIndex;

            return state;
        }

        AddError(message: string) {

            this.Erros.push('(' + this.TargetTokens[this.CurrentIndex].LineNumber + ') ' + message);
        }
    }

    export class Analyzer {

        analyze(result: AnalyzerResult, tokens: TextTokenCollection, state: ProcessingState) {

            state.Result = result;
            state.TargetTokens = tokens;

            this.processCodeBlock(result, tokens, state);
        }

        // Syntax part parsing

        private processSyntaxPart(result: AnalyzerResult, tokens: TextTokenCollection, state: ProcessingState) {

            while (state.CurrentIndex < tokens.length) {

                var mode = this.processSyntax_GetProcessingMode(tokens, state);

                switch (mode) {

                    case SyntaxProcessingMode.Module:
                        this.processSyntax_Module(result, tokens, state);
                        break;

                    case SyntaxProcessingMode.None:
                        state.CurrentIndex++;
                        break;
                }
            }
        }

        private processSyntax_GetProcessingMode(tokens: TextTokenCollection, state: ProcessingState): SyntaxProcessingMode {

            let token = tokens[state.CurrentIndex];
            let setting = state.Setting;

            if (token.isBlank()) {
                return SyntaxProcessingMode.Blank;
            }

            if (token.is(TextTokenType.AlphaNumeric, setting.TS_module)
                || token.is(TextTokenType.AlphaNumeric, setting.TS_namespace)) {

                return SyntaxProcessingMode.Module;
            }

            if (token.is(TextTokenType.AlphaNumeric, setting.TS_enum)) {

                return SyntaxProcessingMode.Enum;
            }

            return SyntaxProcessingMode.Blank;
        }

        private processSyntax_Module(result: AnalyzerResult, tokens: TextTokenCollection, state: ProcessingState) {

            result.SetCurrentStatementType(StatementType.Module);

            // current index is at "module" or "namespace"

            // search block start
            let blockPartStartIndex = tokens.findIndexInZeroLevel(state.CurrentIndex + 1, tokens.endIndex, state.Setting.TS_OpenBlace);

            if (blockPartStartIndex == -1) {
                state.AddError('モジュールまたは名前空間の { が必要です。');
                let nextIndex = tokens.findNonWhiteSpaceIndex(state.CurrentIndex + 1, tokens.length - 1);
                if (nextIndex == -1) {
                    state.AddError('モジュールまたは名前空間には名称が必要です。');
                    return;
                }
                blockPartStartIndex = nextIndex + 1;
            }

            // module [module name] {
            for (let tokenIndex = state.LastIndex; tokenIndex <= blockPartStartIndex; tokenIndex++) {
                var token = tokens[tokenIndex];
                result.AppendToCurrentStatement(token);
            }

            // inner statements
            var innerState = state.CloneForInnerState();
            var innerResult = new AnalyzerResult();
            innerState.CurrentIndex = blockPartStartIndex + 1;
            this.processCodeBlock(innerResult, tokens, innerState);

            result.SetInnerStatementToCurrentStatement(innerResult.Statements);

            state.CurrentIndex = innerState.CurrentIndex;

            // }
            result.NewLineToCurrentStatement();
            result.AppendToCurrentStatement(token);

            result.FlushStatement();

            state.CurrentIndex = innerState.CurrentIndex + 1;
        }

        // Code block parsing

        private processCodeBlock(result: AnalyzerResult, tokens: TextTokenCollection, state: ProcessingState) {

            state.LastIndex = state.CurrentIndex;

            while (state.CurrentIndex < tokens.length) {

                var mode = this.processCodeBlock_GetProcessingMode(tokens, state);

                switch (mode) {

                    case CodeBlockProcessingMode.Continue:
                        this.processSyntax_Continue(result, tokens, state);
                        break;

                    case CodeBlockProcessingMode.BlockEnd:
                        this.processSyntax_BlockEnd(result, tokens, state);
                        break;

                    case CodeBlockProcessingMode.SyntaxStart:
                        this.processSyntax_SyntaxStart(result, tokens, state);
                        break;
                }

                if (state.BlockEnd) {
                    break;
                }
            }
        }

        private processCodeBlock_GetProcessingMode(tokens: TextTokenCollection, state: ProcessingState): CodeBlockProcessingMode {

            let token = tokens[state.CurrentIndex];
            let setting = state.Setting;

            if (token.is(TextTokenType.AlphaNumeric, state.Setting.TS_CloseBlace)) {
                return CodeBlockProcessingMode.BlockEnd;
            }

            if (!token.isBlank()) {
                return CodeBlockProcessingMode.SyntaxStart;
            }

            return CodeBlockProcessingMode.Continue;
        }

        private processSyntax_Continue(result: AnalyzerResult, tokens: TextTokenCollection, state: ProcessingState) {

            let token = tokens[state.CurrentIndex];

            result.AppendToCurrentStatement(token);

            state.CurrentIndex++;
        }

        private processSyntax_BlockEnd(result: AnalyzerResult, tokens: TextTokenCollection, state: ProcessingState) {

            state.BlockEnd = true;
        }

        private processSyntax_SyntaxStart(result: AnalyzerResult, tokens: TextTokenCollection, state: ProcessingState) {

            result.FlushStatement();

            this.processSyntaxPart(result, tokens, state);
        }

        // Common functions

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