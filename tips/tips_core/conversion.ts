
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
type ushort = number;
type uint = number;
type ulong = number;
type float = number;
type double = number;

function ListAddRange<T>(destList: List<T>, addList: List<T>) {
    Array.prototype.push.apply(destList, addList);
}

function ListGetRange<T>(srcList: List<T>, index: int, length: int): List<T> {
    return srcList.slice(index, index + length);
}

function ListRemoveAt<T>(destList: List<T>, index: int) {
    destList.splice(index, 1);
}

function DictionaryContainsKey<T>(dic: Dictionary<T>, key: string): boolean {
    return (key in dic);
}

function StringIsNullOrEmpty(str: string): boolean {
    return (str == null || str == undefined || str == "");
}

function StringIndexOf(str: string, searchString, position: int): int {
    return str.indexOf(searchString, position);
}

function StringSubstring(text: string, startIndex: int, length: int): string {
    return text.substr(startIndex, length);
}

function StringStartsWith(text: string, searchString: string): boolean {
    return (text.indexOf(searchString) == 0);
}

function StringContains(text: string, searchString: string): boolean {
    return (text.indexOf(searchString) != -1);
}

function DateGetTime(): long {
    return (new Date().getTime());
}
