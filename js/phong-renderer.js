
/**
 */
PhongRenderer = function(canvas) {
	
	// Vertex shader
	var vsStr = [
				 "precision mediump float;",
				 "attribute vec3 aVertexPosition;",
				 "attribute vec3 aNormal;",
				 
				 "uniform mat4 world;",
				 "uniform mat4 view;",
				 "uniform mat4 proj;",
				 
				 "varying vec3 vNormal;",
				 "varying vec3 world_pos;",
				 
				 "void main(void){",
					"vNormal = (world * vec4(aNormal, 1.0)).xyz;",
					"world_pos = (world * vec4(aVertexPosition, 1.0)).xyz;",
					"gl_Position = proj * view * world * vec4(aVertexPosition, 1.0);",
				 "}",
				 ].join("\n");
	
	// Fragment shader
	var fsStr = [
				 "precision mediump float;",
				 "varying vec3 vNormal;",
				 "varying vec3 world_pos;",
				 
				 "uniform mat4 world;",
				 "uniform vec3 lightPos;",
				 "uniform vec3 uViewPos;",
				 
				 "void main(void){",
					/*"vec3 pos = world_pos;",
					"vec3 normal = normalize(vNormal);",
					"vec3 L = normalize(lightPos - pos);",
					"vec3 N = vNormal;",
					"vec3 R = reflect(L, N);",
					"vec3 E = normalize(uViewPos - pos);",
				 
					"float angle = clamp(dot(normal, L), 0.0, 1.0);",
					"float cosBeta = clamp(pow(dot(E, R), 10.0), 0.0, 1.0);",
				 
					"vec3 col = vec3(1.0, 1.0, 1.0) * angle + vec3(1.0, 1.0, 1.0) * cosBeta;",
					"gl_FragColor = vec4(col, 1.0);",*/
					"gl_FragColor = vec4(vNormal, 1.0);",
				 "}",
				  ].join("\n");
		
	// Get the WebGL context
	var gl = WebGLUtils.setupWebGL(canvas);
	
	// Create the shader program
	var prog = WebGLUtils.createProgram(gl, vsStr, fsStr);
		
	gl.useProgram(prog);
	
	// Store the attribute and uniform locations as properties of the program
	prog.attrPosition = gl.getAttribLocation(prog, "aVertexPosition");
	gl.enableVertexAttribArray(prog.attrPosition);
		
	prog.attrNormal = gl.getAttribLocation(prog, "aNormal");
	gl.enableVertexAttribArray(prog.attrNormal);
	
	prog.unifMatrixP = gl.getUniformLocation(prog, "proj");
	prog.unifMatrixMV = gl.getUniformLocation(prog, "view");
	prog.unifMatrixW = gl.getUniformLocation(prog, "world");
	
	prog.unifLightPos = gl.getUniformLocation(prog, "lightPos");
	prog.unifViewPos = gl.getUniformLocation(prog, "uViewPos");
	
	// Set black background
	gl.clearColor(0.0, 0.0, 0.0, 0.0);
	gl.enable(gl.DEPTH_TEST);
	
	// Create buffers for point cloud data
	var vertexBuffer = gl.createBuffer();
	vertexBuffer.itemSize = 3;
	vertexBuffer.numItems = 0;
	
	var normalBuffer = gl.createBuffer();
	normalBuffer.itemSize = 3;
	normalBuffer.numItems = 0;
	
	var indexBuffer = gl.createBuffer();
	
	var mvMatrix = mat4.create();
	var pMatrix = mat4.create();
	var wMatrix = mat4.create();
	mat4.identity(wMatrix);
	
	var pcRotationMatrix = mat4.create();
	mat4.identity(pcRotationMatrix);
	
	var degToRad = function(degrees) {
		return degrees * Math.PI / 180;
	}
	
	this.bufferData = function(vertices, normals, indices) {
		
		gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
		vertexBuffer.numItems = vertices.length / 3;
		
		gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
		normalBuffer.numItems = normals.length / 3;

		var maxIndex = 0;
		for (var i = 0; i < indices.length; i++) {
			maxIndex = Math.max(maxIndex, indices[i]);
		}
		console.log("Highest index: " + maxIndex + " / " + String(65535));
		
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
		indexBuffer.numItems = indices.length;
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
	
	// TODO: Add boolean parameter that specifies if requestAnimationFrame should be called?
	this.render = function() {
		
		gl.viewport(0, 0, canvas.width, canvas.height);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		
		mat4.perspective(45, canvas.width / canvas.height, 0.1, 2000.0, pMatrix);
		
		mat4.identity(mvMatrix);
		mat4.translate(mvMatrix, pos);
		// mat4.scale(mvMatrix, vec3.create([0.125, 0.125, -0.125]));
		mat4.multiply(mvMatrix, pcRotationMatrix);
		mat4.translate(mvMatrix, cor);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
		gl.vertexAttribPointer(prog.attrPosition, vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
		gl.vertexAttribPointer(prog.attrNormal, normalBuffer.itemSize, gl.FLOAT, false, 0, 0);
		
		gl.uniform3fv(prog.lightPos, [1, 1, 0]);
		gl.uniform3fv(prog.uViewPos, [0, 0, 0]);
		gl.uniformMatrix4fv(prog.unifMatrixP, false, pMatrix);
		gl.uniformMatrix4fv(prog.unifMatrixMV, false, mvMatrix);
		gl.uniformMatrix4fv(prog.unifMatrixW, false, wMatrix);
		
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
		gl.drawElements(gl.TRIANGLES, indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
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



