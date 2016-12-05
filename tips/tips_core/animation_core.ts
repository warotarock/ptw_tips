
// bezier curve data type
interface IPOBezPoint {
    [n: number]: float;
}

interface IPOBezTriple {
    [n: number]: IPOBezPoint;
}

interface IPOBezTripleList {
    [n: number]: IPOBezTriple;
    length: int;
}

enum IPOCurveIPOTypes {
    Liner = 1,
    Bezier = 2
}

// InterPOlation curve: combination of bezier curve for animation
class IPOCurve {
    ipoType = IPOCurveIPOTypes.Bezier;
    lastTime = 0.0;
    lastIndex = 0;
    curve: IPOBezTripleList = null;
}

// combination of bezier curve for object animation
class IPOObjectAnimation {
    locX: IPOCurve = null;
    locY: IPOCurve = null;
    locZ: IPOCurve = null;
    rotationX: IPOCurve = null;
    rotationY: IPOCurve = null;
    quatZ: IPOCurve = null;
    scaleX: IPOCurve = null;
    scaleY: IPOCurve = null;
    scaleZ: IPOCurve = null;
}

// combination of bezier curve for bone animation
class IPOBoneAnimationBone {
    locX: IPOCurve = null;
    locY: IPOCurve = null;
    locZ: IPOCurve = null;
    quatX: IPOCurve = null;
    quatY: IPOCurve = null;
    quatZ: IPOCurve = null;
    quatW: IPOCurve = null;
    scaleX: IPOCurve = null;
    scaleY: IPOCurve = null;
    scaleZ: IPOCurve = null;
}

// set of IPOAnimationBone for bone animation
interface IPOBoneAnimation {
    [n: string]: IPOBoneAnimationBone;
}

// bone animation stuff
class BoneAnimationBone {
    name: string;
    parent: int;
    matrix: Mat4;
}

class BoneAnimationBufferBone {
    transtarion = vec3.fromValues(0.0, 0.0, 0.0);
    quaternion = quat.fromValues(0.0, 0.0, 0.0, 1.0);
    scaling = vec3.fromValues(1.0, 1.0, 1.0);
}

class BoneAnimationBuffer {
    bones: Dictionary<BoneAnimationBufferBone> = null;
}

class BoneAnimationMatrixBuffer {
    animatedBoneMatrixDictionary: Dictionary<Mat4> = null;
    animatedBoneMatrixList: List<Mat4> = null;
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

    private cuberoot(x: float): float {
        var res = Math.pow(Math.abs(x), 1.0 / 3.0);
        return (x >= 0) ? res : -res;
    }

