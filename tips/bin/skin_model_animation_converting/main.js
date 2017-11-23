var SkinModelAnimationConverting;
(function (SkinModelAnimationConverting) {
    var fs = (typeof (require) != 'undefined') ? require('fs') : {
        writeFile: function (fileName, text) {
            document.getElementById('content').innerHTML = text;
        }
    };
    var FCurve = (function () {
        function FCurve() {
            this.points = new List();
        }
        return FCurve;
    }());
    var ActionGroup = (function () {
        function ActionGroup() {
            this.curves = new List();
        }
        return ActionGroup;
    }());
    var Action = (function () {
        function Action() {
            this.groups = List();
        }
        return Action;
    }());
    var ConvertedCurve = (function () {
        function ConvertedCurve() {
            this.ipoType = 2;
            this.lastTime = 0.0;
            this.lastIndex = 0;
            this.curve = new List();
        }
        return ConvertedCurve;
    }());
    var ConvertedCurveGroup = (function () {
        function ConvertedCurveGroup() {
            this.curves = new List();
        }
        return ConvertedCurveGroup;
    }());
    var ConvertedAnimation = (function () {
        function ConvertedAnimation() {
            this.boneAnimationGroups = new List();
            this.objectAnimationGroup = null;
        }
        return ConvertedAnimation;
    }());
    var Main = (function () {
        function Main() {
        }
        Main.prototype.execute = function () {
            var _this = this;
            var fileName = 'sample_skin_model_animation.blend';
            var outFileName = this.getExtensionChangedFileName('../temp/' + fileName, 'json');
            document.getElementById('message').innerHTML = 'Out put will be located ' + outFileName;
            var request = new XMLHttpRequest();
            request.open('GET', fileName, true);
            request.responseType = 'arraybuffer';
            request.addEventListener('load', function (e) {
                // read a blend file
                var blendFile = BlendFileReader.readBlendFile(request.response);
                // Parsing
                var actions = _this.parse(blendFile);
                // Converting
                var convetedData = _this.convert(actions);
                // Output
                _this.output(convetedData, outFileName);
                document.getElementById('message').innerHTML = 'Out put done ' + outFileName;
            });
            request.send();
        };
        Main.prototype.parse = function (blendFile) {
            // Gets all bAction
            var bheadDictionary = new Dictionary();
            Enumerable.From(blendFile.bheadList)
                .ForEach(function (bhead) { return bheadDictionary[bhead.old] = bhead; });
            var bAction_TypeInfo = blendFile.dna.getStructureTypeInfo('bAction');
            var bAction_BHeads = Enumerable.From(blendFile.bheadList)
                .Where(function (bh) { return bh.SDNAnr == bAction_TypeInfo.sdnaIndex; })
                .ToArray();
            var actions = new List();
            // For each bAction
            for (var _i = 0, bAction_BHeads_1 = bAction_BHeads; _i < bAction_BHeads_1.length; _i++) {
                var bAction_BHead = bAction_BHeads_1[_i];
                var bAction = blendFile.dna.createDataSet(bAction_BHead);
                var action = new Action();
                action.name = bAction.id.name.substr(2);
                // For each bActionGroup in bAction, creates groups
                var bActionGroup_Address = bAction.groups.first;
                while (true) {
                    var bActionGroup_BHead = bheadDictionary[bActionGroup_Address];
                    var bActionGroup = blendFile.dna.createDataSet(bActionGroup_BHead);
                    var actionGroup = new ActionGroup();
                    actionGroup.name = bActionGroup.name;
                    // For each FCurve in bActionGroup, creates curves
                    var fCurve_Address = bActionGroup.channels.first;
                    while (true) {
                        var fCurve_BHead = bheadDictionary[fCurve_Address];
                        var fCurve = blendFile.dna.createDataSet(fCurve_BHead);
                        // Gets bezTriples
                        var bezTriple_Bhead = bheadDictionary[fCurve.bezt];
                        var bezTriple = blendFile.dna.createDataSet(bezTriple_Bhead);
                        var points = [];
                        for (var k = 0; k < bezTriple.elementCount; k++) {
                            var bezt = bezTriple[k];
                            points.push([
                                [bezt.vec[0], bezt.vec[1], bezt.vec[2]],
                                [bezt.vec[3], bezt.vec[4], bezt.vec[5]],
                                [bezt.vec[6], bezt.vec[7], bezt.vec[8]]
                            ]);
                        }
                        // Creates FCurve
                        var curve = new FCurve();
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
        };
        Main.prototype.convert = function (actions) {
            var convertedAnimations = new List();
            // for each bAction
            for (var _i = 0, actions_1 = actions; _i < actions_1.length; _i++) {
                var action = actions_1[_i];
                var animation = new ConvertedAnimation();
                animation.name = action.name;
                var orderedGroups = Enumerable.From(action.groups)
                    .OrderBy(function (group) { return group.name; })
                    .ToArray();
                var curveGroupDictionary = new Dictionary();
                for (var _a = 0, orderedGroups_1 = orderedGroups; _a < orderedGroups_1.length; _a++) {
                    var actionGroup = orderedGroups_1[_a];
                    var isBoneAction = this.isBoneAction(actionGroup.name);
                    // Creates groups. Groups for object animation are collected into a group.
                    var groupName = void 0;
                    if (isBoneAction) {
                        groupName = actionGroup.name;
                    }
                    else {
                        groupName = 'Object';
                    }
                    var curveGroup = void 0;
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
                    var channelIndex = 0;
                    for (var _b = 0, _c = actionGroup.curves; _b < _c.length; _b++) {
                        var fCurve = _c[_b];
                        // Converts group and curve name.
                        var curveName = void 0;
                        if (isBoneAction) {
                            curveName = this.getBoneAnimationCurveName(channelIndex);
                            channelIndex++;
                        }
                        else {
                            curveName = this.getObjectAnimationCurveName(actionGroup.name, fCurve.array_index);
                        }
                        var curve = new ConvertedCurve();
                        curve.name = curveName;
                        curve.curve = fCurve.points;
                        curveGroup.curves.push(curve);
                    }
                }
                convertedAnimations.push(animation);
            }
            return convertedAnimations;
        };
        Main.prototype.output = function (animations, outFileName) {
            var tab1 = '  ';
            var tab2 = '    ';
            var tab3 = '      ';
            var out = [];
            out.push('{');
            for (var animationIndex = 0; animationIndex < animations.length; animationIndex++) {
                var animation = animations[animationIndex];
                out.push(tab1 + '\"' + animation.name + '\": {');
                this.ouputCurveGroups(out, 'boneAnimations', animation.boneAnimationGroups);
                out[out.length - 1] += ',';
                this.ouputCurveGroup(out, 'objectAnimation', animation.objectAnimationGroup, tab2, tab3);
                out.push(tab1 + '}');
                if (animationIndex < animations.length - 1) {
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
        Main.prototype.ouputCurveGroups = function (out, groupCategoryName, groups) {
            var tab2 = '    ';
            var tab3 = '      ';
            var tab4 = '        ';
            out.push(tab2 + '\"' + groupCategoryName + '\": {');
            for (var groupIndex = 0; groupIndex < groups.length; groupIndex++) {
                var group = groups[groupIndex];
                this.ouputCurveGroup(out, group.name, group, tab3, tab4);
                if (groupIndex < groups.length - 1) {
                    out[out.length - 1] += ',';
                }
            }
            out.push(tab2 + '}');
        };
        Main.prototype.ouputCurveGroup = function (out, groupName, group, tab1, tab2) {
            out.push(tab1 + '\"' + groupName + '\": {');
            for (var curveIndex = 0; curveIndex < group.curves.length; curveIndex++) {
                var curve = group.curves[curveIndex];
                out.push(tab2 + '\"' + curve.name + '\": '
                    + JSON.stringify(curve, this.jsonStringifyReplacer));
                if (curveIndex < group.curves.length - 1) {
                    out[out.length - 1] += ',';
                }
            }
            out.push(tab1 + '}');
        };
        Main.prototype.isBoneAction = function (actionGroupName) {
            var curveName = this.getObjectAnimationCurveName(actionGroupName, 0);
            return StringIsNullOrEmpty(curveName);
        };
        Main.prototype.getObjectAnimationCurveName = function (actionGroupName, array_index) {
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
        Main.prototype.getBoneAnimationCurveName = function (array_index) {
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
})(SkinModelAnimationConverting || (SkinModelAnimationConverting = {}));
