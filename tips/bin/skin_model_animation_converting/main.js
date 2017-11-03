var SkinModelAnimationConverting;
(function (SkinModelAnimationConverting) {
    var fs = (typeof (require) != 'undefined') ? require('fs') : {
        writeFile: function (fileName, text) {
            document.getElementById('content').innerHTML = text;
        }
    };
    // Data types
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
            this.groups = new List();
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
            for (var i = 0; i < bAction_BHeads.length; i++) {
                var bAction_BHead = bAction_BHeads[i];
                var bAction = blendFile.dna.createDataSet(bAction_BHead);
                var action = new Action();
                action.name = bAction.id.name.substr(2);
                var actionGroupDictionary = new Dictionary();
                // For each FCurve in bAction, creates curves within each group
                var fCurve_Address = bAction.curves.first;
                while (true) {
                    var fCurve_BHead = bheadDictionary[fCurve_Address];
                    var fCurve = blendFile.dna.createDataSet(fCurve_BHead);
                    // Gets action group
                    var actionGroup;
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
                var fCurveGroupDictionary = new Dictionary();
                for (var _a = 0, orderedGroups_1 = orderedGroups; _a < orderedGroups_1.length; _a++) {
                    var actionGroup = orderedGroups_1[_a];
                    var isBoneAction = this.isBoneAction(actionGroup.name);
                    var channelIndex = 0;
                    for (var _b = 0, _c = actionGroup.curves; _b < _c.length; _b++) {
                        var fCurve = _c[_b];
                        // Converts group and curve name. Curves for object animation are collected into a group.
                        var groupName;
                        var curveName;
                        if (isBoneAction) {
                            groupName = actionGroup.name;
                            curveName = this.getBoneAnimationCurveName(channelIndex);
                            channelIndex++;
                        }
                        else {
                            groupName = "Object";
                            curveName = this.getObjectAnimationCurveName(actionGroup.name, fCurve.array_index);
                        }
                        var fCurveGroup = void 0;
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
                for (var groupName_1 in fCurveGroupDictionary) {
                    var fCurveGroup = fCurveGroupDictionary[groupName_1];
                    animation.groups.push(fCurveGroup);
                }
                convertedAnimations.push(animation);
            }
            return convertedAnimations;
        };
        Main.prototype.output = function (animations, outFileName) {
            var out = [];
            out.push("{");
            for (var animationIndex = 0; animationIndex < animations.length; animationIndex++) {
                var animation = animations[animationIndex];
                out.push("  \"" + animation.name + "\": {");
                for (var groupIndex = 0; groupIndex < animation.groups.length; groupIndex++) {
                    var group = animation.groups[groupIndex];
                    out.push("    \"" + group.name + "\": {");
                    for (var curveIndex = 0; curveIndex < group.curves.length; curveIndex++) {
                        var curve = group.curves[curveIndex];
                        out.push("      \"" + curve.name + "\": "
                            + JSON.stringify(curve, this.jsonStringifyReplacer)
                            + (curveIndex < group.curves.length - 1 ? ',' : ''));
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
        };
        Main.prototype.isBoneAction = function (actionGroupName) {
            var curveName = this.getObjectAnimationCurveName(actionGroupName, 0);
            return StringIsNullOrEmpty(curveName);
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