    private solveQuadraticEquation(solution: Vec3, a: float, b: float, c: float) {

        var d: float;
        var x1: float;
        var x2: float;

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

        var PI: float = 3.14159265358979323846264;
        var p: float;
        var q: float;
        var t: float;
        var a3: float;
        var b3: float;

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
            q = this.cuberoot(q);
            solution[0] = 2 * q - b;
            solution[1] = -q - b;
            solution[2] = -1;
        }
        else if (a > 0) {
            var sign = 1;
            if (q <= 0) { sign = -1; }
            a3 = this.cuberoot(q + (sign) * Math.sqrt(a));
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
        var a: float = x4 - 3 * (x3 - x2) - x1;
        var b: float = 3 * (x3 - 2 * x2 + x1);
        var c: float = 3 * (x2 - x1);
        var d: float = x1 - targetX;
        this.solveCubicEquation(this.bezierTempSolution, a, b, c, d);

        // return a root which in original range (>= 0.0 and <= 1.0)
        for (var i = 0; i < 3; i++) {
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
    getIPOCurveValue(ipoCurve: IPOCurve, time: float): float {

        var sectionIndex = 0;
        var timeInSection = 0.0;

        // start from last searched index
        var firstIndex = 0;
        if (time >= ipoCurve.lastTime) {
            firstIndex = ipoCurve.lastIndex;
        }

        // search target section
        for (var i = firstIndex; i < ipoCurve.curve.length; i++) {
            if (ipoCurve.curve[i][1][0] <= time) // x of center point of BezTriple[i]
            {
                timeInSection = time - ipoCurve.curve[i][1][0];
                sectionIndex = i;
            }
            else {
                break;
            }
        }

        ipoCurve.lastTime = time;
        ipoCurve.lastIndex = sectionIndex;

        // interpolation
        var baseValue = ipoCurve.curve[sectionIndex][1][1]; // y of center point of BezTriple[sectionIndex]
        var interpolatedValue = baseValue;
        var ipoRate = 0.0;

        if (sectionIndex < ipoCurve.curve.length - 1) {

            if (ipoCurve.ipoType == IPOCurveIPOTypes.Bezier) {
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
            else if (ipoCurve.ipoType == IPOCurveIPOTypes.Liner) {
                ipoRate = timeInSection / (ipoCurve.curve[sectionIndex + 1][1][0] - ipoCurve.curve[sectionIndex][1][0]);
                interpolatedValue = this.calcInterpolationLiner(
                    ipoCurve.curve[sectionIndex][1][1]
                    , ipoCurve.curve[sectionIndex + 1][1][1]
                    , timeInSection);
            }
        }

        return interpolatedValue;
    }

    getIPOCurveValueIfNotNull(ipoCurve: IPOCurve, time: float, nullAlternateValue: float): float {

        if (ipoCurve == undefined || ipoCurve == null) {
            return nullAlternateValue;
        }

        return this.getIPOCurveValue(ipoCurve, time);
    }

    // bone animation functions
    createBoneAnimationBuffer(bones: List<BoneAnimationBone>): BoneAnimationBuffer {

        var buffer = new BoneAnimationBuffer();
        buffer.bones = new Dictionary<BoneAnimationBufferBone>();

        for (var i = 0; i < bones.length; i++) {
            var namedObject = bones[i];

            var bufferBone = new BoneAnimationBufferBone();
            buffer.bones[namedObject.name] = bufferBone;
        }

        return buffer;
    }

    createBoneMatrixBuffer(bones: List<BoneAnimationBone>): BoneAnimationMatrixBuffer {

        var buffer = new BoneAnimationMatrixBuffer();
        buffer.animatedBoneMatrixDictionary = new Dictionary<Mat4>();
        buffer.animatedBoneMatrixList = new List<Mat4>(bones.length);

        for (var i = 0; i < bones.length; i++) {
            var namedObject = bones[i];

            buffer.animatedBoneMatrixList[i] = mat4.create();
            buffer.animatedBoneMatrixDictionary[namedObject.name] = buffer.animatedBoneMatrixList[i];
        }

        return buffer;
    }

    private animationTempMatrix: Mat4 = mat4.create();
    private animationTempMatrixForQuat: Mat4 = mat4.create();
    private animationTempQuat: Quat4 = quat.create();

    calcBoneAnimation(resultBuffer: BoneAnimationBuffer, bones: List<BoneAnimationBone>, animation: IPOBoneAnimation, time: float) {

        for (var i = 0; i < bones.length; i++) {
            var bone = bones[i];

            if (!DictionaryContainsKey(resultBuffer.bones, bone.name)) {
                continue;
            }

            var resultBone = resultBuffer.bones[bone.name];

            if (DictionaryContainsKey(animation, bone.name)) {

                var animationBone: IPOBoneAnimationBone = animation[bone.name];

                vec3.set(resultBone.Transtarion
                    , this.getIPOCurveValueIfNotNull(animationBone.locX, time, 0.0)
                    , this.getIPOCurveValueIfNotNull(animationBone.locY, time, 0.0)
                    , this.getIPOCurveValueIfNotNull(animationBone.locZ, time, 0.0));

                quat.set(resultBone.Quaternion
                    , this.getIPOCurveValueIfNotNull(animationBone.quatX, time, 0.0)
                    , this.getIPOCurveValueIfNotNull(animationBone.quatY, time, 0.0)
                    , this.getIPOCurveValueIfNotNull(animationBone.quatZ, time, 0.0)
                    , this.getIPOCurveValueIfNotNull(animationBone.quatW, time, 1.0));
                quat.normalize(resultBone.Quaternion, resultBone.Quaternion);

                vec3.set(resultBone.Scaling
                    , this.getIPOCurveValueIfNotNull(animationBone.scaleX, time, 1.0)
                    , this.getIPOCurveValueIfNotNull(animationBone.scaleY, time, 1.0)
                    , this.getIPOCurveValueIfNotNull(animationBone.scaleZ, time, 1.0));
            }
            else {
                vec3.set(resultBone.Transtarion, 0.0, 0.0, 0.0);
                quat.set(resultBone.Quaternion, 0.0, 0.0, 0.0, 1.0);
                vec3.set(resultBone.Scaling, 1.0, 1.0, 1.0);
            }
        }
    }

    blendBoneAnimation(resultBuffer: BoneAnimationBuffer, animationBufferA: BoneAnimationBuffer, animationBufferB: BoneAnimationBuffer, blendRatio: float, option: CalcBoneAnimationOption) {

        for (var boneName in animationBufferA.bones) {

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

            var boneA = animationBufferA.bones[boneName];
            var boneB = animationBufferB.bones[boneName];
            var boneResult = resultBuffer.bones[boneName];

            vec3.lerp(boneResult.Transtarion, boneA.Transtarion, boneB.Transtarion, blendRatio);
            quat.lerp(boneResult.Quaternion, boneA.Quaternion, boneB.Quaternion, blendRatio);
            vec3.lerp(boneResult.Scaling, boneA.Scaling, boneB.Scaling, blendRatio);
        }
    }

    calcBoneMatrix(resultBuffer: BoneAnimationMatrixBuffer, bones: List<BoneAnimationBone>, animationBuffer: BoneAnimationBuffer) {

        for (var i = 0; i < bones.length; i++) {
            var bone = bones[i];

            if (bone.parent != -1) {
                // root parent
                mat4.multiply(this.animationTempMatrix, resultBuffer.animatedBoneMatrixList[bone.parent], bone.matrix);
            }
            else {
                // child
                mat4.copy(this.animationTempMatrix, bone.matrix);
            }

            // calculate matrix
            if (DictionaryContainsKey(animationBuffer.bones, bone.name)) {
                var bufferBone: BoneAnimationBufferBone = animationBuffer.bones[bone.name];

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

            mat4.copy(resultBuffer.animatedBoneMatrixDictionary[bone.name], this.animationTempMatrix);
        }
    }
}
