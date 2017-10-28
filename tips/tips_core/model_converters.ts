
namespace Converters {

    // Data types

    export class BoneIndexWeight {

        index: int = 0;
        weight: float = 0.0;
    }

    export class MeshVertex {

        position: Vec3 = vec3.create();
        normal: Vec3 = vec3.create();
        texcoords: List<Vec2> = null;
        boneWeights: List<BoneIndexWeight> = null;
    }

    export class MeshFace {

        vertexIndeces: List<int> = null;
        vertexNormals: List<Vec3> = null;
        texcoords: List<List<Vec2>> = null;
        faceNormal: Vec3 = vec3.create();

        materialName: string = null;
        materialIndex: int = null;

        boneCount: int = 0;
        sortingIndeces: List<int> = null;
    }

    export class StaticMeshModel {

        name: string = null;
        vertices: List<MeshVertex> = null;
        faces: List<MeshFace> = null;
    }

    export class SkinVertexPosition {

        boneWeight: float;
        position: Vec3 = vec3.create();
        normal: Vec3 = vec3.create();
    }

    export class SkinVertex {

        positions: List<SkinVertexPosition> = null;
        texcoords: List<Vec2> = null;
    }

    export class SkinMeshPart {

        materialIndex: int = -1;
        boneIndices: List<int> = null;
        vertices: List<SkinVertex> = null;
        faces: List<MeshFace> = null;
    }

    export class SkinMeshBone {

        name: string = null;
        parent: SkinMeshBone = null;
        originalBoneIndex: int = -1;

        nestLevel: int = -1;

        localMatrix: Mat4 = mat4.create();
        worldMatrix: Mat4 = mat4.create();
        worldInvMatrix: Mat4 = mat4.create();
        worldInvNormalMatrix: Mat4 = mat4.create();
    }

    export class PartedSkinMeshModel {

        name: string = null;
        bones: List<SkinMeshBone> = null;
        parts: List<SkinMeshPart> = null;
    }

    class SkinFaceGroup {

        key: string;
        materialIndex: int;
        boneCount: int;
        boneIndices: List<int>;
        faces: List<MeshFace>;
        combined: boolean;
    }

    function padding(index: int): string {

        if (index == -1) {
            return '___';
        }
        else {
            return ('000' + index).slice(-3);
        }
    }

    function getFaceGroupKey(materialIndex: int, indeces: List<int>): string {

        return (
            padding(materialIndex)
            + padding(indeces.length > 0 ? indeces[0] : -1)
            + padding(indeces.length > 1 ? indeces[1] : -1)
            + padding(indeces.length > 2 ? indeces[2] : -1)
            + padding(indeces.length > 3 ? indeces[3] : -1)
        );
    }

    export class SceneData {

        staticMeshModels: List<StaticMeshModel> = null;
        skinMeshModels: List<PartedSkinMeshModel> = null;
    }

    // Converter / Parser

    export class ThreeJSColladaParser {

        private collada: any = null;

        parse(threeJSCollada: any): SceneData {

            this.collada = threeJSCollada;

            let sceneData = new SceneData();

            sceneData.staticMeshModels = this.parseStaticGeometries();
            sceneData.skinMeshModels = this.parseSkinGeometries();

            return sceneData;
        }

        private isSkinGeometry(geometry: any) {

            if (geometry.mesh
                && geometry.mesh.geometry3js
                && geometry.mesh.geometry3js.bones !== undefined) { // due to SkinnedMesh.js of three.js

                return true;
            }
            else {
                return false;
            }
        }

        // Static geometry

        private parseStaticGeometries(): List<StaticMeshModel> {

            var geometries = this.collada.dae.geometries;

            var result = new List<StaticMeshModel>();
            for (var geometryName in geometries) {
                var geometry = geometries[geometryName];

                if (this.isSkinGeometry(geometry)) {
                    continue;
                }

                var parsedGeometry = this.parseStaticGeometry(geometryName, geometry);

                result.push(parsedGeometry);
            }

            return result;
        }

        private parseStaticGeometry(geometryName: string, geometry: any): StaticMeshModel {

            var geometry3js = geometry.mesh.geometry3js;

            // Extract mesh data
            var vertices = this.extractVertices(geometry3js);

            var faces = this.extractFaces(geometry3js);

            this.overwriteVertexUV(faces, vertices);

            var meshSufixIndex = geometryName.lastIndexOf('-mesh');
            var meshName = geometryName.substr(0, meshSufixIndex);

            // Build a static mesh model
            var result = new StaticMeshModel();
            result.name = meshName;
            result.vertices = vertices;
            result.faces = faces;

            return result;
        }

