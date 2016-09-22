window.onload = function () {
    var request = new XMLHttpRequest();
    request.open('GET', "sample.blend", true);
    request.responseType = 'arraybuffer';
    var onLoadRequest = function (e) {
        var blendFile = BlendFileReader.readBlendFile(request.response);
        ouputSample(blendFile);
    };
    request.addEventListener("load", onLoadRequest);
    request.send();
};
function getAddressText(address) {
    var tempText = "00000000" + address.toString(16);
    return tempText.substr(tempText.length - 8);
}
function ouputSample(blendFile) {
    var content_element = document.getElementById('content');
    var blocks_element = document.getElementById('blocks');
    var dna_element = document.getElementById('dna');
    var result = [];
    // DNAの情報を出力
    result.push("[DNA]");
    for (var i = 0; i < blendFile.dna.structureTypeInfoList.length; i++) {
        var typeInfo = blendFile.dna.structureTypeInfoList[i];
        result.push(typeInfo.name);
        for (var k = 0; k < typeInfo.fieldInfoList.length; k++) {
            var fieldInfo = typeInfo.fieldInfoList[k];
            result.push("&emsp;" + fieldInfo.definitionName + ": " + fieldInfo.typeName + " " + fieldInfo.offset);
        }
        result.push("");
    }
    dna_element.innerHTML = result.join("<br/>");
    result = [];
    // ブロックの情報を出力
    result.push("[All data bloks]");
    for (var i = 0; i < blendFile.bheadList.length; i++) {
        var bhead = blendFile.bheadList[i];
        var typeInfo = blendFile.dna.structureTypeInfoList[bhead.SDNAnr];
        result.push(bhead.code + " " + typeInfo.name + " " + getAddressText(bhead.old) + " (" + bhead.nr.toString() + ")");
    }
    blocks_element.innerHTML = result.join("<br/>");
    result = [];
    // サンプルとしてマテリアル、オブジェクトの情報を出力
    result.push("[Data samples]");
    var material_TypeInfo = blendFile.dna.getStructureTypeInfo("Material");
    for (var i = 0; i < blendFile.bheadList.length; i++) {
        var bHead = blendFile.bheadList[i];
        if (bHead.SDNAnr == material_TypeInfo.sdnaIndex) {
            var dataset = blendFile.dna.createDataSet(material_TypeInfo, bHead, 0);
            var out = "Material " + getAddressText(bHead.old) + " (" + bhead.nr.toString() + ")" + "<br/>"
                + "&emsp;name: " + dataset.id.name + "<br/>"
                + "&emsp;r: " + dataset.r.toFixed(4) + "<br/>"
                + "&emsp;g: " + dataset.g.toFixed(4) + "<br/>"
                + "&emsp;b: " + dataset.b.toFixed(4) + "<br/>";
            result.push(out);
        }
    }
    var object_TypeInfo = blendFile.dna.getStructureTypeInfo("Object");
    for (var i = 0; i < blendFile.bheadList.length; i++) {
        var bHead = blendFile.bheadList[i];
        if (bHead.SDNAnr == object_TypeInfo.sdnaIndex) {
            var dataset = blendFile.dna.createDataSet(object_TypeInfo, bHead, 0);
            var out = "Object " + getAddressText(bHead.old) + " (" + bhead.nr.toString() + ")" + "<br/>"
                + "&emsp;name: " + dataset.id.name + "<br/>"
                + "&emsp;loc: (" + dataset.loc[0].toFixed(4)
                + ", " + dataset.loc[1].toFixed(4)
                + ", " + dataset.loc[2].toFixed(4) + ")<br/>";
            result.push(out);
        }
    }
    content_element.innerHTML = result.join("<br/>");
}
//# sourceMappingURL=main.js.map