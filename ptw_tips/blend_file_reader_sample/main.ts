
window.onload = () => {
    var content = document.getElementById('content');

    var request = new XMLHttpRequest();
    request.open('GET', "sample.blend", true);
    request.responseType = 'arraybuffer';
    var onLoadRequest = (e: Event) => {

        var blendFile = BlendFileReader.readBlendFile(request.response);
        var result: List<string> = [];

        // マテリアルの情報を取得
        var material_TypeInfo = blendFile.dna.getStructureTypeInfo("Material");
        for (var i = 0; i < blendFile.bheadList.length; i++) {
            var bHead = blendFile.bheadList[i];
            if (bHead.SDNAnr == material_TypeInfo.sdnaIndex) {

                var dataset: any = blendFile.dna.createDataSet(material_TypeInfo, bHead, 0);

                var out = "Material<br/>"
                    + "&emsp;name: " + dataset.id.name + "<br/>"
                    + "&emsp;r: " + dataset.r.toFixed(4) + "<br/>"
                    + "&emsp;g: " + dataset.g.toFixed(4) + "<br/>"
                    + "&emsp;b: " + dataset.b.toFixed(4) + "<br/>";

                result.push(out);
            }
        }

        // オブジェクトの情報を取得
        var object_TypeInfo = blendFile.dna.getStructureTypeInfo("Object");
        for (var i = 0; i < blendFile.bheadList.length; i++) {
            var bHead = blendFile.bheadList[i];
            if (bHead.SDNAnr == object_TypeInfo.sdnaIndex) {

                var dataset: any = blendFile.dna.createDataSet(object_TypeInfo, bHead, 0);

                var out = "Object<br/>"
                    + "&emsp;name: " + dataset.id.name + "<br/>"
                    + "&emsp;loc: (" + dataset.loc[0].toFixed(4)
                        + ", " + dataset.loc[1].toFixed(4)
                        + ", " + dataset.loc[2].toFixed(4) + ")<br/>";

                result.push(out);
            }
        }

        content.innerHTML = result.join("<br/><br/>");
    };
    request.addEventListener("load", onLoadRequest);
    request.send();
};