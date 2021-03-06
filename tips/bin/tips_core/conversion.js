// Detailed type declarations
var List = Array;
var Dictionary = Array;
// List methods
function ListAddRange(destList, addList) {
    Array.prototype.push.apply(destList, addList);
}
function ListGetRange(srcList, index, length) {
    return srcList.slice(index, index + length);
}
function ListRemoveAt(destList, index) {
    destList.splice(index, 1);
}
// Dictionary methods
function DictionaryContainsKey(dic, key) {
    return (key in dic);
}
// String methods
function StringIsNullOrEmpty(str) {
    return (str == null || str == undefined || str == "");
}
function StringIndexOf(str, searchString, position) {
    return str.indexOf(searchString, position);
}
function StringSubstring(text, startIndex, length) {
    return text.substr(startIndex, length);
}
function StringStartsWith(text, searchString) {
    return (text.indexOf(searchString) == 0);
}
function StringContains(text, searchString) {
    return (text.indexOf(searchString) != -1);
}
function DateGetTime() {
    return (new Date().getTime());
}
