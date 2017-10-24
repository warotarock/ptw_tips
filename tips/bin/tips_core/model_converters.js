var Converters;
(function (Converters) {
    // Data types
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
    var BoneIndexWeight = (function () {
        function BoneIndexWeight() {
            this.index = 0;
            this.weight = 0.0;
        }
        return BoneIndexWeight;
    }());
    Converters.BoneIndexWeight = BoneIndexWeight;
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
    var Mesh = (function () {
        function Mesh() {
            this.name = null;
            this.vertices = null;
            this.faces = null;
        }
        return Mesh;
    }());
    Converters.Mesh = Mesh;
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
    var SkinModelPart = (function () {
        function SkinModelPart() {
            this.materialIndex = -1;
            this.boneIndices = null;
            this.vertices = null;
            this.faces = null;
        }
        return SkinModelPart;
    }());
    Converters.SkinModelPart = SkinModelPart;
    var SkinningBone = (function () {
        function SkinningBone() {
            this.name = null;
            this.parent = null;
            this.originalBoneIndex = -1;
            this.nestLevel = -1;
            this.localMatrix = mat4.create();
            this.worldMatrix = mat4.create();
            this.worldInvMatrix = mat4.create();
            this.worldInvNormalMatrix = mat4.create();
        }
        return SkinningBone;
    }());
    Converters.SkinningBone = SkinningBone;
    var PartedSkinModel = (function () {
        function PartedSkinModel() {
            this.name = null;
            this.bones = null;
            this.parts = null;
        }
        return PartedSkinModel;
    }());
    Converters.PartedSkinModel = PartedSkinModel;
    var SkinningFaceGroup = (function () {
        function SkinningFaceGroup() {
        }
        return SkinningFaceGroup;
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
            this.staticMeshes = null;
            this.skinModels = null;
        }
        return SceneData;
    }());
    Converters.SceneData = SceneData;
    // Converter
    var ThreeJSColladaConverterHelper = (function () {
        function ThreeJSColladaConverterHelper() {
            this.collada = null;
        }
        ThreeJSColladaConverterHelper.prototype.parse = function (threeJSCollada) {
            this.collada = threeJSCollada;
            var sceneData = new SceneData();
            sceneData.staticMeshes = this.parseStaticGeometries();
            sceneData.skinModels = this.parseSkinGeometries();
            return sceneData;
        };
        ThreeJSColladaConverterHelper.prototype.isSkinGeometry = function (geometry) {
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
        ThreeJSColladaConverterHelper.prototype.parseStaticGeometries = function () {
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
        ThreeJSColladaConverterHelper.prototype.parseStaticGeometry = function (geometryName, geometry) {
            var geometry3js = geometry.mesh.geometry3js;
            var vertices = this.parseVertices(geometry3js);
            var faces = this.parseFaces(geometry3js);
            this.overwriteVertexUV(faces, vertices);
            var meshSufixIndex = geometryName.lastIndexOf('-mesh');
            var meshName = geometryName.substr(0, meshSufixIndex);
            var result = new Mesh();
            result.name = meshName;
            result.vertices = vertices;
            result.faces = faces;
            return result;
        };
        ThreeJSColladaConverterHelper.prototype.parseVertices = function (geometry3js) {
            var vertices = new List();
            for (var i = 0; i < geometry3js.vertices.length; i++) {
                var vartexData = geometry3js.vertices[i];
                var vertex = new MeshVertex();
                vec3.set(vertex.position, vartexData.x, vartexData.y, vartexData.z);
                vec3.set(vertex.normal, 0.0, 0.0, 0.0);
                vertex.texcoords = new List();
                vertices.push(vertex);
            }
            return vertices;
        };
        ThreeJSColladaConverterHelper.prototype.parseFaces = function (geometry3js) {
            var faces = new List();
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
                    face.texcoords = new List();
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
        };
        ThreeJSColladaConverterHelper.prototype.overwriteVertexUV = function (faces, vertices) {
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
        };
        // Skin geometry
        ThreeJSColladaConverterHelper.prototype.parseSkinGeometries = function () {
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
        ThreeJSColladaConverterHelper.prototype.parseSkinGeometry = function (geometryName, geometry) {
            var geometry3js = geometry.mesh.geometry3js;
            var vertices = this.parseVertices(geometry3js);
            var faces = this.parseFaces(geometry3js);
            var bones = this.parseBones(geometry3js);
            this.overwriteVertexUV(faces, vertices);
            var partedSkinnigModel = this.parsePartedSkinData(geometry3js, faces, vertices, bones);
            var meshSufixIndex = geometryName.lastIndexOf('-mesh');
            partedSkinnigModel.name = geometryName.substr(0, meshSufixIndex);
            return partedSkinnigModel;
        };
        ThreeJSColladaConverterHelper.prototype.parseBones = function (geometry3js) {
            var tempVec3 = vec3.create();
            var result = new List();
            for (var i = 0; i < geometry3js.bones.length; i++) {
                var bone = geometry3js.bones[i];
                var skiningBone = new SkinningBone();
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
                .OrderBy(function (skiningBone) { return skiningBone.nestLevel; })
                .ThenBy(function (skiningBone) { return skiningBone.name; })
                .ToArray();
            return result;
        };
        ThreeJSColladaConverterHelper.prototype.normalizeMat4 = function (mat) {
            this.normalizeMat4Part(mat, 0);
            this.normalizeMat4Part(mat, 4);
            this.normalizeMat4Part(mat, 8);
            mat[12] = 0.0;
            mat[13] = 0.0;
            mat[14] = 0.0;
        };
        ThreeJSColladaConverterHelper.prototype.normalizeMat4Part = function (mat, offset) {
            var length = Math.sqrt(mat[offset + 0] * mat[offset + 0] + mat[offset + 1] * mat[offset + 1] + mat[offset + 2] * mat[offset + 2]);
            if (length > 0) {
                mat[offset + 0] /= length;
                mat[offset + 1] /= length;
                mat[offset + 2] /= length;
            }
        };
        ThreeJSColladaConverterHelper.prototype.parsePartedSkinData = function (geometry3js, faces, vertices, bones) {
            if (geometry3js.skinIndices == undefined || geometry3js.skinIndices == null) {
                return null;
            }
            // get material-bone keyed groups per a face
            var skinningFaceGoups = this.parsePartedSkinData_GetFaceGroups(geometry3js, faces, vertices);
            var vertexIndexTable = new Array(vertices.length);
            // create a part data for each groups
            var parts = new List();
            for (var i = 0; i < skinningFaceGoups.length; i++) {
                var group = skinningFaceGoups[i];
                // assign new vertex index in the part
                var new_vertex_count = 0;
                for (var k = 0; k < vertexIndexTable.length; k++) {
                    vertexIndexTable[k] = -1;
                }
                for (var k = 0; k < group.faces.length; k++) {
                    var face = group.faces[k];
                    for (var m = 0; m < face.vertexIndeces.length; m++) {
                        var vertexIndex = face.vertexIndeces[m];
                        if (vertexIndexTable[vertexIndex] == -1) {
                            vertexIndexTable[vertexIndex] = new_vertex_count;
                            new_vertex_count++;
                        }
                    }
                }
                // create vertices
                var part_vertices = new List(new_vertex_count);
                for (var k = 0; k < vertexIndexTable.length; k++) {
                    if (vertexIndexTable[k] != -1) {
                        var src_vertex = vertices[k];
                        var skinVertex = new SkinVertex();
                        skinVertex.texcoords = src_vertex.texcoords;
                        skinVertex.positions = new List();
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
                var part_faces = new List();
                for (var k = 0; k < group.faces.length; k++) {
                    var face = group.faces[k];
                    var skinFace = new MeshFace();
                    skinFace.vertexIndeces = Enumerable.From(face.vertexIndeces)
                        .Select(function (index) { return vertexIndexTable[index]; })
                        .ToArray();
                    skinFace.vertexNormals = face.vertexNormals;
                    skinFace.texcoords = face.texcoords;
                    vec3.copy(skinFace.faceNormal, face.faceNormal);
                    skinFace.materialName = face.materialName;
                    skinFace.materialIndex = face.materialIndex;
                    part_faces.push(skinFace);
                }
                // create part
                var part = new SkinModelPart();
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
            var result = new PartedSkinModel();
            result.bones = bones;
            result.parts = parts;
            return result;
        };
        ThreeJSColladaConverterHelper.prototype.parsePartedSkinData_GetFaceGroups = function (geometry3js, faces, vertices) {
            // add weight data to vertex and face data
            for (var i = 0; i < faces.length; i++) {
                var face = faces[i];
                face.sortingIndeces = new List();
                for (var k = 0; k < face.vertexIndeces.length; k++) {
                    var vertexIndex = face.vertexIndeces[k];
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
                    console.log("more than 4 bone count detected.");
                }
            }
            // grouping by bone and material
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
            // compress all one-bone groups
            for (var i = 0; i < faceGoups.length; i++) {
                var group = faceGoups[i];
                if (group.boneCount != 1) {
                    continue;
                }
                else {
                    var compress_to_group = null;
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
                .Where(function (group) { return !group.combined; })
                .OrderBy(function (group) { return group.key; })
                .ToArray();
            return faceGoups;
        };
        return ThreeJSColladaConverterHelper;
    }());
    Converters.ThreeJSColladaConverterHelper = ThreeJSColladaConverterHelper;
})(Converters || (Converters = {}));
