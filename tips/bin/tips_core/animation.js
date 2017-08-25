var IPOCurveIPOTypes;
(function (IPOCurveIPOTypes) {
    IPOCurveIPOTypes[IPOCurveIPOTypes["Liner"] = 1] = "Liner";
    IPOCurveIPOTypes[IPOCurveIPOTypes["Bezier"] = 2] = "Bezier";
})(IPOCurveIPOTypes || (IPOCurveIPOTypes = {}));
// InterPOlation curve: combination of bezier curve for animation
var IPOCurve = (function () {
    function IPOCurve() {
        this.ipoType = IPOCurveIPOTypes.Bezier;
        this.lastTime = 0.0;
        this.lastIndex = 0;
        this.curve = null;
    }
    return IPOCurve;
}());
// combination of bezier curve for object animation
var IPOObjectAnimation = (function () {
    function IPOObjectAnimation() {
        this.locationX = null;
        this.locationY = null;
        this.locationZ = null;
        this.rotationX = null;
        this.rotationY = null;
        this.rotationZ = null;
        this.scalingX = null;
        this.scalingY = null;
        this.scalingZ = null;
    }
    return IPOObjectAnimation;
}());
// combination of bezier curve for bone animation
var IPOBoneAnimationBone = (function () {
    function IPOBoneAnimationBone() {
        this.locX = null;
        this.locY = null;
        this.locZ = null;
        this.quatX = null;
        this.quatY = null;
        this.quatZ = null;
        this.quatW = null;
        this.scaleX = null;
        this.scaleY = null;
        this.scaleZ = null;
    }
    return IPOBoneAnimationBone;
}());
// bone animation stuff
var BoneAnimationBone = (function () {
    function BoneAnimationBone() {
    }
    return BoneAnimationBone;
}());
var BoneAnimationBufferBone = (function () {
    function BoneAnimationBufferBone() {
        this.transtarion = vec3.fromValues(0.0, 0.0, 0.0);
        this.quaternion = quat.fromValues(0.0, 0.0, 0.0, 1.0);
        this.scaling = vec3.fromValues(1.0, 1.0, 1.0);
    }
    return BoneAnimationBufferBone;
}());
var BoneAnimationBuffer = (function () {
    function BoneAnimationBuffer() {
        this.bones = null;
    }
    return BoneAnimationBuffer;
}());
var BoneAnimationMatrixBuffer = (function () {
    function BoneAnimationMatrixBuffer() {
        this.animatedBoneMatrixDictionary = null;
        this.animatedBoneMatrixList = null;
    }
    return BoneAnimationMatrixBuffer;
}());
var BoneAnimationFilterType;
(function (BoneAnimationFilterType) {
    BoneAnimationFilterType[BoneAnimationFilterType["SpecifyTarget"] = 1] = "SpecifyTarget";
    BoneAnimationFilterType[BoneAnimationFilterType["ExcludeTarget"] = 2] = "ExcludeTarget";
})(BoneAnimationFilterType || (BoneAnimationFilterType = {}));
var CalcBoneAnimationOption = (function () {
    function CalcBoneAnimationOption() {
        this.boneNameFilterType = BoneAnimationFilterType.SpecifyTarget;
        this.boneNameFilter = new Dictionary();
    }
    return CalcBoneAnimationOption;
}());
var AnimationSolver = (function () {
    function AnimationSolver() {
        // Bezier curve solver functions
        this.bezierTempSolution = vec3.fromValues(0.0, 0.0, 0.0);
        this.animationTempMatrix = mat4.create();
        this.animationTempMatrixForQuat = mat4.create();
        this.animationTempQuat = quat.create();
    }
    AnimationSolver.prototype.cuberoot = function (x) {
        var res = Math.pow(Math.abs(x), 1.0 / 3.0);
        return (x >= 0) ? res : -res;
    };
    AnimationSolver.prototype.solveQuadraticEquation = function (solution, a, b, c) {
        var d;
        var x1;
        var x2;
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
    };
    AnimationSolver.prototype.solveCubicEquation = function (solution, a, b, c, d) {
        var PI = 3.14159265358979323846264;
        var p;
        var q;
        var t;
        var a3;
        var b3;
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
            if (q <= 0) {
                sign = -1;
            }
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
    };
    AnimationSolver.prototype.calcBezierTimeInSection = function (x1, x2, x3, x4, targetX) {
        // calculate time of x position of IPO curve
        this.bezierTempSolution[0] = 0.0;
        this.bezierTempSolution[1] = 0.0;
        this.bezierTempSolution[2] = 0.0;
        var a = x4 - 3 * (x3 - x2) - x1;
        var b = 3 * (x3 - 2 * x2 + x1);
        var c = 3 * (x2 - x1);
        var d = x1 - targetX;
        this.solveCubicEquation(this.bezierTempSolution, a, b, c, d);
        // return a root which in original range (>= 0.0 and <= 1.0)
        for (var i = 0; i < 3; i++) {
            if (this.bezierTempSolution[i] >= 0.0 && this.bezierTempSolution[i] <= 1.0) {
                return this.bezierTempSolution[i];
            }
        }
        return 0.0;
    };
    AnimationSolver.prototype.calcInterpolationLiner = function (x1, x2, t) {
        return x1 + (x2 - x1) * t;
    };
    AnimationSolver.prototype.calcInterpolationBezier = function (x1, x2, x3, x4, t) {
        return (1 - t) * (1 - t) * (1 - t) * x1 +
            3 * (1 - t) * (1 - t) * t * x2 +
            3 * (1 - t) * t * t * x3 +
            t * t * t * x4;
    };
    // IPOCurve value functions
    AnimationSolver.prototype.getIPOCurveValue = function (ipoCurve, time) {
        var sectionIndex = 0;
        var timeInSection = 0.0;
        // start from last searched index
        var firstIndex = 0;
        if (time >= ipoCurve.lastTime) {
            firstIndex = ipoCurve.lastIndex;
        }
        // search target section
        for (var i = firstIndex; i < ipoCurve.curve.length; i++) {
            if (ipoCurve.curve[i][1][0] <= time) {
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
                ipoRate = this.calcBezierTimeInSection(ipoCurve.curve[sectionIndex][1][0], ipoCurve.curve[sectionIndex][2][0], ipoCurve.curve[sectionIndex + 1][0][0], ipoCurve.curve[sectionIndex + 1][1][0], time);
                interpolatedValue = this.calcInterpolationBezier(ipoCurve.curve[sectionIndex][1][1], ipoCurve.curve[sectionIndex][2][1], ipoCurve.curve[sectionIndex + 1][0][1], ipoCurve.curve[sectionIndex + 1][1][1], ipoRate);
            }
            else if (ipoCurve.ipoType == IPOCurveIPOTypes.Liner) {
                ipoRate = timeInSection / (ipoCurve.curve[sectionIndex + 1][1][0] - ipoCurve.curve[sectionIndex][1][0]);
                interpolatedValue = this.calcInterpolationLiner(ipoCurve.curve[sectionIndex][1][1], ipoCurve.curve[sectionIndex + 1][1][1], ipoRate);
            }
        }
        return interpolatedValue;
    };
    AnimationSolver.prototype.getIPOCurveValueIfNotNull = function (ipoCurve, time, defaultValue) {
        if (ipoCurve == undefined || ipoCurve == null) {
            return defaultValue;
        }
        return this.getIPOCurveValue(ipoCurve, time);
    };
    // bone animation functions
    AnimationSolver.prototype.createBoneAnimationBuffer = function (bones) {
        var buffer = new BoneAnimationBuffer();
        buffer.bones = new Dictionary();
        for (var i = 0; i < bones.length; i++) {
            var namedObject = bones[i];
            var bufferBone = new BoneAnimationBufferBone();
            buffer.bones[namedObject.name] = bufferBone;
        }
        return buffer;
    };
    AnimationSolver.prototype.createBoneMatrixBuffer = function (bones) {
        var buffer = new BoneAnimationMatrixBuffer();
        buffer.animatedBoneMatrixDictionary = new Dictionary();
        buffer.animatedBoneMatrixList = new List(bones.length);
        for (var i = 0; i < bones.length; i++) {
            var namedObject = bones[i];
            buffer.animatedBoneMatrixList[i] = mat4.create();
            buffer.animatedBoneMatrixDictionary[namedObject.name] = buffer.animatedBoneMatrixList[i];
        }
        return buffer;
    };
    AnimationSolver.prototype.calcBoneAnimation = function (resultBuffer, bones, animation, time) {
        for (var i = 0; i < bones.length; i++) {
            var bone = bones[i];
            if (!DictionaryContainsKey(resultBuffer.bones, bone.name)) {
                continue;
            }
            var resultBone = resultBuffer.bones[bone.name];
            if (DictionaryContainsKey(animation, bone.name)) {
                var animationBone = animation[bone.name];
                vec3.set(resultBone.transtarion, this.getIPOCurveValueIfNotNull(animationBone.locX, time, 0.0), this.getIPOCurveValueIfNotNull(animationBone.locY, time, 0.0), this.getIPOCurveValueIfNotNull(animationBone.locZ, time, 0.0));
                quat.set(resultBone.quaternion, this.getIPOCurveValueIfNotNull(animationBone.quatX, time, 0.0), this.getIPOCurveValueIfNotNull(animationBone.quatY, time, 0.0), this.getIPOCurveValueIfNotNull(animationBone.quatZ, time, 0.0), this.getIPOCurveValueIfNotNull(animationBone.quatW, time, 1.0));
                quat.normalize(resultBone.quaternion, resultBone.quaternion);
                vec3.set(resultBone.scaling, this.getIPOCurveValueIfNotNull(animationBone.scaleX, time, 1.0), this.getIPOCurveValueIfNotNull(animationBone.scaleY, time, 1.0), this.getIPOCurveValueIfNotNull(animationBone.scaleZ, time, 1.0));
            }
            else {
                vec3.set(resultBone.transtarion, 0.0, 0.0, 0.0);
                quat.set(resultBone.quaternion, 0.0, 0.0, 0.0, 1.0);
                vec3.set(resultBone.scaling, 1.0, 1.0, 1.0);
            }
        }
    };
    AnimationSolver.prototype.blendBoneAnimation = function (resultBuffer, animationBufferA, animationBufferB, blendRatio, option) {
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
    };
    AnimationSolver.prototype.calcBoneMatrix = function (resultBuffer, bones, animationBuffer) {
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
                var bufferBone = animationBuffer.bones[bone.name];
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
    };
    return AnimationSolver;
}());
