var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Converters;
(function (Converters) {
    var ModelVertex = (function () {
        function ModelVertex() {
        }
        return ModelVertex;
    }());
    Converters.ModelVertex = ModelVertex;
    var ModelFace = (function () {
        function ModelFace() {
        }
        return ModelFace;
    }());
    Converters.ModelFace = ModelFace;
    var Model = (function () {
        function Model() {
        }
        return Model;
    }());
    Converters.Model = Model;
    var ModelConverterHelper = (function () {
        function ModelConverterHelper() {
            this.modelMeshes = null;
        }
        ModelConverterHelper.prototype.attach = function (rawData) {
        };
        return ModelConverterHelper;
    }());
    Converters.ModelConverterHelper = ModelConverterHelper;
    var ThreeJSColladaConverterHelper = (function (_super) {
        __extends(ThreeJSColladaConverterHelper, _super);
        function ThreeJSColladaConverterHelper() {
            _super.apply(this, arguments);
            this.collada = null;
        }
        ThreeJSColladaConverterHelper.prototype.attach = function (threeJSCollada) {
            this.collada = threeJSCollada;
            this.modelMeshes = this.parseGeometries();
        };
        ThreeJSColladaConverterHelper.prototype.parseGeometries = function () {
            var geometries = this.collada.dae.geometries;
            var resultList = new List();
            for (var geometryName in geometries) {
                var geometry = geometries[geometryName];
                var parsedGeometry = this.parseStaticGeometry(geometryName, geometry);
                resultList.push(parsedGeometry);
            }
            return resultList;
        };
        ThreeJSColladaConverterHelper.prototype.parseStaticGeometry = function (geometryName, geometry) {
            var geometry3js = geometry.mesh.geometry3js;
            var vertices = new List();
            for (var i = 0; i < geometry3js.vertices.length; i++) {
                var vartexData = geometry3js.vertices[i];
                var vertex = {
                    position: vec3.fromValues(vartexData.x, vartexData.y, vartexData.z),
                    normal: vec3.fromValues(0.0, 0.0, 0.0),
                    texcoord: vec2.fromValues(0.0, 0.0)
                };
                vertices.push(vertex);
            }
            var faces = new List();
            for (var i = 0; i < geometry3js.faces.length; i++) {
                var faceData = geometry3js.faces[i];
                var face = {
                    vertexIndeces: [faceData.a, faceData.b, faceData.c],
                    vertexNormals: [
                        vec3.fromValues(faceData.vertexNormals[0].x, faceData.vertexNormals[0].y, faceData.vertexNormals[0].z),
                        vec3.fromValues(faceData.vertexNormals[1].x, faceData.vertexNormals[1].y, faceData.vertexNormals[1].z),
                        vec3.fromValues(faceData.vertexNormals[2].x, faceData.vertexNormals[2].y, faceData.vertexNormals[2].z)
                    ],
                    vertexUvs: null,
                    faceNormal: vec3.fromValues(faceData.normal.x, faceData.normal.y, faceData.normal.z),
                    materialName: faceData.daeMaterial,
                    materialIndex: faceData.materialIndex
                };
                faces.push(face);
            }
            for (var i = 0; i < geometry3js.faceVertexUvs.length; i++) {
                var faceVertexUv = geometry3js.faceVertexUvs[0][i];
                var face = faces[i];
                face.vertexUvs = [
                    vec2.fromValues(faceVertexUv[0].x, faceVertexUv[0].y),
                    vec2.fromValues(faceVertexUv[1].x, faceVertexUv[1].y),
                    vec2.fromValues(faceVertexUv[2].x, faceVertexUv[2].y)
                ];
            }
            // overwrite vretex data by face data (may be conflicted...)
            for (var i = 0; i < faces.length; i++) {
                var face = faces[i];
                for (var k = 0; k < face.vertexIndeces.length; k++) {
                    var vertex = vertices[face.vertexIndeces[k]];
                    var vertexNormals = face.vertexNormals[k];
                    vec3.copy(vertex.normal, vertexNormals);
                    if (face.vertexUvs != null) {
                        vec2.copy(vertex.texcoord, face.vertexUvs[k]);
                    }
                }
            }
            return {
                name: geometryName,
                vertices: vertices,
                faces: faces
            };
        };
        return ThreeJSColladaConverterHelper;
    }(ModelConverterHelper));
    Converters.ThreeJSColladaConverterHelper = ThreeJSColladaConverterHelper;
})(Converters || (Converters = {}));
//# sourceMappingURL=model_converters.js.map