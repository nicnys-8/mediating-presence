
/**
 */
PointCloudRendererX = function(canvas) {
	
	// Vertex shader
	var vsStr = [
				 "attribute vec3 aVertexPosition;",
				
				 "uniform mat4 uMVMatrix;",
				 "uniform mat4 uPMatrix;",
				 
				 /*
				  // Not used atm (values hard coded)
				 "uniform vec2 textureSize;",
				 "uniform float pointSize;",
				 "uniform float uvOffset;",
				  */
				 
				 "varying vec2 uv;",
				 
				 "void main(void) {",
					"vec4 pos = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);",
					"float x = aVertexPosition.x;",
					"float y = -aVertexPosition.y;",
				 
					"if (x < 80.0) {", // textureSize.width / 2.0
						"x += 6.0 * x / 80.0;",
					"} else {",
						"x += 6.0 * (2.0 - x / 80.0);", // uvOffset
					"}",
				
					"uv = vec2(x / 160.0, y / 120.0);",
					"gl_PointSize = -(pos.z / pos.w - 1.0) * 5.0;", // * pointSize
					"gl_Position = pos;",
				 "}",
				 ].join("\n");
	
	// Fragment shader
	var fsStr = [
				 "precision mediump float;",
				 "uniform sampler2D tex;",
				 "uniform float brightness;",
				 "varying vec2 uv;",
				 "void main(void) {",
					"gl_FragColor = vec4(texture2D(tex, uv).rgb * brightness, 1.0);",
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
	prog.unifBrightness = gl.getUniformLocation(prog, "brightness");
	
	// Set black background
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.enable(gl.DEPTH_TEST);
	
	// Create buffers for point cloud data
	var vertexBuffer = gl.createBuffer();
	vertexBuffer.itemSize = 3;
	vertexBuffer.numItems = 0;
	
	var mvMatrix = mat4.create();
	var pMatrix = mat4.create();
	
	var pcRotationMatrix = mat4.create();
	mat4.identity(pcRotationMatrix);
	
	var degToRad = function(degrees) {
		return degrees * Math.PI / 180;
	}
	
	this.bufferData = function(vertices) {
		gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
		vertexBuffer.numItems = vertices.length / 3;
	}
	
	this.setTexture = function(imageData) {
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, imageData.width, imageData.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(imageData.data));
		// gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
	}
	
	var cor = vec3.create([0, 0, 0]),
		pos = vec3.create([0, 0, 0]);
	
	this.setCenterOfRotation = function(vec) {
		cor[0] = vec[0];
		cor[1] = vec[1];
		cor[2] = vec[2];
	}
	this.setPosition = function(vec) {
		pos[0] = vec[0];
		pos[1] = vec[1];
		pos[2] = vec[2];
	}
	
	var brightness = 1.0;
	this.setBrightness = function(value) {
		brightness = value;
	}
	
	// TODO: Add boolean parameter that specifies if requestAnimationFrame should be called?
	this.render = function() {
		
		gl.viewport(0, 0, canvas.width, canvas.height);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		
		mat4.perspective(45, canvas.width / canvas.height, 50.0, 1000.0, pMatrix);
		
		mat4.identity(mvMatrix);
		mat4.translate(mvMatrix, pos);
		mat4.multiply(mvMatrix, pcRotationMatrix);
		mat4.translate(mvMatrix, cor);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
		gl.vertexAttribPointer(prog.attrPosition, vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
		
		gl.uniformMatrix4fv(prog.unifMatrixP, false, pMatrix);
		gl.uniformMatrix4fv(prog.unifMatrixMV, false, mvMatrix);
		gl.uniform1f(prog.unifBrightness, brightness);
		
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.uniform1i(prog.unifTex, 0);
		
		gl.drawArrays(gl.POINTS, 0, vertexBuffer.numItems);
	}
	
	// Add mouse event handlers to canvas
	// Allows for rotation of the scene
	
	var mouseDown = false;
	var lastMouseX = null;
	var lastMouseY = null;
	
	var pcRotationMatrix = mat4.create();
	mat4.identity(pcRotationMatrix);
	
	function handleMouseDown(event) {
		mouseDown = true;
		lastMouseX = event.clientX;
		lastMouseY = event.clientY;
	}
	
	function handleMouseUp(event) {
		mouseDown = false;
	}
	
	var hasDataToSend = false;
	var sendRotation = mat4.create();
	mat4.identity(sendRotation);
	
	function handleMouseMove(event) {
		
		if (!mouseDown) {
			return;
		}
		
		var newX = event.clientX;
		var newY = event.clientY;
		
		var deltaX = newX - lastMouseX;
		
		if (deltaX > 30) {
			lastMouseX = newX;
			lastMouseY = newY;
			return;
		}
		
		var newRotationMatrix = mat4.create();
		mat4.identity(newRotationMatrix);
		mat4.rotate(newRotationMatrix, degToRad(deltaX / 5), [0, 1, 0]);
		
		var deltaY = newY - lastMouseY;
		mat4.rotate(newRotationMatrix, degToRad(deltaY / 5), [1, 0, 0]);
		
		mat4.multiply(newRotationMatrix, pcRotationMatrix, pcRotationMatrix);
		
		// ** For shared viewing **
		mat4.multiply(newRotationMatrix, sendRotation, sendRotation);
		hasDataToSend = true;
		// ************************
		
		lastMouseX = newX;
		lastMouseY = newY;
	}
	
	this.updateModelRotation = function(mat) {
		// mat4.set(mat, pcRotationMatrix);
		// console.log(pcRotationMatrix);
		
		mat4.multiply(mat, pcRotationMatrix, pcRotationMatrix);
	}
	this.getRotationMatrix = function() {
		
		if (!hasDataToSend)
			return null;
		
		var rot = [];
		for (var i = 0; i < sendRotation.length; i++) {
			rot[i] = sendRotation[i];
		}
		mat4.identity(sendRotation);
		
		hasDataToSend = false;
		
		return rot;
	}
	
	// TODO: addEventListener instead?
	canvas.addEventListener("mousedown", handleMouseDown, false);
	document.addEventListener("mouseup", handleMouseUp, false);
	document.addEventListener("mousemove", handleMouseMove, false);
};



