var BlendFileReaderSample;
(function (BlendFileReaderSample) {
    window.onload = function () {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'sample.blend');
        xhr.responseType = 'arraybuffer';
        xhr.addEventListener('load', function (e) {
            var blendFile = BlendFileReader.readBlendFile(xhr.response);
            ouputSample(blendFile);
        });
        xhr.send();
    };
    function getAddressText(address) {
        var tempText = '00000000' + address.toString(16);
        return tempText.substr(tempText.length - 8);
    }
    function ouputSample(blendFile) {
        var file_element = document.getElementById('file');
        var dna_element = document.getElementById('dna');
        var blocks_element = document.getElementById('blocks');
        var content_element = document.getElementById('content');
        var result = [];
        result.push(".blend version: " + blendFile.fileHeader.version_number);
        file_element.innerHTML = result.join('<br/>');
        // DNA
        result.push('[DNA]');
        result = [];
        for (var i = 0; i < blendFile.dna.structureTypeInfoList.length; i++) {
            var typeInfo = blendFile.dna.structureTypeInfoList[i];
            result.push(typeInfo.name);
            for (var k = 0; k < typeInfo.fieldInfoList.length; k++) {
                var fieldInfo = typeInfo.fieldInfoList[k];
                result.push('&emsp;' + fieldInfo.definitionName + ': ' + fieldInfo.typeName + ' ' + fieldInfo.offset);
            }
            result.push('');
        }
        dna_element.innerHTML = result.join('<br/>');
        // data blocks
        result.push('[All data blocks]');
        result = [];
        for (var i = 0; i < blendFile.bheadList.length; i++) {
            var bhead = blendFile.bheadList[i];
            var typeInfo = blendFile.dna.structureTypeInfoList[bhead.SDNAnr];
            result.push(bhead.code + ' ' + typeInfo.name + ' ' + getAddressText(bhead.old) + ' (' + bhead.nr.toString() + ')');
        }
        blocks_element.innerHTML = result.join('<br/>');
        // detail data samples
        result.push('[Data samples]');
        result = [];
        var material_TypeInfo = blendFile.dna.getStructureTypeInfo('Material');
        for (var i = 0; i < blendFile.bheadList.length; i++) {
            var bHead = blendFile.bheadList[i];
            if (bHead.SDNAnr == material_TypeInfo.sdnaIndex) {
                var dataset = blendFile.dna.createDataSetFromBHead(bHead);
                var out = 'Material ' + getAddressText(bHead.old) + ' (' + bhead.nr.toString() + ')' + '<br/>'
                    + '&emsp;name: ' + dataset.id.name + '<br/>'
                    + '&emsp;r: ' + dataset.r.toFixed(4) + '<br/>'
                    + '&emsp;g: ' + dataset.g.toFixed(4) + '<br/>'
                    + '&emsp;b: ' + dataset.b.toFixed(4) + '<br/>';
                result.push(out);
            }
        }
        var object_TypeInfo = blendFile.dna.getStructureTypeInfo('Object');
        for (var i = 0; i < blendFile.bheadList.length; i++) {
            var bHead = blendFile.bheadList[i];
            if (bHead.SDNAnr == object_TypeInfo.sdnaIndex) {
                var dataset = blendFile.dna.createDataSetFromBHead(bHead);
                var out = 'Object ' + getAddressText(bHead.old) + ' (' + bhead.nr.toString() + ')' + '<br/>'
                    + '&emsp;name: ' + dataset.id.name + '<br/>'
                    + '&emsp;loc: (' + dataset.loc[0].toFixed(4)
                    + ', ' + dataset.loc[1].toFixed(4)
                    + ', ' + dataset.loc[2].toFixed(4) + ')<br/>';
                result.push(out);
            }
        }
        content_element.innerHTML = result.join('<br/>');
    }
})(BlendFileReaderSample || (BlendFileReaderSample = {}));
