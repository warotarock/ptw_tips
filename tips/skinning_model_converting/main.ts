﻿
var fs = require('fs');
var path = require('path');

namespace SkinningModelConverting {

    declare var THREE: any;

    class MeshInfo {
        name: string = null;
        conversionName: string = null;
        imageList = new List<string>();
    }

    class ConvertedSkinningModelPart {
        materialIndex: int;
        boneIndices: List<int>;
        vertexStride: int;
        vertices: List<float>;
        indices: List<int>;
    }

    class ConvertedSkinningModel {
        name: string;
        images: List<string>;
        bones: List<Converters.SkinningBone>;
        parts: List<ConvertedSkinningModelPart>;
    }

    window.onload = () => {

        var fileName = 'sample_skinning_model.blend';
        var outFileName = getExtensionChangedFileName('../temp/' + fileName, 'json');

        // load collada
        var collada_loader = new THREE.ColladaLoader();
        collada_loader.load(getExtensionChangedFileName(fileName, 'dae'),
            (threeJSCollada) => {

                var helper = new Converters.ThreeJSColladaConverterHelper();
                helper.attach(threeJSCollada);

                // load .blend for additional information
                var request = new XMLHttpRequest();
                request.open('GET', fileName, true);
                request.responseType = 'arraybuffer';
                request.addEventListener('load',
                    (e: Event) => {
                        var blendFile = BlendFileReader.readBlendFile(request.response);
                        var meshInfos = getMeshInfoFromBlend(blendFile);

                        // execute converting
                        var convetedModels = convert(helper, meshInfos);
                        output(convetedModels, outFileName);

                        console.log("converting done.");
                    }
                );
                request.send();
            }
        );
    };

    function getExtensionChangedFileName(fileName: string, newExtension) {

        return (fileName.match(/(.*)(?:\.([^.]+$))/))[1] + '.' + newExtension;
    }

    function jsonStringifyReplacer(key: string, value: any): any {

        if (typeof value === 'number') {
            return Number(value.toFixed(4));
        }
        else {
            return value;
        }
    }

    function floatArrayToArray(array: Float32Array | number[]) {
        var result = [];
        for (var i = 0; i < array.length; i++) {
            result.push(array[i]);
        }
        return result;
    }

    function getMeshInfoFromBlend(blendFile: BlendFileReader.ReadBlendFileResult): Dictionary<MeshInfo> {

        var bheadDictionary = new Dictionary<BlendFileReader.BHead>();
        Enumerable.From(blendFile.bheadList)
            .ForEach(bhead => bheadDictionary[bhead.old] = bhead);

        var mesh_TypeInfo = blendFile.dna.getStructureTypeInfo('Mesh');
        var mesh_BHeads = Enumerable.From(blendFile.bheadList)
            .Where(bh => bh.SDNAnr == mesh_TypeInfo.sdnaIndex)
            .ToArray();

        var result = new Dictionary<MeshInfo>();

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

                    var mtex: List<long> = material_dataset.mtex;
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

    function convert(helper: Converters.ModelConverterHelper, meshInfos: Dictionary<MeshInfo>): List<ConvertedSkinningModel> {

        var skinModels = helper.skinModels;

        var convetedModels = new List<ConvertedSkinningModel>();
        for (var modelIndex = 0; modelIndex < skinModels.length; modelIndex++) {
            var skinModel = skinModels[modelIndex];

            var sortedParts = Enumerable.From(skinModel.parts)
                .OrderBy(part => part.boneIndices.length)
                .ThenBy(part => part.boneIndices[0])
                .ThenBy(part => part.boneIndices.length > 1 ? part.boneIndices[1] : 9999)
                .ThenBy(part => part.boneIndices.length > 2 ? part.boneIndices[2] : 9999)
                .ThenBy(part => part.boneIndices.length > 3 ? part.boneIndices[3] : 9999)
                .ToArray();

            var convetedParts = new List<ConvertedSkinningModelPart>();
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
    }

    function getBoneParentIndex(boneList: List<Converters.SkinningBone>, parent: Converters.SkinningBone) {

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

    function output(skinningModels: List<ConvertedSkinningModel>, outFileName: string) {

        var out = [];
        out.push('{')
        for (var modelIndex = 0; modelIndex < skinningModels.length; modelIndex++) {
            var skinningModel = skinningModels[modelIndex];

            out.push('  \"' + skinningModel.name + '\": {');

            // images
            var imagesText = [];
            imagesText.push('    \"images\": [');
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

            // parts
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
        out.push('}')

        fs.writeFile(outFileName, out.join('\r\n'), function (error) {
            if (error != null) {
                alert('error : ' + error);
            }
        });
    }
}