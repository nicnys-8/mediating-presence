
/**
 */
PointCloudRendererX = function(canvas) {
	
	var config = {
		DEPTH_CAM: {
			FOV_X: 58.5,
			FOV_Y: 45.6,
			ASPECT_RATIO: 58.5 / 45.6, // ????
			WIDTH: 160,
			HEIGHT: 120,
			NEAR: 285.63,
			FAR: 4000,
		},
		RGB_CAM: {
			FOV_X: 62.0,
			FOV_Y: 48.6,
			WIDTH: 160,
			HEIGHT:120,
			ASPECT_RATIO: 62.0 / 48.6, // 1.3333,
			NEAR: 531.15,
			FAR: 4000,
		},
		CAMERA_SEPARATION:[25, 0, 0],
	};
	
	// Vertex shader
	var vsStr = [
				 "attribute vec3 aVertexPosition;",
				
				 "uniform mat4 uMVMatrix;",
				 "uniform mat4 uPMatrix;",
				 "uniform mat4 uTexCoordMatrix;",
				 
				 /* Not used atm (values hard coded)
				 "uniform vec2 textureSize;",
				 "uniform float pointSize;",
				  */
				 
				 "uniform vec2 uvScale;",
				 "uniform vec2 uvOffset;",
				 
				 "varying vec2 uv;",
				 "varying vec2 uv2;",
				 
				 "void main(void) {",
				 
				 "const float degToRad = 3.141592653 / 180.0;",
				 "const float fovdx = 58.5 * degToRad;",
				 "const float fovdy = 45.6 * degToRad;",
				 "const float fd = 285.63;",
				 "const float fovcx = 62.0 * degToRad;",
				 "const float fovcy = 48.6 * degToRad;",
				 "const float fc = 531.15;",
				 
				 "float ddx = fd * tan(fovdx / 2.0);",
				 "float ddy = fd * tan(fovdy / 2.0);",
				 "float dcx = fc * tan(fovcx / 2.0);",
				 "float dcy = fc * tan(fovcy / 2.0);",
				 
				 "float x = aVertexPosition.x;",
				 "float y = aVertexPosition.y;",
				 "float z = aVertexPosition.z;",
				 
				 "vec2 p2x = vec2((x - 80.0) / 80.0 * ddx, fd);",
				 "float vx = atan(p2x.x, p2x.y);",
				 "vec2 p3x = vec2(z * sin(vx), z * cos(vx));",
				 "float uvx = (p3x.x + 25.0) * fc / p3x.y;",
				 "uvx = ((uvx / dcx) + 1.0) * 0.5;",
				 
				 "vec2 p2y = vec2((y - 60.0) / 60.0 * ddy, fd);",
				 "float vy = atan(p2y.x, p2y.y);",
				 "vec2 p3y = vec2(z * sin(vy), z * cos(vy));",
				 "float uvy = (p3y.x + 25.0) * fc / p3y.y;",
				 "uvy = ((uvy / dcy) + 1.0) * 0.5;",
					
				 "vec4 pos = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);",
				 "uv = vec2(uvx, uvy);",
				 
				 // "uv = vec2((x + uvOffset.x) * uvScale.x / 160.0, (y + uvOffset.y) * uvScale.y / 120.0);",
				 
				 "vec4 texCoords = uTexCoordMatrix * vec4(aVertexPosition, 1.0);",
				 "uv = texCoords.xy / texCoords.w;",
				 
					"if (z < 1000.0) {",
						"uv2 = vec2((z - 500.0) / 500.0, 0.0);",
					"} else {",
						"uv2 = vec2((z - 1000.0) / 2000.0, 0.0);",
					"}",
					
					// "uv2 = vec2((z - 500.0) / 2000.0, 0.0);",
				 
					"gl_PointSize = (pos.z / pos.w + 1.0) * 3.0;", // * pointSize
				 
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
	
	prog.uMatrixP = gl.getUniformLocation(prog, "uPMatrix");
	prog.uMatrixMV = gl.getUniformLocation(prog, "uMVMatrix");
	prog.uMatrixTC = gl.getUniformLocation(prog, "uTexCoordMatrix");
	
	prog.uVideoTex = gl.getUniformLocation(prog, "tex");
	prog.uHSVTex = gl.getUniformLocation(prog, "hsvTex");
	prog.uBrightness = gl.getUniformLocation(prog, "brightness");
	prog.uUseVideo = gl.getUniformLocation(prog, "useVideo");
	
	prog.uUVScale = gl.getUniformLocation(prog, "uvScale");
	prog.uUVOffset = gl.getUniformLocation(prog, "uvOffset");
	
	// Set black background
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.enable(gl.DEPTH_TEST);
	
	// Create buffers for point cloud data
	var vertexBuffer = gl.createBuffer();
	vertexBuffer.itemSize = 3;
	vertexBuffer.numItems = 0;
	
	
	
	// ****************************************************
	// *** Extra shader program for drawing the frustum ***
	
	var vsStr2 = [
				  "attribute vec3 pos;",
				  "uniform mat4 mat;",
				  "void main(void) {",
				  "gl_Position = mat * vec4(pos, 1.0);",
				  "}",
				  ].join("\n");
	
	var fsStr2 = [
				  "precision mediump float;",
				  "void main(void) {",
				  "gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);",
				  "}",
				  ].join("\n");
	
	// Create the shader program
	var boxProg = WebGLUtils.createProgram(gl, vsStr2, fsStr2);
	
	gl.useProgram(boxProg);
	
	// Store the attribute and uniform locations as properties of the program
	prog.attrPosition = gl.getAttribLocation(boxProg, "pos");
	gl.enableVertexAttribArray(boxProg.attrPosition);
	prog.uMathurman = gl.getUniformLocation(boxProg, "mat");
	
	// Create buffers for point cloud data
	var boxBuffer = gl.createBuffer();
	boxBuffer.itemSize = 3;
	boxBuffer.numItems = 0;
	
	var box = new Float32Array([
								-1, -1, -1,		1, -1, -1,
								1, -1, -1,		1, 1, -1,
								1, 1, -1,		-1, 1, -1,
								-1, 1, -1,		-1, -1, -1,
								
								-1, -1, 1,		1, -1, 1,
								1, -1, 1,		1, 1, 1,
								1, 1, 1,		-1, 1, 1,
								-1, 1, 1,		-1, -1, 1,
								
								-1, -1, -1,		-1, -1, 1,
								1, -1, -1,		1, -1, 1,
								1, 1, -1,		1, 1, 1,
								-1, 1, -1,		-1, 1, 1,
								]);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, boxBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, box, gl.STATIC_DRAW);
	boxBuffer.numItems = box.length / boxBuffer.itemSize;
	
	var boxMat = mat4.create();
	// ****************************************************
	
	
	
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
		
		config.DEPTH_CAM.FOV_X = Number(vec[0]);
		config.DEPTH_CAM.FOV_Y = Number(vec[1]);
		config.DEPTH_CAM.ASPECT_RATIO = config.DEPTH_CAM.FOV_X / config.DEPTH_CAM.FOV_Y;
		recalculateProjection();
		
	};
	this.setUVOffset = function(vec) {
		config.RGB_CAM.FOV_X = Number(vec[0]);
		config.RGB_CAM.FOV_Y = Number(vec[1]);
		config.RGB_CAM.ASPECT_RATIO = config.RGB_CAM.FOV_X / config.RGB_CAM.FOV_Y;
		recalculateProjection();
		
		uvOffset[0] = vec[0];
		uvOffset[1] = vec[1];
	};
	
	this.setCameraSeparation = function(vec) {
		vec3.set(vec, config.CAMERA_SEPARATION);
		recalculateProjection();
	};

	var config = {
		DEPTH_CAM: {
			FOV_X: 58.5,
			FOV_Y: 45.6,
			ASPECT_RATIO: 58.5 / 45.6, // ????
			WIDTH: 160,
			HEIGHT: 120,
			NEAR: 800, // 285.63
			FAR: 2000,
		},
		RGB_CAM: {
			FOV_X: 62.0,
			FOV_Y: 48.6,
			WIDTH: 160,
			HEIGHT:120,
			ASPECT_RATIO: 62.0 / 48.6, // 1.3333,
			NEAR: 800, // 531.15
			FAR: 2000,
		},
		CAMERA_SEPARATION:[-25, 0, 0],
	};
	
	var mUnprojectDepth,
		mCenterBox,
		mRGBCamProj,
		mDepthToRGBCam,
		mCubeToTex,
		mDepthToTex;
	
	function recalculateProjection() {
		// ***************
		// Inverse projection matrix for Kinect depth cam
		mUnprojectDepth = mat4.create();
		mat4.perspective(config.DEPTH_CAM.FOV_Y,
						 config.DEPTH_CAM.ASPECT_RATIO,
						 config.DEPTH_CAM.NEAR,
						 config.DEPTH_CAM.FAR,
						 mUnprojectDepth);
		mat4.inverse(mUnprojectDepth);
		
		mCenterBox = mat4.create();
		mat4.ortho(0, config.DEPTH_CAM.WIDTH,
				   config.DEPTH_CAM.HEIGHT, 0,
				   -config.DEPTH_CAM.NEAR,
				   -config.DEPTH_CAM.FAR,
				   mCenterBox);
		// ***************
		
		
		
		// ***************
		// Matrix for converting depth pixels to texture
		// coordinates in the RGB camera image (test)
		
		mRGBCamProj = mat4.create();
		mat4.perspective(config.RGB_CAM.FOV_Y,
						 config.RGB_CAM.ASPECT_RATIO,
						 config.RGB_CAM.NEAR,
						 config.RGB_CAM.FAR,
						 mRGBCamProj);
		
		mDepthToRGBCam = mat4.create();
		mat4.lookAt([config.CAMERA_SEPARATION[0], config.CAMERA_SEPARATION[1], config.CAMERA_SEPARATION[2]],
					[config.CAMERA_SEPARATION[0], config.CAMERA_SEPARATION[1], config.CAMERA_SEPARATION[2] - 1],
					[0, 1, 0],
					mDepthToRGBCam);

		mCubeToTex = mat4.create();
		mat4.identity(mCubeToTex);
		mat4.translate(mCubeToTex, [0.5, 0.5, 0.5]);
		mat4.scale(mCubeToTex, [0.5, -0.5, 0.5]);
		
		mDepthToTex = mat4.create();
		mat4.identity(mDepthToTex);
		mat4.multiply(mDepthToTex, mCubeToTex, mDepthToTex);
		mat4.multiply(mDepthToTex, mRGBCamProj, mDepthToTex);
		mat4.multiply(mDepthToTex, mDepthToRGBCam, mDepthToTex);
		mat4.multiply(mDepthToTex, mUnprojectDepth, mDepthToTex);
		mat4.multiply(mDepthToTex, mCenterBox, mDepthToTex);
		// ***************
	}
	recalculateProjection();
	
	var testGrej = mat4.create();
	
	// TODO: Add boolean parameter that specifies if requestAnimationFrame should be called?
	this.render = function() {
		
		gl.viewport(0, 0, canvas.width, canvas.height);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		
		gl.useProgram(prog);
		
		mat4.perspective(45, canvas.width / canvas.height, 20.0, 1000.0, pMatrix);
		
		mat4.identity(cameraMatrix);
		mat4.lookAt(eye, lookAt, [0, 1, 0], cameraMatrix);
		mat4.multiply(cameraMatrix, mvMatrix, mvMatrix);
		
		// ***************
		mat4.multiply(pMatrix, mvMatrix, boxMat);
		mat4.multiply(boxMat, mUnprojectDepth, boxMat);
		// ***************
		
		mat4.multiply(mUnprojectDepth, mCenterBox, testGrej);
		mat4.multiply(mvMatrix, testGrej, mvMatrix);
		
		
		gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
		gl.vertexAttribPointer(prog.attrPosition, vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
		
		gl.uniformMatrix4fv(prog.uMatrixP, false, pMatrix);
		gl.uniformMatrix4fv(prog.uMatrixMV, false, mvMatrix);
		gl.uniformMatrix4fv(prog.uMatrixTC, false, mDepthToTex);
		
		gl.uniform1f(prog.uBrightness, brightness);

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.uniform1i(prog.uVideoTex, 0);
		gl.uniform1i(prog.uHSVTex, 1);
		gl.uniform1i(prog.uUseVideo, useVideo);
		
		gl.uniform2fv(prog.uUVScale, uvScale);
		gl.uniform2fv(prog.uUVOffset, uvOffset);
		
		gl.drawArrays(gl.POINTS, 0, vertexBuffer.numItems);
		
		
		
		
		gl.useProgram(boxProg);
		gl.bindBuffer(gl.ARRAY_BUFFER, boxBuffer);
		gl.vertexAttribPointer(prog.attrPosition, boxBuffer.itemSize, gl.FLOAT, false, 0, 0);
		gl.uniformMatrix4fv(prog.uMathurman, false, boxMat);
		gl.drawArrays(gl.LINES, 0, boxBuffer.numItems);
	}
	
	var parallax = 800;
	this.setParallax = function(value) {
		parallax = Number(value);
		
		config.DEPTH_CAM.FAR = parallax;
		config.RGB_CAM.FAR = parallax;
		recalculateProjection();
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
			
			vec3.set(vec3.scale(headPos, 0.5*0.125), eye);
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



