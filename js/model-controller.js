
/*
 * Extensions to glMatrix, by Jimmy.
 */

quat4.nlerp = function(quat, quat2, lerp, dest) {
	if (!dest) { dest = quat; }
	
	dest[0] = quat[0] + (quat2[0] - quat[0]) * lerp;
	dest[1] = quat[1] + (quat2[1] - quat[1]) * lerp;
	dest[2] = quat[2] + (quat2[2] - quat[2]) * lerp;
	dest[3] = quat[3] + (quat2[3] - quat[3]) * lerp;
	quat4.normalize(dest);
	
	return dest;
};

quat4.closeEnough = function(quat, quat2) {
	var dx = quat[0] - quat2[0],
		dy = quat[1] - quat2[1],
		dz = quat[2] - quat2[2],
		dw = quat[3] - quat2[3],
		close = 0.01 * 0.01;
	return dx * dx < close
		&& dy * dy < close
		&& dz * dz < close
		&& dw * dw < close;
};

quat4.isEqual = function(quat, quat2) {
	return quat[0] == quat2[0]
		&& quat[1] == quat2[1]
		&& quat[2] == quat2[2]
		&& quat[3] == quat2[3];
};

vec3.closeEnough = function(vec, vec2) {
	var dx = vec[0] - vec2[0],
		dy = vec[1] - vec2[1],
		dz = vec[2] - vec2[2],
		close = 0.01 * 0.01;
	return dx * dx < close
		&& dy * dy < close
		&& dz * dz < close;
};

vec3.isEqual = function(vec, vec2) {
	return vec[0] == vec2[0]
		&& vec[1] == vec2[1]
		&& vec[2] == vec2[2];
};

/**
 */
ModelController = function(canvas) {
	
	var center = vec3.create([0, 0, 0]),
		position = vec3.create([0, 0, 0]),
		scale = vec3.create([1, 1, 1]),
		zoom = 1.0,
		mModelView = mat4.create(),
		mRotation = mat4.create(),
		qTargetRotation = quat4.create([0, 0, 0, 1]),
		qRotation = quat4.create([0, 0, 0, 1]),
		qSendRotation = quat4.create([0, 0, 0, 1]),
		hasValidMVMatrix = false;

	function degToRad(degrees) {
		return degrees * Math.PI / 180;
	}
	
	this.setCenterOfRotation = function(vec) {
		if (!vec3.isEqual(vec, center)) {
			vec3.set(vec, center);
			hasValidMVMatrix = false;
		}
	};
	
	this.setPosition = function(vec) {
		if (!vec3.isEqual(vec, position)) {
			vec3.set(vec, position);
			hasValidMVMatrix = false;
		}
	};
	
	// RENAME!
	this.setScale = function(val) {
		this.setScaleVec([val, val, val]);
	};
	this.setScaleVec = function(vec) {
		if (!vec3.isEqual(vec, scale)) {
			vec3.set(vec, scale);
			hasValidMVMatrix = false;
		}
	};
	this.setZoom = function(val) {
		if (zoom !== val) {
			zoom = val;
			hasValidMVMatrix = false;
		}
	};
	
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
			
			maxX = x > maxX ? x : maxX;
			maxY = y > maxY ? y : maxY;
			maxZ = z > maxZ ? z : maxZ;
			
			minX = x < minX ? x : minX;
			minY = y < minY ? y : minY;
			minZ = z < minZ ? z : minZ;
		}
		
		cx = (maxX + minX) / 2;
		cy = (maxY + minY) / 2;
		cz = (maxZ + minZ) / 2;
		baseScale = 1.0 / (maxX - minX);
		distance = -1.0 / Math.atan(degToRad(22.5));
		
		this.setScale(baseScale);
		this.setCenterOfRotation([-cx, -cy, -cz]);
		this.setPosition([0, 0, distance]);
	};
	
	this.getModelViewMatrix = function() {
		
		if (hasValidMVMatrix) {
			return mModelView;
		}
		
		// quat4.slerp(vq, rq, 0.1);
		quat4.nlerp(qRotation, qTargetRotation, 0.1);
		quat4.toMat4(qRotation, mRotation);
		
		mat4.identity(mModelView);
		mat4.translate(mModelView, position);
		mat4.multiply(mModelView, mRotation);
		mat4.scale(mModelView, [scale[0] * zoom, scale[1] * zoom, scale[2] * zoom]);
		mat4.translate(mModelView, center);
		
		hasValidMVMatrix = quat4.closeEnough(qRotation, qTargetRotation);
		
		return mModelView;
	};
	
	// Add mouse event handlers to canvas
	// Allows for rotation of the model
	var mouseDown = false,
		lastMouseX,
		lastMouseY,
		hasDataToSend = false;
	
	function handleMouseDown(event) {
		mouseDown = true;
		lastMouseX = event.clientX;
		lastMouseY = event.clientY;
		event.preventDefault();
	}
	function handleMouseUp(event) {
		mouseDown = false;
	}
	function handleMouseMove(event) {
		
		if (!mouseDown) {
			return;
		}
		
		var newX = event.clientX,
			newY = event.clientY,
			deltaX = newX - lastMouseX,
			deltaY = newY - lastMouseY,
			ax = degToRad(deltaX / 4),
			ay = degToRad(deltaY / 4),
			qx = quat4.create([-Math.sin(ay), 0, 0, Math.cos(ay)]),
			qy = quat4.create([0, -Math.sin(ax), 0, Math.cos(ax)]),
			rot = quat4.multiply(qy, qx);
		
		quat4.multiply(qTargetRotation, rot);
		
		// ** For shared viewing **
		quat4.multiply(qSendRotation, rot);
		hasDataToSend = true;
		// ************************

		hasValidMVMatrix = false;
		lastMouseX = newX;
		lastMouseY = newY;
	}

	this.resetRotation = function() {
		quat4.set([0, 0, 0, 1], qTargetRotation);
		hasValidMVMatrix = false;
	};
	
	this.rotate = function(quat) {
		quat4.multiply(qTargetRotation, quat);
		hasValidMVMatrix = false;
	};

	this.setRotation = function(quat) {
		quat4.set(quat, qTargetRotation);
		hasValidMVMatrix = false;
	};
	
	this.setRotationMatrix = function(mat) {
		mat4.rotationToQuat4(mat, qTargetRotation);
	};
	
	this.getSendRotation = function() {
		
		if (!hasDataToSend) {
			return; // undefined
		}
		
		var quat = []; // quat4.create();
		quat4.set(qSendRotation, quat);
		quat4.set([0, 0, 0, 1], qSendRotation);
		hasDataToSend = false;
		return quat;
	};
	
	this.getFullRotation = function() {
		var quat = []; // quat4.create();
		quat4.set(qTargetRotation, quat);
		return quat;
	};
	
	canvas.addEventListener("mousedown", handleMouseDown, false);
	document.addEventListener("mouseup", handleMouseUp, false);
	// document.addEventListener("mouseout", function(e){handleMouseUp(e); console.log("out");}, false);
	document.addEventListener("mousemove", handleMouseMove, false);
	
	this.destroy = function() {
		canvas.removeEventListener("mousedown", handleMouseDown);
		document.removeEventListener("mouseup", handleMouseUp);
		// document.removeEventListener("mouseout", handleMouseUp);
		document.removeEventListener("mousemove", handleMouseMove);
		canvas = null;
	};
};



