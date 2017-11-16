
namespace SkinModelAnimationConverting {

    let fs = (typeof(require) != 'undefined') ? require('fs') : {
        writeFile(fileName, text) {
            document.getElementById('content').innerHTML = text;
        }
    };

    class FCurve {

        array_index: int;
        points = new List<AnimationCurvePoint>();
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
        curve = new List<AnimationCurvePoint>();
    }

    class ConvertedCurveGroup {

        name: string;
        isBoneAction: boolean;
        curves = new List<ConvertedCurve>();
    }

    class ConvertedAnimation {

        name: string;
        boneAnimationGroups = new List<ConvertedCurveGroup>();
        objectAnimationGroup: ConvertedCurveGroup = null;
    }

    class Main {

        execute() {

            let fileName = 'sample_skin_model_animation.blend';
            let outFileName = this.getExtensionChangedFileName('../temp/' + fileName, 'json');

            document.getElementById('message').innerHTML = 'Out put will be located ' + outFileName;

            let request = new XMLHttpRequest();
            request.open('GET', fileName, true);
            request.responseType = 'arraybuffer';
            request.addEventListener('load',
                (e: Event) => {

                    // read a blend file
                    let blendFile = BlendFileReader.readBlendFile(request.response);

                    // Parsing
                    let actions = this.parse(blendFile);

                    // Converting
                    let convetedData = this.convert(actions);

                    // Output
                    this.output(convetedData, outFileName);

                    document.getElementById('message').innerHTML = 'Out put done ' + outFileName;
                }
            );
            request.send();
        }

        parse(blendFile: BlendFileReader.ReadBlendFileResult): List<Action> {

            // Gets all bAction
            let bheadDictionary = new Dictionary<BlendFileReader.BHead>();
            Enumerable.From(blendFile.bheadList)
                .ForEach(bhead => bheadDictionary[bhead.old] = bhead);

            let bAction_TypeInfo = blendFile.dna.getStructureTypeInfo('bAction');
            let bAction_BHeads = Enumerable.From(blendFile.bheadList)
                .Where(bh => bh.SDNAnr == bAction_TypeInfo.sdnaIndex)
                .ToArray();

            let actions = new List<Action>();

            // For each bAction
            for (let i = 0; i < bAction_BHeads.length; i++) {
                let bAction_BHead = bAction_BHeads[i];
                let bAction = blendFile.dna.createDataSet(bAction_BHead);

                let action = new Action();
                action.name = bAction.id.name.substr(2);

                // For each bActionGroup in bAction, creates groups
                let bActionGroup_Address = bAction.groups.first;
                while (true) {

                    let bActionGroup_BHead = bheadDictionary[bActionGroup_Address];
                    let bActionGroup = blendFile.dna.createDataSet(bActionGroup_BHead);

                    let actionGroup = new ActionGroup();
                    actionGroup.name = bActionGroup.name;

                    // For each FCurve in bActionGroup, creates curves
                    let fCurve_Address = bActionGroup.channels.first;
                    while (true) {

                        let fCurve_BHead = bheadDictionary[fCurve_Address];
                        let fCurve = blendFile.dna.createDataSet(fCurve_BHead);

                        // Gets bezTriples
                        let bezTriple_Bhead = bheadDictionary[fCurve.bezt];
                        let bezTriple = blendFile.dna.createDataSet(bezTriple_Bhead);

                        let points = [];
                        for (let k = 0; k < bezTriple.elementCount; k++) {
                            let bezt = bezTriple[k];

                            points.push(
                                [
                                    [bezt.vec[0], bezt.vec[1], bezt.vec[2]],
                                    [bezt.vec[3], bezt.vec[4], bezt.vec[5]],
                                    [bezt.vec[6], bezt.vec[7], bezt.vec[8]]
                                ]
                            );
                        }

                        // Creates FCurve
                        let curve = new FCurve();
                        curve.array_index = fCurve.array_index;
                        curve.points = points;

                        actionGroup.curves.push(curve);

                        if (fCurve_Address == bActionGroup.channels.last) {
                            break;
                        }
                        else {
                            fCurve_Address = fCurve.next;
                        }
                    }

                    action.groups.push(actionGroup);

                    if (bActionGroup_Address == bAction.groups.last) {
                        break;
                    }
                    else {
                        bActionGroup_Address = bActionGroup.next;
                    }
                }

                actions.push(action);
            }

            return actions;
        }

