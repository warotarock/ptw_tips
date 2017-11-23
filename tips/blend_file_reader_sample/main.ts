namespace BlendFileReaderSample {

    window.onload = () => {

        let xhr = new XMLHttpRequest();
        xhr.open('GET', 'sample.blend');
        xhr.responseType = 'arraybuffer';
        xhr.addEventListener('load',
            (e: Event) => {
                let blendFile = BlendFileReader.readBlendFile(xhr.response);
                ouputSample(blendFile);
            }
        );
        xhr.send();
    };

    function getAddressText(address: ulong): string {

        let tempText = '00000000' + address.toString(16);

        return tempText.substr(tempText.length - 8);
    }

    function ouputSample(blendFile: BlendFileReader.ReadBlendFileResult) {

        let file_element = document.getElementById('file');
        let dna_element = document.getElementById('dna');
        let blocks_element = document.getElementById('blocks');
        let content_element = document.getElementById('content');

        let result: List<string> = [];

        result.push(".blend version: " + blendFile.fileHeader.version_number);
        file_element.innerHTML = result.join('<br/>');

        // DNA
        result = [];
        result.push('[DNA]');

        for (let typeInfo of blendFile.dna.structureTypeInfoList) {

            result.push(typeInfo.name);

            for (let fieldInfo of typeInfo.fieldInfoList) {

                result.push('&emsp;' + fieldInfo.definitionName + ': ' + fieldInfo.typeName + ' ' + fieldInfo.offset);
            }

            result.push('');
        }

        dna_element.innerHTML = result.join('<br/>');

        // Data blocks
        result = [];
        result.push('[All data blocks]');

        for (let bhead of blendFile.bheadList) {

            let typeInfo = blendFile.dna.structureTypeInfoList[bhead.SDNAnr];

            result.push(bhead.code + ' ' + typeInfo.name + ' ' + getAddressText(bhead.old) + ' (' + bhead.nr.toString() + ')');
        }

        blocks_element.innerHTML = result.join('<br/>');

        // Detail data samples
        result = [];
        result.push('[Data samples]');

        let material_TypeInfo = blendFile.dna.getStructureTypeInfo('Material');

        for (let bHead of blendFile.bheadList) {

            if (bHead.SDNAnr == material_TypeInfo.sdnaIndex) {

                let dataset: any = blendFile.dna.createDataSet(bHead);

                let out = 'Material ' + getAddressText(bHead.old) + ' (' + bHead.nr.toString() + ')' + '<br/>'
                    + '&emsp;name: ' + dataset.id.name + '<br/>'
                    + '&emsp;r: ' + dataset.r.toFixed(4) + '<br/>'
                    + '&emsp;g: ' + dataset.g.toFixed(4) + '<br/>'
                    + '&emsp;b: ' + dataset.b.toFixed(4) + '<br/>';

                result.push(out);
            }
        }

        let object_TypeInfo = blendFile.dna.getStructureTypeInfo('Object');

        for (let bHead of blendFile.bheadList) {

            if (bHead.SDNAnr == object_TypeInfo.sdnaIndex) {

                let dataset: any = blendFile.dna.createDataSet(bHead);

                let out = 'Object ' + getAddressText(bHead.old) + ' (' + bHead.nr.toString() + ')' + '<br/>'
                    + '&emsp;name: ' + dataset.id.name + '<br/>'
                    + '&emsp;loc: (' + dataset.loc[0].toFixed(4)
                    + ', ' + dataset.loc[1].toFixed(4)
                    + ', ' + dataset.loc[2].toFixed(4) + ')<br/>';

                result.push(out);
            }
        }

        content_element.innerHTML = result.join('<br/>');
    }
}
