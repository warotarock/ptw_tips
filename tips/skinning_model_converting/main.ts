
namespace SkinModelConverting {

    declare var THREE: any;

    var fs = (typeof (require) != 'undefined') ? require('fs') : {
        writeFile(fileName, text) {
            document.getElementById('content').innerHTML = text;
        }
    };

    // Data types

    class ConvertedSkinModelPart {
        materialIndex: int;
        boneIndices: List<int>;
        vertexStride: int;
        vertices: List<float>;
        indices: List<int>;
    }

    class ConvertedSkinModel {
        name: string;
        bones: List<Converters.SkinMeshBone>;
        parts: List<ConvertedSkinModelPart>;
    }

    // Main

    class Main {

        execute() {

            var fileName = 'sample_skin_model.dae';
            var outFileName = this.getExtensionChangedFileName('../temp/' + fileName, 'json');

            document.getElementById('message').innerHTML = 'Out put will be located ' + outFileName;

            // Parsing by collada loader
            var collada_loader = new THREE.ColladaLoader();

            collada_loader.load(fileName,
                (threeJSCollada) => {

                    var parser = new Converters.ThreeJSColladaParser();
                    let sceneData = parser.parse(threeJSCollada);

                    // Converting
                    var convetedModels = this.convert(sceneData);

                    // Output
                    this.output(convetedModels, outFileName);

                    document.getElementById('message').innerHTML = 'Out put done ' + outFileName;
                }
            );
        }

        convert(sceneData: Converters.SceneData): List<ConvertedSkinModel> {

            var convetedModels = new List<ConvertedSkinModel>();

            for (var skinModel of sceneData.skinMeshModels) {

                var sortedParts = Enumerable.From(skinModel.parts)
                    .OrderBy(part => part.boneIndices.length)
                    .ThenBy(part => part.boneIndices[0])
                    .ThenBy(part => part.boneIndices.length > 1 ? part.boneIndices[1] : 9999)
                    .ThenBy(part => part.boneIndices.length > 2 ? part.boneIndices[2] : 9999)
                    .ThenBy(part => part.boneIndices.length > 3 ? part.boneIndices[3] : 9999)
                    .ToArray();

                var convetedParts = new List<ConvertedSkinModelPart>();

                for (var skinPart of sortedParts) {

                    var boneIndices = [];
                    for (var boneIndex of skinPart.boneIndices) {

                        boneIndices.push(boneIndex);
                    }

                    var vertices = [];
                    for (var skinVertex of skinPart.vertices) {

                        for (var skinVertexPosition of skinVertex.positions) {

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

                        for (var texcoords of skinVertex.texcoords) {

                            vertices.push(texcoords[0]);
                            vertices.push(texcoords[1]);
                        }
                    }

                    var indices = [];
                    for (var meshFace of skinPart.faces) {

                        for (var index of meshFace.vertexIndeces) {

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
        }

        output(skinModels: List<ConvertedSkinModel>, outFileName: string) {

            var tab1 = '  ';
            var tab2 = '    ';
            var tab3 = '      ';
            var tab4 = '        ';

            var out = [];
            out.push('{')

            out.push(tab1 + '\"skin_models\": {')

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

            out.push(tab1 + '}')

            out.push('}')

            fs.writeFile(outFileName, out.join('\r\n'), function (error) {
                if (error != null) {
                    alert('error : ' + error);
                }
            });
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

        getBoneParentIndex(boneList: List<Converters.SkinMeshBone>, parent: Converters.SkinMeshBone) {

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
    }

    window.onload = () => {

        let main = new Main();
        main.execute();
    };
}
