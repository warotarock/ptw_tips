var fs = require('fs');
var path = require('path');
var SkinningModelConverting;
(function (SkinningModelConverting) {
    // Data types
    var MeshInfo = (function () {
        function MeshInfo() {
            this.name = null;
            this.conversionName = null;
            this.imageList = new List();
        }
        return MeshInfo;
    }());
    var ConvertedSkinningModelPart = (function () {
        function ConvertedSkinningModelPart() {
        }
        return ConvertedSkinningModelPart;
    }());
    var ConvertedSkinningModel = (function () {
        function ConvertedSkinningModel() {
        }
        return ConvertedSkinningModel;
    }());
    // Main
    var Main = (function () {
        function Main() {
        }
        Main.prototype.execute = function () {
            var _this = this;
            var fileName = 'sample_skinning_model.dae';
            var blendFileName = this.getExtensionChangedFileName(fileName, 'blend');
            var outFileName = this.getExtensionChangedFileName('../temp/' + fileName, 'json');
            document.getElementById('content').innerHTML = 'Out put will be located ' + outFileName;
            // Parsing by collada loader
            var collada_loader = new THREE.ColladaLoader();
            collada_loader.load(fileName, function (threeJSCollada) {
                var parser = new Converters.ThreeJSColladaParser();
                var sceneData = parser.parse(threeJSCollada);
                // Additional information from .blend
                var request = new XMLHttpRequest();
                request.open('GET', blendFileName, true);
                request.responseType = 'arraybuffer';
                request.addEventListener('load', function (e) {
                    var blendFile = BlendFileReader.readBlendFile(request.response);
                    var meshInfos = _this.getMeshInfoFromBlend(blendFile);
                    // Converting
                    var convetedModels = _this.convert(sceneData, meshInfos);
                    // Output
                    _this.output(convetedModels, outFileName);
                    document.getElementById('content').innerHTML = 'Out put done ' + outFileName;
                });
                request.send();
            });
        };
        Main.prototype.convert = function (sceneData, meshInfos) {
            var convetedModels = new List();
            for (var modelIndex = 0; modelIndex < sceneData.skinMeshModels.length; modelIndex++) {
                var skinModel = sceneData.skinMeshModels[modelIndex];
                var sortedParts = Enumerable.From(skinModel.parts)
                    .OrderBy(function (part) { return part.boneIndices.length; })
                    .ThenBy(function (part) { return part.boneIndices[0]; })
                    .ThenBy(function (part) { return part.boneIndices.length > 1 ? part.boneIndices[1] : 9999; })
                    .ThenBy(function (part) { return part.boneIndices.length > 2 ? part.boneIndices[2] : 9999; })
                    .ThenBy(function (part) { return part.boneIndices.length > 3 ? part.boneIndices[3] : 9999; })
                    .ToArray();
                var convetedParts = new List();
                for (var partIndex = 0; partIndex < sortedParts.length; partIndex++) {
                    var skinPart = sortedParts[partIndex];
                    var vertices = [];
                    for (var vertexIndex = 0; vertexIndex < skinPart.vertices.length; vertexIndex++) {
                        var skinVertex = skinPart.vertices[vertexIndex];
                        for (var k = 0; k < skinVertex.positions.length; k++) {
                            var vpos = skinVertex.positions[k];
                            vertices.push(vpos.boneWeight);
                            vertices.push(vpos.position[0]);
                            vertices.push(vpos.position[1]);
                            vertices.push(vpos.position[2]);
                            vertices.push(vpos.normal[0]);
                            vertices.push(vpos.normal[1]);
                            vertices.push(vpos.normal[2]);
                        }
                        if (skinVertex.positions.length == 1 || skinVertex.positions.length == 3) {
                            vertices.push(0.0);
                            vertices.push(0.0);
                            vertices.push(0.0);
                            vertices.push(0.0);
                            vertices.push(0.0);
                            vertices.push(0.0);
                            vertices.push(0.0);
                        }
                        for (var k = 0; k < skinVertex.texcoords.length; k++) {
                            vertices.push(skinVertex.texcoords[k][0]);
                            vertices.push(skinVertex.texcoords[k][1]);
                        }
                    }
                    var indices = [];
                    for (var faceindex = 0; faceindex < skinPart.faces.length; faceindex++) {
                        var meshFace = skinPart.faces[faceindex];
                        for (var k = 0; k < meshFace.vertexIndeces.length; k++) {
                            indices.push(meshFace.vertexIndeces[k]);
                        }
                    }
                    var boneIndices = [];
                    for (var boneIndex = 0; boneIndex < skinPart.boneIndices.length; boneIndex++) {
                        if (skinPart.boneIndices[boneIndex] == -1) {
                            break;
                        }
                        else {
                            boneIndices.push(skinPart.boneIndices[boneIndex]);
                        }
                    }
                    var vertexCount = (skinVertex.positions.length <= 2 ? 2 : 4);
                    convetedParts.push({
                        materialIndex: skinPart.materialIndex,
                        boneIndices: boneIndices,
                        vertexStride: ((1 + 3 + 3) * vertexCount) + (2 * skinPart.vertices[0].texcoords.length),
                        vertices: vertices,
                        indices: indices
                    });
                }
                convetedModels.push({
                    name: skinModel.name,
                    images: meshInfos[skinModel.name].imageList,
                    bones: skinModel.bones,
                    parts: convetedParts
                });
            }
            return convetedModels;
        };
        Main.prototype.output = function (skinningModels, outFileName) {
            var tab1 = '  ';
            var tab2 = '    ';
            var tab3 = '      ';
            var tab4 = '        ';
            var out = [];
            out.push('{');
            out.push(tab1 + '\"skin_models\": {');
            for (var modelIndex = 0; modelIndex < skinningModels.length; modelIndex++) {
                var skinningModel = skinningModels[modelIndex];
                out.push(tab2 + '\"' + skinningModel.name + '\": {');
                // images
                var imagesText = [];
                imagesText.push(tab3 + '\"images\": [');
                for (var imageIndex = 0; imageIndex < skinningModel.images.length; imageIndex++) {
                    var imageName = skinningModel.images[imageIndex];
                    if (imageName.length > 2 && imageName.substr(0, 2) == '//') {
                        imageName = imageName.substr(2);
                    }
                    imageName = path.basename(imageName);
                    imagesText.push('\"' + imageName + '\"' + (imageIndex < skinningModel.images.length - 1 ? ', ' : ''));
                }
                imagesText.push('],');
                out.push(imagesText.join(''));
                // bones
                out.push(tab3 + '\"bones\": [');
                for (var boneIndex = 0; boneIndex < skinningModel.bones.length; boneIndex++) {
                    var bone = skinningModel.bones[boneIndex];
                    out.push(tab4 + '{' +
                        '\"name\": \"' + bone.name + '\"' +
                        ', \"parent\": ' + this.getBoneParentIndex(skinningModel.bones, bone.parent) +
                        ', \"matrix\": ' + JSON.stringify(this.floatArrayToArray(bone.localMatrix), this.jsonStringifyReplacer) +
                        '}' + (boneIndex < skinningModel.bones.length - 1 ? ',' : ''));
                }
                out.push(tab3 + '],');
                // parts
                out.push(tab3 + '\"parts\": [');
                for (var partIndex = 0; partIndex < skinningModel.parts.length; partIndex++) {
                    var convetedPart = skinningModel.parts[partIndex];
                    out.push(tab4 + '{');
                    out.push(tab4 + '  \"bone\": ' + JSON.stringify(convetedPart.boneIndices, this.jsonStringifyReplacer));
                    out.push(tab4 + '  , \"material\": ' + convetedPart.materialIndex);
                    out.push(tab4 + '  , \"vertexStride\": ' + convetedPart.vertexStride);
                    out.push(tab4 + '  , \"vertex\": ' + JSON.stringify(convetedPart.vertices, this.jsonStringifyReplacer));
                    out.push(tab4 + '  , \"index\": ' + JSON.stringify(convetedPart.indices));
                    out.push(tab4 + '}' + (partIndex < skinningModel.parts.length - 1 ? ',' : ''));
                }
                out.push(tab3 + ']');
                out.push(tab2 + '}' + (modelIndex < skinningModels.length - 1 ? ',' : ''));
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
        Main.prototype.getMeshInfoFromBlend = function (blendFile) {
            var bheadDictionary = new Dictionary();
            Enumerable.From(blendFile.bheadList)
                .ForEach(function (bhead) { return bheadDictionary[bhead.old] = bhead; });
            var mesh_TypeInfo = blendFile.dna.getStructureTypeInfo('Mesh');
            var mesh_BHeads = Enumerable.From(blendFile.bheadList)
                .Where(function (bh) { return bh.SDNAnr == mesh_TypeInfo.sdnaIndex; })
                .ToArray();
            var result = new Dictionary();
            // search image file path by: mesh -> list of material -> material -> list of texture -> texture -> image -> file path
            for (var i = 0; i < mesh_BHeads.length; i++) {
                var mesh_bhead = mesh_BHeads[i];
                var mesh_dataset = blendFile.dna.createDataSet(mesh_bhead);
                var totcol = mesh_dataset.totcol;
                var meshInfo = new MeshInfo();
                meshInfo.name = (mesh_dataset.id.name).substring(2);
                meshInfo.conversionName = meshInfo.name.replace('.', '_');
                if (mesh_dataset.mat != 0) {
                    var material_array_bhead = bheadDictionary[mesh_dataset.mat];
                    var material_array_dataset = blendFile.dna.createDataSet(material_array_bhead);
                    for (var m = 0; m < totcol; m++) {
                        var material_bhead = bheadDictionary[material_array_dataset[m]];
                        var material_dataset = blendFile.dna.createDataSet(material_bhead);
                        var mtex = material_dataset.mtex;
                        for (var k = 0; k < mtex.length; k++) {
                            if (mtex[k] != 0) {
                                var mtex_bhead = bheadDictionary[mtex[k]];
                                var mtex_dataset = blendFile.dna.createDataSet(mtex_bhead);
                                if (mtex_dataset.tex != 0) {
                                    var tex_dataset = blendFile.dna.createDataSet(bheadDictionary[mtex_dataset.tex]);
                                    var image_dataset = blendFile.dna.createDataSet(bheadDictionary[tex_dataset.ima]);
                                    meshInfo.imageList.push(image_dataset.name);
                                }
                            }
                        }
                    }
                }
                result[meshInfo.conversionName] = meshInfo;
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
})(SkinningModelConverting || (SkinningModelConverting = {}));
