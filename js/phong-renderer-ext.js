
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
				 "uniform float blobbiness;",
				 "uniform float zoom;",
				 
				 "varying vec3 vNormal;",
				 "varying vec3 vWorldPos;",
				 
				 "void main(void){",
					"vWorldPos = (view * vec4(aVertexPosition, 1.0)).xyz;",
					"vec4 n = normalize(view * vec4(aNormal, 0.0));",
					"vec4 pos = view * vec4(aVertexPosition, 1.0);",
					"vNormal = n.xyz;",
					"gl_Position = proj * (pos + (n * zoom * blobbiness));",
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
	
	var mvMatrix = mat4.create(),
		pMatrix = mat4.create(),
		specular = vec3.create([0.8, 0.8, 0.8]),
		diffuse = vec3.create([0.6, 0.6, 0.6]),
		ambient = vec3.create([0.2, 0.2, 0.2]),
		shininess = 20,
		lightPos = vec3.create([0, 0, 0]),
		zoom = 1.0,
		blobbiness = 0.0;
	
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
	
	this.setSpecular = function(vec) {
		vec3.set(vec, specular);
	};
	this.setDiffuse = function(vec) {
		vec3.set(vec, diffuse);
	};
	this.setAmbient = function(vec) {
		vec3.set(vec, ambient);
	};
	this.setShininess = function(val) {
		shininess = val;
	};
	this.setZoom = function(val) {
		zoom = val;
	};
	this.setLightPos = function(vec) {
		vec3.set(vec, lightPos);
	};
	this.setBlobbiness = function(val) {
		blobbiness = val;
	};
	
	this.render = function() {
		
		gl.viewport(0, 0, canvas.width, canvas.height);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		
		mat4.perspective(45, canvas.width / canvas.height, 0.1, 2000.0, pMatrix);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
		gl.vertexAttribPointer(prog.attrPosition, vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
		gl.vertexAttribPointer(prog.attrNormal, normalBuffer.itemSize, gl.FLOAT, false, 0, 0);
		
		gl.uniform3fv(prog.unifLightPos, lightPos);
		gl.uniform3fv(prog.unifViewPos, [0.0, 0.0, 0.0]);
		gl.uniformMatrix4fv(prog.unifMatrixP, false, pMatrix);
		gl.uniformMatrix4fv(prog.unifMatrixMV, false, mvMatrix);
		
		gl.uniform3fv(prog.unifSpecular, specular);
		gl.uniform3fv(prog.unifDiffuse, diffuse);
		gl.uniform3fv(prog.unifAmbient, ambient);
		gl.uniform1f(prog.unifShininess, shininess);
		gl.uniform1f(prog.unifBlobbiness, blobbiness);
		gl.uniform1f(prog.unifZoom, zoom);
		
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



