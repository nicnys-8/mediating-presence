
/**
 */
PhongRendererExt = function(canvas) {
	
	// Vertex shader
	var vsStr = [
				 "precision mediump float;",
				 "attribute vec3 aVertexPosition;",
				 "attribute vec3 aNormal;",
				 
				 "uniform mat4 view;",
				 "uniform mat4 proj;",
				 "uniform mat4 norm;",
				 "uniform float blobbiness;",
				 "uniform float zoom;",
				 
				 "varying vec3 vNormal;",
				 "varying vec3 vWorldPos;",
				 
				 "void main(void){",
					"vWorldPos = (view * vec4(aVertexPosition, 1.0)).xyz;",
					"vec4 n = normalize(norm * vec4(aNormal, 0.0));",
					"vec4 pos = view * vec4(aVertexPosition, 1.0);",
					"vNormal = n.xyz;",
					"gl_Position = proj * (pos + (n * zoom * blobbiness)); // +*/ sin(pos.y * 3.14159 * blobbiness)); // * blobbiness);",
				 "}",
				 ].join("\n");
	
	// Fragment shader
	var fsStr = [
				 "precision mediump float;",
				 "varying vec3 vNormal;",
				 "varying vec3 vWorldPos;",
				 
				 "uniform vec3 uLightPos;",
				 "uniform vec3 uViewPos;",
				 
				 "uniform vec3 matSpecular;",
				 "uniform vec3 matDiffuse;",
				 "uniform vec3 matAmbient;",
				 "uniform float matShininess;",
				 "uniform float blobbiness;",
				 
				 "void main(void) {",
				 
					"vec3 pos = vWorldPos;",
					"vec3 V = normalize(pos - uViewPos);",
					"vec3 L = normalize(pos - uLightPos);",
					"vec3 N = normalize(vNormal);",
					"vec3 R = reflect(N, L);",
				 
					"float angleNL = -dot(N, L);",
					"float angleVR = pow(dot(V, R), matShininess);",
				 
					"vec3 specular = vec3(0.0);",
					
					"if (angleVR > 0.0) {",
						"specular = matSpecular * angleVR;",
					"}",
				 
					"vec3 diffuse = matDiffuse * angleNL;",
					"vec3 ambient = matAmbient;",
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
	prog.unifMatrixN = gl.getUniformLocation(prog, "norm");
	
	prog.unifLightPos = gl.getUniformLocation(prog, "uLightPos");
	prog.unifViewPos = gl.getUniformLocation(prog, "uViewPos");
	
	prog.unifSpecular = gl.getUniformLocation(prog, "matSpecular");
	prog.unifDiffuse = gl.getUniformLocation(prog, "matDiffuse");
	prog.unifAmbient = gl.getUniformLocation(prog, "matAmbient");
	prog.unifShininess = gl.getUniformLocation(prog, "matShininess");
	
	prog.unifBlobbiness = gl.getUniformLocation(prog, "blobbiness");
	prog.unifZoom = gl.getUniformLocation(prog, "zoom");
	
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
	
	var specular = [0.8, 0.8, 0.8];
	var diffuse = [0.6, 0.6, 0.6];
	var ambient = [0.2, 0.2, 0.2];
	var shininess = 20;
	var scale = 1.0;
	var zoom = 1.0;
	
	this.setSpecular = function(vec) {
		specular[0] = vec[0];
		specular[1] = vec[1];
		specular[2] = vec[2];
	}
	this.setDiffuse = function(vec) {
		diffuse[0] = vec[0];
		diffuse[1] = vec[1];
		diffuse[2] = vec[2];
	}
	this.setAmbient = function(vec) {
		ambient[0] = vec[0];
		ambient[1] = vec[1];
		ambient[2] = vec[2];
	}
	this.setShininess = function(val) {
		shininess = val;
	}
	this.setScale = function(val) {
		scale = val;
	}
	this.setZoom = function(val) {
		zoom = val;
	}
	
	var lightPos = [0, 0, 0];
	this.setLightPos = function(vec) {
		lightPos[0] = vec[0];
		lightPos[1] = vec[1];
		lightPos[2] = vec[2];
	}
	
	var blobbiness = 0.0;
	this.setBlobbiness = function(val) {
		blobbiness = val;
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
		mat4.scale(mvMatrix, [scale, scale, scale]);
		mat4.translate(mvMatrix, cor);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
		gl.vertexAttribPointer(prog.attrPosition, vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
		gl.vertexAttribPointer(prog.attrNormal, normalBuffer.itemSize, gl.FLOAT, false, 0, 0);
		
		gl.uniform3fv(prog.unifLightPos, lightPos);
		gl.uniform3fv(prog.unifViewPos, [0.0, 0.0, 0.0]);
		gl.uniformMatrix4fv(prog.unifMatrixP, false, pMatrix);
		gl.uniformMatrix4fv(prog.unifMatrixMV, false, mvMatrix);
		gl.uniformMatrix4fv(prog.unifMatrixN, false, pcRotationMatrix);
		
		gl.uniform3fv(prog.unifSpecular, specular);
		gl.uniform3fv(prog.unifDiffuse, diffuse);
		gl.uniform3fv(prog.unifAmbient, ambient);
		gl.uniform1f(prog.unifShininess, shininess);
		gl.uniform1f(prog.unifBlobbiness, blobbiness);
		gl.uniform1f(prog.unifZoom, zoom);
		
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



