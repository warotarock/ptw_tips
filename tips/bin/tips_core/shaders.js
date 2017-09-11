var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var SampleShaders;
(function (SampleShaders) {
    var PlainShader = (function (_super) {
        __extends(PlainShader, _super);
        function PlainShader() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.aPosition = -1;
            _this.aNormal = -1;
            _this.aTexCoord = -1;
            _this.uTexture0 = null;
            return _this;
        }
        PlainShader.prototype.initializeVertexSourceCode = function () {
            this.vertexShaderSourceCode = ''
                + this.floatPrecisionDefinitionCode
                + 'attribute vec3 aPosition;'
                + 'attribute vec3 aNormal;'
                + 'attribute vec2 aTexCoord;'
                + 'uniform mat4 uPMatrix;'
                + 'uniform mat4 uMVMatrix;'
                + 'varying vec3 vNormal;'
                + 'varying vec2 vTexCoord;'
                + 'void main(void) {'
                + '	   gl_Position = uPMatrix * uMVMatrix * vec4(aPosition, 1.0);'
                + '    vNormal = aNormal;'
                + '    vTexCoord = aTexCoord;'
                + '}';
        };
        PlainShader.prototype.initializeFragmentSourceCode = function () {
            this.fragmentShaderSourceCode = ''
                + this.floatPrecisionDefinitionCode
                + 'varying vec3 vNormal;'
                + 'varying vec2 vTexCoord;'
                + 'uniform sampler2D uTexture0;'
                + 'void main(void) {'
                + '    gl_FragColor = texture2D(uTexture0, vTexCoord);'
                + '}';
        };
        PlainShader.prototype.initializeAttributes = function (gl) {
            this.initializeAttributes_RenderShader(gl);
            this.initializeAttributes_BasicShader(gl);
        };
        PlainShader.prototype.initializeAttributes_BasicShader = function (gl) {
            this.aPosition = this.getAttribLocation('aPosition', gl);
            this.aNormal = this.getAttribLocation('aNormal', gl);
            this.aTexCoord = this.getAttribLocation('aTexCoord', gl);
            this.uTexture0 = this.getUniformLocation('uTexture0', gl);
        };
        PlainShader.prototype.setBuffers = function (model, images, gl) {
            gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
            this.enableVertexAttributes(gl);
            this.resetVertexAttribPointerOffset();
            this.vertexAttribPointer(this.aPosition, 3, gl.FLOAT, model.vertexDataStride, gl);
            this.vertexAttribPointer(this.aNormal, 3, gl.FLOAT, model.vertexDataStride, gl);
            this.vertexAttribPointer(this.aTexCoord, 2, gl.FLOAT, model.vertexDataStride, gl);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, images[0].texture);
            gl.uniform1i(this.uTexture0, 0);
        };
        return PlainShader;
    }(RenderShader));
    SampleShaders.PlainShader = PlainShader;
})(SampleShaders || (SampleShaders = {}));
