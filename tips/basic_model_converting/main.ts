
var fs = require('fs');

namespace BasicModelConverting {

    declare var THREE: any;

    // Data types

    class ConvertedModel {
        name: string;
        vertexStride: int;
        vertex: List<float>;
        index: List<int>;
    }

    // Main

    class Main {

        execute() {

            var fileName = 'sample_basic_model.dae';
            var outFileName = this.getExtensionChangedFileName('../temp/' + fileName, 'json');

            document.getElementById('content').innerHTML = 'Out put will be located ' + outFileName;

            var collada_loader = new THREE.ColladaLoader();

            // Parsing by collada loader
            collada_loader.load(
                fileName,
                (threeJSCollada) => {

                    var parser = new Converters.ThreeJSColladaParser();
                    let sceneData = parser.parse(threeJSCollada);

                    // Converting
                    var convetedModels = this.convert(sceneData.staticMeshModels);

                    // Output
                    this.output(convetedModels, outFileName);

                    document.getElementById('content').innerHTML = 'Out put done ' + outFileName;
                }
            );

        }

        convert(staticMeshes: List<Converters.StaticMeshModel>): List<ConvertedModel> {

            var convetedModels = new List<ConvertedModel>();
            for (var meshIndex = 0; meshIndex < staticMeshes.length; meshIndex++) {
                var mesh = staticMeshes[meshIndex];

                var vertexData = [];
                for (var i = 0; i < mesh.vertices.length; i++) {
                    var modelVertex = mesh.vertices[i];

                    vertexData.push(modelVertex.position[0]);
                    vertexData.push(modelVertex.position[1]);
                    vertexData.push(modelVertex.position[2]);

                    vertexData.push(modelVertex.normal[0]);
                    vertexData.push(modelVertex.normal[1]);
                    vertexData.push(modelVertex.normal[2]);

                    for (var k = 0; k < modelVertex.texcoords.length; k++) {
                        vertexData.push(modelVertex.texcoords[k][0]);
                        vertexData.push(modelVertex.texcoords[k][1]);
                    }
                }

                var indexData = [];
                for (var i = 0; i < mesh.faces.length; i++) {
                    var modelFace = mesh.faces[i];

                    for (var k = 0; k < modelFace.vertexIndeces.length; k++) {
                        indexData.push(modelFace.vertexIndeces[k]);
                    }
                }

                var uvMapCount = mesh.vertices[0].texcoords.length;

                var vertexStride = (3 + 3) + (2 * uvMapCount);

                convetedModels.push({
                    name: mesh.name,
                    vertexStride: vertexStride,
                    vertex: vertexData,
                    index: indexData
                });
            }

            return convetedModels;
        }

        output(convetedMeshes: List<ConvertedModel>, outFileName: string) {

            var tab1 = '  ';
            var tab2 = '    ';
            var tab3 = '      ';

            var formatedOutputForSample = false;

            var out = [];

            out.push('{')

            out.push(tab1 + '\"models\": {')

            for (var i = 0; i < convetedMeshes.length; i++) {
                var convetedMesh = convetedMeshes[i];

                if (formatedOutputForSample) {

                    out.push(tab2 + '\"' + convetedMesh.name + '\": {');
                    out.push(tab3 + '\"name\": \"' + convetedMesh.name + '\"');
                    out.push(tab3 + ', \"vertexStride\": ' + convetedMesh.vertexStride);
                    out.push(tab3 + ', \"vertex\": ' + JSON.stringify(convetedMesh.vertex, this.jsonStringifyReplacer));
                    out.push(tab3 + ', \"index\": ' + JSON.stringify(convetedMesh.index));
                    out.push(tab2 + '}' + (i < convetedMeshes.length - 1 ? ',' : ''));
                }
                else {

                    out.push(tab2 + '\"' + convetedMesh.name + '\": '
                        + JSON.stringify(convetedMesh, this.jsonStringifyReplacer)
                        + (i < convetedMeshes.length - 1 ? ',' : '')
                    );
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
    }

    window.onload = () => {

        let main = new Main();
        main.execute();
    };
}