        private extractVertices(geometry3js: any): List<MeshVertex> {

            var vertices = new List<MeshVertex>();
            for (var i = 0; i < geometry3js.vertices.length; i++) {
                var vartexData = geometry3js.vertices[i];

                var vertex = new MeshVertex();
                vec3.set(vertex.position, vartexData.x, vartexData.y, vartexData.z);
                vec3.set(vertex.normal, 0.0, 0.0, 0.0);
                vertex.texcoords = new List<Vec2>();

                vertices.push(vertex);
            }

            return vertices;
        }

        private extractFaces(geometry3js: any): List<MeshFace> {

            var faces = new List<MeshFace>();

            for (var i = 0; i < geometry3js.faces.length; i++) {
                var faceData = geometry3js.faces[i];

                var face = new MeshFace();
                face.vertexIndeces = [
                    faceData.a,
                    faceData.b,
                    faceData.c
                ];
                face.vertexNormals = [
                    vec3.fromValues(faceData.vertexNormals[0].x, faceData.vertexNormals[0].y, faceData.vertexNormals[0].z),
                    vec3.fromValues(faceData.vertexNormals[1].x, faceData.vertexNormals[1].y, faceData.vertexNormals[1].z),
                    vec3.fromValues(faceData.vertexNormals[2].x, faceData.vertexNormals[2].y, faceData.vertexNormals[2].z)
                ];
                face.texcoords = null;
                face.faceNormal = vec3.fromValues(faceData.normal.x, faceData.normal.y, faceData.normal.z);
                face.materialName = faceData.daeMaterial;
                face.materialIndex = faceData.materialIndex;

                faces.push(face);
            }

            if (geometry3js.faceVertexUvs.length > 0) {

                for (var i = 0; i < geometry3js.faces.length; i++) {
                    var face = faces[i];

                    face.texcoords = new List<List<Vec2>>();

                    for (var k = 0; k < geometry3js.faceVertexUvs.length; k++) {
                        var faceVertexUv = geometry3js.faceVertexUvs[k][i];

                        face.texcoords.push([
                            vec2.fromValues(faceVertexUv[0].x, faceVertexUv[0].y),
                            vec2.fromValues(faceVertexUv[1].x, faceVertexUv[1].y),
                            vec2.fromValues(faceVertexUv[2].x, faceVertexUv[2].y)
                        ]);
                    }
                }
            }

            return faces;
        }

        private overwriteVertexUV(faces: List<MeshFace>, vertices: List<MeshVertex>) {

            // overwrite vretex texture coord data by face data (may be conflicted...)
            for (var i = 0; i < faces.length; i++) {
                var face = faces[i];

                for (var faceVertexIndex = 0; faceVertexIndex < face.vertexIndeces.length; faceVertexIndex++) {
                    var vertex = vertices[face.vertexIndeces[faceVertexIndex]];
                    var vertexNormals = face.vertexNormals[faceVertexIndex];

                    vec3.copy(vertex.normal, vertexNormals);

                    if (face.texcoords != null && face.texcoords.length > 0) {
                        for (var uvMapIndex = 0; uvMapIndex < face.texcoords.length; uvMapIndex++) {
                            if (vertex.texcoords.length <= uvMapIndex) {
                                vertex.texcoords.push(vec2.create());
                            }
                            vec3.copy(vertex.texcoords[uvMapIndex], face.texcoords[uvMapIndex][faceVertexIndex]);
                        }
                    }
                }
            }
        }

        // Skin geometry

        private parseSkinGeometries(): List<PartedSkinMeshModel> {

            var geometries = this.collada.dae.geometries;

            var result = new List<PartedSkinMeshModel>();

            for (var geometryName in geometries) {
                var geometry = geometries[geometryName];

                if (!this.isSkinGeometry(geometry)) {
                    continue;
                }

                var parsedGeometry = this.parseSkinGeometry(geometryName, geometry);

                result.push(parsedGeometry);
            }

            return result;
        }

