// written by @warotarock for gl-matrix.js 2.2.1

type Vec2 = Float32Array;
type Vec3 = Float32Array;
type Vec4 = Float32Array;
type Quat4 = Float32Array;
type Mat2 = Float32Array;
type Mat2d = Float32Array;
type Mat3 = Float32Array;
type Mat4 = Float32Array;

declare module vec2 {
    export function add(out: Vec2, a: Vec2 | number[], b: Vec2 | number[]): Vec2;
    export function create(): Vec2;
    export function clone(a: Vec2 | number[]): Vec2;
    export function fromValues(x: number, y: number): Vec2;
    export function copy(out: Vec2, a: Vec2 | number[]): Vec2;
    export function set(out: Vec2, x: number, y: number): Vec2;
    export function sub(out: Vec2, a: Vec2 | number[], b: Vec2 | number[]): Vec2;
    export function subtract(out: Vec2, a: Vec2 | number[], b: Vec2 | number[]): Vec2;
    export function mul(out: Vec2, a: Vec2 | number[], b: Vec2 | number[]): Vec2;
    export function multiply(out: Vec2, a: Vec2 | number[], b: Vec2 | number[]): Vec2;
    export function div(out: Vec2, a: Vec2 | number[], b: Vec2 | number[]): Vec2;
    export function divide(out: Vec2, a: Vec2 | number[], b: Vec2 | number[]): Vec2;
    export function min(out: Vec2, a: Vec2 | number[], b: Vec2 | number[]): Vec2;
    export function max(out: Vec2, a: Vec2 | number[], b: Vec2 | number[]): Vec2;
    export function scale(out: Vec2, a: Vec2 | number[], b: number): Vec2;
    export function dist(a: Vec2 | number[], b: Vec2 | number[]): number;
    export function distance(a: Vec2 | number[], b: Vec2 | number[]): number;
    export function sqrDist(a: Vec2 | number[], b: Vec2 | number[]): number;
    export function squaredDistance(a: Vec2 | number[], b: Vec2 | number[]): number;
    export function len(a: Vec2 | number[]): number;
    export function length(a: Vec2 | number[]): number;
    export function sqrLen(a: Vec2 | number[]): number;
    export function squaredLength(a: Vec2 | number[]): number;
    export function negate(out: Vec2, a: Vec2 | number[]): Vec2;
    export function normalize(out: Vec2, a: Vec2 | number[]): Vec2;
    export function dot(a: Vec2 | number[], b: Vec2 | number[]): number;
    export function cross(out: Vec2, a: Vec2 | number[], b: Vec2 | number[]): Vec2;
    export function lerp(out: Vec2, a: Vec2 | number[], b: Vec2 | number[], t: number): Vec2;
    export function transformMat2(out: Vec2, a: Vec2 | number[], m: Mat2 | number[]): Vec2;
    export function transformMat2d(out: Vec2, a: Vec2 | number[], m: Mat2d): Vec2;
    export function str(a: Vec2 | number[]): string;
}

declare module vec3 {
    export function add(out: Vec3, a: Vec3 | number[], b: Vec3 | number[]): Vec3;
    export function create(): Vec3;
    export function clone(a: Vec3 | number[]): Vec3;
    export function fromValues(x: number, y: number, z: number): Vec3;
    export function copy(out: Vec3, a: Vec3 | number[]): Vec3;
    export function set(out: Vec3, x: number, y: number, z: number): Vec3;
    export function sub(out: Vec3, a: Vec3 | number[], b: Vec3 | number[]): Vec3;
    export function subtract(out: Vec3, a: Vec3 | number[], b: Vec3 | number[]): Vec3;
    export function mul(out: Vec3, a: Vec3 | number[], b: Vec3 | number[]): Vec3;
    export function multiply(out: Vec3, a: Vec3 | number[], b: Vec3 | number[]): Vec3;
    export function div(out: Vec3, a: Vec3 | number[], b: Vec3 | number[]): Vec3;
    export function divide(out: Vec3, a: Vec3 | number[], b: Vec3 | number[]): Vec3;
    export function min(out: Vec3, a: Vec3 | number[], b: Vec3 | number[]): Vec3;
    export function max(out: Vec3, a: Vec3 | number[], b: Vec3 | number[]): Vec3;
    export function scale(out: Vec3, a: Vec3 | number[], b: number): Vec3;
    export function dist(a: Vec3 | number[], b: Vec3 | number[]): number;
    export function distance(a: Vec3 | number[], b: Vec3 | number[]): number;
    export function sqrDist(a: Vec3 | number[], b: Vec3 | number[]): number;
    export function squaredDistance(a: Vec3 | number[], b: Vec3 | number[]): number;
    export function len(a: Vec3 | number[]): number;
    export function length(a: Vec3 | number[]): number;
    export function sqrLen(a: Vec3 | number[]): number;
    export function squaredLength(a: Vec3 | number[]): number;
    export function negate(out: Vec3, a: Vec3 | number[]): Vec3;
    export function normalize(out: Vec3, a: Vec3 | number[]): Vec3;
    export function dot(a: Vec3 | number[], b: Vec3 | number[]): number;
    export function cross(out: Vec3, a: Vec3 | number[], b: Vec3 | number[]): Vec3;
    export function lerp(out: Vec3, a: Vec3 | number[], b: Vec3 | number[], t: number): Vec3;
    export function transformMat4(out: Vec3, a: Vec3 | number[], m: Mat4 | number[]): Vec3;
    export function transformQuat(out: Vec3, a: Vec3 | number[], q: Vec4 | number[]): Vec3;
    export function str(a: Vec3 | number[]): string;
}

