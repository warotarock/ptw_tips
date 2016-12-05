"use strict";
var fs = require('fs');
var ObjectAnimationConverter;
(function (ObjectAnimationConverter) {
    window.onload = function () {
        var fileName = 'sample_obj_animation.blend';
        var outFileName = getExtensionChangedFileName('../temp/' + fileName, 'json');
        var request = new XMLHttpRequest();
        request.open('GET', fileName, true);
        request.responseType = 'arraybuffer';
        request.addEventListener('load', function (e) {
            // read a blend file
            var blendFile = BlendFileReader.readBlendFile(request.response);
            // execute converting
            var convetedData = convert(blendFile);
            output(convetedData, outFileName);
        });
        request.send();
    };
    function getExtensionChangedFileName(fileName, newExtension) {
        return (fileName.match(/(.*)(?:\.([^.]+$))/))[1] + '.' + newExtension;
    }
    function jsonStringifyReplacer(key, value) {
        if (typeof value === 'number') {
            return Number(value.toFixed(4));
        }
        else {
            return value;
        }
    }
    function floatArrayToArray(array) {
        var result = [];
        for (var i = 0; i < array.length; i++) {
            result.push(array[i]);
        }
        return result;
    }
    function convert(blendFile) {
        var bheadDictionary = new Dictionary();
        Enumerable.From(blendFile.bheadList)
            .ForEach(function (bhead) { return bheadDictionary[bhead.old] = bhead; });
        var bAction_TypeInfo = blendFile.dna.getStructureTypeInfo('bAction');
        var bAction_BHeads = Enumerable.From(blendFile.bheadList)
            .Where(function (bh) { return bh.SDNAnr == bAction_TypeInfo.sdnaIndex; })
            .ToArray();
        var result = new List();
        // for each bAction
        for (var i = 0; i < bAction_BHeads.length; i++) {
            var bAction_BHead = bAction_BHeads[i];
            var bAction_DataSet = blendFile.dna.createDataSetFromBHead(bAction_BHead);
            var animation = {
                name: bAction_DataSet.id.name,
                curves: []
            };
            // for each fCurve in bAction
            var fCurve_Address = bAction_DataSet.curves.first;
            while (true) {
                var fCurve_BHead = bheadDictionary[fCurve_Address];
                var fCurve_DataSet = blendFile.dna.createDataSetFromBHead(fCurve_BHead);
                var bActionGroup_BHead = bheadDictionary[fCurve_DataSet.grp];
                var bActionGroup_DataSet = blendFile.dna.createDataSetFromBHead(bActionGroup_BHead);
                var bezTriple_Bhead = bheadDictionary[fCurve_DataSet.bezt];
                var bezTriple_DataSet = blendFile.dna.createDataSetFromBHead(bezTriple_Bhead);
                var points = [];
                for (var k = 0; k < bezTriple_DataSet.elementCount; k++) {
                    var bezt = bezTriple_DataSet[k];
                    points.push([
                        [bezt.vec[0], bezt.vec[1], bezt.vec[2]],
                        [bezt.vec[3], bezt.vec[4], bezt.vec[5]],
                        [bezt.vec[6], bezt.vec[7], bezt.vec[8]]
                    ]);
                }
                var curve = {
                    group: bActionGroup_DataSet.name,
                    array_index: fCurve_DataSet.array_index,
                    points: points
                };
                animation.curves.push(curve);
                if (fCurve_Address == bAction_DataSet.curves.last) {
                    break;
                }
                else {
                    fCurve_Address = fCurve_DataSet.next;
                }
            }
            result.push(animation);
        }
        return result;
    }
    function output(convetedData, outFileName) {
        var out = [];
        out.push("{");
        for (var i = 0; i < convetedData.length; i++) {
            var animation = convetedData[i];
            out.push("   \"" + animation.name + "\": {");
            for (var k = 0; k < animation.curves.length; k++) {
                var curve = animation.curves[k];
                var output_carve = {
                    ipoType: 1,
                    lastTime: 0.0,
                    lastIndex: 0,
                    curve: curve.points
                };
                out.push("      \"" + getCurveName(curve) + "\": "
                    + JSON.stringify(output_carve, jsonStringifyReplacer)
                    + (k < animation.curves.length - 1 ? ',' : ''));
            }
            out.push("  }" + (i < convetedData.length - 1 ? ',' : ''));
        }
        out.push("}");
        fs.writeFile(outFileName, out.join('\r\n'), function (error) {
            if (error != null) {
                alert('error : ' + error);
            }
        });
    }
    function getCurveName(curve) {
        if (curve.group == "Location") {
            if (curve.array_index == 0) {
                return "locationX";
            }
            else if (curve.array_index == 1) {
                return "locationY";
            }
            else if (curve.array_index == 2) {
                return "locationZ";
            }
        }
        else if (curve.group == "Rotation") {
            if (curve.array_index == 0) {
                return "rotationX";
            }
            else if (curve.array_index == 1) {
                return "rotationY";
            }
            else if (curve.array_index == 2) {
                return "rotationZ";
            }
        }
        else if (curve.group == "Scaling") {
            if (curve.array_index == 0) {
                return "scalingX";
            }
            else if (curve.array_index == 1) {
                return "scalingY";
            }
            else if (curve.array_index == 2) {
                return "scalingZ";
            }
        }
        return null;
    }
})(ObjectAnimationConverter || (ObjectAnimationConverter = {}));
//# sourceMappingURL=main.js.map