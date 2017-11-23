
// Bezier curve

interface AnimationCurvePointCoord {

    [n: number]: float;
}

interface AnimationCurvePoint {

    [n: number]: AnimationCurvePointCoord;
}

interface AnimationCurvePointArray {

    [n: number]: AnimationCurvePoint;
    length: int;
}

// InterPOlation curve (equal to Blender F-curve)

enum AnimationCurveInterpolationType {

    Liner = 1,
    Bezier = 2
}

class AnimationCurve {

    ipoType = AnimationCurveInterpolationType.Bezier;
    lastTime = 0.0;
    lastIndex = 0;
    curve: AnimationCurvePointArray = null;
}

// Object animation based on IPOCurves

class ObjectAnimationCurveSet {

    locationX: AnimationCurve = null;
    locationY: AnimationCurve = null;
    locationZ: AnimationCurve = null;
    rotationX: AnimationCurve = null;
    rotationY: AnimationCurve = null;
    rotationZ: AnimationCurve = null;
    scalingX: AnimationCurve = null;
    scalingY: AnimationCurve = null;
    scalingZ: AnimationCurve = null;
}

// Bone animation based on IPOCurves

class BoneAnimationBoneCurveSet {

    locX: AnimationCurve = null;
    locY: AnimationCurve = null;
    locZ: AnimationCurve = null;
    quatX: AnimationCurve = null;
    quatY: AnimationCurve = null;
    quatZ: AnimationCurve = null;
    quatW: AnimationCurve = null;
    scaleX: AnimationCurve = null;
    scaleY: AnimationCurve = null;
    scaleZ: AnimationCurve = null;
}

interface BoneAnimation {

    [n: string]: BoneAnimationBoneCurveSet;
}

class BoneAnimationBone {

    name: string;
    parent: int;
    matrix: Mat4;
}

class BoneAnimationBufferBone {

    name: string = null;
    transtarion = vec3.fromValues(0.0, 0.0, 0.0);
    quaternion = quat.fromValues(0.0, 0.0, 0.0, 1.0);
    scaling = vec3.fromValues(1.0, 1.0, 1.0);
}

class BoneAnimationBuffer {

    bones: Dictionary<BoneAnimationBufferBone> = null;
    boneList: List<BoneAnimationBufferBone> = null;
}

class BoneAnimationMatrixBuffer {

    boneMatrices: Dictionary<Mat4> = null;
    boneMatrixList: List<Mat4> = null;
}

enum BoneAnimationFilterType {

    SpecifyTarget = 1,
    ExcludeTarget = 2
}

class CalcBoneAnimationOption {

    boneNameFilterType = BoneAnimationFilterType.SpecifyTarget;
    boneNameFilter = new Dictionary<boolean>();
}

class AnimationSolver {

    // Bezier curve solver functions

    private bezierTempSolution: Vec3 = vec3.fromValues(0.0, 0.0, 0.0);

    private cubeRoot(x: float): float {

        let res = Math.pow(Math.abs(x), 1.0 / 3.0);

        return (x >= 0) ? res : -res;
    }

    private solveQuadraticEquation(solution: Vec3, a: float, b: float, c: float) {

        let d: float;
        let x1: float;
        let x2: float;

        if (a == 0) {

            solution[0] = -c / b;
            solution[1] = -1;
            return;
        }
        d = b * b - 4 * a * c;
        if (d > 0) {

            if (b < 0) {

                x1 = (-b - Math.sqrt(d)) / 2 / a;
                x2 = -b / a - x1;
            }
            else {

                x1 = (-b + Math.sqrt(d)) / 2 / a;
                x2 = -b / a - x1;
            }

            solution[0] = x1;
            solution[1] = x2;
        }
        else if (d == 0) {

            solution[0] = -b / 2 / a;
            solution[1] = -1;
        }
        else {

            // imaginary root
        }
    }

