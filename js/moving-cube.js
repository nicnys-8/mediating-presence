// function superclass() {this.stuff="stuff";}

const CUBE_SIDE = 50;


/**
 Constructor
 */

MovingCube = function() {
    
    THREE.Object3D.call(this);
    
    this.selected = false;
    this.targetPosition = this.position;
    this.obstacles;
    
    // Meshes
    this.meshes = [];
    this.geometry = new THREE.CubeGeometry(CUBE_SIDE, CUBE_SIDE, CUBE_SIDE);
    this.material = new THREE.MeshLambertMaterial();
    this.material.color.setHex(0xff0000);
    var mesh = new THREE.Mesh(this.geometry, this.material);
    this.meshes.push(mesh);
    this.add(mesh);
};

//MovingCube.prototype = new THREE.Object3D();
MovingCube.prototype = Object.create(THREE.Object3D.prototype);

MovingCube.prototype.setPosition = function(x, y, z) {
    this.position.set(x, y, z);
}

/**
 */
MovingCube.prototype.setSelected = function(bool) {
    this.selected = bool;
    if (this.selected) {
        this.material.color.setHex(0x00ff00);
    } else {
        this.material.color.setHex(0xff0000);
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
        if (obstacle != this && !(
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