declare module vec4 {
    export function add(out: Vec4, a: Vec4 | number[], b: Vec4 | number[]): Vec4;
    export function create(): Vec4;
    export function clone(a: Vec4 | number[]): Vec4;
    export function fromValues(x: number, y: number, z: number, w: number): Vec4;
    export function copy(out: Vec4, a: Vec4 | number[]): Vec4;
    export function set(out: Vec4, x: number, y: number, z: number, w: number): Vec4;
    export function sub(out: Vec4, a: Vec4 | number[], b: Vec4 | number[]): Vec4;
    export function subtract(out: Vec4, a: Vec4 | number[], b: Vec4 | number[]): Vec4;
    export function mul(out: Vec4, a: Vec4 | number[], b: Vec4 | number[]): Vec4;
    export function multiply(out: Vec4, a: Vec4 | number[], b: Vec4 | number[]): Vec4;
    export function div(out: Vec4, a: Vec4 | number[], b: Vec4 | number[]): Vec4;
    export function divide(out: Vec4, a: Vec4 | number[], b: Vec4 | number[]): Vec4;
    export function min(out: Vec4, a: Vec4 | number[], b: Vec4 | number[]): Vec4;
    export function max(out: Vec4, a: Vec4 | number[], b: Vec4 | number[]): Vec4;
    export function scale(out: Vec4, a: Vec4 | number[], b: number): Vec4;
    export function dist(a: Vec4 | number[], b: Vec4 | number[]): number;
    export function distance(a: Vec4 | number[], b: Vec4 | number[]): number;
    export function sqrDist(a: Vec4 | number[], b: Vec4 | number[]): number;
    export function squaredDistance(a: Vec4 | number[], b: Vec4 | number[]): number;
    export function len(a: Vec4 | number[]): number;
    export function length(a: Vec4 | number[]): number;
    export function sqrLen(a: Vec4 | number[]): number;
    export function squaredLength(a: Vec4 | number[]): number;
    export function negate(out: Vec4, a: Vec4 | number[]): Vec4;
    export function normalize(out: Vec4, a: Vec4 | number[]): Vec4;
    export function dot(a: Vec4 | number[], b: Vec4 | number[]): number;
    export function cross(out: Vec4, a: Vec4 | number[], b: Vec4 | number[]): Vec4;
    export function lerp(out: Vec4, a: Vec4 | number[], b: Vec4 | number[], t: number): Vec4;
    export function transformMat4(out: Vec4, a: Vec4 | number[], m: Mat4 | number[]): Vec4;
    export function transformQuat(out: Vec4, a: Vec4 | number[], q: Vec4 | number[]): Vec4;
    export function str(a: Vec4 | number[]): string;
}

declare module quat {
    export function create(): Quat4;
    export function clone(a: Quat4 | number[]): Quat4;
    export function fromValues(x: number, y: number, z: number, w: number): Quat4;
    export function copy(out: Quat4, a: Quat4 | number[]): Quat4;
    export function set(out: Quat4, x: number, y: number, z: number, w: number): Quat4;
    export function identity(out: Quat4): Quat4;
    export function setAxisAngle(out: Quat4, axis: Vec3, rad: number): Quat4;
    export function add(out: Quat4, a: Quat4 | number[], b: Quat4 | number[]): Quat4;
    export function mul(out: Quat4, a: Quat4 | number[], b: Quat4 | number[]): Quat4;
    export function multiply(out: Quat4, a: Quat4 | number[], b: Quat4 | number[]): Quat4;
    export function scale(out: Quat4, a: Quat4 | number[], b: number): Quat4;
    export function rotateX(out: Quat4, a: Quat4 | number[], rad: number): Quat4;
    export function rotateY(out: Quat4, a: Quat4 | number[], rad: number): Quat4;
    export function rotateZ(out: Quat4, a: Quat4 | number[], rad: number): Quat4;
    export function calculateW(out: Quat4, a: Quat4 | number[]): Quat4;
    export function dot(a: Quat4 | number[], b: Quat4 | number[]): number;
    export function lerp(out: Quat4, a: Quat4 | number[], b: Quat4 | number[], t: number): Quat4;
    export function slerp(out: Quat4, a: Quat4 | number[], b: Quat4 | number[], t: number): Quat4;
    export function invert(out: Quat4, a: Quat4 | number[]): Quat4;
    export function conjugate(out: Quat4, a: Quat4 | number[]): Quat4;
    export function len(a: Quat4 | number[]): number;
    export function length(a: Quat4 | number[]): number;
    export function sqrLen(a: Quat4 | number[]): number;
    export function squaredLength(a: Quat4 | number[]): number;
    export function normalize(out: Quat4, a: Quat4 | number[]): Quat4;
    export function str(a: Quat4 | number[]): string;
}

