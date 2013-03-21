

/**
 Level constructor
 */
KlotskiLevel = function(callback, blockList) {
    THREE.Object3D.call(this);
    this.obstacles = [];
    this.blocks = [];
    this.initWalls();
    this.initBlocks(blockList);
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
            /*
            this.activeBlock.startPoint.x = this.activeBlock.position.x;
            this.activeBlock.startPoint.z = this.activeBlock.position.z;
             */
            
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
        /*
        if (this.activeBlock.startPoint.x != this.activeBlock.position.x
            ||
            this.activeBlock.startPoint.z != this.activeBlock.position.z
            ) {
            this.callback();
         
        }*/
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
 Add all blocks to the level
 */
KlotskiLevel.prototype.initBlocks = function(tokens) {
    
    // Add some code to do some stuff!
    
    // http://help.dottoro.com/ljhlvomw.php
    
    tokens = [new KlotskiToken(0, 0, 2, 1),
              new KlotskiToken(2, 0, 2, 1),
              new KlotskiToken(0, 1, 2, 1),
              new KlotskiToken(0, 2, 2, 1),
              new KlotskiToken(2, 2, 2, 1),
              new KlotskiToken(0, 3, 1, 1),
              new KlotskiToken(1, 3, 1, 1),
              new KlotskiToken(0, 4, 1, 1),
              new KlotskiToken(1, 4, 1, 1),
              new KlotskiToken(2, 3, 2, 2, true)
              ];
    
    var token;
    for (var i = 0; i < tokens.length; i++) {
        token = tokens[i];
        
        var block = new MovingBlock(token.x, token.y, token.width, token.height, this.obstacles);
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


/**
 A token representing a Klotski block
 */
KlotskiToken = function(x, y, width, height, main) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    if (main) this.main = main;
}





