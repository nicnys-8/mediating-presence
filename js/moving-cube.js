// function superclass() {this.stuff="stuff";}

const CUBE_SIDE = 50;

var geometry = new THREE.CubeGeometry(CUBE_SIDE, CUBE_SIDE, CUBE_SIDE);
var material = new THREE.MeshLambertMaterial();
material.color.setHex(0xff0000);

/**
 Constructor
 */
MovingCube = function() {
    this.selected = false;
}

MovingCube.prototype = new THREE.Mesh(geometry, material);


/**
 */
MovingCube.prototype.setSelected = function(bool) {
    this.selected = bool;
    if (this.selected) {
        material.color.setHex(0x00ff00);
    } else {
        material.color.setHex(0xff0000);
    }
}


/**
 */
MovingCube.prototype.isSelected = function() {
    return this.selected;
}


/**
 Move (at most) the specified distance toward the specified point
 */
MovingCube.prototype.moveTowardPoint = function(point, dx, dz) {
    // X movement
    if (Math.abs(this.position.x - point.x) < dx)  {
        // MOVE TO THE CORRECT POSITION
    } else {
        // Translate by dx in the specified direction
        this.translateX(((this.position.x < point.x) ? dx : -dx));
        
    }
    
    // Z movement
    if (Math.abs(this.position.z - point.z) < dz)  {
        // MOVE TO THE CORRECT POSITION
        // Translate by dx in the specified direction
    } else {
        // Translate by dx in the specified direction
        this.translateZ(((this.position.z < point.z) ? dz : -dz));
    }
}


/**
 Check whether a collision with an object in the array 'objects'
 would occur of the cube snapped to the specified location
 */
MovingCube.prototype.collidesAtPosition = function(objects, position) {
    // Check!
}