    private solveCubicEquation(solution: Vec3, a: float, b: float, c: float, d: float) {

        let PI: float = 3.14159265358979323846264;
        let p: float;
        let q: float;
        let t: float;
        let a3: float;
        let b3: float;

        if (a == 0) {
            this.solveQuadraticEquation(solution, b, c, d);
            return;
        }

        b /= 3 * a;
        c /= a;
        d /= a;
        p = b * b - c / 3;
        q = (b * (c - 2 * b * b) - d) / 2;

        a = q * q - p * p * p;

        if (a == 0) {

            q = this.cubeRoot(q);
            solution[0] = 2 * q - b;
            solution[1] = -q - b;
            solution[2] = -1;
        }
        else if (a > 0) {

            let sign = 1;
            if (q <= 0) { sign = -1; }
            a3 = this.cubeRoot(q + (sign) * Math.sqrt(a));
            b3 = p / a3;
            solution[0] = a3 + b3 - b;
            solution[1] = -1;
            solution[2] = -1;
        }
        else {

            a = 2 * Math.sqrt(p);
            t = Math.acos(q / (p * a / 2));
            solution[0] = a * Math.cos(t / 3) - b;
            solution[1] = a * Math.cos((t + 2 * PI) / 3) - b;
            solution[2] = a * Math.cos((t + 4 * PI) / 3) - b;
        }
    }

    private calcBezierTimeInSection(x1: float, x2: float, x3: float, x4: float, targetX: float): float {

        // calculate time of x position of IPO curve
        this.bezierTempSolution[0] = 0.0;
        this.bezierTempSolution[1] = 0.0;
        this.bezierTempSolution[2] = 0.0;
        let a = x4 - 3 * (x3 - x2) - x1;
        let b = 3 * (x3 - 2 * x2 + x1);
        let c = 3 * (x2 - x1);
        let d = x1 - targetX;
        this.solveCubicEquation(this.bezierTempSolution, a, b, c, d);

        // return a root which in original range (>= 0.0 and <= 1.0)
        for (let i = 0; i < 3; i++) {

            if (this.bezierTempSolution[i] >= 0.0 && this.bezierTempSolution[i] <= 1.0) {

                return this.bezierTempSolution[i];
            }
        }

        return 0.0;
    }

    private calcInterpolationLiner(x1: float, x2: float, t: float): float {

        return x1 + (x2 - x1) * t;
    }

    private calcInterpolationBezier(x1: float, x2: float, x3: float, x4: float, t: float): float {

        return (1 - t) * (1 - t) * (1 - t) * x1 +
            3 * (1 - t) * (1 - t) * t * x2 +
            3 * (1 - t) * t * t * x3 +
            t * t * t * x4;
    }

    // IPOCurve value functions

