var Converters;
(function (Converters) {
    // Data types
    var BoneIndexWeight = (function () {
        function BoneIndexWeight() {
            this.index = 0;
            this.weight = 0.0;
        }
        return BoneIndexWeight;
    }());
    Converters.BoneIndexWeight = BoneIndexWeight;
    var MeshVertex = (function () {
        function MeshVertex() {
            this.position = vec3.create();
            this.normal = vec3.create();
            this.texcoords = null;
            this.boneWeights = null;
        }
        return MeshVertex;
    }());
    Converters.MeshVertex = MeshVertex;
    var MeshFace = (function () {
        function MeshFace() {
            this.vertexIndeces = null;
            this.vertexNormals = null;
            this.texcoords = null;
            this.faceNormal = vec3.create();
            this.materialName = null;
            this.materialIndex = null;
            this.boneCount = 0;
            this.sortingIndeces = null;
        }
        return MeshFace;
    }());
    Converters.MeshFace = MeshFace;
    var StaticMeshModel = (function () {
        function StaticMeshModel() {
            this.name = null;
            this.vertices = null;
            this.faces = null;
        }
        return StaticMeshModel;
    }());
    Converters.StaticMeshModel = StaticMeshModel;
    var SkinVertexPosition = (function () {
        function SkinVertexPosition() {
            this.position = vec3.create();
            this.normal = vec3.create();
        }
        return SkinVertexPosition;
    }());
    Converters.SkinVertexPosition = SkinVertexPosition;
    var SkinVertex = (function () {
        function SkinVertex() {
            this.positions = null;
            this.texcoords = null;
        }
        return SkinVertex;
    }());
    Converters.SkinVertex = SkinVertex;
    var SkinMeshPart = (function () {
        function SkinMeshPart() {
            this.materialIndex = -1;
            this.boneIndices = null;
            this.vertices = null;
            this.faces = null;
        }
        return SkinMeshPart;
    }());
    Converters.SkinMeshPart = SkinMeshPart;
    var SkinMeshBone = (function () {
        function SkinMeshBone() {
            this.name = null;
            this.parent = null;
            this.originalBoneIndex = -1;
            this.nestLevel = -1;
            this.localMatrix = mat4.create();
            this.worldMatrix = mat4.create();
            this.worldInvMatrix = mat4.create();
            this.worldInvNormalMatrix = mat4.create();
        }
        return SkinMeshBone;
    }());
    Converters.SkinMeshBone = SkinMeshBone;
    var PartedSkinMeshModel = (function () {
        function PartedSkinMeshModel() {
            this.name = null;
            this.bones = null;
            this.parts = null;
        }
        return PartedSkinMeshModel;
    }());
    Converters.PartedSkinMeshModel = PartedSkinMeshModel;
    var SkinFaceGroup = (function () {
        function SkinFaceGroup() {
        }
        return SkinFaceGroup;
    }());
    function padding(index) {
        if (index == -1) {
            return '___';
        }
        else {
            return ('000' + index).slice(-3);
        }
    }
    function getFaceGroupKey(materialIndex, indeces) {
        return (padding(materialIndex)
            + padding(indeces.length > 0 ? indeces[0] : -1)
            + padding(indeces.length > 1 ? indeces[1] : -1)
            + padding(indeces.length > 2 ? indeces[2] : -1)
            + padding(indeces.length > 3 ? indeces[3] : -1));
    }
    var SceneData = (function () {
        function SceneData() {
            this.staticMeshModels = null;
            this.skinMeshModels = null;
        }
        return SceneData;
    }());
    Converters.SceneData = SceneData;
    // Converter / Parser
    var ThreeJSColladaParser = (function () {
        function ThreeJSColladaParser() {
            this.collada = null;
        }
        ThreeJSColladaParser.prototype.parse = function (threeJSCollada) {
            this.collada = threeJSCollada;
            var sceneData = new SceneData();
            sceneData.staticMeshModels = this.parseStaticGeometries();
            sceneData.skinMeshModels = this.parseSkinGeometries();
            return sceneData;
        };
        ThreeJSColladaParser.prototype.isSkinGeometry = function (geometry) {
            if (geometry.mesh
                && geometry.mesh.geometry3js
                && geometry.mesh.geometry3js.bones !== undefined) {
                return true;
            }
            else {
                return false;
            }
        };
        // Static geometry
        ThreeJSColladaParser.prototype.parseStaticGeometries = function () {
            var geometries = this.collada.dae.geometries;
            var result = new List();
            for (var geometryName in geometries) {
                var geometry = geometries[geometryName];
                if (this.isSkinGeometry(geometry)) {
                    continue;
                }
                var parsedGeometry = this.parseStaticGeometry(geometryName, geometry);
                result.push(parsedGeometry);
            }
            return result;
        };
        ThreeJSColladaParser.prototype.parseStaticGeometry = function (geometryName, geometry) {
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
        };
        ThreeJSColladaParser.prototype.extractVertices = function (geometry3js) {
            var vertices = new List();
            for (var _i = 0, _a = geometry3js.vertices; _i < _a.length; _i++) {
                var vartexData = _a[_i];
                var vertex = new MeshVertex();
                vec3.set(vertex.position, vartexData.x, vartexData.y, vartexData.z);
                vec3.set(vertex.normal, 0.0, 0.0, 0.0);
                vertex.texcoords = new List();
                vertices.push(vertex);
            }
            return vertices;
        };
        ThreeJSColladaParser.prototype.extractFaces = function (geometry3js) {
            var faces = new List();
            for (var _i = 0, _a = geometry3js.faces; _i < _a.length; _i++) {
                var faceData = _a[_i];
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
                for (var faceIndex = 0; faceIndex < geometry3js.faces.length; faceIndex++) {
                    var face = faces[faceIndex];
                    face.texcoords = new List();
                    for (var uvLayerIndex = 0; uvLayerIndex < geometry3js.faceVertexUvs.length; uvLayerIndex++) {
                        var faceVertexUv = geometry3js.faceVertexUvs[uvLayerIndex][faceIndex];
                        face.texcoords.push([
                            vec2.fromValues(faceVertexUv[0].x, faceVertexUv[0].y),
                            vec2.fromValues(faceVertexUv[1].x, faceVertexUv[1].y),
                            vec2.fromValues(faceVertexUv[2].x, faceVertexUv[2].y)
                        ]);
                    }
                }
            }
            return faces;
        };
        ThreeJSColladaParser.prototype.overwriteVertexUV = function (faces, vertices) {
            // overwrite vretex texture coord data by face data (may be conflicted...)
            for (var _i = 0, faces_1 = faces; _i < faces_1.length; _i++) {
                var face = faces_1[_i];
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
        };
        // Skin geometry
        ThreeJSColladaParser.prototype.parseSkinGeometries = function () {
            var geometries = this.collada.dae.geometries;
            var result = new List();
            for (var geometryName in geometries) {
                var geometry = geometries[geometryName];
                if (!this.isSkinGeometry(geometry)) {
                    continue;
                }
                var parsedGeometry = this.parseSkinGeometry(geometryName, geometry);
                result.push(parsedGeometry);
            }
            return result;
        };
        ThreeJSColladaParser.prototype.parseSkinGeometry = function (geometryName, geometry) {
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
        };
        ThreeJSColladaParser.prototype.extractBones = function (geometry3js) {
            var tempVec3 = vec3.create();
            var result = new List();
            for (var boneIndex = 0; boneIndex < geometry3js.bones.length; boneIndex++) {
                var bone = geometry3js.bones[boneIndex];
                var skiningBone = new SkinMeshBone();
                skiningBone.name = bone.name.replace(/_/g, '.');
                skiningBone.originalBoneIndex = boneIndex;
                mat4.copy(skiningBone.localMatrix, bone.matrix.elements);
                mat4.copy(skiningBone.worldMatrix, skiningBone.localMatrix);
                if (typeof (bone.parent) == 'number' && bone.parent != -1) {
                    var parent_1 = result[bone.parent];
                    skiningBone.parent = parent_1;
                    mat4.multiply(skiningBone.worldMatrix, parent_1.worldMatrix, skiningBone.worldMatrix);
                }
                mat4.invert(skiningBone.worldInvMatrix, skiningBone.worldMatrix);
                mat4.copy(skiningBone.worldInvNormalMatrix, skiningBone.worldMatrix);
                this.normalizeMat4(skiningBone.worldInvNormalMatrix);
                mat4.invert(skiningBone.worldInvNormalMatrix, skiningBone.worldInvNormalMatrix);
                result.push(skiningBone);
            }
            for (var _i = 0, result_1 = result; _i < result_1.length; _i++) {
                var skiningBone = result_1[_i];
                if (skiningBone.parent == null) {
                    skiningBone.nestLevel = 0;
                }
                else {
                    skiningBone.nestLevel = skiningBone.parent.nestLevel + 1;
                }
            }
            result = Enumerable.From(result)
                .OrderBy(function (skiningBone) { return skiningBone.nestLevel; })
                .ThenBy(function (skiningBone) { return skiningBone.name; })
                .ToArray();
            return result;
        };
        ThreeJSColladaParser.prototype.normalizeMat4 = function (mat) {
            this.normalizeMat4Part(mat, 0);
            this.normalizeMat4Part(mat, 4);
            this.normalizeMat4Part(mat, 8);
            mat[12] = 0.0;
            mat[13] = 0.0;
            mat[14] = 0.0;
        };
        ThreeJSColladaParser.prototype.normalizeMat4Part = function (mat, offset) {
            var length = Math.sqrt(mat[offset + 0] * mat[offset + 0] + mat[offset + 1] * mat[offset + 1] + mat[offset + 2] * mat[offset + 2]);
            if (length > 0) {
                mat[offset + 0] /= length;
                mat[offset + 1] /= length;
                mat[offset + 2] /= length;
            }
        };
        ThreeJSColladaParser.prototype.collectFaceGroups = function (geometry3js, vertices, faces) {
            if (geometry3js.skinIndices == undefined || geometry3js.skinIndices == null) {
                return null;
            }
            // Adds weight data to vertex and face data
            for (var _i = 0, faces_2 = faces; _i < faces_2.length; _i++) {
                var face = faces_2[_i];
                face.sortingIndeces = new List();
                for (var _a = 0, _b = face.vertexIndeces; _a < _b.length; _a++) {
                    var vertexIndex = _b[_a];
                    var vertex = vertices[vertexIndex];
                    var skinIndex = geometry3js.skinIndices[vertexIndex];
                    var skinWeight = geometry3js.skinWeights[vertexIndex];
                    vertex.boneWeights = new List();
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
                    console.log('more than 4 bone count detected.');
                }
            }
            // Grouping by bone and material
            var faceGoups = Enumerable.From(faces)
                .GroupBy(function (face) { return getFaceGroupKey(face.materialIndex, face.sortingIndeces); })
                .Select(function (group) { return ({
                key: group.Key(),
                boneCount: group.source[0].boneCount,
                boneIndices: group.source[0].sortingIndeces,
                materialIndex: group.source[0].materialIndex,
                faces: group.source,
                combined: false
            }); })
                .OrderBy(function (group) { return group.key; })
                .ToArray();
            // Combine all groups witch has only 1 bone to another group
            for (var sourceGroupIndex = 0; sourceGroupIndex < faceGoups.length; sourceGroupIndex++) {
                var sourceGroup = faceGoups[sourceGroupIndex];
                if (sourceGroup.boneCount != 1) {
                    continue;
                }
                else {
                    var combineTo_Group = null;
                    var ndeedsNewBoneSlot = false;
                    // Search another group wihich has same bone combination
                    for (var candidate_GroupIndex = 0; candidate_GroupIndex < faceGoups.length; candidate_GroupIndex++) {
                        var candidate_Group = faceGoups[candidate_GroupIndex];
                        if (candidate_GroupIndex != sourceGroupIndex && candidate_Group.materialIndex == sourceGroup.materialIndex && candidate_Group.boneCount >= 2) {
                            for (var boneSlotIndex = 0; boneSlotIndex < candidate_Group.boneIndices.length; boneSlotIndex++) {
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
                        for (var candidate_GroupIndex = 0; candidate_GroupIndex < faceGoups.length; candidate_GroupIndex++) {
                            var candidate_Group = faceGoups[candidate_GroupIndex];
                            if (candidate_GroupIndex != sourceGroupIndex && candidate_Group.materialIndex == sourceGroup.materialIndex && candidate_Group.boneCount == 1) {
                                combineTo_Group = candidate_Group;
                                ndeedsNewBoneSlot = true;
                                break;
                            }
                        }
                    }
                    if (combineTo_Group == null) {
                        for (var candidate_GroupIndex = 0; candidate_GroupIndex < faceGoups.length; candidate_GroupIndex++) {
                            var candidate_Group = faceGoups[candidate_GroupIndex];
                            if (candidate_GroupIndex != sourceGroupIndex && candidate_Group.materialIndex == sourceGroup.materialIndex && candidate_Group.boneCount == 3) {
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
                .Where(function (group) { return !group.combined; })
                .OrderBy(function (group) { return group.key; })
                .ToArray();
            return faceGoups;
        };
        ThreeJSColladaParser.prototype.buildPartedSkinMeshModel = function (faceGoups, vertices, faces, bones) {
            // Creates vertex index table
            var vertexIndexTable = new Array(vertices.length);
            // Create bone index table to replace bone index to re-ordered one
            var boneIndexTable = new List(bones.length);
            for (var i = 0; i < bones.length; i++) {
                var bone = bones[i];
                boneIndexTable[bone.originalBoneIndex] = i;
            }
            // Creates a part data for each groups
            var parts = new List();
            for (var _i = 0, faceGoups_1 = faceGoups; _i < faceGoups_1.length; _i++) {
                var group = faceGoups_1[_i];
                // Assigns new index for face's vertex
                var new_vertex_count = 0;
                for (var i = 0; i < vertexIndexTable.length; i++) {
                    vertexIndexTable[i] = -1;
                }
                for (var _a = 0, _b = group.faces; _a < _b.length; _a++) {
                    var face = _b[_a];
                    for (var _c = 0, _d = face.vertexIndeces; _c < _d.length; _c++) {
                        var vertexIndex = _d[_c];
                        if (vertexIndexTable[vertexIndex] == -1) {
                            vertexIndexTable[vertexIndex] = new_vertex_count;
                            new_vertex_count++;
                        }
                    }
                }
                // Creates vertices
                var part_vertices = new List(new_vertex_count);
                for (var oldVertexIndex = 0; oldVertexIndex < vertexIndexTable.length; oldVertexIndex++) {
                    var newVertexIndex = vertexIndexTable[oldVertexIndex];
                    if (newVertexIndex != -1) {
                        var src_vertex = vertices[oldVertexIndex];
                        var skinVertex = new SkinVertex();
                        skinVertex.texcoords = src_vertex.texcoords;
                        skinVertex.positions = new List();
                        for (var _e = 0, _f = group.boneIndices; _e < _f.length; _e++) {
                            var boneIndex = _f[_e];
                            var vpos = new SkinVertexPosition();
                            vec3.copy(vpos.position, src_vertex.position);
                            vec3.copy(vpos.normal, src_vertex.normal);
                            vpos.boneWeight = 0.0;
                            for (var _g = 0, _h = src_vertex.boneWeights; _g < _h.length; _g++) {
                                var boneWeight = _h[_g];
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
                var part_faces = new List();
                for (var _j = 0, _k = group.faces; _j < _k.length; _j++) {
                    var face = _k[_j];
                    var vertexIndeces = Enumerable.From(face.vertexIndeces)
                        .Select(function (index) { return vertexIndexTable[index]; })
                        .ToArray();
                    var skinFace = new MeshFace();
                    skinFace.vertexIndeces = vertexIndeces;
                    skinFace.vertexNormals = face.vertexNormals;
                    skinFace.texcoords = face.texcoords;
                    vec3.copy(skinFace.faceNormal, face.faceNormal);
                    skinFace.materialName = face.materialName;
                    skinFace.materialIndex = face.materialIndex;
                    part_faces.push(skinFace);
                }
                // Creates bone indices
                var part_boneIndices = new List();
                for (var _l = 0, _m = group.boneIndices; _l < _m.length; _l++) {
                    var oldBoneIndex = _m[_l];
                    var newBoneIndex = boneIndexTable[oldBoneIndex];
                    part_boneIndices.push(newBoneIndex);
                }
                // Creates part
                var part = new SkinMeshPart();
                part.boneIndices = part_boneIndices;
                part.materialIndex = group.materialIndex;
                part.vertices = part_vertices;
                part.faces = part_faces;
                parts.push(part);
            }
            // Transforms vertex positions into bone local
            for (var _o = 0, parts_1 = parts; _o < parts_1.length; _o++) {
                var part = parts_1[_o];
                for (var _p = 0, _q = part.vertices; _p < _q.length; _p++) {
                    var vertex = _q[_p];
                    for (var vertexIndex = 0; vertexIndex < vertex.positions.length; vertexIndex++) {
                        var vpos = vertex.positions[vertexIndex];
                        var boneIndex = part.boneIndices[vertexIndex];
                        var bone = bones[boneIndex];
                        vec3.transformMat4(vpos.position, vpos.position, bone.worldInvMatrix);
                        vec3.transformMat4(vpos.normal, vpos.normal, bone.worldInvNormalMatrix);
                        vec3.normalize(vpos.normal, vpos.normal);
                    }
                }
            }
            // Creates a model
            var result = new PartedSkinMeshModel();
            result.bones = bones;
            result.parts = parts;
            return result;
        };
        return ThreeJSColladaParser;
    }());
    Converters.ThreeJSColladaParser = ThreeJSColladaParser;
})(Converters || (Converters = {}));
