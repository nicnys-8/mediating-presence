// MOVE LATER
/*-------------------
 ====================
 ------------------*/

var Klotski = Klotski || {};

// De här två ska flyttas till en separat Klotskiklass sen
Klotski.setBlockblockSpeed = function(speed) {
    blockSpeed = speed;
}

Klotski.setGridSize = function(size) {
    gridSize = size;
}


// Default values
var gridSize = 50;
var blockSpeed = 4;

/**
 Wall constructor
 */
KlotskiWall = function(width, height) {
    THREE.Object3D.call(this);
    // Set texture
    var texture = THREE.ImageUtils.loadTexture('../images/rock.png');
    this.material = new THREE.MeshLambertMaterial({map: texture})
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


/*-------------------
 ====================
 ------------------*/

/**
 Constructor
 */
KlotskiBlock = function(width, height, obstacles) {
    THREE.Object3D.call(this);
    
    this.startPoint = {x: this.position.x, z: this.position.z};
    
    this.targetX = this.position.x;
    this.targetZ = this.position.z;
    
    this.obstacles = obstacles;
    
    this.material = new THREE.MeshLambertMaterial();
    this.material.color.setRGB(1, 0.4 * Math.random(), 0.4 * Math.random());
    
    this.width = width * gridSize;
    this.height = height * gridSize;
    
    var geometry = new THREE.CubeGeometry(this.width, gridSize, this.height);
    this.mesh = new THREE.Mesh(geometry, this.material);
    // Set the origin to the upper left corner of the mesh
    this.mesh.position.set((width * gridSize / 2), 0, (height * gridSize / 2));
    this.add(this.mesh);
    
    this.main = false;
};

KlotskiBlock.prototype = Object.create(THREE.Object3D.prototype);


KlotskiBlock.prototype.setMain = function() {
    this.main = true;
    this.material.color.setRGB(0.4 * Math.random(), 0.4 * Math.random(), 1);
}


/**
 Set the position of the block, and stop it
 from moving by setting the target position
 */
KlotskiBlock.prototype.setPosition = function(x, y, z) {
    // Maybe I shouldn't round here...
    this.position.set(Math.round(x), Math.round(y), Math.round(z));
    this.targetX = this.position.x;
    this.targetZ = this.position.z;
}


/**
 Snap the block to an exact gridpoint
 */
KlotskiBlock.prototype.snapToGridPoint = function(x, z) {
    this.setPosition(x * gridSize, gridSize / 2, z * gridSize);
}


/**
 Check if the block is snapped vertically
 */
KlotskiBlock.prototype.xSnapped = function() {
    return (this.position.x % gridSize == 0);
}


/**
 Check if the block is snapped horizontally
 */
KlotskiBlock.prototype.zSnapped = function() {
    return (this.position.z % gridSize == 0);
}


/**
 Update the blocks target position; decides where the
 block will move when stepTowardTarget is called
 */
KlotskiBlock.prototype.updateTargetPosition = function(point) {
    var xDistance, zDistance;
    var sign;
    
    xDistance = point.x - this.position.x;
    zDistance = point.z - this.position.z;
    
    if (Math.abs(xDistance) > Math.abs(zDistance)) {
        
        if (Math.abs(xDistance) < gridSize / 2) return;
        if (!this.zSnapped()) return;
        
        sign = Math.sign(xDistance);
        // Set the target one gridpoint away in the direction of 'sign'
        this.targetX = Math.round(sign + (this.position.x) / gridSize) * gridSize;
        // Prevent diagonal motion
        this.targetZ = (Math.round(this.position.z / gridSize)) * gridSize;
        
    } else {
        
        if (Math.abs(zDistance) < gridSize / 2) return;
        if (!this.xSnapped()) return;
        
        sign = Math.sign(zDistance);
        // Set the target one gridpoint away in the direction of 'sign'
        this.targetZ = Math.round(sign + (this.position.z + sign) / gridSize) * gridSize;
        // Prevent diagonal motion
        this.targetX = (Math.round(this.position.x / gridSize)) * gridSize;
    }
}


/**
 Move a bit toward the target position
 */
KlotskiBlock.prototype.stepTowardTarget = function() {
    this.xStep(blockSpeed);
    this.zStep(blockSpeed);
    
    // Stupid code for winning the game
    if (
        this.main &&
        this.position.x == gridSize * 1 &&
        this.position.z == gridSize * 4) {
        alert("You win!");
        this.main = false;
    }
}


/**
 Move (at most) the specified distance toward the specified point along the x-axis
 */
KlotskiBlock.prototype.xStep = function(dx) {
    var distance = Math.abs(this.position.x - this.targetX);
    // if (distance == 0) return;
    
    dx = Math.min(dx, distance);
    var dir = ((this.position.x < this.targetX) ? 1 : -1);
    
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
        this.targetClosestGridPoint();
        
    }
}


/**
 Move (at most) the specified distance toward the specified point along the z-axis
 */
KlotskiBlock.prototype.zStep = function(dz) {
    var distance = Math.abs(this.position.z - this.targetZ);
    // if (distance == 0) return;
    
    dz = Math.min(dz, distance);
    var dir = ((this.position.z < this.targetZ) ? 1 : -1);
    
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
        this.targetClosestGridPoint();
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
 Check if the block is overlapping another object in the
 obstacle array
 */
KlotskiBlock.prototype.collides = function() {
    var collides = false;
    var obstacle;
    
    for (var i = 0; i < this.obstacles.length; i++) {
        obstacle = this.obstacles[i];
        if (this == obstacle) continue;
        
        if (!(this.position.x + this.width <=
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
 Returns the sign of a number SHOULD BE MOVED
 */
Math.sign = function(x) {
    var sign = ((x < 0) ? -1 : 1);
    return sign;
}


