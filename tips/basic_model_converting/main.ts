
namespace BasicModelConverting {

    declare let THREE: any;

    let fs = (typeof (require) != 'undefined') ? require('fs') : {
        writeFile(fileName, text) {
            document.getElementById('content').innerHTML = text;
        }
    };

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

            let fileName = 'sample_basic_model.dae';
            let outFileName = this.getExtensionChangedFileName('../temp/' + fileName, 'json');

            document.getElementById('message').innerHTML = 'Out put will be located ' + outFileName;

            let collada_loader = new THREE.ColladaLoader();

            // Parsing by collada loader
            collada_loader.load(
                fileName,
                (threeJSCollada) => {

                    let parser = new Converters.ThreeJSColladaParser();
                    let sceneData = parser.parse(threeJSCollada);

                    // Converting
                    let convetedModels = this.convert(sceneData.staticMeshModels);

                    // Output
                    this.output(convetedModels, outFileName);

                    document.getElementById('message').innerHTML = 'Out put done ' + outFileName;
                }
            );

        }

        convert(staticMeshes: List<Converters.StaticMeshModel>): List<ConvertedModel> {

            let convetedModels = new List<ConvertedModel>();
            for (let mesh of staticMeshes) {

                let vertexData = [];
                for (let modelVertex of mesh.vertices) {

                    vertexData.push(modelVertex.position[0]);
                    vertexData.push(modelVertex.position[1]);
                    vertexData.push(modelVertex.position[2]);

                    vertexData.push(modelVertex.normal[0]);
                    vertexData.push(modelVertex.normal[1]);
                    vertexData.push(modelVertex.normal[2]);

                    for (let uvIndex = 0; uvIndex < modelVertex.texcoords.length; uvIndex++) {
                        vertexData.push(modelVertex.texcoords[uvIndex][0]);
                        vertexData.push(modelVertex.texcoords[uvIndex][1]);
                    }
                }

                let indexData = [];
                for (let modelFace of mesh.faces) {

                    for (let vertexIndex of modelFace.vertexIndeces) {
                        indexData.push(vertexIndex);
                    }
                }

                let uvMapCount = mesh.vertices[0].texcoords.length;

                let vertexStride = (3 + 3) + (2 * uvMapCount);

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

            let tab1 = '  ';
            let tab2 = '    ';
            let tab3 = '      ';

            let formatedOutputForSample = false;

            let out = [];

            out.push('{')

            out.push(tab1 + '\"models\": {')

            for (let i = 0; i < convetedMeshes.length; i++) {
                let convetedMesh = convetedMeshes[i];

                if (formatedOutputForSample) {

                    out.push(tab2 + '\"' + convetedMesh.name + '\": {');
                    out.push(tab3 + '\"name\": \"' + convetedMesh.name + '\"');
                    out.push(tab3 + ', \"vertexStride\": ' + convetedMesh.vertexStride);
                    out.push(tab3 + ', \"vertex\": ' + JSON.stringify(convetedMesh.vertex, this.jsonStringifyReplacer));
                    out.push(tab3 + ', \"index\": ' + JSON.stringify(convetedMesh.index));
                    out.push(tab2 + '}');
                }
                else {

                    out.push(tab2 + '\"' + convetedMesh.name + '\": '
                        + JSON.stringify(convetedMesh, this.jsonStringifyReplacer)
                    );
                }

                if (i < convetedMeshes.length - 1) {

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
    }

    window.onload = () => {

        let main = new Main();
        main.execute();
    };
}
