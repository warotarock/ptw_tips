var fs = require('fs');
var BasicModelConverting;
(function (BasicModelConverting) {
    // Data types
    var ConvertedModel = (function () {
        function ConvertedModel() {
        }
        return ConvertedModel;
    }());
    // Main
    var Main = (function () {
        function Main() {
        }
        Main.prototype.execute = function () {
            var _this = this;
            var fileName = 'sample_basic_model.dae';
            var outFileName = this.getExtensionChangedFileName('../temp/' + fileName, 'json');
            document.getElementById('content').innerHTML = 'Out put will be located ' + outFileName;
            var collada_loader = new THREE.ColladaLoader();
            // Parsing by collada loader
            collada_loader.load(fileName, function (threeJSCollada) {
                var parser = new Converters.ThreeJSColladaParser();
                var sceneData = parser.parse(threeJSCollada);
                // Converting
                var convetedModels = _this.convert(sceneData.staticMeshModels);
                // Output
                _this.output(convetedModels, outFileName);
                document.getElementById('content').innerHTML = 'Out put done ' + outFileName;
            });
        };
        Main.prototype.convert = function (staticMeshes) {
            var convetedModels = new List();
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
        };
        Main.prototype.output = function (convetedMeshes, outFileName) {
            var tab1 = '  ';
            var tab2 = '    ';
            var tab3 = '      ';
            var formatedOutputForSample = false;
            var out = [];
            out.push('{');
            out.push(tab1 + '\"models\": {');
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
                        + (i < convetedMeshes.length - 1 ? ',' : ''));
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
        return Main;
    }());
    window.onload = function () {
        var main = new Main();
        main.execute();
    };
})(BasicModelConverting || (BasicModelConverting = {}));
