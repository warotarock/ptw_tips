"use strict";
var fs = require('fs');
var SkinningModelConverter;
(function (SkinningModelConverter) {
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
    window.onload = function () {
        var fileName = 'sample_skinning_model.blend';
        var outFileName = getExtensionChangedFileName('../temp/' + fileName, 'json');
        // load collada
        var collada_loader = new THREE.ColladaLoader();
        collada_loader.load(getExtensionChangedFileName(fileName, 'dae'), function (threeJSCollada) {
            var helper = new Converters.ThreeJSColladaConverterHelper();
            helper.attach(threeJSCollada);
            // load blend for additional information
            var request = new XMLHttpRequest();
            request.open('GET', fileName, true);
            request.responseType = 'arraybuffer';
            request.addEventListener('load', function (e) {
                var blendFile = BlendFileReader.readBlendFile(request.response);
                var meshInfos = getMeshInfoFromBlend(blendFile);
                // execute converting
                var convetedModels = convert(helper, meshInfos);
                output(convetedModels, outFileName);
            });
            request.send();
        });
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
    function getMeshInfoFromBlend(blendFile) {
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
            var mesh_dataset = blendFile.dna.createDataSetFromBHead(mesh_bhead);
            var totcol = mesh_dataset.totcol;
            var meshInfo = new MeshInfo();
            meshInfo.name = (mesh_dataset.id.name).substring(2);
            meshInfo.conversionName = meshInfo.name.replace('.', '_');
            if (mesh_dataset.mat != 0) {
                var material_array_bhead = bheadDictionary[mesh_dataset.mat];
                var material_array_dataset = blendFile.dna.createDataSetFromBHead(material_array_bhead);
                for (var m = 0; m < totcol; m++) {
                    var material_bhead = bheadDictionary[material_array_dataset[m]];
                    var material_dataset = blendFile.dna.createDataSetFromBHead(material_bhead);
                    var mtex = material_dataset.mtex;
                    for (var k = 0; k < mtex.length; k++) {
                        if (mtex[k] != 0) {
                            var mtex_bhead = bheadDictionary[mtex[k]];
                            var mtex_dataset = blendFile.dna.createDataSetFromBHead(mtex_bhead);
                            if (mtex_dataset.tex != 0) {
                                var tex_dataset = blendFile.dna.createDataSetFromBHead(bheadDictionary[mtex_dataset.tex]);
                                var image_dataset = blendFile.dna.createDataSetFromBHead(bheadDictionary[tex_dataset.ima]);
                                meshInfo.imageList.push(image_dataset.name);
                            }
                        }
                    }
                }
            }
            result[meshInfo.conversionName] = meshInfo;
        }
        return result;
    }
    function convert(helper, meshInfos) {
        var skinModels = helper.skinModels;
        var convetedModels = new List();
        for (var modelIndex = 0; modelIndex < skinModels.length; modelIndex++) {
            var skinModel = skinModels[modelIndex];
            var convetedParts = new List();
            for (var partIndex = 0; partIndex < skinModel.parts.length; partIndex++) {
                var skinPart = skinModel.parts[partIndex];
                var vertices = [];
                for (var modelIndex = 0; modelIndex < skinPart.vertices.length; modelIndex++) {
                    var skinVertex = skinPart.vertices[modelIndex];
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
                    for (var m = 0; m < skinVertex.texcoords.length; m++) {
                        vertices.push(skinVertex.texcoords[m][0]);
                        vertices.push(skinVertex.texcoords[m][1]);
                    }
                }
                var indices = [];
                for (var modelIndex = 0; modelIndex < skinPart.faces.length; modelIndex++) {
                    var meshFace = skinPart.faces[modelIndex];
                    for (var k = 0; k < meshFace.vertexIndeces.length; k++) {
                        indices.push(meshFace.vertexIndeces[k]);
                    }
                }
                var boneIndices = [];
                for (var modelIndex = 0; modelIndex < skinPart.boneIndices.length; modelIndex++) {
                    if (skinPart.boneIndices[modelIndex] == -1) {
                        break;
                    }
                    else {
                        boneIndices.push(skinPart.boneIndices[modelIndex]);
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
    }
    function getBoneParentIndex(boneList, parent) {
        if (parent == null) {
            return -1;
        }
        for (var i = 0; i < boneList.length; i++) {
            if (boneList[i].name == parent.name) {
                return i;
            }
        }
        return -1;
    }
    function output(skinningModels, outFileName) {
        var out = [];
        out.push('{');
        for (var modelIndex = 0; modelIndex < skinningModels.length; modelIndex++) {
            var skinningModel = skinningModels[modelIndex];
            out.push('  \"' + skinningModel.name + '\": {');
            var imagesText = [];
            imagesText.push('    \"images\": [');
            for (var imageIndex = 0; imageIndex < skinningModel.images.length; imageIndex++) {
                var imageName = skinningModel.images[imageIndex];
                if (imageName.length > 2 && imageName.substr(0, 2) == '//') {
                    imageName = imageName.substr(2);
                }
                imagesText.push('\"' + imageName + '\"' + (imageIndex < skinningModel.images.length - 1 ? ', ' : ''));
            }
            imagesText.push('],');
            out.push(imagesText.join(''));
            out.push('    \"bones\": [');
            for (var boneIndex = 0; boneIndex < skinningModel.bones.length; boneIndex++) {
                var bone = skinningModel.bones[boneIndex];
                out.push('      {' +
                    '\"name\": \"' + bone.name + '\"' +
                    ', \"parent\": ' + getBoneParentIndex(skinningModel.bones, bone.parent) +
                    ', \"matrix\": ' + JSON.stringify(floatArrayToArray(bone.localMatrix), jsonStringifyReplacer) +
                    '}' + (boneIndex < skinningModel.bones.length - 1 ? ',' : ''));
            }
            out.push('    ],');
            out.push('    \"parts\": [');
            for (var partIndex = 0; partIndex < skinningModel.parts.length; partIndex++) {
                var convetedPart = skinningModel.parts[partIndex];
                out.push('      {');
                out.push('        \"bone\": ' + JSON.stringify(convetedPart.boneIndices, jsonStringifyReplacer));
                out.push('        , \"material\": ' + convetedPart.materialIndex);
                out.push('        , \"vertexStride\": ' + convetedPart.vertexStride);
                out.push('        , \"vertex\": ' + JSON.stringify(convetedPart.vertices, jsonStringifyReplacer));
                out.push('        , \"index\": ' + JSON.stringify(convetedPart.indices));
                out.push('      }' + (partIndex < skinningModel.parts.length - 1 ? ',' : ''));
            }
            out.push('    ]');
            out.push('  }' + (modelIndex < skinningModels.length - 1 ? ',' : ''));
        }
        out.push('}');
        fs.writeFile(outFileName, out.join('\r\n'), function (error) {
            if (error != null) {
                alert('error : ' + error);
            }
        });
    }
})(SkinningModelConverter || (SkinningModelConverter = {}));
//# sourceMappingURL=main.js.map