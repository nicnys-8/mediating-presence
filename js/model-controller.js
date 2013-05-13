
/*
 * mat4.rotationToQuat4
 *
 * Extension to glMatrix, by Jimmy. Based on
 * http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToQuaternion/
 * Calculates a quat4 fom the given matrix. In order to work
 * correctly, mat needs to be a pure rotation matrix.
 *
 * Params:
 * mat - mat4 rotation matrix to create quaternion from
 * dest - Optional, quat4 receiving operation result
 *
 * Returns:
 * dest if specified, a new quat4 otherwise
 */
mat4.rotationToQuat4 = function(mat, dest) {
	
	if (!dest) { dest = quat4.create(); };
	
	var a00 = mat[0], a01 = mat[1], a02 = mat[2];
	var a10 = mat[4], a11 = mat[5], a12 = mat[6];
	var a20 = mat[8], a21 = mat[9], a22 = mat[10];
	var tr = a00 + a11 + a22, S, invS;
	
	if (tr > 0) {
		S = Math.sqrt(tr + 1.0) * 2; // S=4*qw
		invS = 1.0 / S;
		dest[0] = (a21 - a12) * invS;
		dest[1] = (a02 - a20) * invS;
		dest[2] = (a10 - a01) * invS;
		dest[3] = 0.25 * S;
	} else if ((a00 > a11) && (a00 > a22)) {
		S = Math.sqrt(1.0 + a00 - a11 - a22) * 2; // S=4*qx
		invS = 1.0 / S;
		dest[0] = 0.25 * S;
		dest[1] = (a01 + a10) * invS;
		dest[2] = (a02 + a20) * invS;
		dest[3] = (a21 - a12) * invS;
	} else if (a11 > a22) {
		S = Math.sqrt(1.0 + a11 - a00 - a22) * 2; // S=4*qy
		invS = 1.0 / S;
		dest[0] = (a01 + a10) * invS;
		dest[1] = 0.25 * S;
		dest[2] = (a12 + a21) * invS;
		dest[3] = (a02 - a20) * invS;
	} else {
		S = Math.sqrt(1.0 + a22 - a00 - a11) * 2; // S=4*qz
		invS = 1.0 / S;
		dest[0] = (a02 + a20) * invS;
		dest[1] = (a12 + a21) * invS;
		dest[2] = 0.25 * S;
		dest[3] = (a10 - a01) * invS;
	}
	
	return dest;
};

var copySign = function(x1, x2) {
	var sign = x2 < 0 ? -1 : x2 > 0 ? 1 : 0;
	return x1 < 0 ? -x1 * sign : x1 * sign;
};

mat4.rotationToQuat4_alt = function(mat, dest) {
	
	if (!dest) { dest = quat4.create(); };
	
	var a00 = mat[0], a01 = mat[1], a02 = mat[2];
	var a10 = mat[4], a11 = mat[5], a12 = mat[6];
	var a20 = mat[8], a21 = mat[9], a22 = mat[10];
	
	dest[0] = Math.sqrt(Math.max(0, 1 + a00 - a11 - a22)) * 0.5;
	dest[1] = Math.sqrt(Math.max(0, 1 - a00 + a11 - a22)) * 0.5;
	dest[2] = Math.sqrt(Math.max(0, 1 - a00 - a11 + a22)) * 0.5;
	dest[3] = Math.sqrt(Math.max(0, 1 + a00 + a11 + a22)) * 0.5;
	
	dest[0] = copySign(dest[0], a21 - a12);
	dest[1] = copySign(dest[1], a02 - a20);
	dest[2] = copySign(dest[2], a10 - a01);
	
	return dest;
};


/**
 */
