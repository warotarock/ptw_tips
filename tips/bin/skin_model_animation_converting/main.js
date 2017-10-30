var fs = require('fs');
var SkinModelAnimationConverting;
(function (SkinModelAnimationConverting) {
    var Main = (function () {
        function Main() {
        }
        Main.prototype.execute = function () {
            var _this = this;
            var fileName = '../skinning_model_converting/sample_skin_model.blend';
            var outFileName = '../temp/sample_skin_animation.json';
            document.getElementById('content').innerHTML = 'Out put will be located ' + outFileName;
            var request = new XMLHttpRequest();
            request.open('GET', fileName, true);
            request.responseType = 'arraybuffer';
            request.addEventListener('load', function (e) {
                // read a blend file
                var blendFile = BlendFileReader.readBlendFile(request.response);
                // execute converting
                var convetedData = _this.convert(blendFile);
                _this.output(convetedData, outFileName);
                document.getElementById('content').innerHTML = 'Out put done ' + outFileName;
            });
            request.send();
        };
        Main.prototype.convert = function (blendFile) {
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
                    name: bAction_DataSet.id.name.substr(2),
                    curves: []
                };
                var lastGroupName = null;
                var channelIndex = 0;
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
                    var isBoneAction = this.isBoneAction(bActionGroup_DataSet.name);
                    var groupName;
                    var channelName;
                    if (isBoneAction) {
                        groupName = bActionGroup_DataSet.name;
                        if (lastGroupName != groupName) {
                            lastGroupName = groupName;
                            channelIndex = 0;
                        }
                        channelName = this.getBoneAnimationCurveName(channelIndex);
                        channelIndex++;
                    }
                    else {
                        groupName = "Object";
                        channelName = this.getObjectAnimationCurveName(bActionGroup_DataSet.name, fCurve_DataSet.array_index);
                    }
                    var curve = {
                        group: groupName.replace(/_/g, '.'),
                        channel: channelName,
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
        };
        Main.prototype.output = function (convetedData, outFileName) {
            var out = [];
            out.push("{");
            for (var i = 0; i < convetedData.length; i++) {
                var animation = convetedData[i];
                out.push("  \"" + animation.name + "\": {");
                var channelGroup = Enumerable.From(animation.curves)
                    .GroupBy(function (curve) { return curve.group; })
                    .Select(function (group) { return ({
                    name: group.Key(),
                    curves: group.source
                }); })
                    .OrderBy(function (group) { return group.name; })
                    .ToArray();
                for (var groupIndex = 0; groupIndex < channelGroup.length; groupIndex++) {
                    var group = channelGroup[groupIndex];
                    out.push("    \"" + group.name + "\": {");
                    for (var k = 0; k < group.curves.length; k++) {
                        var curve = group.curves[k];
                        var output_carve = {
                            ipoType: 2,
                            lastTime: 0.0,
                            lastIndex: 0,
                            curve: curve.points
                        };
                        out.push("      \"" + curve.channel + "\": "
                            + JSON.stringify(output_carve, this.jsonStringifyReplacer)
                            + (k < group.curves.length - 1 ? ',' : ''));
                    }
                    out.push("    }" + (groupIndex < channelGroup.length - 1 ? ',' : ''));
                }
                out.push("  }" + (i < convetedData.length - 1 ? ',' : ''));
            }
            out.push("}");
            fs.writeFile(outFileName, out.join('\r\n'), function (error) {
                if (error != null) {
                    alert('error : ' + error);
                }
            });
        };
        Main.prototype.isBoneAction = function (actionGroupName) {
            var convertedName = this.getObjectAnimationCurveName(actionGroupName, 0);
            return StringIsNullOrEmpty(convertedName);
        };
        Main.prototype.getObjectAnimationCurveName = function (actionGroupName, array_index) {
            if (actionGroupName == "Location") {
                if (array_index == 0) {
                    return "locationX";
                }
                else if (array_index == 1) {
                    return "locationY";
                }
                else if (array_index == 2) {
                    return "locationZ";
                }
            }
            else if (actionGroupName == "Rotation") {
                if (array_index == 0) {
                    return "rotationX";
                }
                else if (array_index == 1) {
                    return "rotationY";
                }
                else if (array_index == 2) {
                    return "rotationZ";
                }
            }
            else if (actionGroupName == "Scaling") {
                if (array_index == 0) {
                    return "scalingX";
                }
                else if (array_index == 1) {
                    return "scalingY";
                }
                else if (array_index == 2) {
                    return "scalingZ";
                }
            }
            return null;
        };
        Main.prototype.getBoneAnimationCurveName = function (array_index) {
            if (array_index == 0) {
                return "quatW";
            }
            else if (array_index == 1) {
                return "quatX";
            }
            else if (array_index == 2) {
                return "quatY";
            }
            else if (array_index == 3) {
                return "quatZ";
            }
            else if (array_index == 4) {
                return "locX";
            }
            else if (array_index == 5) {
                return "locY";
            }
            else if (array_index == 6) {
                return "locZ";
            }
        };
        Main.prototype.getExtensionChangedFileName = function (fileName, newExtension) {
            return (fileName.match(/(.*)(?:\.([^.]+$))/))[1] + '.' + newExtension;
        };
        Main.prototype.jsonStringifyReplacer = function (key, value) {
            if (typeof value === 'number') {
                return Number(value.toFixed(4));
            }
            else {
                return value;
            }
        };
        Main.prototype.floatArrayToArray = function (array) {
            var result = [];
            for (var i = 0; i < array.length; i++) {
                result.push(array[i]);
            }
            return result;
        };
        return Main;
    }());
    window.onload = function () {
        var main = new Main();
        main.execute();
    };
})(SkinModelAnimationConverting || (SkinModelAnimationConverting = {}));