        private parseSkinGeometry(geometryName: string, geometry: any): PartedSkinMeshModel {

            var geometry3js = geometry.mesh.geometry3js;

            // Extract mesh data
            var vertices = this.extractVertices(geometry3js);

            var faces = this.extractFaces(geometry3js);

            this.overwriteVertexUV(faces, vertices);

            var bones = this.extractBones(geometry3js);

            var faceGroups = this.collectFaceGroups(geometry3js, vertices, faces);

            var meshSufixIndex = geometryName.lastIndexOf('-mesh');
            var meshName = geometryName.substr(0, meshSufixIndex);

            // Build a parted skin mesh model
            var skinMeshModel = this.buildPartedSkinMeshModel(faceGroups, vertices, faces, bones);

            skinMeshModel.name = meshName;

            return skinMeshModel;
        }

        private extractBones(geometry3js: any): List<SkinMeshBone> {

            var tempVec3 = vec3.create();

            var result = new List<SkinMeshBone>();

            for (var i = 0; i < geometry3js.bones.length; i++) {
                var bone = geometry3js.bones[i];

                var skiningBone = new SkinMeshBone();
                skiningBone.name = bone.name.replace(/_/g, '.');
                skiningBone.originalBoneIndex = i;
                mat4.copy(skiningBone.localMatrix, bone.matrix.elements);

                mat4.copy(skiningBone.worldMatrix, skiningBone.localMatrix);
                if (typeof (bone.parent) == 'number' && bone.parent != -1) {
                    var parent = result[bone.parent];
                    skiningBone.parent = parent;
                    mat4.multiply(skiningBone.worldMatrix, parent.worldMatrix, skiningBone.worldMatrix);
                }

                mat4.invert(skiningBone.worldInvMatrix, skiningBone.worldMatrix);

                mat4.copy(skiningBone.worldInvNormalMatrix, skiningBone.worldMatrix);
                this.normalizeMat4(skiningBone.worldInvNormalMatrix);
                mat4.invert(skiningBone.worldInvNormalMatrix, skiningBone.worldInvNormalMatrix);

                result.push(skiningBone);
            }

            for (var i = 0; i < result.length; i++) {
                var skiningBone = result[i];

                if (skiningBone.parent == null) {
                    skiningBone.nestLevel = 0;
                }
                else {
                    skiningBone.nestLevel = skiningBone.parent.nestLevel + 1;
                }
            }

            result = Enumerable.From(result)
                .OrderBy(skiningBone => skiningBone.nestLevel)
                .ThenBy(skiningBone => skiningBone.name)
                .ToArray();

            return result;
        }

        private normalizeMat4(mat: Mat4) {

            this.normalizeMat4Part(mat, 0);
            this.normalizeMat4Part(mat, 4);
            this.normalizeMat4Part(mat, 8);
            mat[12] = 0.0;
            mat[13] = 0.0;
            mat[14] = 0.0;
        }

        private normalizeMat4Part(mat: Mat4, offset: int) {

            var length = Math.sqrt(mat[offset + 0] * mat[offset + 0] + mat[offset + 1] * mat[offset + 1] + mat[offset + 2] * mat[offset + 2]);
            if (length > 0) {
                mat[offset + 0] /= length;
                mat[offset + 1] /= length;
                mat[offset + 2] /= length;
            }
        }

