var fs = require('fs');
var BasicModelConverting;
(function (BasicModelConverting) {
    // Data types
    var ConvertedModel = (function () {
        function ConvertedModel() {
        }
        return ConvertedModel;
    }());
    // Main process
    window.onload = function () {
        var fileName = 'sample_basic_model.dae';
        var outFileName = getExtensionChangedFileName('../temp/' + fileName, 'json');
        document.getElementById('content').innerHTML = 'Out put will be located ' + outFileName;
        var collada_loader = new THREE.ColladaLoader();
        // Parsing by collada loader
        collada_loader.load(fileName, function (threeJSCollada) {
            var helper = new Converters.ThreeJSColladaConverterHelper();
            var sceneData = helper.parse(threeJSCollada);
            // Converting
            var convetedModels = convert(sceneData.staticMeshes);
            // Output
            output(convetedModels, outFileName);
            document.getElementById('content').innerHTML = 'Out put done ' + outFileName;
        });
    };
    function convert(staticMeshes) {
        var convetedModels = new List();
        for (var meshIndex = 0; meshIndex < staticMeshes.length; meshIndex++) {
            var mesh = staticMeshes[meshIndex];
            var vertices = [];
            for (var i = 0; i < mesh.vertices.length; i++) {
                var modelVertex = mesh.vertices[i];
                vertices.push(modelVertex.position[0]);
                vertices.push(modelVertex.position[1]);
                vertices.push(modelVertex.position[2]);
                vertices.push(modelVertex.normal[0]);
                vertices.push(modelVertex.normal[1]);
                vertices.push(modelVertex.normal[2]);
                for (var k = 0; k < modelVertex.texcoords.length; k++) {
                    vertices.push(modelVertex.texcoords[k][0]);
                    vertices.push(modelVertex.texcoords[k][1]);
                }
            }
            var indices = [];
            for (var i = 0; i < mesh.faces.length; i++) {
                var modelFace = mesh.faces[i];
                for (var k = 0; k < modelFace.vertexIndeces.length; k++) {
                    indices.push(modelFace.vertexIndeces[k]);
                }
            }
            convetedModels.push({
                name: mesh.name,
                vertexStride: (3 + 3) + (2 * mesh.vertices[0].texcoords.length),
                vertices: vertices,
                indices: indices
            });
        }
        return convetedModels;
    }
    function output(convetedMeshes, outFileName) {
        var tab1 = '  ';
        var tab2 = '    ';
        var tab3 = '      ';
        var out = [];
        out.push('{');
        out.push(tab1 + '\"models\": {');
        for (var i = 0; i < convetedMeshes.length; i++) {
            var convetedMesh = convetedMeshes[i];
            out.push(tab2 + '\"' + convetedMesh.name + '\": {');
            out.push(tab3 + '\"vertexStride\": ' + convetedMesh.vertexStride);
            out.push(tab3 + ', \"vertex\": ' + JSON.stringify(convetedMesh.vertices, jsonStringifyReplacer));
            out.push(tab3 + ', \"index\": ' + JSON.stringify(convetedMesh.indices));
            out.push(tab2 + '}' + (i < convetedMeshes.length - 1 ? ',' : ''));
        }
        out.push(tab1 + '}');
        out.push('}');
        fs.writeFile(outFileName, out.join('\r\n'), function (error) {
            if (error != null) {
                alert('error : ' + error);
            }
        });
    }
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
})(BasicModelConverting || (BasicModelConverting = {}));
