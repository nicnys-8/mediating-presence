
const CUBE_SIDE = 50;
const UNIT = 50;
var geometry = new THREE.CubeGeometry(CUBE_SIDE, CUBE_SIDE, CUBE_SIDE);

/**
 Constructor
 */
KlotskiBlock = function() {
    THREE.Object3D.call(this);
    this.selected = false;
    
    this.targetX = this.position.x;
    this.targetZ = this.position.z;
    
    this.material = new THREE.MeshLambertMaterial();
    this.material.color.setHex(0xff0000);
    
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.add(this.mesh);
};

KlotskiBlock.prototype = Object.create(THREE.Object3D.prototype);


/**
 
 */
KlotskiBlock.prototype.setPosition = function(x, y, z) {
    // Maybe I shouldn't round here...
    this.position.set(Math.round(x), Math.round(y), Math.round(z));
    this.targetX = this.position.x;
    this.targetZ = this.position.z;
}


/**
 */
KlotskiBlock.prototype.setSelected = function(bool) {
    this.selected = bool;
    if (this.selected) {
        this.material.color.setHex(0x00ff00);
    } else {
        this.material.color.setHex(0xff0000);
        this.targetClosestGridPoint();
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


KlotskiBlock.prototype.xSnapped = function() {
    return (this.position.x % UNIT == 0);
}


KlotskiBlock.prototype.zSnapped = function() {
    return (this.position.z % UNIT == 0);
}


/**
 Sets the position the cube moves toward

KlotskiBlock.prototype.updateTargetPosition = function(point) {
    var distance;
    var sign;
    
    if (this.zSnapped()) {
        distance = point.x - this.position.x;
        sign = Math.sign(distance);
        
        this.targetX = (Math.round(this.position.x / UNIT) + sign) * UNIT;
        // this.targetZ = (Math.round(this.position.z / UNIT)) * UNIT;
    }
    
    if (this.xSnapped()) {
        distance = point.z - this.position.z;
        sign = Math.sign(distance);
        
        this.targetZ = (Math.round(this.position.z / UNIT) + sign) * UNIT;
        // this.targetX = (Math.round(this.position.x / UNIT)) * UNIT;
    }
}
 */


/*
 ...
 */
KlotskiBlock.prototype.updateTargetPosition = function(point) {
    var xDistance, zDistance;
    var sign;
    
    xDistance = point.x - this.position.x;
    zDistance = point.z - this.position.z;
    
    if (Math.abs(xDistance) > Math.abs(zDistance)) {
        if (this.zSnapped()) {
            sign = Math.sign(xDistance);
            this.targetX = Math.round((this.position.x + xDistance) / UNIT) * UNIT;
            this.targetZ = (Math.round(this.position.z / UNIT)) * UNIT;
        }
    } else {
        if (this.xSnapped()) {
            sign = Math.sign(zDistance);
            this.targetZ = Math.round((this.position.z + zDistance) / UNIT) * UNIT;
            this.targetX = (Math.round(this.position.x / UNIT)) * UNIT;
        }
    }
}

/**
 ...
 */
KlotskiBlock.prototype.targetClosestGridPoint = function() {
    this.targetX = (Math.round(this.position.x / UNIT)) * UNIT;
    this.targetZ = (Math.round(this.position.z / UNIT)) * UNIT;
}
    
    
/**
 Returns the sign of a number
 */
Math.sign = function(x) {
    if (x == 0) return 0;
    return x / Math.abs(x);
}

/**
 ...
 */
KlotskiBlock.prototype.step = function() {
    this.xStep(2);
    this.zStep(2);
    /*
     var zDistance = Math.abs(this.position.z - this.targetPosition.z);
     var xDistance = Math.abs(this.position.x - this.targetPosition.x);
     
     if (zDistance > xDistance) {
     // if (this.position.x % CUBE_SIDE == 0)
     this.zStep(d);
     } else {
     //if (this.position.z % CUBE_SIDE == 0)
     this.xStep(d)
     }*/
}


/**
 Move (at most) the specified distance toward the specified point along the x-axis
 */
KlotskiBlock.prototype.xStep = function(dx) {
    var dir = ((this.position.x < this.targetX) ? 1 : -1);
    var distance = Math.abs(this.position.x - this.targetX);
    
    dx = Math.min(dx, distance);
    
    // Translate by dx in the specified direction
    var xMovement = dir * dx;
    this.translateX(xMovement);
    if (this.collides()) { //If the translation resulted in a collision...
        this.translateX(-xMovement); //Undo!
        // TODO: Move to contact position
    }
    this.position.x = Math.round(this.position.x);
}


/**
 Move (at most) the specified distance toward the specified point along the x-axis
 */
KlotskiBlock.prototype.zStep = function(dz) {
    var dir = ((this.position.z < this.targetZ) ? 1 : -1);
    var distance = Math.abs(this.position.z - this.targetZ);
    
    dz = Math.min(dz, distance);
    
    // Translate by dz in the specified direction
    var zMovement = dir * dz;
    this.translateZ(zMovement);
    if (this.collides()) { //If the translation resulted in a collision...
        this.translateZ(-zMovement); //Undo!
        // TODO: Move to contact position
    }
    this.position.z = Math.round(this.position.z);
}


/**
 Check if the block is overlapping another object in the
 obstacle array
 */
KlotskiBlock.prototype.collides = function() {
    var collides = false;
    var offset = CUBE_SIDE / 2;
    var obstacle;
    
    for (var i = 0; i < obstacles.length; i++) {
        obstacle = obstacles[i];
        
        if (this !== obstacle && !(
                                   this.position.x + offset <= obstacle.position.x - offset ||
                                   this.position.x - offset >= obstacle.position.x + offset ||
                                   
                                   this.position.z + offset <= obstacle.position.z - offset ||
                                   this.position.z - offset >= obstacle.position.z + offset
                                   )) {
            collides = true;
        }
    }
    return collides;
}





