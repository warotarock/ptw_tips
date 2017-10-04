// declarations for language conversion
var List = Array;
var Dictionary = Array;
function ListAddRange(destList, addList) {
    Array.prototype.push.apply(destList, addList);
}
function ListRemoveAt(destList, index) {
    destList.splice(index, 1);
}
function DictionaryContainsKey(dic, key) {
    return (key in dic);
}
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
