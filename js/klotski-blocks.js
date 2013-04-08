const SPEED = 0.1;
const SMOOTHNESS = 6;
const MODIFIER_VALUE = 2;

var geometry11;
var geometry12;
var geometry21;
var geometry22;
var geometriesInited = false;

/**
 Block constructor
 */
Block = function(column, row, width, height) {
    THREE.Object3D.call(this);
    
    this.width = width;
    this.height = height;
    
    this.material = new THREE.MeshPhongMaterial();
    
    if (!geometriesInited) initGeometries();
    var geometry;
    
    // If the block is one of the standard shapes, get a shared
    // geometry
    if (width == 1 && height == 1) geometry = geometry11;
    else if (width == 1 && height == 2) geometry = geometry12;
    else if (width == 2 && height == 1) geometry = geometry21;
    else if (width == 2 && height == 2) geometry = geometry22;
    
    // If the block is not one of the standard shapes, create a
    // new geometry for it
    else {
        geometry = new THREE.CubeGeometry(width, height, 1, SMOOTHNESS, SMOOTHNESS, SMOOTHNESS);
        var modifier = new THREE.SubdivisionModifier(MODIFIER_VALUE);
        modifier.modify(geometry);
    }
    
    this.mesh = new THREE.Mesh(geometry, this.material);
    // Move the mesh so that its corner is at the block's origin
    this.mesh.position.set((width / 2), (height / 2), 0.5);
    this.add(this.mesh);
    this.snapToGridPoint(column, row);
}

Block.prototype = Object.create(THREE.Object3D.prototype);

/**
 Move the block to the specified grid point
 */
Block.prototype.snapToGridPoint = function(column, row) {
    this.position.set(column, row, 0.5);
}


/**
 Check if the block is snapped vertically
 */
Block.prototype.xSnapped = function() {
    return (this.position.x % 1 == 0);
}


/**
 Check if the block is snapped horizontally
 */
Block.prototype.ySnapped = function() {
    return (this.position.y % 1 == 0);
}


/**
 Check if the block is completely snapped
 */
Block.prototype.isSnapped = function() {
    return (this.ySnapped() && this.xSnapped());
}

/**
 Wall constructor
 */
KlotskiWall = function(column, row, width, height) {
    Block.call(this, column, row, width, height);
    // Set the texture
    var texture = THREE.ImageUtils.loadTexture("../images/rock-small.png");
    this.material.map = texture;
    this.material.map.wrapS = THREE.RepeatWrapping;
    this.material.map.wrapT = THREE.RepeatWrapping;
    this.material.map.repeat.set(width, height);
}

KlotskiWall.prototype = Object.create(Block.prototype);


/**
 MovingBlock constructor
 */
MovingBlock = function(id, column, row, width, height, obstacles) {
    Block.call(this, column, row, width, height);
    this.id = id;
    this.targetX = this.position.x;
    this.targetY = this.position.y;
    this.obstacles = obstacles;
};

MovingBlock.prototype = Object.create(Block.prototype);


/**
 Make this the main block; the goal of the
 game is to get the main block to the goal.

MovingBlock.prototype.setMain = function() {
    this.main = true;
    this.material.color.setRGB(0.3, 0.3, 1);
}; */

/**
 Sets the type of the Klotski block
 @param type A string representing one of three types:
 red: Can only be moved by the red player
 blue: Can only be moved by the blue player
 green: The main block, can be moved by both players.
 */
MovingBlock.prototype.setColor = function(color) {
    this.color = color;
    if (color == "red") {
        this.material.color.setRGB(1.0, 0.1, 0.1);
    }
    else if (color == "blue") {
        this.material.color.setRGB(0.1, 0.1, 1.0);
    }
    else if (color == "green") {
        this.material.color.setRGB(0.1, 1.0, 0.1);
    }
}


/**
 Update the blocks target position; decides where the
 block will move when stepTowardTarget is called
 */
