// written by @warotarock for jagenjo/collada.js

declare var Collada: any;

declare namespace ColladaParser {

    export interface Scene {
        materials: Dictionary<Material>;
        meshes: Dictionary<Mesh>;
        images: Dictionary<Mesh>;
        root: Object;
        object_type: string;
        metadata: any;
        resources: any;
        external_files: any;
    }

    export interface Mesh {
        name: string;
        filename: string;
        info: any;
        object_type: string;
        vertices: Float32Array;
        normals: Float32Array;
        coords: Float32Array;
        triangles: Uint16Array;

        // may be optional
        coords1: Float32Array;
        coords2: Float32Array;
        coords3: Float32Array;
        coords4: Float32Array;
        coords5: Float32Array;
    }

    export interface Material {
        id: string;
        object_type: string;
        ambient: Vec3;
        diffuse: Vec3;
        emission: Vec3;
        shininess: float;
        index_of_refraction: int;
        textures: Dictionary<Texture>;
    }

    export interface Image {
        name: string;
        filename: string;
        path: string;
        map: string;
    }

    export interface Texture {
        map_id: string;
        uvs: string;
    }

    export interface Object {
        id: string;
        name: string;
        type: string;
        children: List<Object>;
        model: Mat4;
        mesh: string;
        material: string;
        light: Light;
        camera: Camera;
    }

    export interface Light {
        type: string;
        color: Vec3;
        position: Vec3;
        target: Vec3;
    }

    export interface Camera {
        aspect: float;
        fov: float;
        near: float;
        far: float;
    }
}