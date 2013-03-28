
function KlotskiLevel() {};


/**
 Level constructor
 */
KlotskiLevel = function(blockList, blockSnappedCallback) {
    THREE.Object3D.call(this);
    
    this.obstacles = [];
    this.blocks = [];
    this.initWalls();
    this.initBlocks(blockList);
    this.initLights();
    this.initFloor();
    
    this.particleSystem = new TouchParticleSystem();
    this.add(this.particleSystem);
    
    this.activeBlock = null;
    this.clickOffset = new THREE.Vector3(0, 0, 0);
    
    this.blockSnappedCallback = blockSnappedCallback;
    
    /*
     Move down a tiny bit to prevent flickering,
     and move it so that it's center is at the center of the level
     */
    floor.position.set(2, 3, -0.1);
    this.add(floor);
    this.floor = floor;
}


KlotskiLevel.prototype = Object.create(THREE.Object3D.prototype);


/**
 Update the state of the level
 */
KlotskiLevel.prototype.tick = function() {
    var block;
    var snappedBefore;
    var snappedAfter;
    
    // Update blocks
    for (var i = 0; i < this.blocks.length; i++) {
        block = this.blocks[i];
        snappedBefore = block.isSnapped();
        // Move the block toward its target
        block.stepTowardTarget();
        snappedAfter = block.isSnapped();
        
        // If the block snapped to an even grid point, run the callback method
        if (!snappedBefore && snappedAfter) {
            this.blockSnappedCallback(block.id,
                                      block.position.x,
                                      block.position.y);
        }
    }
    
    // Update particle system
    this.particleSystem.update();
}


/**
 If a MovingBlock is clicked, make it controllable
 */
KlotskiLevel.prototype.clickEvent = function(x, y) {
    for (var i = 0; i < this.blocks.length; i++) {
        var blockHit = MouseInterface.getMouseHit(this.blocks, x, y);
        if (blockHit) {
            this.activeBlock = blockHit.object.parent;
            floorHit = MouseInterface.getMouseHit([this.floor], x, y);
            
            if (floorHit) {
                // Get the offset between hitpoint and the block
                this.clickOffset.subVectors(floorHit.point, this.activeBlock.position);
            }
        }
    }
}


/**
 If a block is active, move it
 */
KlotskiLevel.prototype.moveEvent = function(x, y) {
    var mouse3D = MouseInterface.getMouse3D(x, y);
    
    this.particleSystem.position.set(mouse3D.x, mouse3D.y, mouse3D.z);
    // this.particleSystem.setOrigin(mouse3D);
    
    var hit = MouseInterface.getMouseHit([this.floor], x, y);
    if (!hit) return; // Return if the floor isn't hit
    
    // Blocks
    if (this.activeBlock) {
        var target = new THREE.Vector3();
        target.subVectors(hit.point, this.clickOffset);
        /* Set the active block's target position
         to the clicked point */
        this.activeBlock.updateTargetPosition(target.x ,target.y);
    }
}


/**
 If a block is active, move it
 */
KlotskiLevel.prototype.externalBlockMove = function(id, x, y) {
    for (var i = 0; i < this.blocks.length; i++) {
        var block = this.blocks[i];
        if (block.id != id) continue;
        block.updateTargetPosition(x, y);
    }
}


/**
 When the user input is released, deactivate the active block
 */
KlotskiLevel.prototype.releaseEvent = function(x, y) {
    if (this.activeBlock) {
        this.activeBlock = null;
    }
}


/*
 This is called whenever a block is moved to a new position
 */
KlotskiLevel.prototype.blockSnappedCallback = function(blockID, x, y) {
}

/*-----------------------
 ===| Init functions |===
 ----------------------*/

/**
 Add all blocks to the level
 */
KlotskiLevel.prototype.initBlocks = function(tokens) {
    var token;
    for (var i = 0; i < tokens.length; i++) {
        token = tokens[i];
        var id = i;
        var block = new MovingBlock(id, token.x, token.y, token.width, token.height, this.obstacles);
        // Set the main block (this makes it blue and important and stuff...)
        if (token.main) block.setMain();
        this.add(block);
        this.blocks.push(block);
        this.obstacles.push(block);
    }
}


/**
 Add lights to the level
 */
KlotskiLevel.prototype.initLights = function() {
    // Point light
    var light = new THREE.PointLight(0xffffff);
    light.position.set(0, 0, 20);
    this.add(light);
    
    // Ambient light
    var light = new THREE.AmbientLight(0x404040); // soft white light
    this.add(light);
}


/**
 Add the level's floor
 */
KlotskiLevel.prototype.initFloor = function() {
    var floorMaterial = new THREE.MeshLambertMaterial({map: THREE.ImageUtils.loadTexture('grass.png')});
    
    floorMaterial.map.wrapS = floorMaterial.map.wrapT = THREE.RepeatWrapping;
    floorMaterial.map.repeat.set(3, 3);
    
    var floorGeometry = new THREE.PlaneGeometry(10, 10, 10, 10);
    floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.doubleSided = true;
    
    /*
     Move down a tiny bit to prevent flickering,
     and move it so that it's center is at the center of the level
     */
    floor.position.set(2, 3, -0.1);
    this.add(floor);
    this.floor = floor;
}


/**
 Add the walls to the level
 - The origin of the level is at the lower left,
 inside of the walls
 */
KlotskiLevel.prototype.initWalls = function() {
    var wall = new KlotskiWall(-1, -1, 1, 7);
    this.add(wall);
    this.obstacles.push(wall);
    
    wall = new KlotskiWall(4, -1, 1, 7);
    this.add(wall);
    this.obstacles.push(wall);
    
    wall = new KlotskiWall(0, -1, 4, 1);
    this.add(wall);
    this.obstacles.push(wall);
    
    wall = new KlotskiWall(4, -1, 1, 7);
    this.add(wall);
    this.obstacles.push(wall);
    
    wall = new KlotskiWall(0, 5, 1, 1);
    this.add(wall);
    this.obstacles.push(wall);
    
    wall = new KlotskiWall(3, 5, 1, 1);
    this.add(wall);
    this.obstacles.push(wall);
}


/**
 A token representing a Klotski block
 -used for creating levels
 */
KlotskiToken = function(x, y, width, height, main) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    if (main) this.main = main;
}



