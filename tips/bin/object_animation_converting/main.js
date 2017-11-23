var ObjectAnimationConverter;
(function (ObjectAnimationConverter) {
    var fs = (typeof (require) != 'undefined') ? require('fs') : {
        writeFile: function (fileName, text) {
            document.getElementById('content').innerHTML = text;
        }
    };
    var Main = (function () {
        function Main() {
        }
        Main.prototype.execute = function () {
            var _this = this;
            var fileName = 'sample_obj_animation.blend';
            var outFileName = this.getExtensionChangedFileName('../temp/' + fileName, 'json');
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
            for (var _i = 0, bAction_BHeads_1 = bAction_BHeads; _i < bAction_BHeads_1.length; _i++) {
                var bAction_BHead = bAction_BHeads_1[_i];
                var bAction = blendFile.dna.createDataSet(bAction_BHead);
                var animation = {
                    name: bAction.id.name.substr(2),
                    curves: []
                };
                var lastGroupName = null;
                var channelIndex = 0;
                // for each fCurve in bAction
                var fCurve_Address = bAction.curves.first;
                while (true) {
                    var fCurve_BHead = bheadDictionary[fCurve_Address];
                    var fCurve = blendFile.dna.createDataSet(fCurve_BHead);
                    var bActionGroup_BHead = bheadDictionary[fCurve.grp];
                    var bActionGroup = blendFile.dna.createDataSet(bActionGroup_BHead);
                    var bezTriple_Bhead = bheadDictionary[fCurve.bezt];
                    var bezTriple = blendFile.dna.createDataSet(bezTriple_Bhead);
                    var points = [];
                    for (var i = 0; i < bezTriple.elementCount; i++) {
                        var bezt = bezTriple[i];
                        points.push([
                            [bezt.vec[0], bezt.vec[1], bezt.vec[2]],
                            [bezt.vec[3], bezt.vec[4], bezt.vec[5]],
                            [bezt.vec[6], bezt.vec[7], bezt.vec[8]]
                        ]);
                    }
                    var isBoneAction = StringIsNullOrEmpty(this.getCurveName(bActionGroup.name, fCurve.array_index));
                    var groupName = void 0;
                    var channelName = void 0;
                    if (isBoneAction) {
                        groupName = bActionGroup.name;
                        if (lastGroupName != groupName) {
                            lastGroupName = groupName;
                            channelIndex = 0;
                        }
                        channelName = this.getBoneCurveName(channelIndex);
                        channelIndex++;
                    }
                    else {
                        groupName = 'Object';
                        channelName = this.getCurveName(bActionGroup.name, fCurve.array_index);
                    }
                    var curve = {
                        group: groupName.replace(/_/g, '.'),
                        channel: channelName,
                        array_index: fCurve.array_index,
                        points: points
                    };
                    animation.curves.push(curve);
                    if (fCurve_Address == bAction.curves.last) {
                        break;
                    }
                    else {
                        fCurve_Address = fCurve.next;
                    }
                }
                result.push(animation);
            }
            return result;
        };
        Main.prototype.output = function (convetedData, outFileName) {
            var out = [];
            out.push('{');
            for (var animationIndex = 0; animationIndex < convetedData.length; animationIndex++) {
                var animation = convetedData[animationIndex];
                out.push('  \"' + animation.name + '\": {');
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
                    out.push('    \"' + group.name + '\": {');
                    for (var curveIndex = 0; curveIndex < group.curves.length; curveIndex++) {
                        var curve = group.curves[curveIndex];
                        var output_carve = {
                            ipoType: 2,
                            lastTime: 0.0,
                            lastIndex: 0,
                            curve: curve.points
                        };
                        out.push('      \"' + curve.channel + '\": '
                            + JSON.stringify(output_carve, this.jsonStringifyReplacer));
                        if (curveIndex < group.curves.length - 1) {
                            out[out.length - 1] += ',';
                        }
                    }
                    out.push('    }');
                    if (groupIndex < channelGroup.length - 1) {
                        out[out.length - 1] += ',';
                    }
                }
                out.push('  }');
                if (animationIndex < convetedData.length - 1) {
                    out[out.length - 1] += ',';
                }
            }
            out.push('}');
            fs.writeFile(outFileName, out.join('\r\n'), function (error) {
                if (error != null) {
                    alert('error : ' + error);
                }
            });
        };
        Main.prototype.getCurveName = function (actionGroupName, array_index) {
            if (actionGroupName == 'Location') {
                if (array_index == 0) {
                    return 'locationX';
                }
                else if (array_index == 1) {
                    return 'locationY';
                }
                else if (array_index == 2) {
                    return 'locationZ';
                }
            }
            else if (actionGroupName == 'Rotation') {
                if (array_index == 0) {
                    return 'rotationX';
                }
                else if (array_index == 1) {
                    return 'rotationY';
                }
                else if (array_index == 2) {
                    return 'rotationZ';
                }
            }
            else if (actionGroupName == 'Scaling') {
                if (array_index == 0) {
                    return 'scalingX';
                }
                else if (array_index == 1) {
                    return 'scalingY';
                }
                else if (array_index == 2) {
                    return 'scalingZ';
                }
            }
            return null;
        };
        Main.prototype.getBoneCurveName = function (array_index) {
            if (array_index == 0) {
                return 'quatW';
            }
            else if (array_index == 1) {
                return 'quatX';
            }
            else if (array_index == 2) {
                return 'quatY';
            }
            else if (array_index == 3) {
                return 'quatZ';
            }
            else if (array_index == 4) {
                return 'locX';
            }
            else if (array_index == 5) {
                return 'locY';
            }
            else if (array_index == 6) {
                return 'locZ';
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
})(ObjectAnimationConverter || (ObjectAnimationConverter = {}));
