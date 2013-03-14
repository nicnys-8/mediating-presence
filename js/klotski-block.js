
const CUBE_SIDE = 50;
var geometry = new THREE.CubeGeometry(CUBE_SIDE, CUBE_SIDE, CUBE_SIDE);

/**
 Constructor
 */
KlotskiBlock = function() {
    THREE.Object3D.call(this);
    this.selected = false;
    this.targetPosition = this.position;
    
    this.material = new THREE.MeshLambertMaterial();
    this.material.color.setHex(0xff0000);
    
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.add(this.mesh);
};

KlotskiBlock.prototype = Object.create(THREE.Object3D.prototype);


/**
 
 */
KlotskiBlock.prototype.setPosition = function(x, y, z) {
    this.position.set(x, y, z);
}


/**
 */
KlotskiBlock.prototype.setSelected = function(bool) {
    this.selected = bool;
    if (this.selected) {
        this.material.color.setHex(0x00ff00);
    } else {
        this.material.color.setHex(0xff0000);
    }
}


/**
 Returns a boolean telling us whether the cube has been selected
 */
KlotskiBlock.prototype.isSelected = function() {
    return this.selected;
}


/**
 Not used right now, since I made the sneaky move to make obstacles
 a globally accessible variable...
 /**
 Set the array of objects the cube will check collisions against
 
 MovingCube.prototype.setObstacles = function(obstacles) {
 this.obstacles = obstacles;
 }*/


/**
 Sets the position the cube moves toward
 */
KlotskiBlock.prototype.setTargetPosition = function(position) {
    this.targetPosition = position;
}


/**
 ...
 */
KlotskiBlock.prototype.stepTowardTarget = function(d) {
    var zDistance = Math.abs(this.position.z - this.targetPosition.z);
    var xDistance = Math.abs(this.position.x - this.targetPosition.x);
    
    if (zDistance > xDistance) {
        this.zStep(d);
    } else {
        this.xStep(d)
    }
}


/**
 Move (at most) the specified distance toward the specified point along the x-axis
 */
KlotskiBlock.prototype.xStep = function(dx) {
    var dir = ((this.position.x < this.targetPosition.x) ? 1 : -1);
    var distance = Math.abs(this.position.x - this.targetPosition.x);
    
    dx = Math.min(dx, distance);
    
    // Translate by dx in the specified direction
    var xMovement = dir * dx;
    this.translateX(xMovement);
    if (this.collides()) { //If the translation resulted in a collision...
        this.translateX(-xMovement); //Undo!
    }
}


/**
 Move (at most) the specified distance toward the specified point along the x-axis
 */
KlotskiBlock.prototype.zStep = function(dz) {
    var dir = ((this.position.z < this.targetPosition.z) ? 1 : -1);
    var distance = Math.abs(this.position.z - this.targetPosition.z);
    
    dz = Math.min(dz, distance);
    
    // Translate by dz in the specified direction
    var zMovement = dir * dz;
    this.translateZ(zMovement);
    if (this.collides()) { //If the translation resulted in a collision...
        this.translateZ(-zMovement); //Undo!
    }
}

/**
 OBS! Det här är en svammelmetod, ska förstås ändras sen...
 */
KlotskiBlock.prototype.collides = function() {
    var collides = false;
    var offset = CUBE_SIDE / 2;
    var obstacle;
    
    for (var i = 0; i < obstacles.length; i++) {
        obstacle = obstacles[i];
        
        if (this.mesh !== obstacle && !(
              this.mesh.position.x + offset < obstacle.position.x - offset ||
              this.mesh.position.x - offset > obstacle.position.x + offset ||
              
              this.mesh.position.z + offset < obstacle.position.z - offset ||
              this.mesh.position.z - offset > obstacle.position.z + offset
              )) {
            collides = true;
        }
    }
    return collides;
}