        private collectFaceGroups(geometry3js: any, vertices: List<MeshVertex>, faces: List<MeshFace>): List<SkinFaceGroup> {

            if (geometry3js.skinIndices == undefined || geometry3js.skinIndices == null) {
                return null;
            }

            // add weight data to vertex and face data
            for (var i = 0; i < faces.length; i++) {
                var face = faces[i];

                face.sortingIndeces = new List<int>();

                for (var k = 0; k < face.vertexIndeces.length; k++) {

                    var vertexIndex = face.vertexIndeces[k]
                    var vertex = vertices[vertexIndex];
                    var skinIndex = geometry3js.skinIndices[vertexIndex];
                    var skinWeight = geometry3js.skinWeights[vertexIndex];

                    vertex.boneWeights = new List<BoneIndexWeight>();

                    var boneWeight = new BoneIndexWeight();
                    boneWeight.index = skinIndex.x;
                    boneWeight.weight = skinWeight.x;
                    vertex.boneWeights.push(boneWeight);
                    face.sortingIndeces.push(boneWeight.index);

                    if (skinIndex.y > 0) {
                        boneWeight = new BoneIndexWeight();
                        boneWeight.index = skinIndex.y;
                        boneWeight.weight = skinWeight.y;
                        vertex.boneWeights.push(boneWeight);
                        face.sortingIndeces.push(boneWeight.index);
                    }

                    if (skinIndex.z > 0) {
                        boneWeight = new BoneIndexWeight();
                        boneWeight.index = skinIndex.z;
                        boneWeight.weight = skinWeight.z;
                        vertex.boneWeights.push(boneWeight);
                        face.sortingIndeces.push(boneWeight.index);
                    }

                    if (skinIndex.w > 0) {
                        boneWeight = new BoneIndexWeight();
                        boneWeight.index = skinIndex.w;
                        boneWeight.weight = skinWeight.w;
                        vertex.boneWeights.push(boneWeight);
                        face.sortingIndeces.push(boneWeight.index);
                    }
                }

                face.sortingIndeces = Enumerable.From(face.sortingIndeces)
                    .Distinct()
                    .OrderBy()
                    .ToArray();

                face.boneCount = face.sortingIndeces.length;

                if (face.boneCount > 4) {
                    console.log("more than 4 bone count detected.");
                }
            }

            // grouping by bone and material
            var faceGoups: List<SkinFaceGroup> = Enumerable.From(faces)
                .GroupBy(face => getFaceGroupKey(face.materialIndex, face.sortingIndeces))
                .Select(group => ({
                    key: group.Key(),
                    boneCount: group.source[0].boneCount,
                    boneIndices: group.source[0].sortingIndeces,
                    materialIndex: group.source[0].materialIndex,
                    faces: group.source,
                    combined: false
                }))
                .OrderBy(group => group.key)
                .ToArray();

            // compress all one-bone groups
            for (var i = 0; i < faceGoups.length; i++) {
                var group = faceGoups[i];

                if (group.boneCount != 1) {
                    continue;
                }
                else {
                    var compress_to_group: SkinFaceGroup = null;
                    var newBone = false;

                    // search another group wihich same bone have
                    for (var k = 0; k < faceGoups.length; k++) {
                        var toGroup = faceGoups[k];
                        if (k != i && toGroup.materialIndex == group.materialIndex && toGroup.boneCount >= 2) {
                            for (var m = 0; m < toGroup.boneIndices.length; m++) {
                                if (toGroup.boneIndices[m] == group.boneIndices[0]) {
                                    compress_to_group = toGroup;
                                    break;
                                }
                            }
                        }
                    }

                    // search another one bone group
                    // or search three bone group
                    if (compress_to_group == null) {
                        for (var k = 0; k < faceGoups.length; k++) {
                            var toGroup = faceGoups[k];
                            if (k != i && toGroup.materialIndex == group.materialIndex && toGroup.boneCount == 1) {
                                compress_to_group = toGroup;
                                newBone = true;
                                break;
                            }
                        }
                    }
                    if (compress_to_group == null) {
                        for (var k = 0; k < faceGoups.length; k++) {
                            var toGroup = faceGoups[k];
                            if (k != i && toGroup.materialIndex == group.materialIndex && toGroup.boneCount == 3) {
                                compress_to_group = toGroup;
                                newBone = true;
                                break;
                            }
                        }
                    }

                    if (compress_to_group != null) {

                        if (newBone) {
                            compress_to_group.boneIndices.push(group.boneIndices[0]);
                            compress_to_group.boneCount++;
                        }

                        compress_to_group.key = getFaceGroupKey(compress_to_group.materialIndex, compress_to_group.boneIndices);

                        // combine mesh
                        compress_to_group.faces = compress_to_group.faces.concat(group.faces);

                        group.combined = true;
                    }
                }
            }

            // adjust boneIndices array size
            for (var i = 0; i < faceGoups.length; i++) {
                var group = faceGoups[i];
                if (group.boneIndices.length == 1 || group.boneIndices.length == 3) {
                    group.boneIndices.push(-1);
                }
            }

            // filter and ordering
            faceGoups = Enumerable.From(faceGoups)
                .Where(group => !group.combined)
                .OrderBy(group => group.key)
                .ToArray();

            return faceGoups;
        }

