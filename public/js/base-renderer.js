
/**
 */
BaseRenderer = function(canvas) {
	
	// Vertex shader
	var vsStr = [
				 "precision mediump float;",
				 "attribute vec3 aVertexPosition;",
				 "attribute vec3 aNormal;",
				 
				 "uniform mat4 view;",
				 "uniform mat4 proj;",
				 
				 "varying vec3 vNormal;",
				 "varying vec3 vWorldPos;",
				 
				 "void main(void){",
					"vWorldPos = (view * vec4(aVertexPosition, 1.0)).xyz;",
					"vNormal = (view * vec4(aNormal, 0.0)).xyz;",
					"gl_Position = proj * view * vec4(aVertexPosition, 1.0);",
				 "}",
				 ].join("\n");
	
	// Fragment shader
	var fsStr = [
				 "precision mediump float;",
				 "varying vec3 vNormal;",
				 "varying vec3 vWorldPos;",
				 
				 "uniform vec3 uLightPos;",
				 "uniform vec3 uViewPos;",
				 
				 "void main(void) {",
				 
					"vec3 pos = vWorldPos;",
					"vec3 V = normalize(pos - uViewPos);",
					"vec3 L = normalize(pos - uLightPos);",
					"vec3 N = normalize(vNormal);",
					"vec3 R = reflect(N, L);",
				 
					"float angleNL = -dot(N, L);",
					"float angleVR = pow(dot(V, R), 200.0);",
				 
					"vec3 specular = vec3(0.8, 0.8, 0.8) * angleVR;",
					"vec3 diffuse = vec3(0.6, 0.6, 0.0) * angleNL;",
					"vec3 ambient = vec3(0.2, 0.0, 0.2);",
					"vec3 color = specular + diffuse + ambient;",
				 
					"gl_FragColor = vec4(color, 1.0);",
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
	
	prog.unifLightPos = gl.getUniformLocation(prog, "uLightPos");
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
		console.log("cor");
		console.log(vec);
		cor[0] = vec[0];
		cor[1] = vec[1];
		cor[2] = vec[2];
	}
	this.setPosition = function(vec) {
		console.log("pos");
		console.log(vec);
		pos[0] = vec[0];
		pos[1] = vec[1];
		pos[2] = vec[2];
	}
	
	var uniformLocations = null;
	
	this.getUniformLocations = function(names) {
		if (uniformLocations == null) {
			uniformLocations = {};
			for (var i in names) {
				var name = names[i];
				uniformLocations[name] = gl.getUniformLocation(prog, name);
			}
		}
		return uniformLocations;
	}
	
	this.setUniform = function(name, type, value) {
	
		var location = uniformLocations[name];
		if (!location) {
			return;
		}
		switch (type) {
		case "float":
			gl.uniform1f(location, value); break;
		case "int":
			gl.uniform1i(location, value); break;
		case "vec2":
			gl.uniform2fv(location, value); break;
		case "ivec2":
			gl.uniform2iv(location, value); break;
		case "vec3":
			gl.uniform3fv(location, value); break;
		case "ivec3":
			gl.uniform3iv(location, value); break;
		case "mat2":
			gl.uniformMatrix2fv(location, false, value); break;
		case "mat3":
			gl.uniformMatrix3fv(location, false, value); break;
		case "mat4":
			gl.uniformMatrix4fv(location, false, value); break;
		default:
			// I skipped some known types for now, so this message may be faulty :)
			console.log("Trying to set unknown uniform type '" + type + "'.");
		}
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
		
		gl.uniform3fv(prog.unifLightPos, [10.0, 10.0, -10.0]);
		gl.uniform3fv(prog.unifViewPos, [0.0, 0.0, 0.0]);
		gl.uniformMatrix4fv(prog.unifMatrixP, false, pMatrix);
		gl.uniformMatrix4fv(prog.unifMatrixMV, false, mvMatrix);
		
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
	document.addEventListener("mousedown", handleMouseDown, false);
	document.addEventListener("mouseup", handleMouseUp, false);
	document.addEventListener("mousemove", handleMouseMove, false);
};



