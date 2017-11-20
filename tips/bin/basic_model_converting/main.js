var BasicModelConverting;
(function (BasicModelConverting) {
    var fs = (typeof (require) != 'undefined') ? require('fs') : {
        writeFile: function (fileName, text) {
            document.getElementById('content').innerHTML = text;
        }
    };
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
            document.getElementById('message').innerHTML = 'Out put will be located ' + outFileName;
            var collada_loader = new THREE.ColladaLoader();
            // Parsing by collada loader
            collada_loader.load(fileName, function (threeJSCollada) {
                var parser = new Converters.ThreeJSColladaParser();
                var sceneData = parser.parse(threeJSCollada);
                // Converting
                var convetedModels = _this.convert(sceneData.staticMeshModels);
                // Output
                _this.output(convetedModels, outFileName);
                document.getElementById('message').innerHTML = 'Out put done ' + outFileName;
            });
        };
        Main.prototype.convert = function (staticMeshes) {
            var convetedModels = new List();
            for (var _i = 0, staticMeshes_1 = staticMeshes; _i < staticMeshes_1.length; _i++) {
                var mesh = staticMeshes_1[_i];
                var vertexData = [];
                for (var _a = 0, _b = mesh.vertices; _a < _b.length; _a++) {
                    var modelVertex = _b[_a];
                    vertexData.push(modelVertex.position[0]);
                    vertexData.push(modelVertex.position[1]);
                    vertexData.push(modelVertex.position[2]);
                    vertexData.push(modelVertex.normal[0]);
                    vertexData.push(modelVertex.normal[1]);
                    vertexData.push(modelVertex.normal[2]);
                    for (var uvIndex = 0; uvIndex < modelVertex.texcoords.length; uvIndex++) {
                        vertexData.push(modelVertex.texcoords[uvIndex][0]);
                        vertexData.push(modelVertex.texcoords[uvIndex][1]);
                    }
                }
                var indexData = [];
                for (var _c = 0, _d = mesh.faces; _c < _d.length; _c++) {
                    var modelFace = _d[_c];
                    for (var _e = 0, _f = modelFace.vertexIndeces; _e < _f.length; _e++) {
                        var vertexIndex = _f[_e];
                        indexData.push(vertexIndex);
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
                    out.push(tab2 + '}');
                }
                else {
                    out.push(tab2 + '\"' + convetedMesh.name + '\": '
                        + JSON.stringify(convetedMesh, this.jsonStringifyReplacer));
                }
                if (i < convetedMeshes.length - 1) {
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
        return Main;
    }());
    window.onload = function () {
        var main = new Main();
        main.execute();
    };
})(BasicModelConverting || (BasicModelConverting = {}));
