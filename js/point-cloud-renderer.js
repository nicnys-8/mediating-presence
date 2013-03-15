
/**
 */
PointCloudRenderer = function(canvas) {
	
	// Vertex shader
	var vsStr = [
				 "attribute vec3 aVertexPosition;",
				 "attribute vec4 aVertexColor;",
				 
				 "uniform mat4 uMVMatrix;",
				 "uniform mat4 uPMatrix;",
				 
				 "varying vec4 vColor;",
				 
				 "void main(void) {",
					"vec4 pos = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);",
					"gl_PointSize = 3.0 / pos.z;",
					"gl_Position = pos;",
					"vColor = aVertexColor;",
				 "}",
				 ].join("\n");
	
	// Fragment shader
	var fsStr = [
				 "precision mediump float;",
				 "varying vec4 vColor;",
				 "void main(void) {",
					"gl_FragColor = vColor;",
				 "}",
				  ].join("\n");
		
	// Get the WebGL context
	var gl = WebGLUtils.setupWebGL2D(canvas);
	
	// Create the shader program
	var prog = WebGLUtils.createProgram(gl, vsStr, fsStr);
		
	gl.useProgram(prog);
		
	// Store the attribute and uniform locations as properties of the program
	prog.attrPosition = gl.getAttribLocation(prog, "aVertexPosition");
	gl.enableVertexAttribArray(prog.attrPosition);
		
	prog.attrColor = gl.getAttribLocation(prog, "aVertexColor");
	gl.enableVertexAttribArray(prog.attrColor);
	
	prog.unifMatrixP = gl.getUniformLocation(prog, "uPMatrix");
	prog.unifMatrixMV = gl.getUniformLocation(prog, "uMVMatrix");
	
	// Set black background
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	
	// Create buffers for point cloud data
	var positionBuffer = gl.createBuffer();
	positionBuffer.itemSize = 3;
	positionBuffer.numItems = 0;
	
	var colorBuffer = gl.createBuffer();
	colorBuffer.itemSize = 4;
	colorBuffer.numItems = 0;
	
	var mvMatrix = mat4.create();
	var pMatrix = mat4.create();
	
	var pcRotationMatrix = mat4.create();
	mat4.identity(pcRotationMatrix);
	
	var degToRad = function(degrees) {
		return degrees * Math.PI / 180;
	}
	
	this.bufferData = function(vertices, colors) {
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
		positionBuffer.numItems = vertices.length / 3;
		
		gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
		colorBuffer.numItems = colors.length / 4;
	}
	
	var center = vec3.create([0, 0, 0]);
	this.setCenterOfRotation = function(vec) {
		center[0] = vec[0];
		center[1] = vec[1];
		center[2] = vec[2];
	}
	
	this.render = function() {
		
		gl.viewport(0, 0, canvas.width, canvas.height);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		
		mat4.perspective(45, canvas.width / canvas.height, 0.1, 1000, pMatrix);
		
		mat4.identity(mvMatrix);
		mat4.translate(mvMatrix, [center[0], center[1], center[2]]);
		// mat4.scale(mvMatrix, vec3.create([0.125, 0.125, 0.125]));
		mat4.multiply(mvMatrix, pcRotationMatrix);
		mat4.translate(mvMatrix, [-center[0], -center[1], -center[2]]);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		gl.vertexAttribPointer(prog.attrPosition, positionBuffer.itemSize, gl.FLOAT, false, 0, 0);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
		gl.vertexAttribPointer(prog.attrColor, colorBuffer.itemSize, gl.FLOAT, false, 0, 0);
		
		gl.uniformMatrix4fv(prog.unifMatrixP, false, pMatrix);
		gl.uniformMatrix4fv(prog.unifMatrixMV, false, mvMatrix);
		gl.drawArrays(gl.POINTS, 0, positionBuffer.numItems);
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
	
	function handleMouseMove(event) {
		
		if (!mouseDown) {
			return;
		}
		
		var newX = event.clientX;
		var newY = event.clientY;
		
		var deltaX = newX - lastMouseX;
		var newRotationMatrix = mat4.create();
		mat4.identity(newRotationMatrix);
		mat4.rotate(newRotationMatrix, degToRad(deltaX / 10), [0, 1, 0]);
		
		var deltaY = newY - lastMouseY;
		mat4.rotate(newRotationMatrix, degToRad(deltaY / 10), [1, 0, 0]);
		
		mat4.multiply(newRotationMatrix, pcRotationMatrix, pcRotationMatrix);
		
		lastMouseX = newX;
		lastMouseY = newY;
	}

	// TODO: addEventListener instead?
	canvas.addEventListener("mousedown", handleMouseDown, false);
	document.addEventListener("mouseup", handleMouseUp, false);
	document.addEventListener("mousemove", handleMouseMove, false);
};


