
namespace SampleShaders {

    export class PlainShader extends RenderShader {

        aPosition = -1;
        aNormal = -1;
        aTexCoord = -1;

        uTexture0: WebGLUniformLocation = null;

        initializeVertexSourceCode() {

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
        }

        initializeFragmentSourceCode() {

            this.fragmentShaderSourceCode = ''
                + this.floatPrecisionDefinitionCode

                + 'varying vec3 vNormal;'
                + 'varying vec2 vTexCoord;'

                + 'uniform sampler2D uTexture0;'

                + 'void main(void) {'
                + '    gl_FragColor = texture2D(uTexture0, vTexCoord);'
                + '}';
        }

        initializeAttributes() {

            this.initializeAttributes_RenderShader();
            this.initializeAttributes_BasicShader();
        }

        initializeAttributes_BasicShader() {

            this.aPosition = this.getAttribLocation('aPosition');
            this.aNormal = this.getAttribLocation('aNormal');
            this.aTexCoord = this.getAttribLocation('aTexCoord');

            this.uTexture0 = this.getUniformLocation('uTexture0');
        }

        setBuffers(model: RenderModel, images: List<RenderImage>) {

            let gl = this.gl;

            gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);

            this.enableVertexAttributes();
            this.resetVertexAttribPointerOffset();

            this.vertexAttribPointer(this.aPosition, 3, gl.FLOAT, model.vertexDataStride);
            this.vertexAttribPointer(this.aNormal, 3, gl.FLOAT, model.vertexDataStride);
            this.vertexAttribPointer(this.aTexCoord, 2, gl.FLOAT, model.vertexDataStride);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, images[0].texture);
            gl.uniform1i(this.uTexture0, 0);
        }
    }
}