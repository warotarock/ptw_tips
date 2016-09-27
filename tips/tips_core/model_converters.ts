
namespace Converters {

    export class ModelVertex {
        position: Vec3;
        normal: Vec3;
        texcoord: Vec3;
    }

    export class ModelFace {
        vertexIndeces: List<int>;
        vertexNormals: List<Vec3>;
        vertexUvs: List<Vec2>;
        faceNormal: Vec3;
        materialName: string;
        materialIndex: int;
    }

    export class Model {
        name: string;
        vertices: List<ModelVertex>;
        faces: List<ModelFace>;
    }

    export class ModelConverterHelper {

        modelMeshes: List<Model> = null;

        attach(rawData: any) {
        }
    }

    export class ThreeJSColladaConverterHelper extends ModelConverterHelper {

        collada: any = null;

        attach(threeJSCollada: any) {

            this.collada = threeJSCollada;
            this.modelMeshes = this.parseGeometries();
        }

        private parseGeometries(): List<Model> {

            var geometries = this.collada.dae.geometries;

            var resultList = new List<Model>();
            for (var geometryName in geometries) {
                var geometry = geometries[geometryName];

                var parsedGeometry = this.parseStaticGeometry(geometryName, geometry);

                resultList.push(parsedGeometry);
            }

            return resultList;
        }

        private parseStaticGeometry(geometryName: string, geometry: any): Model {

            var geometry3js = geometry.mesh.geometry3js;

            var vertices = new List<ModelVertex>();
            for (var i = 0; i < geometry3js.vertices.length; i++) {
                var vartexData = geometry3js.vertices[i];

                var vertex: ModelVertex = {
                    position: vec3.fromValues(vartexData.x, vartexData.y, vartexData.z),
                    normal: vec3.fromValues(0.0, 0.0, 0.0),
                    texcoord: vec2.fromValues(0.0, 0.0)
                };

                vertices.push(vertex);
            }

            var faces = new List<ModelFace>();
            for (var i = 0; i < geometry3js.faces.length; i++) {
                var faceData = geometry3js.faces[i];

                var face: ModelFace = {
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
        }
    }
}