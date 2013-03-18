

/**
 Level constructor
 */
KlotskiLevel = function(callback) {
    THREE.Object3D.call(this);
    this.obstacles = [];
    this.blocks = [];
    this.initWalls();
    this.initBlocks();
    this.initLights();
    this.initFloor();
    this.activeBlock = null;
    this.clickOffset = new THREE.Vector3(0, 0, 0);
    this.callback = callback;
}


KlotskiLevel.prototype = Object.create(THREE.Object3D.prototype);


/**
 Move all blocks toward their target positions
 */
KlotskiLevel.prototype.tick = function() {
    for (var i = 0; i < this.blocks.length; i++) {
        this.blocks[i].stepTowardTarget();
    }
}


/**
 If an object is clicked, activate it
 */
KlotskiLevel.prototype.clickEvent = function(x, y) {
    for (var i = 0; i < this.blocks.length; i++) {
        var blockHit = MouseInterface.getMouseHit(this.blocks, x, y);
        if (blockHit) {
            
            this.activeBlock = blockHit.object.parent;
            
            // Store the current position of the clicked block
            this.activeBlock.startPoint.x = this.activeBlock.position.x;
            this.activeBlock.startPoint.z = this.activeBlock.position.z;

            floorHit = MouseInterface.getMouseHit([this.floor], x, y);
            
            if (floorHit) {
                // Get the offset between hitpoint and the block
                this.clickOffset.subVectors(floorHit.point, this.activeBlock.position);
            }
        } return;
    }
}



/**
 If a block is active, move it
 */
KlotskiLevel.prototype.moveEvent = function(x, y) {
    // Find where the mouse intersects the floor
    if (this.activeBlock) {
        var hit = MouseInterface.getMouseHit([this.floor], x, y);
        // Return if the floor isn't at the touch point
        if (!hit) return;
        
        var target = new THREE.Vector3();
        target.subVectors(hit.point, this.clickOffset);
        /* Update the active blocks target position
        to the clicked point */
        this.activeBlock.updateTargetPosition(target);
    }
}


/**
 When the user input is released, deactivate the active block
 */
KlotskiLevel.prototype.releaseEvent = function(x, y) {
    /* If a block was moved to a new position
     and then released, send the callback method
     */
    if (this.activeBlock) {
        if (this.activeBlock.startPoint.x != this.activeBlock.position.x
            ||
            this.activeBlock.startPoint.z != this.activeBlock.position.z
            ) {
            this.callback();
        }
        // If a cube is selected, deselect it.
        this.activeBlock = null;
    }
}


/*-----------------------
 ===| Init functions |===
 ----------------------*/

/**
 Add the walls to the level
 */
KlotskiLevel.prototype.initWalls = function() {
    var wall = new KlotskiWall(1, 7);
    wall.snapToGridPoint(-1, -1);
    this.add(wall);
    this.obstacles.push(wall);
    
    wall = new KlotskiWall(1, 7);
    wall.snapToGridPoint(4, -1);
    this.add(wall);
    this.obstacles.push(wall);
    
    wall = new KlotskiWall(4, 1);
    wall.snapToGridPoint(0, -1);
    this.add(wall);
    this.obstacles.push(wall);
    
    wall = new KlotskiWall(1, 7);
    wall.snapToGridPoint(4, -1);
    this.add(wall);
    this.obstacles.push(wall);
    
    wall = new KlotskiWall(1, 1);
    wall.snapToGridPoint(0, 5);
    this.add(wall);
    this.obstacles.push(wall);
    
    wall = new KlotskiWall(1, 1);
    wall.snapToGridPoint(3, 5);
    this.add(wall);
    this.obstacles.push(wall);
}


/**
 Add all blocks to the level
 */
KlotskiLevel.prototype.initBlocks = function() {
    var block = new KlotskiBlock(2, 1, this.obstacles);
    block.snapToGridPoint(0, 0);
    this.add(block);
    this.blocks.push(block);
    this.obstacles.push(block);
    
    block = new KlotskiBlock(2, 1, this.obstacles);
    block.snapToGridPoint(2, 0);
    this.add(block);
    this.blocks.push(block);
    this.obstacles.push(block);
    
    block = new KlotskiBlock(2, 1, this.obstacles);
    block.snapToGridPoint(0, 1);
    this.add(block);
    this.blocks.push(block);
    this.obstacles.push(block);
    
    block = new KlotskiBlock(2, 1, this.obstacles);
    block.snapToGridPoint(0, 2);
    this.add(block);
    this.blocks.push(block);
    this.obstacles.push(block);
    
    block = new KlotskiBlock(2, 1, this.obstacles);
    block.snapToGridPoint(2, 2);
    this.add(block);
    this.blocks.push(block);
    this.obstacles.push(block);
    
    block = new KlotskiBlock(1, 1, this.obstacles);
    block.snapToGridPoint(0, 3);
    this.add(block);
    this.blocks.push(block);
    this.obstacles.push(block);
    
    block = new KlotskiBlock(1, 1, this.obstacles);
    block.snapToGridPoint(1, 3);
    this.add(block);
    this.blocks.push(block);
    this.obstacles.push(block);
    
    block = new KlotskiBlock(1, 1, this.obstacles);
    block.snapToGridPoint(0, 4);
    this.add(block);
    this.blocks.push(block);
    this.obstacles.push(block);
    
    block = new KlotskiBlock(1, 1, this.obstacles);
    block.snapToGridPoint(1, 4);
    this.add(block);
    this.blocks.push(block);
    this.obstacles.push(block);
    
    block = new KlotskiBlock(2, 2, this.obstacles);
    block.snapToGridPoint(2, 3);
    this.add(block);
    this.blocks.push(block);
    this.obstacles.push(block);
    block.setSuperDuper();
    
}


/**
 Add lights to the level
 */
KlotskiLevel.prototype.initLights = function() {
    // Point light
    var light = new THREE.PointLight(0xffffff);
    light.position.set(0, 250, 0);
    this.add(light);
    
    // Ambient light
    var light = new THREE.AmbientLight(0x404040); // soft white light
    this.add(light);
}


/**
 Add the level's floor
 */
KlotskiLevel.prototype.initFloor = function() {
    var floorMaterial = new THREE.MeshLambertMaterial({map: THREE.ImageUtils.loadTexture('../images/grass.png')});
    
    floorMaterial.map.wrapS = floorMaterial.map.wrapT = THREE.RepeatWrapping;
    floorMaterial.map.repeat.set(3, 3);
    
    var floorGeometry = new THREE.PlaneGeometry(600, 600, 10, 10);
    floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.doubleSided = true;
    
    // Rotate the floor correctly
    floor.rotation.x -= Math.PI / 2;
    // Move down a tiny bit to prevent flickering
    floor.position.set(gridSize * 2, -0.5, 0);
    this.add(floor);
    this.floor = floor;
}
