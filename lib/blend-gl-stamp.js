
/**
 Library for merging images using WebGL. Currently only has support for
 merging images with one shader that uses a blend function similar to 
 Photoshop's 'darken' blend mode (shader code in vsStr and fsStr below).
 I will add some more filters if I have time! / Jimmy
 */
StampGL = function() {
	
	// Create a canvas and WebGL context
	var canvas = document.createElement("canvas");
	var gl = WebGLUtils.setupWebGL2D(canvas);
	
	// If gl is null, WebGL is unavailable
	// Let the mergeImages function throw an exception to indicate this
	if (!gl) {
		return {
			mergeImages:function() { throw "WebGL not available"; }
		};
	}
	
	// Vertex shader
	var vsStr = [
				 "precision mediump float;",
				 "attribute vec2 position;",
				 "attribute vec2 texCoord;",
				 "varying vec2 uv;",
				 
				 "void main(void) {",
					// Flip y, textures are upside down by default
					"gl_Position = vec4(position.x, -position.y, 0.0, 1.0);",
					"uv = texCoord;",
				 "}"
				 ].join("\n");
	
	// Fragment shader
	var fsStr1 = [
				  "precision mediump float;",
				  "uniform sampler2D tex1, tex2;",
				  "uniform vec2 textureSize;",
				  "varying vec2 uv;",
                 
				  "void main() {",
					"vec2 onePixel = vec2(1.0, 1.0) / textureSize;",
					"vec4 c = texture2D(tex1, uv);",
					"if (c.r == 1.0 && c.g == 1.0 && c.g == 1.0) { gl_FragColor = c; return; }",
					"c = texture2D(tex1, uv + onePixel * vec2( 0, -1));",
					"if (c.r == 1.0 && c.g == 1.0 && c.g == 1.0) { gl_FragColor = c; return; }",
					"c = texture2D(tex1, uv + onePixel * vec2( -1, 0));",
					"if (c.r == 1.0 && c.g == 1.0 && c.g == 1.0) { gl_FragColor = c; return; }",
					"c = texture2D(tex1, uv + onePixel * vec2( 0, 1));",
					"if (c.r == 1.0 && c.g == 1.0 && c.g == 1.0) { gl_FragColor = c; return; }",
					"c = texture2D(tex1, uv + onePixel * vec2( 1, 0));",
					"if (c.r == 1.0 && c.g == 1.0 && c.g == 1.0) { gl_FragColor = c; return; }",
					"gl_FragColor = texture2D(tex1, uv);",
				  "}"
				  ].join("\n");
	
	// Fragment shader
	var fsStr2 = [
				  "precision mediump float;",
				  "uniform sampler2D tex1, tex2;",
				  "uniform vec2 textureSize;",
				  "varying vec2 uv;",
				  
				  "void main() {",
				  "vec2 onePixel = vec2(1.0, 1.0) / textureSize;",
				  "vec4 px = texture2D(tex2, uv);",
				  "vec4 c = texture2D(tex1, uv);",
				  "if (c.r < 1.0 || c.g < 1.0 || c.g < 1.0) { gl_FragColor = px; return; }",
				  "c = texture2D(tex1, uv + onePixel * vec2( 0, -1));",
				  "if (c.r < 1.0 || c.g < 1.0 || c.g < 1.0) { gl_FragColor = px; return; }",
				  "c = texture2D(tex1, uv + onePixel * vec2( -1, 0));",
				  "if (c.r < 1.0 || c.g < 1.0 || c.g < 1.0) { gl_FragColor = px; return; }",
				  "c = texture2D(tex1, uv + onePixel * vec2( 0, 1));",
				  "if (c.r < 1.0 || c.g < 1.0 || c.g < 1.0) { gl_FragColor = px; return; }",
				  "c = texture2D(tex1, uv + onePixel * vec2( 1, 0));",
				  "if (c.r < 1.0 || c.g < 1.0 || c.g < 1.0) { gl_FragColor = px; return; }",
				  "gl_FragColor = texture2D(tex1, uv);",
				  "}"
				  ].join("\n");
	
	// Create the shader program
	var prog1 = WebGLUtils.createProgram(gl, vsStr, fsStr1);
	
	// Store the attribute and uniform locations as properties of the program
	prog1.attrLocPosition = gl.getAttribLocation(prog1, 'position');
	prog1.attrLocTexCoord = gl.getAttribLocation(prog1, 'texCoord');
	prog1.unifLocTex1 = gl.getUniformLocation(prog1, 'tex1');
    prog1.unifLocTex2 = gl.getUniformLocation(prog1, 'tex2');
	prog1.unifLocTextureSize = gl.getUniformLocation(prog1, 'textureSize');
	
	// Create the shader program
	var prog2 = WebGLUtils.createProgram(gl, vsStr, fsStr2);
	
	// Store the attribute and uniform locations as properties of the program
	prog2.attrLocPosition = gl.getAttribLocation(prog2, 'position');
	prog2.attrLocTexCoord = gl.getAttribLocation(prog2, 'texCoord');
	prog2.unifLocTex1 = gl.getUniformLocation(prog2, 'tex1');
    prog2.unifLocTex2 = gl.getUniformLocation(prog2, 'tex2');
	prog2.unifLocTextureSize = gl.getUniformLocation(prog2, 'textureSize');

	// Interleaved vertex and texture coordinate data
	var data = [-1, -1,
				 0,  0,
				 1, -1,
				 1,  0,
				-1,  1,
				 0,  1,
				 1,  1,
				 1,  1];
	
	// Create a buffer for the vertex and texture coordinate data
	var vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	
	// Create two textures to use when blending
	var baseTex = WebGLUtils.createTexture(gl);
	var overlayTex = WebGLUtils.createTexture(gl);

	/**
	 Private function that uses the above shader program to merge two images.
	 */
	var shrink = function(img1, img2) {
		
		// Resize the canvas, if necessary (use the size of the first image)
		if (canvas.width != img1.width ||
			canvas.height != img1.height) {
			canvas.width = img1.width;
			canvas.height = img1.height;
			gl.viewport(0, 0, canvas.width, canvas.height);
		}
		// Activate shaders
		gl.useProgram(prog1);
		
		// Bind and create base texture
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, baseTex);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img1);
        
        // Bind and create base texture
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, overlayTex);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img2);
		
		// Bind vertex buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
		
		// Send uniform values to GPU
		gl.uniform1i(prog1.unifLocTex1, 0);
		gl.uniform1i(prog1.unifLocTex2, 1);
		gl.uniform2f(prog1.unifLocTextureSize, img1.width, img1.height);
        
		// Send vertex attributes to GPU
		gl.enableVertexAttribArray(prog1.attrLocPosition);
		gl.enableVertexAttribArray(prog1.attrLocTexCoord);
		gl.vertexAttribPointer(prog1.attrLocPosition, 2, gl.FLOAT, false, 16, 0);
		gl.vertexAttribPointer(prog1.attrLocTexCoord, 2, gl.FLOAT, false, 16, 8);
		
		// Render the image
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
		
		// Unbind textures and buffers
		gl.bindBuffer(gl.ARRAY_BUFFER, null);
		gl.bindTexture(gl.TEXTURE_2D, null);
		
		// The blend result is rendered to canvas, return it
		/*
		 TODO:
		 Render intermediate results to framebuffer instead, should be more efficient
		 */
		return canvas;
	}
	
	/**
	 Private function that uses the above shader program to merge two images.
	 */
	var grow = function(img1, img2) {
		
		// Resize the canvas, if necessary (use the size of the first image)
		if (canvas.width != img1.width ||
			canvas.height != img1.height) {
			canvas.width = img1.width;
			canvas.height = img1.height;
			gl.viewport(0, 0, canvas.width, canvas.height);
		}
		// Activate shaders
		gl.useProgram(prog2);
		
		// Bind and create base texture
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, baseTex);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img1);
        
        // Bind and create base texture
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, overlayTex);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img2);
		
		// Bind vertex buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
		
		// Send uniform values to GPU
		gl.uniform1i(prog2.unifLocTex1, 0);
		gl.uniform1i(prog2.unifLocTex2, 1);
		gl.uniform2f(prog2.unifLocTextureSize, img1.width, img1.height);
        
		// Send vertex attributes to GPU
		gl.enableVertexAttribArray(prog2.attrLocPosition);
		gl.enableVertexAttribArray(prog2.attrLocTexCoord);
		gl.vertexAttribPointer(prog2.attrLocPosition, 2, gl.FLOAT, false, 16, 0);
		gl.vertexAttribPointer(prog2.attrLocTexCoord, 2, gl.FLOAT, false, 16, 8);
		
		// Render the image
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
		
		// Unbind textures and buffers
		gl.bindBuffer(gl.ARRAY_BUFFER, null);
		gl.bindTexture(gl.TEXTURE_2D, null);
		
		// The blend result is rendered to canvas, return it
		/*
		 TODO:
		 Render intermediate results to framebuffer instead, should be more efficient
		 */
		return canvas;
	}

	// Return the public interface
	return {
		shrink:shrink,
		grow:grow,
	};
}();

	

	