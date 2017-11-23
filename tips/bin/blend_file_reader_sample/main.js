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
        result = [];
        result.push('[DNA]');
        for (var _i = 0, _a = blendFile.dna.structureTypeInfoList; _i < _a.length; _i++) {
            var typeInfo = _a[_i];
            result.push(typeInfo.name);
            for (var _b = 0, _c = typeInfo.fieldInfoList; _b < _c.length; _b++) {
                var fieldInfo = _c[_b];
                result.push('&emsp;' + fieldInfo.definitionName + ': ' + fieldInfo.typeName + ' ' + fieldInfo.offset);
            }
            result.push('');
        }
        dna_element.innerHTML = result.join('<br/>');
        // Data blocks
        result = [];
        result.push('[All data blocks]');
        for (var _d = 0, _e = blendFile.bheadList; _d < _e.length; _d++) {
            var bhead = _e[_d];
            var typeInfo = blendFile.dna.structureTypeInfoList[bhead.SDNAnr];
            result.push(bhead.code + ' ' + typeInfo.name + ' ' + getAddressText(bhead.old) + ' (' + bhead.nr.toString() + ')');
        }
        blocks_element.innerHTML = result.join('<br/>');
        // Detail data samples
        result = [];
        result.push('[Data samples]');
        var material_TypeInfo = blendFile.dna.getStructureTypeInfo('Material');
        for (var _f = 0, _g = blendFile.bheadList; _f < _g.length; _f++) {
            var bHead = _g[_f];
            if (bHead.SDNAnr == material_TypeInfo.sdnaIndex) {
                var dataset = blendFile.dna.createDataSet(bHead);
                var out = 'Material ' + getAddressText(bHead.old) + ' (' + bHead.nr.toString() + ')' + '<br/>'
                    + '&emsp;name: ' + dataset.id.name + '<br/>'
                    + '&emsp;r: ' + dataset.r.toFixed(4) + '<br/>'
                    + '&emsp;g: ' + dataset.g.toFixed(4) + '<br/>'
                    + '&emsp;b: ' + dataset.b.toFixed(4) + '<br/>';
                result.push(out);
            }
        }
        var object_TypeInfo = blendFile.dna.getStructureTypeInfo('Object');
        for (var _h = 0, _j = blendFile.bheadList; _h < _j.length; _h++) {
            var bHead = _j[_h];
            if (bHead.SDNAnr == object_TypeInfo.sdnaIndex) {
                var dataset = blendFile.dna.createDataSet(bHead);
                var out = 'Object ' + getAddressText(bHead.old) + ' (' + bHead.nr.toString() + ')' + '<br/>'
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