ModelController = function(canvas) {
	
	var cor = vec3.create([0, 0, 0]),
		pos = vec3.create([0, 0, 0]),
		scale = 1.0,
		zoom = 1.0,
		rotationMatrix = mat4.create(),
		mvMatrix = mat4.create(),
		hasValidMVMatrix = false;
	
	mat4.identity(rotationMatrix);
	
	var degToRad = function(degrees) {
		return degrees * Math.PI / 180;
	}
	
	this.setCenterOfRotation = function(vec) {
		vec3.set(vec, cor);
		hasValidMVMatrix = false;
	}
	
	this.setPosition = function(vec) {
		vec3.set(vec, pos);
		hasValidMVMatrix = false;
	}
	
	this.setScale = function(val) {
		scale = val;
		hasValidMVMatrix = false;
	}
	
	this.setZoom = function(val) {
		zoom = val;
		hasValidMVMatrix = false;
	}
	
	this.calculateInitalTransform = function(vertices) {

		var maxX = -Infinity,
			maxY = -Infinity,
			maxZ = -Infinity,
			minX = Infinity,
			minY = Infinity,
			minZ = Infinity,
			x, y, z,
			cx, cy, cz,
			baseScale, distance,
			i = 0, len = vertices.length;
		
		while (i < len) {
			
			x = vertices[i++];
			y = vertices[i++];
			z = vertices[i++];
			
			maxX = x > maxX ? x : maxX; // Math.max(maxX, x);
			maxY = y > maxY ? y : maxY; // Math.max(maxY, y);
			maxZ = z > maxZ ? z : maxZ; // Math.max(maxZ, z);
			
			minX = x < minX ? x : minX; // Math.min(minX, x);
			minY = y < minY ? y : minY; // Math.min(minY, y);
			minZ = z < minZ ? z : minZ; // Math.min(minZ, z);
		}
		
		cx = (maxX + minX) / 2;
		cy = (maxY + minY) / 2;
		cz = (maxZ + minZ) / 2;
		baseScale = 1.0 / (maxX - minX);
		distance = -1.0 / Math.atan(22.5 * Math.PI / 180);
		
		this.setScale(baseScale);
		this.setCenterOfRotation([-cx, -cy, -cz]);
		this.setPosition([0, 0, distance]);
	}
	
	this.getModelViewMatrix = function() {
		
		if (hasValidMVMatrix) {
			return mvMatrix;
		}
		
		var totScale = scale * zoom;
		
		mat4.identity(mvMatrix);
		mat4.translate(mvMatrix, pos);
		mat4.multiply(mvMatrix, rotationMatrix);
		mat4.scale(mvMatrix, [totScale, totScale, totScale]);
		mat4.translate(mvMatrix, cor);
		
		hasValidMVMatrix = true;
		
		return mvMatrix;
	}
	
	// Add mouse event handlers to canvas
	// Allows for rotation of the scene
	var mouseDown = false,
		lastMouseX = null,
		lastMouseY = null,
		hasDataToSend = false,
		sendRotationMatrix = mat4.create(),
		newRotationMatrix = mat4.create();
	
	mat4.identity(sendRotationMatrix);
	mat4.identity(newRotationMatrix);
	
	var handleMouseDown = function(event) {
		mouseDown = true;
		lastMouseX = event.clientX;
		lastMouseY = event.clientY;
	}
	var handleMouseUp = function(event) {
		mouseDown = false;
	}
	var handleMouseMove = function(event) {
		
		if (!mouseDown) { return; }
		
		var newX = event.clientX,
			newY = event.clientY,
			deltaX = newX - lastMouseX,
			deltaY = newY - lastMouseY;
		
		/*if (deltaX > 30) {
			lastMouseX = newX;
			lastMouseY = newY;
			return;
		}*/
		
		mat4.identity(newRotationMatrix);
		mat4.rotateY(newRotationMatrix, degToRad(deltaX / 5));
		mat4.rotateX(newRotationMatrix, degToRad(deltaY / 5));
		mat4.multiply(newRotationMatrix, rotationMatrix, rotationMatrix);
		
		hasValidMVMatrix = false;
		
		// ** For shared viewing **
		mat4.multiply(newRotationMatrix, sendRotationMatrix, sendRotationMatrix);
		hasDataToSend = true;
		// ************************

		lastMouseX = newX;
		lastMouseY = newY;
		
		/*
		 
		 *** Testing accuracy and speed of mat4->quat->mat4 ***

		 var quat = quat4.create(), matBack, i, error;
		 
		 console.time("First");
		 for (i = 0; i < 1000; i++) mat4.rotationToQuat4(pcRotationMatrix, quat);
		 console.timeEnd("First");
		 
		 matBack = quat4.toMat4(quat);
		 error = 0;
		 for (var i = 0; i < 16; i++) {
		 error += matBack[i] - pcRotationMatrix[i];
		 }
		 console.log(error);
		 
		 console.time("Second");
		 for (i = 0; i < 1000; i++) mat4.rotationToQuat4_alt(pcRotationMatrix, quat);
		 console.timeEnd("Second");
		 
		 matBack = quat4.toMat4(quat);
		 error = 0;
		 for (var i = 0; i < 16; i++) {
		 error += matBack[i] - pcRotationMatrix[i];
		 }
		 console.log(error);
		 */
	}

	this.updateRotation = function(quat) {
		quat4.toMat4(quat, newRotationMatrix);
		mat4.multiply(newRotationMatrix, rotationMatrix, rotationMatrix);
		
		// With matrix:
		// mat4.multiply(mat, rotationMatrix, rotationMatrix);
	}
	
	this.getSendRotation = function() {
		
		if (!hasDataToSend) {
			return null;
		}
		
		var quat = new Array(4); // quat4.create();
		mat4.rotationToQuat4(sendRotationMatrix, quat);
		mat4.identity(sendRotationMatrix);
		hasDataToSend = false;
		return quat;
		
		/*
		 With matrix:
		var rot = new Array(16);
		for (var i = 0; i < 16; i++) {
			rot[i] = sendRotation[i];
		}
		mat4.identity(sendRotation);
		hasDataToSend = false;
		return rot;
		 */
	}

	canvas.addEventListener("mousedown", handleMouseDown, false);
	document.addEventListener("mouseup", handleMouseUp, false);
	document.addEventListener("mousemove", handleMouseMove, false);
	
	this.destroy = function() {
		canvas.removeEventListener("mousedown", handleMouseDown);
		document.removeEventListener("mouseup", handleMouseUp);
		document.removeEventListener("mousemove", handleMouseMove);
		canvas = null;
	};
};



