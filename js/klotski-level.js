

/**
 Level constructor
 */
KlotskiLevel = function() {
    THREE.Object3D.call(this);
    this.obstacles = [];
    this.blocks = [];
    this.initWalls();
    this.initBlocks();
    this.initLights();
    this.initFloor();
}

KlotskiLevel.prototype = Object.create(THREE.Object3D.prototype);


/**
 ..
 */
KlotskiLevel.prototype.tick = function() {
    for (var i = 0; i < this.blocks.length; i++) {
        this.blocks[i].step();
    }
}


/**
 ...
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
 ...
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
 ...
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
 ...
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