    getIPOCurveValue(ipoCurve: AnimationCurve, time: float): float {

        // Start from last searched index
        let firstIndex = ipoCurve.lastIndex;
        let isForwardSearch = (time >= ipoCurve.lastTime);

        // Searchs the section
        let sectionIndex = 0;
        let timeInSection = time;
        if (isForwardSearch) {

            for (let i = firstIndex; i + 1 < ipoCurve.curve.length; i++) {

                // Compares time to section time: x of center point of BezTriple[i]
                let sectionStartTime = ipoCurve.curve[i + 1][1][0];
                if (sectionStartTime > time)
                {
                    timeInSection = time - sectionStartTime;
                    sectionIndex = i;
                    break;
                }
            }
        }
        else {

            for (let i = firstIndex; i >= 0; i--) {

                // Compares time to section time: x of center point of BezTriple[i]
                let sectionStartTime = ipoCurve.curve[i][1][0];
                if (sectionStartTime <= time) {

                    timeInSection = time - sectionStartTime;
                    sectionIndex = i;
                    break;
                }
            }
        }

        ipoCurve.lastTime = time;
        ipoCurve.lastIndex = sectionIndex;

        // Interpolation
        let baseValue = ipoCurve.curve[sectionIndex][1][1]; // y of center point of BezTriple[sectionIndex]
        let interpolatedValue = baseValue;
        let ipoRate = 0.0;

        if (sectionIndex < ipoCurve.curve.length - 1) {

            if (ipoCurve.ipoType == AnimationCurveInterpolationType.Bezier) {

                ipoRate = this.calcBezierTimeInSection(
                    ipoCurve.curve[sectionIndex][1][0]
                    , ipoCurve.curve[sectionIndex][2][0]
                    , ipoCurve.curve[sectionIndex + 1][0][0]
                    , ipoCurve.curve[sectionIndex + 1][1][0]
                    , time);
                interpolatedValue = this.calcInterpolationBezier(
                    ipoCurve.curve[sectionIndex][1][1]
                    , ipoCurve.curve[sectionIndex][2][1]
                    , ipoCurve.curve[sectionIndex + 1][0][1]
                    , ipoCurve.curve[sectionIndex + 1][1][1]
                    , ipoRate);
            }
            else if (ipoCurve.ipoType == AnimationCurveInterpolationType.Liner) {

                ipoRate = timeInSection / (ipoCurve.curve[sectionIndex + 1][1][0] - ipoCurve.curve[sectionIndex][1][0]);
                interpolatedValue = this.calcInterpolationLiner(
                    ipoCurve.curve[sectionIndex][1][1]
                    , ipoCurve.curve[sectionIndex + 1][1][1]
                    , ipoRate);
            }
        }

        return interpolatedValue;
    }

    getIPOCurveValueIfNotNull(ipoCurve: AnimationCurve, time: float, defaultValue: float): float {

        if (ipoCurve == undefined || ipoCurve == null) {
            return defaultValue;
        }

        return this.getIPOCurveValue(ipoCurve, time);
    }

    // Bone animation functions

    createBoneAnimationBuffer(bones: List<BoneAnimationBone>): BoneAnimationBuffer {

        let buffer = new BoneAnimationBuffer();
        buffer.bones = new Dictionary<BoneAnimationBufferBone>();
        buffer.boneList = new List<BoneAnimationBufferBone>(bones.length);

        for (let boneIndex = 0; boneIndex < bones.length; boneIndex++) {
            let bone = bones[boneIndex];

            let bufferBone = new BoneAnimationBufferBone();
            buffer.bones[bone.name] = bufferBone;
            buffer.boneList[boneIndex] = bufferBone;
        }

        return buffer;
    }

    createBoneMatrixBuffer(bones: List<BoneAnimationBone>): BoneAnimationMatrixBuffer {

        let buffer = new BoneAnimationMatrixBuffer();
        buffer.boneMatrices = new Dictionary<Mat4>();
        buffer.boneMatrixList = new List<Mat4>(bones.length);

        for (let boneIndex = 0; boneIndex < bones.length; boneIndex++) {
            let bone = bones[boneIndex];

            buffer.boneMatrixList[boneIndex] = mat4.create();
            buffer.boneMatrices[bone.name] = buffer.boneMatrixList[boneIndex];
        }

        return buffer;
    }

    private animationTempMatrix: Mat4 = mat4.create();
    private animationTempMatrixForQuat: Mat4 = mat4.create();
    private animationTempQuat: Quat4 = quat.create();