declare module mat2 {
    export function create(): Mat2;
    export function clone(a: Mat2 | number[]): Mat2;
    export function copy(out: Mat2, a: Mat2 | number[]): Mat2;
    export function identity(out: Mat2): Mat2;
    export function transpose(out: Mat2, a: Mat2 | number[]): Mat2;
    export function invert(out: Mat2, a: Mat2 | number[]): Mat2;
    export function adjoint(out: Mat2, a: Mat2 | number[]): Mat2;
    export function determinant(a: Mat2 | number[]): number;
    export function mul(out: Mat2, a: Mat2 | number[], b: Mat2 | number[]): Mat2;
    export function multiply(out: Mat2, a: Mat2 | number[], b: Mat2 | number[]): Mat2;
    export function rotate(out: Mat2, a: Mat2 | number[], rad: number): Mat2;
    export function scale(out: Mat2, a: Mat2 | number[], v: Vec2): Mat2;
    export function str(a: Mat2 | number[]): string;
}

declare module mat2d {
    export function create(): Mat2d;
    export function clone(a: Mat2d | number[]): Mat2d;
    export function copy(out: Mat2d, a: Mat2d | number[]): Mat2d;
    export function identity(out: Mat2d): Mat2d;
    export function invert(out: Mat2d, a: Mat2d | number[]): Mat2d;
    export function determinant(a: Mat2d | number[]): number;
    export function mul(out: Mat2d, a: Mat2d | number[], b: Mat2d | number[]): Mat2d;
    export function multiply(out: Mat2d, a: Mat2d | number[], b: Mat2d | number[]): Mat2d;
    export function rotate(out: Mat2d, a: Mat2d | number[], rad: number): Mat2d;
    export function scale(out: Mat2d, a: Mat2d | number[], v: Vec2 | number[]): Mat2d;
    export function translate(out: Mat2d, a: Mat2d | number[], v: Vec2 | number[]): Mat2d;
    export function str(a: Mat2d | number[]): string;
}

declare module mat3 {
    export function create(): Mat3;
    export function clone(a: Mat3 | number[]): Mat3;
    export function copy(out: Mat3, a: Mat3 | number[]): Mat3;
    export function identity(out: Mat3): Mat3;
    export function transpose(out: Mat3, a: Mat3 | number[]): Mat3;
    export function invert(out: Mat3, a: Mat3 | number[]): Mat3;
    export function adjoint(out: Mat3, a: Mat3 | number[]): Mat3;
    export function determinant(a: Mat3 | number[]): number;
    export function mul(out: Mat3, a: Mat3 | number[], b: Mat3): Mat3;
    export function multiply(out: Mat3, a: Mat3 | number[], b: Mat3): Mat3;
    export function str(a: Mat3 | number[]): string;
}

declare module mat4 {
    export function create(): Mat4;
    export function clone(a: Mat4 | number[]): Mat4;
    export function copy(out: Mat4, a: Mat4 | number[]): Mat4;
    export function identity(out: Mat4): Mat4;
    export function transpose(out: Mat4, a: Mat4 | number[]): Mat4;
    export function invert(out: Mat4, a: Mat4 | number[]): Mat4;
    export function adjoint(out: Mat4, a: Mat4 | number[]): Mat4;
    export function determinant(a: Mat4 | number[]): number;
    export function mul(out: Mat4, a: Mat4 | number[], b: Mat4 | number[]): Mat4;
    export function multiply(out: Mat4, a: Mat4 | number[], b: Mat4 | number[]): Mat4;
    export function str(a: Mat4 | number[]): string;
    export function translate(out: Mat4, a: Mat4 | number[], v: Vec3 | number[]): Mat4;
    export function scale(out: Mat4, a: Mat4 | number[], v: Vec3 | number[]): Mat4;
    export function rotate(out: Mat4, a: Mat4 | number[], rad: number, axis: Vec3 | number[]): Mat4;
    export function rotateX(out: Mat4, a: Mat4 | number[], rad: number): Mat4;
    export function rotateY(out: Mat4, a: Mat4 | number[], rad: number): Mat4;
    export function rotateZ(out: Mat4, a: Mat4 | number[], rad: number): Mat4;
    export function fromRotationTranslation(out: Mat4, q: Vec4 | number[], v: Vec3 | number[]): Mat4;
    export function frustum(out: Mat4, left: number, right: number, bottom: number, top: number, near: number, far: number): Mat4;
    export function perspective(out: Mat4, fovy: number, aspect: number, near: number, far: number): Mat4;
    export function ortho(out: Mat4, left: number, right: number, bottom: number, top: number, near: number, far: number): Mat4;
    export function lookAt(out: Mat4, eye: Vec3 | number[], center: Vec3 | number[], up: Vec3 | number[]): Mat4;
    export function fromQuat(out: Mat4, quat: Vec4 | number[]): Mat4;
}