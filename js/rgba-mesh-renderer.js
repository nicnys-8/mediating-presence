
/**
 */
MeshRenderer = function(canvas) {
	
	// Vertex shader
	var vsStr = [
				 "attribute vec3 aVertexPosition;",
				 "attribute vec3 aVertexColor;",
				 
				 "uniform mat4 uMVMatrix;",
				 "uniform mat4 uPMatrix;",
				 
				 "varying vec3 vColor;",
				 
				 "void main(void) {",
					"gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);",
					"vColor = aVertexColor;",
				 "}",
				 ].join("\n");
	
	// Fragment shader
	var fsStr = [
				 "precision mediump float;",
				 "varying vec3 vColor;",
				 "void main(void) {",
					"gl_FragColor = vec4(vColor, 1.0);",
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

	prog.attrColor = gl.getAttribLocation(prog, "aVertexColor");
	gl.enableVertexAttribArray(prog.attrColor);
	
	prog.unifMatrixP = gl.getUniformLocation(prog, "uPMatrix");
	prog.unifMatrixMV = gl.getUniformLocation(prog, "uMVMatrix");
	
	// Set transparent background
	gl.clearColor(0.0, 0.0, 0.0, 0.0);
	gl.enable(gl.DEPTH_TEST);
	
	// Create buffers for point cloud data
	var vertexBuffer = gl.createBuffer();
	vertexBuffer.itemSize = 3;
	vertexBuffer.numItems = 0;
	
	var colorBuffer = gl.createBuffer();
	colorBuffer.itemSize = 3;
	colorBuffer.numItems = 0;
	
	var indexBuffer = gl.createBuffer();
	
	var mvMatrix = mat4.create(),
		pMatrix = mat4.create();
	
	mat4.identity(mvMatrix);
	mat4.identity(pMatrix);
	
	this.bufferData = function(vertices, colors, faces) {
		
		if (typeof vertices === "Array") {
			vertices = new Float32Array(vertices);
		}
		if (typeof colors === "Array") {
			normals = new Float32Array(colors);
		}
		if (typeof faces === "Array") {
			faces = new Uint16Array(faces);
		}
		
		gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
		vertexBuffer.numItems = vertices.length / vertexBuffer.itemSize;
		
		gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
		colorBuffer.numItems = colors.length / colorBuffer.itemSize;
		
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
		
		mat4.perspective(45, canvas.width / canvas.height, 0.1, 1000.0, pMatrix);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
		gl.vertexAttribPointer(prog.attrPosition, vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
		gl.vertexAttribPointer(prog.attrColor, colorBuffer.itemSize, gl.FLOAT, false, 0, 0);
		
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
		gl.deleteBuffer(colorBuffer);
		gl.deleteBuffer(indexBuffer);
		
		gl = null;
		prog = null;
		canvas = null;
	};
};



