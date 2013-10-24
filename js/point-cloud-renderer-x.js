
/**
 */
PointCloudRendererX = function(canvas) {
	
	// Vertex shader
	var vsStr = [
				 "attribute vec3 aVertexPosition;",
				
				 "uniform mat4 uMVMatrix;",
				 "uniform mat4 uPMatrix;",
			
				 /* Not used atm (values hard coded)
				 "uniform vec2 textureSize;",
				 "uniform float pointSize;",
				  */
				 
				 "uniform vec2 uvScale;",
				 "uniform vec2 uvOffset;",
				 
				 "varying vec2 uv;",
				 "varying vec2 uv2;",
				 
				 "void main(void) {",
				 
					"float x = aVertexPosition.x;",
					"float y = aVertexPosition.y;",
					"float z = aVertexPosition.z;",
				 
					"vec4 pos = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);",
				 
					"uv = vec2((x + uvOffset.x) * uvScale.x / 160.0, (y + uvOffset.y) * uvScale.y / 120.0);",
					
					"if (z < 1000.0) {",
						"uv2 = vec2((z - 500.0) / 500.0, 0.0);",
					"} else {",
						"uv2 = vec2((z - 1000.0) / 2000.0, 0.0);",
					"}",
					
					// "uv2 = vec2((z - 500.0) / 2000.0, 0.0);",
				 
					"gl_PointSize = -(pos.z / pos.w - 1.0) * 8.0;", // * pointSize
				 
					"if (z == 0.0) {",
						"gl_Position = vec4(0, 0, 10000, 1);", // this will be clipped(?)
					"} else {",
						"gl_Position = pos;",
					"}",
				 "}",
				 ].join("\n");
	
	// Fragment shader
	var fsStr = [
				 "precision mediump float;",
				 "uniform sampler2D tex;",
				 "uniform sampler2D hsvTex;",
				 
				 "uniform bool useVideo;",
				 "uniform float brightness;",
				 
				 "varying vec2 uv;",
				 "varying vec2 uv2;",
				 
				 "void main(void) {",
					"if (useVideo) {",
						"gl_FragColor = vec4(texture2D(tex, uv).rgb * brightness, 1.0);",
					"} else {",
						"gl_FragColor = texture2D(hsvTex, uv2);",
					"}",
				 "}",
				  ].join("\n");
		
	// Get the WebGL context
	var gl = WebGLUtils.setupWebGL(canvas);
	
	// Create the shader program
	var prog = WebGLUtils.createProgram(gl, vsStr, fsStr);
	
	// Create a texture
	var texture = WebGLUtils.createTexture(gl);
	
	gl.useProgram(prog);
		
	// Store the attribute and uniform locations as properties of the program
	prog.attrPosition = gl.getAttribLocation(prog, "aVertexPosition");
	gl.enableVertexAttribArray(prog.attrPosition);
	
	prog.unifMatrixP = gl.getUniformLocation(prog, "uPMatrix");
	prog.unifMatrixMV = gl.getUniformLocation(prog, "uMVMatrix");
	prog.unifTex = gl.getUniformLocation(prog, "tex");
	prog.unifHSVTex = gl.getUniformLocation(prog, "hsvTex");
	prog.unifBrightness = gl.getUniformLocation(prog, "brightness");
	prog.unifUseVideo = gl.getUniformLocation(prog, "useVideo");
	
	prog.unifUVScale = gl.getUniformLocation(prog, "uvScale");
	prog.unifUVOffset = gl.getUniformLocation(prog, "uvOffset");
	
	// Set black background
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.enable(gl.DEPTH_TEST);
	
	// Create buffers for point cloud data
	var vertexBuffer = gl.createBuffer();
	vertexBuffer.itemSize = 3;
	vertexBuffer.numItems = 0;
	
	var mvMatrix = mat4.create(),
		pMatrix = mat4.create(),
		cameraMatrix = mat4.create();
	
	mat4.identity(mvMatrix);
	mat4.identity(pMatrix);
	mat4.identity(cameraMatrix);
	
	var eye = vec3.create([0, 0, 0]),
		lookAt = vec3.create([0, 0, 0]);
	
	this.setModelViewMatrix = function(mat) {
		mat4.set(mat, mvMatrix);
	};
	this.setLookAtPoint = function(vec) {
		vec3.set(vec, lookAt);
	}
	
	this.bufferData = function(vertices) {
		gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);
		vertexBuffer.numItems = vertices.length / vertexBuffer.itemSize;
	}
	
	this.setTexture = function(image) {
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		
		// instanceof CanvasImageData or something
		if (image.width && image.height && image.data) {
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, image.width, image.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(image.data.buffer));
		} else {
			// TODO: Should be Canvas or Image here, but add check to make sure
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
		}
	}
	
	var hsv2rgb = function(h, s, v) {
		
		var rgb, H, i, data;
		
		if (s === 0) {
			rgb = [v, v, v];
		} else {
			
			H = h / 60.0;
			i = Math.floor(H);
			data = [v * (1.0 - s),
					v * (1.0 - s * (H - i)),
					v * (1.0 - s * (1.0 - (H - i)))];
			
			switch(i) {
				case 0: rgb = [v, data[2], data[0]]; break;
				case 1: rgb = [data[1], v, data[0]]; break;
				case 2: rgb = [data[0], v, data[2]]; break;
				case 3: rgb = [data[0], data[1], v]; break;
				case 4: rgb = [data[2], data[0], v]; break;
				default: rgb = [v, data[0], data[1]]; break;
			}
		}
		return rgb;
	};
	
	var hsvTexData = function(width) {
		var data = new Uint8Array(width * 4),
			h, s, v, rgb,
			scale = 360.0 / width;
		for (var i = 0; i < width; i++) {
			h = i * scale;
			s = 1.0;
			v = 1.0; // - i / width * 0.5;
			rgb = hsv2rgb(h, s, v);
			data[i * 4 + 0] = Math.round(255 * rgb[0]);
			data[i * 4 + 1] = Math.round(255 * rgb[1]);
			data[i * 4 + 2] = Math.round(255 * rgb[2]);
			data[i * 4 + 3] = 255;
		}
		return data;
	}(512);
	
	var hsvTexture = WebGLUtils.createTexture(gl);
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, hsvTexture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 512, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, hsvTexData);
	gl.activeTexture(gl.TEXTURE0);
	
	var brightness = 1.0,
		useVideo = false;
	
	this.setBrightness = function(value) {
		brightness = value;
	}
	
	this.setUseVideo = function(value) {
		useVideo = value;
	}
	
	var uvScale = [1, 1],
		uvOffset = [0, 0];
	
	this.setUVScale = function(vec) {
		uvScale[0] = vec[0];
		uvScale[1] = vec[1];
	}
	this.setUVOffset = function(vec) {
		uvOffset[0] = vec[0];
		uvOffset[1] = vec[1];
	}
	
	
	// TODO: Add boolean parameter that specifies if requestAnimationFrame should be called?
	this.render = function() {
		
		gl.viewport(0, 0, canvas.width, canvas.height);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		
		mat4.perspective(45, canvas.width / canvas.height, 50.0, 1000.0, pMatrix);
		
		mat4.identity(cameraMatrix);
		mat4.lookAt(eye, lookAt, [0, 1, 0], cameraMatrix);
		mat4.multiply(cameraMatrix, mvMatrix, mvMatrix);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
		gl.vertexAttribPointer(prog.attrPosition, vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
		
		gl.uniformMatrix4fv(prog.unifMatrixP, false, pMatrix);
		gl.uniformMatrix4fv(prog.unifMatrixMV, false, mvMatrix);
		gl.uniform1f(prog.unifBrightness, brightness);

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.uniform1i(prog.unifTex, 0);
		gl.uniform1i(prog.unifHSVTex, 1);
		gl.uniform1i(prog.unifUseVideo, useVideo);
		
		gl.uniform2fv(prog.unifUVScale, uvScale);
		gl.uniform2fv(prog.unifUVOffset, uvOffset);
		
		gl.drawArrays(gl.POINTS, 0, vertexBuffer.numItems);
	}
	
	var parallax = 0.33;
	this.setParallax = function(value) {
		parallax = Number(value);
	}
	
	var prevHeadPos = null;
	this.headMoved = function(headPos) {
		
		if (prevHeadPos != null) {
			var delta = vec3.create();
			var delta = vec3.subtract(headPos, prevHeadPos, delta);
			vec3.scale(delta, parallax);
			delta[2] = 0; // *= 0.1;
			vec3.add(eye, delta);
			vec3.set(headPos, prevHeadPos);
		} else {
			prevHeadPos = vec3.create(headPos);
		}
	}
	
	this.resetCamera = function() {
		vec3.set([0, 0, 0], eye);
	}
	
	this.destroy = function() {
		
		var shaders = gl.getAttachedShaders(prog);
		for (var i = 0; i < shaders.length; i++) {
			gl.deleteShader(shaders[i]);
		}
		gl.deleteProgram(prog);
		gl.deleteBuffer(vertexBuffer);
		gl.deleteTexture(texture);
		gl.deleteTexture(hsvTexture);
		
		gl = null;
		prog = null;
		canvas = null;
	};
};