        private buildPartedSkinMeshModel(faceGoups: List<SkinFaceGroup>, vertices: List<MeshVertex>, faces: List<MeshFace>, bones: List<SkinMeshBone>): PartedSkinMeshModel {

            var vertexIndexTable = new Array(vertices.length);

            // create a part data for each groups
            var parts = new List<SkinMeshPart>();
            for (var i = 0; i < faceGoups.length; i++) {
                var group = faceGoups[i];

                // assign new vertex index in the part
                var new_vertex_count = 0;
                for (var k = 0; k < vertexIndexTable.length; k++) {
                    vertexIndexTable[k] = -1;
                }

                for (var k = 0; k < group.faces.length; k++) {
                    var face: MeshFace = group.faces[k];

                    for (var m = 0; m < face.vertexIndeces.length; m++) {
                        var vertexIndex = face.vertexIndeces[m];

                        if (vertexIndexTable[vertexIndex] == -1) {
                            vertexIndexTable[vertexIndex] = new_vertex_count;
                            new_vertex_count++;
                        }
                    }
                }

                // create vertices
                var part_vertices = new List<SkinVertex>(new_vertex_count);
                for (var k = 0; k < vertexIndexTable.length; k++) {

                    if (vertexIndexTable[k] != -1) {

                        var src_vertex = vertices[k];

                        var skinVertex = new SkinVertex();
                        skinVertex.texcoords = src_vertex.texcoords;

                        skinVertex.positions = new List<SkinVertexPosition>();
                        for (var m = 0; m < group.boneIndices.length; m++) {
                            var boneIndex = group.boneIndices[m];

                            if (boneIndex == -1) {
                                continue;
                            }

                            var vpos = new SkinVertexPosition();
                            vec3.copy(vpos.position, src_vertex.position);
                            vec3.copy(vpos.normal, src_vertex.normal);
                            vpos.boneWeight = 0.0;
                            for (var n = 0; n < src_vertex.boneWeights.length; n++) {
                                if (src_vertex.boneWeights[n].index == boneIndex) {
                                    vpos.boneWeight = src_vertex.boneWeights[n].weight;
                                    break;
                                }
                            }

                            skinVertex.positions.push(vpos);
                        }

                        part_vertices[vertexIndexTable[k]] = skinVertex;
                    }
                }

                // create faces
                var part_faces = new List<MeshFace>();
                for (var k = 0; k < group.faces.length; k++) {
                    var face: MeshFace = group.faces[k];

                    var skinFace = new MeshFace();
                    skinFace.vertexIndeces = Enumerable.From(face.vertexIndeces)
                        .Select(index => vertexIndexTable[index])
                        .ToArray();
                    skinFace.vertexNormals = face.vertexNormals;
                    skinFace.texcoords = face.texcoords;
                    vec3.copy(skinFace.faceNormal, face.faceNormal);
                    skinFace.materialName = face.materialName;
                    skinFace.materialIndex = face.materialIndex;

                    part_faces.push(skinFace);
                }

                // create part
                var part = new SkinMeshPart();
                part.boneIndices = group.boneIndices;
                part.materialIndex = group.materialIndex;
                part.vertices = part_vertices;
                part.faces = part_faces;

                parts.push(part);
            }

            // replace bone index to re-ordered one
            var boneIndexTable = [];
            for (var i = 0; i < bones.length; i++) {

                boneIndexTable[bones[i].originalBoneIndex] = i;
            }

            for (var i = 0; i < parts.length; i++) {
                var part = parts[i];

                for (var k = 0; k < part.boneIndices.length; k++) {
                    if (part.boneIndices[k] != -1) {
                        part.boneIndices[k] = boneIndexTable[part.boneIndices[k]];
                    }
                }
            }

            // transform vertex positions into bone local
            for (var i = 0; i < parts.length; i++) {
                var part = parts[i];

                for (var k = 0; k < part.vertices.length; k++) {
                    var vertex = part.vertices[k];

                    for (var m = 0; m < vertex.positions.length; m++) {
                        var vpos = vertex.positions[m];
                        var boneIndex = part.boneIndices[m];
                        var bone = bones[boneIndex];

                        vec3.transformMat4(vpos.position, vpos.position, bone.worldInvMatrix);

                        vec3.transformMat4(vpos.normal, vpos.normal, bone.worldInvNormalMatrix);
                        vec3.normalize(vpos.normal, vpos.normal);
                    }
                }
            }

            // create a model
            var result = new PartedSkinMeshModel();
            result.bones = bones;
            result.parts = parts;

            return result;
        }
    }
}