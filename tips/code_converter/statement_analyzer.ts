
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
        Tokens: List<TextToken> = null;
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

    export class Setting {

        WhiteSpaceLetters = ' \t';
        CommentLineStartLetter = '//';
        CommentBlockStartLetter = '/*';
        CommentBlockEndLetter = '*/';

        SingleSeperatorLetters = ' [](){},?:;#.\t=!<>+-*/%^|&';
        MultiLengthSeperators: List<string> = [
            '===', '!==', '==', '!=', '<=', '>=', '+=', '-=', '*=', '/=', '%=', '^=', '|=', '&=', '&&', '||', '++', '--'
        ];

        NumberSignLetterOrSeperator = '-';
        NumberLiteralLetters = '0123456789+-';

        TextLiteralEscapeSeqLetters = '\\';
        TextLiteralSurrounders = '\'\"';
    }

    export enum ProcessingMode {
        None,
        LineEnd,
        LineComment,
        BlockComment,
        WhiteSpaces,
        Seperator,
        AlphaNumeric,
        NumberLiteral,
        TextLiteral,
    }

    export class AnalyzerResult {

        Statements = new List<CodeStatement>();
        LineNumber = 0;

        AddStatement(statementType: StatementType, tokens: List<TextToken>): CodeStatement {

            let statement = new CodeStatement();

            return statement;
        }
    }

    export class ProcessingState extends Setting {

        // State variables
        CurrentMode = ProcessingMode.None;
        CurrentIndex = 0;

        // Result variables
        Result: AnalyzerResult = null;

        Initialize(setting: Setting) {

            this.Clear();
        }

        Clear() {
            this.CurrentMode = ProcessingMode.None;
            this.CurrentIndex = 0;
            this.Result = new AnalyzerResult();
        }
    }

    export class Processer {
    }
}