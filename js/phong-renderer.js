
/**
 */
PhongRenderer = function(canvas) {
	
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
	
	var mvMatrix = mat4.create(),
		pMatrix = mat4.create();
	
	mat4.identity(mvMatrix);
	mat4.identity(pMatrix);
	
	this.bufferData = function(vertices, normals, faces) {
		
		if (typeof vertices === "Array") {
			vertices = new Float32Array(vertices);
		}
		if (typeof normals === "Array") {
			normals = new Float32Array(normals);
		}
		if (typeof faces === "Array") {
			faces = new Uint16Array(faces);
		}
		
		gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
		vertexBuffer.numItems = vertices.length / vertexBuffer.itemSize;
		
		gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
		normalBuffer.numItems = normals.length / normalBuffer.itemSize;

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, faces, gl.STATIC_DRAW);
		indexBuffer.numItems = faces.length;
	};
	
	this.setModelViewMatrix = function(mat) {
		mat4.set(mat, mvMatrix);
	};
	
	this.render = function() {
		
		gl.viewport(0, 0, canvas.width, canvas.height);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		
		mat4.perspective(45, canvas.width / canvas.height, 0.1, 2000.0, pMatrix);

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
	};
	
	this.destroy = function() {
		
		var shaders = gl.getAttachedShaders(prog);
		for (var i = 0; i < shaders.length; i++) {
			gl.deleteShader(shaders[i]);
		}
		gl.deleteProgram(prog);
		gl.deleteBuffer(vertexBuffer);
		gl.deleteBuffer(normalBuffer);
		gl.deleteBuffer(indexBuffer);
		
		gl = null;
		prog = null;
		canvas = null;
	};
};



