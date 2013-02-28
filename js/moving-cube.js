// function superclass() {this.stuff="stuff";}

const CUBE_SIDE = 50;

material.color.setHex(0xff0000);


MovingCube.prototype = new THREE.Mesh(geometry, material);

/**
 Constructor
 */
MovingCube = function() {
    
    var geometry = new THREE.CubeGeometry(CUBE_SIDE, CUBE_SIDE, CUBE_SIDE);
    var material = new THREE.MeshLambertMaterial();
    
    this.selected = false;
    this.targetPosition = this.position;
    this.obstacles;
    
    console.log("Instance:");
    console.log(this);
    console.log("Prototype:");
    console.log(this.prototype);
}


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
 Sets the position the cube moves toward
 */
MovingCube.prototype.setTargetPosition = function(position) {
    this.targetPosition = position;
}


/**
 Move (at most) the specified distance toward the specified point along the x-axis
 */
MovingCube.prototype.xStep = function(dx) {
    if (Math.abs(this.position.x - this.targetPosition.x) < dx)  {
        // MOVE TO THE CONTACT POSITION
    } else {
        // Translate by dx in the specified direction
        var xMovement = ((this.position.x < this.targetPosition.x) ? dx : -dx);
        this.translateX(xMovement);
        if (this.collides()) { //If the translation resultet in a collision...
            this.translateX(-xMovement); //Undo!
        }
    }
}


/**
 Move (at most) the specified distance toward the specified point along the z-axis
 */
MovingCube.prototype.zStep = function(dz) {
    if (Math.abs(this.position.z - this.targetPosition.z) < dz)  {
        // MOVE TO THE CONTACT POSITION
    } else {
        // Translate by dy in the specified direction
        var zMovement = ((this.position.z < this.targetPosition.z) ? dz : -dz);
        this.translateZ(zMovement);
        if (this.collides()) { //If the translation resultet in a collision...
            this.translateZ(-zMovement); //Undo!
        }
    }
}


/**
 Check if the cube is overlapping any obstacles (only checks x and z)
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




