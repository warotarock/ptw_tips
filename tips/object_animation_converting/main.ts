
namespace ObjectAnimationConverter {

    var fs = (typeof (require) != 'undefined') ? require('fs') : {
        writeFile(fileName, text) {
            document.getElementById('content').innerHTML = text;
        }
    };

    class Main {

        execute() {

            var fileName = 'sample_obj_animation.blend';
            var outFileName = this.getExtensionChangedFileName('../temp/' + fileName, 'json');

            document.getElementById('content').innerHTML = 'Out put will be located ' + outFileName;

            var request = new XMLHttpRequest();
            request.open('GET', fileName, true);
            request.responseType = 'arraybuffer';
            request.addEventListener('load',
                (e: Event) => {
                    // read a blend file
                    var blendFile = BlendFileReader.readBlendFile(request.response);

                    // execute converting
                    var convetedData = this.convert(blendFile);
                    this.output(convetedData, outFileName);

                    document.getElementById('content').innerHTML = 'Out put done ' + outFileName;
                }
            );
            request.send();
        }

        convert(blendFile: BlendFileReader.ReadBlendFileResult): Dictionary<any> {

            var bheadDictionary = new Dictionary<BlendFileReader.BHead>();
            Enumerable.From(blendFile.bheadList)
                .ForEach(bhead => bheadDictionary[bhead.old] = bhead);

            var bAction_TypeInfo = blendFile.dna.getStructureTypeInfo('bAction');
            var bAction_BHeads = Enumerable.From(blendFile.bheadList)
                .Where(bh => bh.SDNAnr == bAction_TypeInfo.sdnaIndex)
                .ToArray();

            var result = new List<any>();

            // for each bAction
            for (var i = 0; i < bAction_BHeads.length; i++) {
                var bAction_BHead = bAction_BHeads[i];
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
                    for (var k = 0; k < bezTriple.elementCount; k++) {
                        var bezt = bezTriple[k];
                        points.push(
                            [
                                [bezt.vec[0], bezt.vec[1], bezt.vec[2]],
                                [bezt.vec[3], bezt.vec[4], bezt.vec[5]],
                                [bezt.vec[6], bezt.vec[7], bezt.vec[8]]
                            ]
                        );
                    }

                    var isBoneAction = StringIsNullOrEmpty(this.getCurveName(bActionGroup.name, fCurve.array_index));

                    var groupName: string;
                    var channelName: string;
                    if (isBoneAction) {
                        groupName = bActionGroup.name
                        if (lastGroupName != groupName) {
                            lastGroupName = groupName;
                            channelIndex = 0;
                        }
                        channelName = this.getBoneCurveName(channelIndex);
                        channelIndex++;
                    }
                    else {
                        groupName = "Object";
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
        }

        output(convetedData: List<any>, outFileName: string) {

            var out = [];

            out.push("{");

            for (var i = 0; i < convetedData.length; i++) {
                var animation = convetedData[i];

                out.push("  \"" + animation.name + "\": {");

                var channelGroup = Enumerable.From(<List<any>>animation.curves)
                    .GroupBy(curve => curve.group)
                    .Select(group => ({
                        name: group.Key(),
                        curves: group.source
                    }))
                    .OrderBy(group => group.name)
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
                            + (k < group.curves.length - 1 ? ',' : '')
                        );
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
        }

        getCurveName(actionGroupName: string, array_index: int) {

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
        }

        getBoneCurveName(array_index: int) {

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
        }

        getExtensionChangedFileName(fileName: string, newExtension) {

            return (fileName.match(/(.*)(?:\.([^.]+$))/))[1] + '.' + newExtension;
        }

        jsonStringifyReplacer(key: string, value: any): any {

            if (typeof value === 'number') {
                return Number(value.toFixed(4));
            }
            else {
                return value;
            }
        }

        floatArrayToArray(array: Float32Array) {
            var result = [];
            for (var i = 0; i < array.length; i++) {
                result.push(array[i]);
            }
            return result;
        }
    }

    window.onload = () => {

        let main = new Main();
        main.execute();
    };
}