    calcBoneAnimation(resultBuffer: BoneAnimationBuffer, bones: List<BoneAnimationBone>, animation: BoneAnimation, time: float) {

        for (let bone of bones) {

            if (!DictionaryContainsKey(resultBuffer.bones, bone.name)) {
                continue;
            }

            let resultBone: BoneAnimationBufferBone = resultBuffer.bones[bone.name];

            if (DictionaryContainsKey(animation, bone.name)) {

                let animationBone: BoneAnimationBoneCurveSet = animation[bone.name];

                vec3.set(resultBone.transtarion
                    , this.getIPOCurveValueIfNotNull(animationBone.locX, time, 0.0)
                    , this.getIPOCurveValueIfNotNull(animationBone.locY, time, 0.0)
                    , this.getIPOCurveValueIfNotNull(animationBone.locZ, time, 0.0));

                quat.set(resultBone.quaternion
                    , this.getIPOCurveValueIfNotNull(animationBone.quatX, time, 0.0)
                    , this.getIPOCurveValueIfNotNull(animationBone.quatY, time, 0.0)
                    , this.getIPOCurveValueIfNotNull(animationBone.quatZ, time, 0.0)
                    , this.getIPOCurveValueIfNotNull(animationBone.quatW, time, 1.0));
                quat.normalize(resultBone.quaternion, resultBone.quaternion);

                vec3.set(resultBone.scaling
                    , this.getIPOCurveValueIfNotNull(animationBone.scaleX, time, 1.0)
                    , this.getIPOCurveValueIfNotNull(animationBone.scaleY, time, 1.0)
                    , this.getIPOCurveValueIfNotNull(animationBone.scaleZ, time, 1.0));
            }
            else {
                vec3.set(resultBone.transtarion, 0.0, 0.0, 0.0);
                quat.set(resultBone.quaternion, 0.0, 0.0, 0.0, 1.0);
                vec3.set(resultBone.scaling, 1.0, 1.0, 1.0);
            }
        }
    }

    blendBoneAnimation(resultBuffer: BoneAnimationBuffer, animationBufferA: BoneAnimationBuffer, animationBufferB: BoneAnimationBuffer, blendRatio: float, option: CalcBoneAnimationOption) {

        for (let bone of animationBufferA.boneList) {
            let boneName = bone.name;

            // Filtering
            if (option != null) {
                if (option.boneNameFilterType == BoneAnimationFilterType.SpecifyTarget) {
                    if (!DictionaryContainsKey(option.boneNameFilter, boneName) || !option.boneNameFilter[boneName]) {
                        continue;
                    }
                }
                else if (option.boneNameFilterType == BoneAnimationFilterType.ExcludeTarget) {
                    if (DictionaryContainsKey(option.boneNameFilter, boneName) && option.boneNameFilter[boneName]) {
                        continue;
                    }
                }
            }

            // Blending
            let boneA = animationBufferA.bones[boneName];
            let boneB = animationBufferB.bones[boneName];
            let boneResult = resultBuffer.bones[boneName];

            vec3.lerp(boneResult.Transtarion, boneA.Transtarion, boneB.Transtarion, blendRatio);
            quat.lerp(boneResult.Quaternion, boneA.Quaternion, boneB.Quaternion, blendRatio);
            vec3.lerp(boneResult.Scaling, boneA.Scaling, boneB.Scaling, blendRatio);
        }
    }

    calcBoneMatrix(resultBuffer: BoneAnimationMatrixBuffer, bones: List<BoneAnimationBone>, animationBuffer: BoneAnimationBuffer) {

        for (let bone of bones) {

            if (bone.parent != -1) {
                // root parent
                mat4.multiply(this.animationTempMatrix, resultBuffer.boneMatrixList[bone.parent], bone.matrix);
            }
            else {
                // child
                mat4.copy(this.animationTempMatrix, bone.matrix);
            }

            // calculate matrix
            if (DictionaryContainsKey(animationBuffer.bones, bone.name)) {
                let bufferBone: BoneAnimationBufferBone = animationBuffer.bones[bone.name];

                // rotation
                mat4.fromQuat(this.animationTempMatrixForQuat, bufferBone.quaternion);

                // translation
                this.animationTempMatrixForQuat[12] = bufferBone.transtarion[0];
                this.animationTempMatrixForQuat[13] = bufferBone.transtarion[1];
                this.animationTempMatrixForQuat[14] = bufferBone.transtarion[2];

                // scaling
                mat4.scale(this.animationTempMatrixForQuat, this.animationTempMatrixForQuat, bufferBone.scaling);

                mat4.multiply(this.animationTempMatrix, this.animationTempMatrix, this.animationTempMatrixForQuat);
            }

            mat4.copy(resultBuffer.boneMatrices[bone.name], this.animationTempMatrix);
        }
    }
}
