

// MOVE LATER
/*-------------------
 ====================
 ------------------*/

// Default values
var gridSize = 50;
var blockSpeed = 4;

/**
 Wall constructor
 */
KlotskiWall = function(width, height) {
    THREE.Object3D.call(this);
    
    var t = THREE.ImageUtils.loadTexture('../images/rock.png');
    
    this.material = new THREE.MeshLambertMaterial({map: t})
    this.material.map.wrapS = THREE.RepeatWrapping;
    this.material.map.wrapT = THREE.RepeatWrapping;
    
    this.material.map.repeat.set(width, height);
    
    this.width = width * gridSize;
    this.height = height * gridSize;
    
    var geometry = new THREE.CubeGeometry(this.width, gridSize * 2, this.height);
    
    this.mesh = new THREE.Mesh(geometry, this.material);
    // Set the origin to the upper left corner of the mesh
    this.mesh.position.set((width * gridSize / 2), 0, (height * gridSize / 2));
    this.add(this.mesh);
}

KlotskiWall.prototype = Object.create(THREE.Object3D.prototype);

KlotskiWall.prototype.snapToGridPoint = function(x, z) {
    this.position.set(x * gridSize, gridSize / 2, z * gridSize);
}





var Klotski = Klotski || {};

// De här två ska flyttas till en separat Klotskiklass sen
Klotski.setBlockblockSpeed = function(speed) {
    blockSpeed = speed;
}

Klotski.setGridSize = function(size) {
    gridSize = size;
}

/*-------------------
 ====================
 ------------------*/





/**
 Constructor
 */
KlotskiBlock = function(width, height) {
    THREE.Object3D.call(this);
    this.selected = false;
    
    this.targetX = this.position.x;
    this.targetZ = this.position.z;
    
    this.material = new THREE.MeshLambertMaterial();
    this.material.color.setRGB(
                               1,
                               0.4 * Math.random(),
                               0.4 * Math.random()
                               );
    
    this.width = width * gridSize;
    this.height = height * gridSize;
    
    var geometry = new THREE.CubeGeometry(this.width, gridSize, this.height);
    
    this.mesh = new THREE.Mesh(geometry, this.material);
    // Set the origin to the upper left corner of the mesh
    this.mesh.position.set((width * gridSize / 2), 0, (height * gridSize / 2));
    this.add(this.mesh);
    
    this.superDuper = false;

};

KlotskiBlock.prototype = Object.create(THREE.Object3D.prototype);


KlotskiBlock.prototype.setSuperDuper = function() {
    this.superDuper = true;
    this.material.color.setRGB(
                               0.4 * Math.random(),
                               0.4 * Math.random(),
                               1
                               );
}


/**
 
 */
KlotskiBlock.prototype.setPosition = function(x, y, z) {
    // Maybe I shouldn't round here...
    this.position.set(Math.round(x), Math.round(y), Math.round(z));
    this.targetX = this.position.x;
    this.targetZ = this.position.z;
}


KlotskiBlock.prototype.snapToGridPoint = function(x, z) {
    this.setPosition(x * gridSize, gridSize / 2, z * gridSize);
}


/**
 */
KlotskiBlock.prototype.setSelected = function(bool) {
    this.selected = bool;
    if (this.selected) {
        //this.material.color.setHex(0x00ff00);
    } else {
        //this.material.color.setHex(0xff0000);
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
    return (this.position.x % gridSize == 0);
}


KlotskiBlock.prototype.zSnapped = function() {
    return (this.position.z % gridSize == 0);
}


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
            this.targetX = Math.round((this.position.x + xDistance) / gridSize) * gridSize;
            this.targetZ = (Math.round(this.position.z / gridSize)) * gridSize;
        }
    } else {
        if (this.xSnapped()) {
            sign = Math.sign(zDistance);
            this.targetZ = Math.round((this.position.z + zDistance) / gridSize) * gridSize;
            this.targetX = (Math.round(this.position.x / gridSize)) * gridSize;
        }
    }
}


/**
 ...
 */
KlotskiBlock.prototype.targetClosestGridPoint = function() {
    this.targetX = (Math.round(this.position.x / gridSize)) * gridSize;
    this.targetZ = (Math.round(this.position.z / gridSize)) * gridSize;
}


/**
 ...
 */
KlotskiBlock.prototype.step = function() {
    this.xStep(blockSpeed);
    this.zStep(blockSpeed);
    
    if (
        this.superDuper &&
        this.position.x == gridSize * 1 &&
        this.position.z == gridSize * 4) {
        alert("Hooray!");
        this.superDuper = false;
    }
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
    // Check if the translation resulted in a collision
    if (this.collides()) {
        //If so, undo it...
        this.translateX(-xMovement);
        
        // ...and move to contact position
        while (!this.collides()) {
            this.translateX(dir);
        }
        this.translateX(-dir);
        
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
    // Check if the translation resulted in a collision
    if (this.collides()) {
        //If so, undo it...
        this.translateZ(-zMovement);
        
        // ...and move to contact position
        while (!this.collides()) {
            this.translateZ(dir);
        }
        this.translateZ(-dir);
    }
    this.position.z = Math.round(this.position.z);
}


/**
 Check if the block is overlapping another object in the
 obstacle array
 */
KlotskiBlock.prototype.collides = function() {
    var collides = false;
    var offset = gridSize / 2;
    var obstacle;
    
    for (var i = 0; i < obstacles.length; i++) {
        obstacle = obstacles[i];
        
        if (this !== obstacle && !(
                                   this.position.x + this.width <=
                                   obstacle.position.x ||
                                   this.position.x >=
                                   obstacle.position.x + obstacle.width ||
                                   
                                   this.position.z + this.height <=
                                   obstacle.position.z ||
                                   this.position.z >=
                                   obstacle.position.z + obstacle.height
                                   )) {
            collides = true;
        }
    }
    return collides;
}


/**
 Returns the sign of a number
 */
Math.sign = function(x) {
    var sign = ((x < 0) ? -1 : 1);
    return sign;
}


