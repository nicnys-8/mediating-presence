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
    this.obstacles;
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
 */
MovingCube.prototype.setObstacles = function(obstacles) {
    this.obstacles = obstacles;
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
        var xMovement = ((this.position.x < point.x) ? dx : -dx);
        this.translateX(xMovement);
        if (this.collides()) {
            this.translateX(-xMovement);
        }
    }
    
    // Z movement
    if (Math.abs(this.position.z - point.z) < dz)  {
        // MOVE TO THE CORRECT POSITION
    } else {
        // Translate by dy in the specified direction
        var zMovement = ((this.position.z < point.z) ? dz : -dz);
        this.translateZ(zMovement);
        if (this.collides()) {
            this.translateZ(-zMovement);
        }
    }
}



/**
 Check whether a collision with an object in the array 'objects'
 would occur of the cube snapped to the specified offset

MovingCube.prototype.collidesAtOffset = function(dx, dy, dz) {
    return false;
    console.log(position);
    var currentPosition = this.position;
    this.position.set(position);
    var collides = this.collides();
    this.position.set(currentPosition);
    return collides;
} */


/**
 Check if the cube is overlapping any obstacles
 */
MovingCube.prototype.collides = function() {
    var collides = false;
    var offset = CUBE_SIDE / 2;
    var obstacle;
    
    for (var i = 0; i < this.obstacles.length; i++) {
        obstacle = obstacles[i]
        if (!(
              this.position.x + offset < obstacle.position.x - offset ||
              this.position.x - offset > obstacle.position.x + offset ||
              
              this.position.z + offset < obstacle.position.z - offset ||
              this.position.z - offset > obstacle.position.z + offset
              )) {
            collides = true;
        }
    }
    return collides;
}




