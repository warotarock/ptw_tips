
namespace SkinModelAnimationConverting {

    var fs = (typeof(require) != 'undefined') ? require('fs') : {
        writeFile(fileName, text) {
            document.getElementById('content').innerHTML = text;
        }
    };

    class FCurve {

        array_index: int;
        points = new List<IPOBezTriple>();
    }

    class ActionGroup {

        name: string;
        curves = new List<FCurve>();
    }

    class Action {

        name: string;
        groups = List<ActionGroup>();
    }

    class ConvertedCurve {

        name: string;
        ipoType = 2;
        lastTime = 0.0;
        lastIndex = 0;
        curve = new List<IPOBezTriple>();
    }

    class ConvertedCurveGroup {

        name: string;
        curves = new List<ConvertedCurve>();
    }

    class ConvertedAnimation {

        name: string;
        groups = new List<ConvertedCurveGroup>();
    }

    class Main {

        execute() {

            var fileName = 'sample_skin_model_animation.blend';
            var outFileName = this.getExtensionChangedFileName('../temp/' + fileName, 'json');

            document.getElementById('message').innerHTML = 'Out put will be located ' + outFileName;

            var request = new XMLHttpRequest();
            request.open('GET', fileName, true);
            request.responseType = 'arraybuffer';
            request.addEventListener('load',
                (e: Event) => {

                    // read a blend file
                    var blendFile = BlendFileReader.readBlendFile(request.response);

                    // Parsing
                    let actions = this.parse(blendFile);

                    // Converting
                    var convetedData = this.convert(actions);

                    // Output
                    this.output(convetedData, outFileName);

                    document.getElementById('message').innerHTML = 'Out put done ' + outFileName;
                }
            );
            request.send();
        }

        parse(blendFile: BlendFileReader.ReadBlendFileResult): List<Action> {

            // Gets all bAction
            var bheadDictionary = new Dictionary<BlendFileReader.BHead>();
            Enumerable.From(blendFile.bheadList)
                .ForEach(bhead => bheadDictionary[bhead.old] = bhead);

            var bAction_TypeInfo = blendFile.dna.getStructureTypeInfo('bAction');
            var bAction_BHeads = Enumerable.From(blendFile.bheadList)
                .Where(bh => bh.SDNAnr == bAction_TypeInfo.sdnaIndex)
                .ToArray();

            var actions = new List<Action>();

            // For each bAction
            for (var i = 0; i < bAction_BHeads.length; i++) {
                var bAction_BHead = bAction_BHeads[i];
                var bAction = blendFile.dna.createDataSet(bAction_BHead);

                var action = new Action();
                action.name = bAction.id.name.substr(2);

                var actionGroupDictionary = new Dictionary<ActionGroup>();

                // For each FCurve in bAction, creates curves within each group
                var fCurve_Address = bAction.curves.first;
                while (true) {

                    var fCurve_BHead = bheadDictionary[fCurve_Address];
                    var fCurve = blendFile.dna.createDataSet(fCurve_BHead);

                    // Gets action group
                    var actionGroup: ActionGroup;
                    if (DictionaryContainsKey(actionGroupDictionary, fCurve.grp)) {

                        actionGroup = actionGroupDictionary[fCurve.grp];
                    }
                    else {

                        var bActionGroup_BHead = bheadDictionary[fCurve.grp];
                        var bActionGroup = blendFile.dna.createDataSet(bActionGroup_BHead);

                        actionGroup = new ActionGroup();
                        actionGroup.name = bActionGroup.name;

                        actionGroupDictionary[fCurve.grp] = actionGroup;

                        action.groups.push(actionGroup);
                    }

                    // Gets bezTriples
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

                    // Creates FCurve
                    var curve = new FCurve();
                    curve.array_index = fCurve.array_index;
                    curve.points = points;

                    actionGroup.curves.push(curve);

                    if (fCurve_Address == bAction.curves.last) {

                        break;
                    }
                    else {

                        fCurve_Address = fCurve.next;
                    }
                }

                actions.push(action);
            }

            return actions;
        }

        convert(actions: List<Action>): List<ConvertedAnimation> {

            var convertedAnimations = new List<ConvertedAnimation>();

            // for each bAction
            for (let action of actions) {

                let animation = new ConvertedAnimation();
                animation.name = action.name;

                var orderedGroups = Enumerable.From(action.groups)
                    .OrderBy(group => group.name)
                    .ToArray();

                let fCurveGroupDictionary = new Dictionary<ConvertedCurveGroup>();

                for (let actionGroup of orderedGroups) {

                    var isBoneAction = this.isBoneAction(actionGroup.name);

                    let channelIndex = 0;

                    for (let fCurve of actionGroup.curves) {

                        // Converts group and curve name. Curves for object animation are collected into a group.
                        var groupName: string;
                        var curveName: string;
                        if (isBoneAction) {

                            groupName = actionGroup.name;
                            curveName = this.getBoneAnimationCurveName(channelIndex);
                            channelIndex++;
                        }
                        else {

                            groupName = "Object";
                            curveName = this.getObjectAnimationCurveName(actionGroup.name, fCurve.array_index);
                        }

                        let fCurveGroup: ConvertedCurveGroup;
                        if (DictionaryContainsKey(fCurveGroupDictionary, groupName)) {

                            fCurveGroup = fCurveGroupDictionary[groupName];
                        }
                        else {

                            fCurveGroup = new ConvertedCurveGroup();
                            fCurveGroup.name = groupName;

                            fCurveGroupDictionary[groupName] = fCurveGroup;
                        }

                        var curve = new ConvertedCurve();
                        curve.name = curveName;
                        curve.curve = fCurve.points;

                        fCurveGroup.curves.push(curve);
                    }
                }

                for (let groupName in fCurveGroupDictionary) {
                    let fCurveGroup = fCurveGroupDictionary[groupName];

                    animation.groups.push(fCurveGroup);
                }

                convertedAnimations.push(animation);
            }

            return convertedAnimations;
        }

        output(animations: List<ConvertedAnimation>, outFileName: string) {

            var out = [];

            out.push("{");

            for (var animationIndex = 0; animationIndex < animations.length; animationIndex++) {
                let animation = animations[animationIndex];

                out.push("  \"" + animation.name + "\": {");

                for (var groupIndex = 0; groupIndex < animation.groups.length; groupIndex++) {
                    var group = animation.groups[groupIndex];

                    out.push("    \"" + group.name + "\": {");

                    for (var curveIndex = 0; curveIndex < group.curves.length; curveIndex++) {
                        var curve = group.curves[curveIndex];

                        out.push("      \"" + curve.name + "\": "
                            + JSON.stringify(curve, this.jsonStringifyReplacer)
                            + (curveIndex < group.curves.length - 1 ? ',' : '')
                        );
                    }

                    out.push("    }" + (groupIndex < animation.groups.length - 1 ? ',' : ''));
                }

                out.push("  }" + (animationIndex < animations.length - 1 ? ',' : ''));
            }

            out.push("}");

            fs.writeFile(outFileName, out.join('\r\n'), function (error) {
                if (error != null) {
                    alert('error : ' + error);
                }
            });
        }

        isBoneAction(actionGroupName: string) {

            let curveName = this.getObjectAnimationCurveName(actionGroupName, 0);

            return StringIsNullOrEmpty(curveName);
        }

        getObjectAnimationCurveName(actionGroupName: string, array_index: int): string {

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

        getBoneAnimationCurveName(array_index: int): string {

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

        getExtensionChangedFileName(fileName: string, newExtension): string {

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

        floatArrayToArray(array: Float32Array | number[]): List<float> {

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
