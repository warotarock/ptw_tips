"use strict";
var fs = require('fs');
window.onload = function () {
    var fileName = 'sample.dae';
    var outFileName = getExtensionChangedFileName('../temp/' + fileName, 'json');
    var collada_loader = new THREE.ColladaLoader();
    collada_loader.load(fileName, function (threeJSCollada) {
        var helper = new Converters.ThreeJSColladaConverterHelper();
        helper.attach(threeJSCollada);
        outputModle(helper, outFileName);
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
function outputModle(helper, outFileName) {
    var modelMeshes = helper.modelMeshes;
    var meshes = [];
    for (var meshIndex = 0; meshIndex < modelMeshes.length; meshIndex++) {
        var modelMesh = modelMeshes[meshIndex];
        var vertexData = [];
        for (var i = 0; i < modelMesh.vertices.length; i++) {
            var modelVertex = modelMesh.vertices[i];
            vertexData.push(modelVertex.position[0]);
            vertexData.push(modelVertex.position[1]);
            vertexData.push(modelVertex.position[2]);
            vertexData.push(modelVertex.normal[0]);
            vertexData.push(modelVertex.normal[1]);
            vertexData.push(modelVertex.normal[2]);
            vertexData.push(modelVertex.texcoord[0]);
            vertexData.push(modelVertex.texcoord[1]);
        }
        var indexData = [];
        for (var i = 0; i < modelMesh.faces.length; i++) {
            var modelFace = modelMesh.faces[i];
            for (var k = 0; k < modelFace.vertexIndeces.length; k++) {
                indexData.push(modelFace.vertexIndeces[k]);
            }
        }
        meshes.push({
            name: modelMesh.name,
            vertex: vertexData,
            index: indexData
        });
    }
    var out = [];
    out.push('{');
    for (var i = 0; i < meshes.length; i++) {
        var mesh = meshes[i];
        out.push('  \"' + mesh.name + '\": {');
        out.push('    \"vertex\": ' + JSON.stringify(mesh.vertex, jsonStringifyReplacer));
        out.push('    , \"index\": ' + JSON.stringify(mesh.index));
        out.push('  }' + (i < meshes.length - 1 ? ',' : ''));
    }
    out.push('}');
    fs.writeFile(outFileName, out.join('\r\n'), function (error) {
        if (error != null) {
            alert('error : ' + error);
        }
    });
}
//# sourceMappingURL=main.js.map