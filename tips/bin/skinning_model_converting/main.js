var SkinModelConverting;
(function (SkinModelConverting) {
    var fs = (typeof (require) != 'undefined') ? require('fs') : {
        writeFile: function (fileName, text) {
            document.getElementById('content').innerHTML = text;
        }
    };
    // Data types
    var ConvertedSkinModelPart = (function () {
        function ConvertedSkinModelPart() {
        }
        return ConvertedSkinModelPart;
    }());
    var ConvertedSkinModel = (function () {
        function ConvertedSkinModel() {
        }
        return ConvertedSkinModel;
    }());
    // Main
    var Main = (function () {
        function Main() {
        }
        Main.prototype.execute = function () {
            var _this = this;
            var fileName = 'sample_skin_model.dae';
            var outFileName = this.getExtensionChangedFileName('../temp/' + fileName, 'json');
            document.getElementById('message').innerHTML = 'Out put will be located ' + outFileName;
            // Parsing by collada loader
            var collada_loader = new THREE.ColladaLoader();
            collada_loader.load(fileName, function (threeJSCollada) {
                var parser = new Converters.ThreeJSColladaParser();
                var sceneData = parser.parse(threeJSCollada);
                // Converting
                var convetedModels = _this.convert(sceneData);
                // Output
                _this.output(convetedModels, outFileName);
                document.getElementById('message').innerHTML = 'Out put done ' + outFileName;
            });
        };
        Main.prototype.convert = function (sceneData) {
            var convetedModels = new List();
            for (var _i = 0, _a = sceneData.skinMeshModels; _i < _a.length; _i++) {
                var skinModel = _a[_i];
                var sortedParts = Enumerable.From(skinModel.parts)
                    .OrderBy(function (part) { return part.boneIndices.length; })
                    .ThenBy(function (part) { return part.boneIndices[0]; })
                    .ThenBy(function (part) { return part.boneIndices.length > 1 ? part.boneIndices[1] : 9999; })
                    .ThenBy(function (part) { return part.boneIndices.length > 2 ? part.boneIndices[2] : 9999; })
                    .ThenBy(function (part) { return part.boneIndices.length > 3 ? part.boneIndices[3] : 9999; })
                    .ToArray();
                var convetedParts = new List();
                for (var _b = 0, sortedParts_1 = sortedParts; _b < sortedParts_1.length; _b++) {
                    var skinPart = sortedParts_1[_b];
                    var boneIndices = [];
                    for (var _c = 0, _d = skinPart.boneIndices; _c < _d.length; _c++) {
                        var boneIndex = _d[_c];
                        boneIndices.push(boneIndex);
                    }
                    var vertices = [];
                    for (var _e = 0, _f = skinPart.vertices; _e < _f.length; _e++) {
                        var skinVertex = _f[_e];
                        for (var _g = 0, _h = skinVertex.positions; _g < _h.length; _g++) {
                            var skinVertexPosition = _h[_g];
                            vertices.push(skinVertexPosition.boneWeight);
                            vertices.push(skinVertexPosition.position[0]);
                            vertices.push(skinVertexPosition.position[1]);
                            vertices.push(skinVertexPosition.position[2]);
                            vertices.push(skinVertexPosition.normal[0]);
                            vertices.push(skinVertexPosition.normal[1]);
                            vertices.push(skinVertexPosition.normal[2]);
                        }
                        if (skinVertex.positions.length == 1 || skinVertex.positions.length == 3) {
                            // Insert position and normal for dummy bone
                            vertices.push(0.0);
                            vertices.push(0.0);
                            vertices.push(0.0);
                            vertices.push(0.0);
                            vertices.push(0.0);
                            vertices.push(0.0);
                            vertices.push(0.0);
                        }
                        for (var _j = 0, _k = skinVertex.texcoords; _j < _k.length; _j++) {
                            var texcoords = _k[_j];
                            vertices.push(texcoords[0]);
                            vertices.push(texcoords[1]);
                        }
                    }
                    var indices = [];
                    for (var _l = 0, _m = skinPart.faces; _l < _m.length; _l++) {
                        var meshFace = _m[_l];
                        for (var _o = 0, _p = meshFace.vertexIndeces; _o < _p.length; _o++) {
                            var index = _p[_o];
                            indices.push(index);
                        }
                    }
                    var vertexCount = (skinVertex.positions.length <= 2 ? 2 : 4);
                    var uvMapCount = skinPart.vertices[0].texcoords.length;
                    var vertexStride = ((1 + 3 + 3) * vertexCount) + (2 * uvMapCount);
                    convetedParts.push({
                        materialIndex: skinPart.materialIndex,
                        boneIndices: boneIndices,
                        vertexStride: vertexStride,
                        vertices: vertices,
                        indices: indices
                    });
                }
                convetedModels.push({
                    name: skinModel.name,
                    bones: skinModel.bones,
                    parts: convetedParts
                });
            }
            return convetedModels;
        };
        Main.prototype.output = function (skinModels, outFileName) {
            var tab1 = '  ';
            var tab2 = '    ';
            var tab3 = '      ';
            var tab4 = '        ';
            var out = [];
            out.push('{');
            out.push(tab1 + '\"skin_models\": {');
            for (var modelIndex = 0; modelIndex < skinModels.length; modelIndex++) {
                var skinModel = skinModels[modelIndex];
                out.push(tab2 + '\"' + skinModel.name + '\": {');
                // bones
                out.push(tab3 + '\"bones\": [');
                for (var boneIndex = 0; boneIndex < skinModel.bones.length; boneIndex++) {
                    var bone = skinModel.bones[boneIndex];
                    out.push(tab4 + '{' +
                        '\"name\": \"' + bone.name + '\"' +
                        ', \"parent\": ' + this.getBoneParentIndex(skinModel.bones, bone.parent) +
                        ', \"matrix\": ' + JSON.stringify(this.floatArrayToArray(bone.localMatrix), this.jsonStringifyReplacer) +
                        '}');
                    if (boneIndex < skinModel.bones.length - 1) {
                        out[out.length - 1] += ',';
                    }
                }
                out.push(tab3 + '],');
                // parts
                out.push(tab3 + '\"parts\": [');
                for (var partIndex = 0; partIndex < skinModel.parts.length; partIndex++) {
                    var convetedPart = skinModel.parts[partIndex];
                    out.push(tab4 + '{');
                    out.push(tab4 + '  \"boneIndices\": ' + JSON.stringify(convetedPart.boneIndices, this.jsonStringifyReplacer));
                    out.push(tab4 + '  , \"material\": ' + convetedPart.materialIndex);
                    out.push(tab4 + '  , \"vertexStride\": ' + convetedPart.vertexStride);
                    out.push(tab4 + '  , \"vertex\": ' + JSON.stringify(convetedPart.vertices, this.jsonStringifyReplacer));
                    out.push(tab4 + '  , \"index\": ' + JSON.stringify(convetedPart.indices));
                    out.push(tab4 + '}');
                    if (partIndex < skinModel.parts.length - 1) {
                        out[out.length - 1] += ',';
                    }
                }
                out.push(tab3 + ']');
                out.push(tab2 + '}');
                if (modelIndex < skinModels.length - 1) {
                    out[out.length - 1] += ',';
                }
            }
            out.push(tab1 + '}');
            out.push('}');
            fs.writeFile(outFileName, out.join('\r\n'), function (error) {
                if (error != null) {
                    alert('error : ' + error);
                }
            });
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
        Main.prototype.getBoneParentIndex = function (boneList, parent) {
            if (parent == null) {
                return -1;
            }
            for (var i = 0; i < boneList.length; i++) {
                if (boneList[i].name == parent.name) {
                    return i;
                }
            }
            return -1;
        };
        return Main;
    }());
    window.onload = function () {
        var main = new Main();
        main.execute();
    };
})(SkinModelConverting || (SkinModelConverting = {}));
