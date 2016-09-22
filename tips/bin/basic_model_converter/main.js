"use strict";
var fs = require('fs');
window.onload = function () {
    var fileName = 'sample.dae';
    fs.readFile(fileName, function (error, data) {
        if (error != null) {
            alert('error : ' + error);
            return;
        }
        var colladaScene = Collada.parse(data);
        var outFileName = getExtensionChangedFileName('../temp/' + fileName, 'json');
        outputModle(colladaScene, outFileName);
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
function outputModle(colladaScene, outFileName) {
    var meshes = [];
    for (var meshName in colladaScene.meshes) {
        var colladaMesh = colladaScene.meshes[meshName];
        var vertexData = [];
        for (var i = 0; i < colladaMesh.vertices.length / 3; i++) {
            var vec3Index = i * 3;
            vertexData.push(colladaMesh.vertices[vec3Index]);
            vertexData.push(colladaMesh.vertices[vec3Index + 1]);
            vertexData.push(colladaMesh.vertices[vec3Index + 2]);
            vertexData.push(colladaMesh.normals[vec3Index]);
            vertexData.push(colladaMesh.normals[vec3Index + 1]);
            vertexData.push(colladaMesh.normals[vec3Index + 2]);
            var vec2Index = i * 2;
            vertexData.push(colladaMesh.coords[vec2Index]);
            vertexData.push(colladaMesh.coords[vec2Index + 1]);
        }
        var indexData = [];
        for (var i = 0; i < colladaMesh.triangles.length; i++) {
            indexData.push(colladaMesh.triangles[i]);
        }
        meshes.push({
            name: colladaMesh.name,
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