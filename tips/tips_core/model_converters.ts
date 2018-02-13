
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
        boneIndex: int = -1;
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

            let geometries = this.collada.dae.geometries;

            let result = new List<StaticMeshModel>();

            for (let geometryName in geometries) {
                let geometry = geometries[geometryName];

                if (this.isSkinGeometry(geometry)) {
                    continue;
                }

                let parsedGeometry = this.parseStaticGeometry(geometryName, geometry);

                result.push(parsedGeometry);
            }

            return result;
        }

        private parseStaticGeometry(geometryName: string, geometry: any): StaticMeshModel {

            let geometry3js = geometry.mesh.geometry3js;

            // Extract mesh data
            let vertices = this.extractVertices(geometry3js);

            let faces = this.extractFaces(geometry3js);

            this.overwriteVertexUV(faces, vertices);

            let meshSufixIndex = geometryName.lastIndexOf('-mesh');
            let meshName = geometryName.substr(0, meshSufixIndex);

            // Build a static mesh model
            let result = new StaticMeshModel();
            result.name = meshName;
            result.vertices = vertices;
            result.faces = faces;

            return result;
        }

        private extractVertices(geometry3js: any): List<MeshVertex> {

            let vertices = new List<MeshVertex>();
            for (let vartexData of geometry3js.vertices) {

                let vertex = new MeshVertex();
                vec3.set(vertex.position, vartexData.x, vartexData.y, vartexData.z);
                vec3.set(vertex.normal, 0.0, 0.0, 0.0);
                vertex.texcoords = new List<Vec2>();

                vertices.push(vertex);
            }

            return vertices;
        }

        private extractFaces(geometry3js: any): List<MeshFace> {

            let faces = new List<MeshFace>();

            for (let faceData of geometry3js.faces) {

                let face = new MeshFace();
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

                for (let faceIndex = 0; faceIndex < geometry3js.faces.length; faceIndex++) {
                    let face = faces[faceIndex];

                    face.texcoords = new List<List<Vec2>>();

                    for (let uvLayerIndex = 0; uvLayerIndex < geometry3js.faceVertexUvs.length; uvLayerIndex++) {
                        let faceVertexUv = geometry3js.faceVertexUvs[uvLayerIndex][faceIndex];

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
            for (let face of faces) {

                for (let faceVertexIndex = 0; faceVertexIndex < face.vertexIndeces.length; faceVertexIndex++) {

                    let vertex = vertices[face.vertexIndeces[faceVertexIndex]];
                    let vertexNormals = face.vertexNormals[faceVertexIndex];

                    vec3.copy(vertex.normal, vertexNormals);

                    if (face.texcoords != null && face.texcoords.length > 0) {

                        for (let uvMapIndex = 0; uvMapIndex < face.texcoords.length; uvMapIndex++) {

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

            let geometries = this.collada.dae.geometries;

            let result = new List<PartedSkinMeshModel>();

            for (let geometryName in geometries) {
                let geometry = geometries[geometryName];

                if (!this.isSkinGeometry(geometry)) {
                    continue;
                }

                let parsedGeometry = this.parseSkinGeometry(geometryName, geometry);

                result.push(parsedGeometry);
            }

            return result;
        }

        private parseSkinGeometry(geometryName: string, geometry: any): PartedSkinMeshModel {

            let geometry3js = geometry.mesh.geometry3js;

            // Extract mesh data
            let vertices = this.extractVertices(geometry3js);

            let faces = this.extractFaces(geometry3js);

            this.overwriteVertexUV(faces, vertices);

            let bones = this.extractBones(geometry3js);

            let faceGroups = this.collectFaceGroups(geometry3js, vertices, faces);

            let meshSufixIndex = geometryName.lastIndexOf('-mesh');
            let meshName = geometryName.substr(0, meshSufixIndex);

            // Build a parted skin mesh model
            let skinMeshModel = this.buildPartedSkinMeshModel(faceGroups, vertices, faces, bones);

            skinMeshModel.name = meshName;

            return skinMeshModel;
        }

        private extractBones(geometry3js: any): List<SkinMeshBone> {

            let tempVec3 = vec3.create();

            let result = new List<SkinMeshBone>();

            for (let boneIndex = 0; boneIndex < geometry3js.bones.length; boneIndex++) {
                let bone = geometry3js.bones[boneIndex];

                let skiningBone = new SkinMeshBone();
                skiningBone.name = bone.name.replace(/_/g, '.');
                skiningBone.originalBoneIndex = boneIndex;
                mat4.copy(skiningBone.localMatrix, bone.matrix.elements);

                mat4.copy(skiningBone.worldMatrix, skiningBone.localMatrix);
                if (typeof (bone.parent) == 'number' && bone.parent != -1) {
                    let parent = result[bone.parent];
                    skiningBone.parent = parent;
                    mat4.multiply(skiningBone.worldMatrix, parent.worldMatrix, skiningBone.worldMatrix);
                }

                mat4.invert(skiningBone.worldInvMatrix, skiningBone.worldMatrix);

                mat4.copy(skiningBone.worldInvNormalMatrix, skiningBone.worldMatrix);
                this.normalizeMat4(skiningBone.worldInvNormalMatrix);
                mat4.invert(skiningBone.worldInvNormalMatrix, skiningBone.worldInvNormalMatrix);

                result.push(skiningBone);
            }

            for (let skiningBone of result) {

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

            for (let boneIndex = 0; boneIndex < result.length; boneIndex++) {
                let skiningBone = result[boneIndex];

                skiningBone.boneIndex = boneIndex;
            }

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

            let length = Math.sqrt(mat[offset + 0] * mat[offset + 0] + mat[offset + 1] * mat[offset + 1] + mat[offset + 2] * mat[offset + 2]);

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

            // Adds weight data to vertex and face data
            for (let face of faces) {

                face.sortingIndeces = new List<int>();

                for (let vertexIndex of face.vertexIndeces) {

                    let vertex = vertices[vertexIndex];
                    let skinIndex = geometry3js.skinIndices[vertexIndex];
                    let skinWeight = geometry3js.skinWeights[vertexIndex];

                    vertex.boneWeights = new List<BoneIndexWeight>();

                    let boneWeight = new BoneIndexWeight();
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
                    console.log('more than 4 bone count detected.');
                }
            }

            // Grouping by bone and material
            let faceGoups: List<SkinFaceGroup> = Enumerable.From(faces)
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

            // Combine all groups witch has only 1 bone to another group
            for (let sourceGroupIndex = 0; sourceGroupIndex < faceGoups.length; sourceGroupIndex++) {
                let sourceGroup = faceGoups[sourceGroupIndex];

                if (sourceGroup.boneCount != 1) {
                    continue;
                }
                else {

                    let combineTo_Group: SkinFaceGroup = null;
                    let ndeedsNewBoneSlot = false;

                    // Search another group wihich has same bone combination
                    for (let candidate_GroupIndex = 0; candidate_GroupIndex < faceGoups.length; candidate_GroupIndex++) {
                        let candidate_Group = faceGoups[candidate_GroupIndex];

                        if (candidate_GroupIndex != sourceGroupIndex && candidate_Group.materialIndex == sourceGroup.materialIndex && candidate_Group.boneCount >= 2) {

                            for (let boneSlotIndex = 0; boneSlotIndex < candidate_Group.boneIndices.length; boneSlotIndex++) {

                                if (candidate_Group.boneIndices[boneSlotIndex] == sourceGroup.boneIndices[0]) {
                                    combineTo_Group = candidate_Group;
                                    break;
                                }
                            }
                        }
                    }

                    // Search another one bone group
                    // or search three bone group
                    if (combineTo_Group == null) {

                        for (let candidate_GroupIndex = 0; candidate_GroupIndex < faceGoups.length; candidate_GroupIndex++) {
                            let candidate_Group = faceGoups[candidate_GroupIndex];

                            if (candidate_GroupIndex != sourceGroupIndex
                                && !candidate_Group.combined
                                && candidate_Group.materialIndex == sourceGroup.materialIndex
                                && candidate_Group.boneCount == 1) {

                                combineTo_Group = candidate_Group;
                                ndeedsNewBoneSlot = true;
                                break;
                            }
                        }
                    }

                    if (combineTo_Group == null) {

                        for (let candidate_GroupIndex = 0; candidate_GroupIndex < faceGoups.length; candidate_GroupIndex++) {
                            let candidate_Group = faceGoups[candidate_GroupIndex];

                            if (candidate_GroupIndex != sourceGroupIndex
                                && !candidate_Group.combined
                                && candidate_Group.materialIndex == sourceGroup.materialIndex
                                && candidate_Group.boneCount == 3) {

                                combineTo_Group = candidate_Group;
                                ndeedsNewBoneSlot = true;
                                break;
                            }
                        }
                    }

                    if (combineTo_Group != null) {

                        if (ndeedsNewBoneSlot) {

                            combineTo_Group.boneIndices.push(sourceGroup.boneIndices[0]);
                            combineTo_Group.boneCount++;
                        }

                        combineTo_Group.key = getFaceGroupKey(combineTo_Group.materialIndex, combineTo_Group.boneIndices);

                        // combine mesh
                        combineTo_Group.faces = combineTo_Group.faces.concat(sourceGroup.faces);

                        sourceGroup.combined = true;
                    }
                }
            }

            // Filter and ordering
            faceGoups = Enumerable.From(faceGoups)
                .Where(group => !group.combined)
                .OrderBy(group => group.key)
                .ToArray();

            return faceGoups;
        }

        private buildPartedSkinMeshModel(faceGoups: List<SkinFaceGroup>, vertices: List<MeshVertex>, faces: List<MeshFace>, bones: List<SkinMeshBone>): PartedSkinMeshModel {

            // Creates vertex index table
            let vertexIndexTable = new Array(vertices.length);

            // Create bone index table to replace bone index to re-ordered one
            let boneIndexTable = new List<int>(bones.length);
            for (let i = 0; i < bones.length; i++) {
                let bone = bones[i];

                boneIndexTable[bone.originalBoneIndex] = i;
            }

            // Creates a part data for each groups
            let parts = new List<SkinMeshPart>();
            for (let group of faceGoups) {

                // Assigns new index for face's vertex
                let new_vertex_count = 0;
                for (let i = 0; i < vertexIndexTable.length; i++) {
                    vertexIndexTable[i] = -1;
                }

                for (let face of group.faces) {

                    for (let vertexIndex of face.vertexIndeces) {

                        if (vertexIndexTable[vertexIndex] == -1) {
                            vertexIndexTable[vertexIndex] = new_vertex_count;
                            new_vertex_count++;
                        }
                    }
                }

                // Creates vertices
                let part_vertices = new List<SkinVertex>(new_vertex_count);
                for (let oldVertexIndex = 0; oldVertexIndex < vertexIndexTable.length; oldVertexIndex++) {

                    let newVertexIndex = vertexIndexTable[oldVertexIndex];

                    if (newVertexIndex != -1) {

                        let src_vertex = vertices[oldVertexIndex];

                        let skinVertex = new SkinVertex();
                        skinVertex.texcoords = src_vertex.texcoords;

                        skinVertex.positions = new List<SkinVertexPosition>();
                        for (let boneIndex of group.boneIndices) {

                            let vpos = new SkinVertexPosition();
                            vec3.copy(vpos.position, src_vertex.position);
                            vec3.copy(vpos.normal, src_vertex.normal);
                            vpos.boneWeight = 0.0;

                            for (let boneWeight of src_vertex.boneWeights) {

                                if (boneWeight.index == boneIndex) {

                                    vpos.boneWeight = boneWeight.weight;
                                    break;
                                }
                            }

                            skinVertex.positions.push(vpos);
                        }

                        part_vertices[newVertexIndex] = skinVertex;
                    }
                }

                // Creates faces
                let part_faces = new List<MeshFace>();
                for (let face of group.faces) {

                    let vertexIndeces = Enumerable.From(face.vertexIndeces)
                        .Select(index => vertexIndexTable[index])
                        .ToArray();

                    let skinFace = new MeshFace();
                    skinFace.vertexIndeces = vertexIndeces;
                    skinFace.vertexNormals = face.vertexNormals;
                    skinFace.texcoords = face.texcoords;
                    vec3.copy(skinFace.faceNormal, face.faceNormal);
                    skinFace.materialName = face.materialName;
                    skinFace.materialIndex = face.materialIndex;

                    part_faces.push(skinFace);
                }

                // Creates bone indices
                let part_boneIndices = new List<int>();
                for (let oldBoneIndex of group.boneIndices) {

                    let newBoneIndex = boneIndexTable[oldBoneIndex];

                    part_boneIndices.push(newBoneIndex);
                }

                // Creates part
                let part = new SkinMeshPart();
                part.boneIndices = part_boneIndices;
                part.materialIndex = group.materialIndex;
                part.vertices = part_vertices;
                part.faces = part_faces;

                parts.push(part);
            }

            // Transforms vertex positions into bone local
            for (let part of parts) {

                for (let vertex of part.vertices) {

                    for (let vertexIndex = 0; vertexIndex < vertex.positions.length; vertexIndex++) {
                        let vpos = vertex.positions[vertexIndex];
                        let boneIndex = part.boneIndices[vertexIndex];

                        let bone = bones[boneIndex];

                        vec3.transformMat4(vpos.position, vpos.position, bone.worldInvMatrix);

                        vec3.transformMat4(vpos.normal, vpos.normal, bone.worldInvNormalMatrix);
                        vec3.normalize(vpos.normal, vpos.normal);
                    }
                }
            }

            // Creates a model
            let result = new PartedSkinMeshModel();
            result.bones = bones;
            result.parts = parts;

            return result;
        }
    }
}