MovingBlock.prototype.updateTargetPosition = function(column, row) {
    var xDistance, yDistance;
    var sign;
    xDistance = column - this.position.x;
    yDistance = row - this.position.y;
    
    /*------------------------
     == Horizontal targeting==
     ------------------------*/
    if (Math.abs(xDistance) > Math.abs(yDistance)) {
        
        if (Math.abs(xDistance) < 0.5) return; // Return if too close
        if (!this.ySnapped()) return;
        
        sign = Math.sign(xDistance);
        
        // Set the target in the direction of 'sign'
        this.targetX = Math.round(this.position.x + sign);
        // Prevent diagonal motion
        this.targetY = (Math.round(this.position.y));
    }
    
    /*----------------------
     == Vertical targeting==
     ----------------------*/
    else {
        
        if (Math.abs(yDistance) < 0.5) return;
        if (!this.xSnapped()) return;
        
        sign = Math.sign(yDistance);
        // Set the target one gridpoint away in the direction of 'sign'
        this.targetY = Math.round(this.position.y + sign);
        // Prevent diagonal motion
        this.targetX = (Math.round(this.position.x));
    }
}


/**
 Move a bit toward the target position
 */
MovingBlock.prototype.stepTowardTarget = function() {
    this.xStep(SPEED);
    this.yStep(SPEED);
}


/**
 Move (at most) the specified distance toward the specified point along the x-axis
 */
MovingBlock.prototype.xStep = function(dx) {
    
    var distance = this.position.x - this.targetX;
    if (distance == 0) return;
    
    var dir = -1 * Math.sign(distance);
    distance = Math.abs(distance);
    // Make sure the block won't move past the target
    dx = Math.min(dx, distance);
    
    // Translate by dx in the specified direction
    var xMovement = dir * dx;
    this.translateX(xMovement);
    // Check if the translation resulted in a collision
    if (this.collides()) {
        //If so, undo it...
        this.translateX(-xMovement);
        // ...move to contact position...
        this.snapToGridPoint(Math.round(this.position.x),
                             Math.round(this.position.y),
                             0);
        // ... and stop moving!
        this.targetClosestGridPoint();
    }
}


/**
 Move (at most) the specified distance toward the specified point along the z-axis
 */
MovingBlock.prototype.yStep = function(dy) {
    var distance = this.position.y - this.targetY;
    if (distance == 0) return;
    
    var dir = -1 * Math.sign(distance);
    distance = Math.abs(distance);
    
    // Make sure the block won't move past the target
    dy = Math.min(dy, distance);
    
    // Translate by dy in the specified direction
    var yMovement = dir * dy;
    this.translateY(yMovement);
    // Check if the translation resulted in a collision
    if (this.collides()) {
        //If so, undo it...
        this.translateY(-yMovement);
        // ...move to contact position...
        this.snapToGridPoint(Math.round(this.position.x),
                             Math.round(this.position.y),
                             0);
        // ... and stop moving!
        this.targetClosestGridPoint();
    }
}


/**
 Target the gridpoint closest to the block's current position
 */
MovingBlock.prototype.targetClosestGridPoint = function() {
    this.targetX = (Math.round(this.position.x));
    this.targetY = (Math.round(this.position.y));
}


/**
 Check if the block is overlapping another object in the
 obstacle array
 */
MovingBlock.prototype.collides = function() {
    var collides = false;
    var obstacle;
    
    for (var i = 0; i < this.obstacles.length; i++) {
        obstacle = this.obstacles[i];
        // Don't check for collisions with itself
        if (this == obstacle) continue;
        // Check if the block and the obstacle intersect
        if (!(this.position.x + this.width <=
              obstacle.position.x ||
              this.position.x >=
              obstacle.position.x + obstacle.width ||
              
              this.position.y + this.height <=
              obstacle.position.y ||
              this.position.y >=
              obstacle.position.y + obstacle.height
              )) {
            collides = true;
        }
    }
    return collides;
}

/**
 Create the shared geometries
 */
var initGeometries = function() {
    geometry11 = new THREE.CubeGeometry(1, 1, 1, SMOOTHNESS, SMOOTHNESS, SMOOTHNESS);
    geometry12 = new THREE.CubeGeometry(1, 2, 1, SMOOTHNESS, SMOOTHNESS, SMOOTHNESS);
    geometry21 = new THREE.CubeGeometry(2, 1, 1, SMOOTHNESS, SMOOTHNESS, SMOOTHNESS);
    geometry22 = new THREE.CubeGeometry(2, 2, 1, SMOOTHNESS, SMOOTHNESS, SMOOTHNESS);
    
    var modifier = new THREE.SubdivisionModifier(MODIFIER_VALUE);
    modifier.modify(geometry11);
    modifier.modify(geometry12);
    modifier.modify(geometry21);
    modifier.modify(geometry22);
    geometriesInited = true;
}

/**
 Returns the sign of a number
 */
Math.sign = function(x) {
    var sign = ((x < 0) ? -1 : 1);
    return sign;
}
