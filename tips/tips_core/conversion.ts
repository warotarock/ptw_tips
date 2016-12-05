
// declarations for language conversion
var List = Array;
var Dictionary = Array;

type List<T> = Array<T>;
type Dictionary<T> = any | Array<T>;

type uchar = number;
type char = number;
type short = number;
type int = number;
type long = number;
type uint = number;
type ulong = number;
type ushort = number;
type float = number;

type stringvalue = string;
type wchar = string;
type wstring = string;
type wstringvalue = string;

function DictionaryContainsKey<T>(dic: Dictionary<T>, key: string): boolean {
    return (key in dic);
}

function StringIsNullOrEmpty(str: string): boolean {
    return (str == null || str == undefined || str == "");
}