        convert(actions: List<Action>): List<ConvertedAnimation> {

            let convertedAnimations = new List<ConvertedAnimation>();

            // for each bAction
            for (let action of actions) {

                let animation = new ConvertedAnimation();
                animation.name = action.name;

                let orderedGroups = Enumerable.From(action.groups)
                    .OrderBy(group => group.name)
                    .ToArray();

                let curveGroupDictionary = new Dictionary<ConvertedCurveGroup>();

                for (let actionGroup of orderedGroups) {

                    let isBoneAction = this.isBoneAction(actionGroup.name);

                    // Creates groups. Groups for object animation are collected into a group.
                    let groupName: string;
                    if (isBoneAction) {

                        groupName = actionGroup.name;
                    }
                    else {

                        groupName = 'Object';
                    }

                    let curveGroup: ConvertedCurveGroup;
                    if (DictionaryContainsKey(curveGroupDictionary, groupName)) {

                        curveGroup = curveGroupDictionary[groupName];
                    }
                    else {

                        curveGroup = new ConvertedCurveGroup();
                        curveGroup.name = groupName;
                        curveGroup.isBoneAction = isBoneAction;

                        curveGroupDictionary[groupName] = curveGroup;

                        if (isBoneAction) {

                            animation.boneAnimationGroups.push(curveGroup);
                        }
                        else {

                            animation.objectAnimationGroup = curveGroup;
                        }
                    }

                    // Creates curves
                    let channelIndex = 0;
                    for (let fCurve of actionGroup.curves) {

                        // Converts group and curve name.
                        let curveName: string;
                        if (isBoneAction) {

                            curveName = this.getBoneAnimationCurveName(channelIndex);
                            channelIndex++;
                        }
                        else {

                            curveName = this.getObjectAnimationCurveName(actionGroup.name, fCurve.array_index);
                        }

                        let curve = new ConvertedCurve();
                        curve.name = curveName;
                        curve.curve = fCurve.points;

                        curveGroup.curves.push(curve);
                    }
                }

                convertedAnimations.push(animation);
            }

            return convertedAnimations;
        }

        output(animations: List<ConvertedAnimation>, outFileName: string) {

            let tab1 = '  ';
            let tab2 = '    ';
            let tab3 = '      ';

            let out: List<string> = [];

            out.push('{');

            for (let animationIndex = 0; animationIndex < animations.length; animationIndex++) {
                let animation = animations[animationIndex];

                out.push(tab1 + '\"' + animation.name + '\": {');

                this.ouputCurveGroups(out, 'boneAnimations', animation.boneAnimationGroups);

                out[out.length - 1] += ',';

                this.ouputCurveGroup(out, 'objectAnimation', animation.objectAnimationGroup, tab2, tab3);

                out.push(tab1 + '}' + (animationIndex < animations.length - 1 ? ',' : ''));
            }

            out.push('}');

            fs.writeFile(outFileName, out.join('\r\n'), function (error) {
                if (error != null) {
                    alert('error : ' + error);
                }
            });
        }

        ouputCurveGroups(out: List<string>, groupCategoryName: string, groups: List<ConvertedCurveGroup>) {

            let tab2 = '    ';
            let tab3 = '      ';
            let tab4 = '        ';

            out.push(tab2 + '\"' + groupCategoryName + '\": {');

            for (let groupIndex = 0; groupIndex < groups.length; groupIndex++) {
                let group = groups[groupIndex];

                this.ouputCurveGroup(out, group.name, group, tab3, tab4);

                if (groupIndex < groups.length - 1) {
                    out[out.length - 1] += ',';
                }
            }

            out.push(tab2 + '}');
        }

        ouputCurveGroup(out: List<string>, groupName: string, group: ConvertedCurveGroup, tab1: string, tab2: string) {

            out.push(tab1 + '\"' + groupName + '\": {');

            for (let curveIndex = 0; curveIndex < group.curves.length; curveIndex++) {
                let curve = group.curves[curveIndex];

                out.push(tab2 + '\"' + curve.name + '\": '
                    + JSON.stringify(curve, this.jsonStringifyReplacer)
                    + (curveIndex < group.curves.length - 1 ? ',' : '')
                );
            }

            out.push(tab1 + '}');
        }

        isBoneAction(actionGroupName: string) {

            let curveName = this.getObjectAnimationCurveName(actionGroupName, 0);

            return StringIsNullOrEmpty(curveName);
        }

        getObjectAnimationCurveName(actionGroupName: string, array_index: int): string {

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
        }

        getBoneAnimationCurveName(array_index: int): string {

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

            let result = [];
            for (let i = 0; i < array.length; i++) {
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
