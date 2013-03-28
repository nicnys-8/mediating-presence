
// Camera constants
const VIEW_ANGLE = 45;
const NEAR = 0.01;
const FAR = 100;

Klotski = function(blocksArg, callbackArg, containerArg) {
    
    /*--------------------------
     ===| Private varaibles |===
     -------------------------*/
    var scene;
    var camera
    var renderer;
    var obstacles;
    var container;
    var particleSystem;
    var blocks;
    var activeBlock;
    var floor;
    var mouseInterface;
    var clickOffset;
    
    /*-----------------------
     ===| Init functions |===
     ----------------------*/
    
    /**
     Sets up the camera and renderer
     */
    var resetRenderer = function() {
        var gameScreenWidth = container.offsetWidth;
        var gameScreenHeight = container.offsetHeight;
        var aspect = gameScreenWidth / gameScreenHeight;
        
        // If a camera already exists, remove it
        if (camera) scene.remove(camera);
        camera = new THREE.PerspectiveCamera(VIEW_ANGLE, aspect, NEAR, FAR);
        camera.position.set(2, 2.5, 12);
        camera.lookAt(new THREE.Vector3(2, 2.5, 0));
        scene.add(camera);
        
        // If a renderer does not already exist, create it
        if (!renderer) {
            renderer = new THREE.WebGLRenderer({antialias: true});
            container.appendChild(renderer.domElement);
        }
        renderer.setSize(gameScreenWidth, gameScreenHeight);
    }
    
    /**
     Add all blocks to the level
     */
    var initBlocks = function(tokens) {
        var token;
        for (var i = 0; i < tokens.length; i++) {
            token = tokens[i];
            var id = i;
            var block = new MovingBlock(id, token.x, token.y, token.width, token.height, obstacles);
            // Set the main block (this makes it blue and important and stuff...)
            if (token.main) block.setMain();
            scene.add(block);
            blocks.push(block);
            obstacles.push(block);
        }
    }
    
    /**
     Adds the walls to the level
     - The origin of the level is at the lower left
     inner corner of the walls
     */
    var initWalls = function() {
        var wall = new KlotskiWall(-1, -1, 1, 7);
        scene.add(wall);
        obstacles.push(wall);
        
        wall = new KlotskiWall(4, -1, 1, 7);
        scene.add(wall);
        obstacles.push(wall);
        
        wall = new KlotskiWall(0, -1, 4, 1);
        scene.add(wall);
        obstacles.push(wall);
        
        wall = new KlotskiWall(4, -1, 1, 7);
        scene.add(wall);
        obstacles.push(wall);
        
        wall = new KlotskiWall(0, 5, 1, 1);
        scene.add(wall);
        obstacles.push(wall);
        
        wall = new KlotskiWall(3, 5, 1, 1);
        scene.add(wall);
        obstacles.push(wall);
    }
    
    /**
     Adds a floor object to the level
     */
    var initFloor = function() {
        var floorMaterial = new THREE.MeshLambertMaterial({map: THREE.ImageUtils.loadTexture('../images/grass.png')});
        
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
        scene.add(floor);
        floor = floor;
    }
    
    /**
     Add lights to the level
     */
    var initLights = function() {
        // Point light
        var light = new THREE.PointLight(0xffffff);
        light.position.set(0, 0, 20);
        scene.add(light);
        
        // Ambient light
        var light = new THREE.AmbientLight(0x404040); // soft white light
        scene.add(light);
    }
    
    /**
     Add particle effects to the level
     */
    var initParticles = function() {
        particleSystem = new TouchParticleSystem();
        scene.add(particleSystem);
    }
    
    /*-----------------------
     ==| Constructor code |==
     ----------------------*/
    blockSnappedCallback = callbackArg;
    container = containerArg;
    
    scene = new THREE.Scene();
    
    blocks = [];
    obstacles = [];
    activeBlock = null;
    initBlocks(blocksArg);
    
    initWalls();
    initFloor();
    initLights();
    initParticles();
    
    resetRenderer();
    window.addEventListener("resize", resetRenderer, false);
    mouseInterface = new MouseInterface(container, camera);
    clickOffset = new THREE.Vector3(0, 0, 0);
    
    /*---------------------
     ==| Game mechanics |==
     --------------------*/
    
    /**
     Update the game state
     */
    var tick = function() {
        
        requestAnimationFrame(tick);
        renderer.render(scene, camera);
        
        var block;
        var snappedBefore;
        var snappedAfter;
        
        // Update blocks
        for (var i = 0; i < blocks.length; i++) {
            block = blocks[i];
            snappedBefore = block.isSnapped();
            // Move the block toward its target
            block.stepTowardTarget();
            snappedAfter = block.isSnapped();
            
            // If the block snapped to an even grid point, run the callback method
            if (!snappedBefore && snappedAfter) {
                blockSnappedCallback(block.id,
                                     block.position.x,
                                     block.position.y);
            }
        }
        // Update particle system
        particleSystem.update();
    }
    
    /**
     React when a block is moved by another player
     */
    var externalBlockMove = function(id, x, y) {
        for (var i = 0; i < blocks.length; i++) {
            var block = blocks[i];
            if (block.id != id) continue;
            block.updateTargetPosition(x, y);
        }
    }
    
    /**
     This is called whenever a block is moved to a new position
     */
    var blockSnappedCallback = function(blockID, x, y) {
    }
    
    /*-----------------------
     ==| Mouse input code |==
     ----------------------*/
    
    /**
     If a MovingBlock is clicked, make it controllable
     */
    var onMouseDown = function(x, y) {
        for (var i = 0; i < blocks.length; i++) {
            var blockHit = mouseInterface.getMouseHit(blocks, x, y);
            if (blockHit) {
                activeBlock = blockHit.object.parent;
                floorHit = mouseInterface.getMouseHit([floor], x, y);
                
                if (floorHit) {
                    // Get the offset between hitpoint and the block
                    clickOffset.subVectors(floorHit.point, activeBlock.position);
                }
            }
        }
    }
    
    /**
     If a block is active, move it
     */
    var onMouseMove = function(x, y) {
        var mouse3D = mouseInterface.getMouse3D(x, y);
        
        particleSystem.position.set(mouse3D.x, mouse3D.y, mouse3D.z);
        // particleSystem.setOrigin(mouse3D);
        
        var hit = mouseInterface.getMouseHit([floor], x, y);
        if (!hit) return; // Return if the floor isn't hit
        
        // Blocks
        if (activeBlock) {
            var target = new THREE.Vector3();
            target.subVectors(hit.point, clickOffset);
            /* Set the active block's target position
             to the clicked point */
            activeBlock.updateTargetPosition(target.x ,target.y);
        }
    }
    
    /**
     When the user input is released, deactivate the active block
     */
    var onMouseUp = function(x, y) {
        if (activeBlock) {
            activeBlock = null;
        }
    }
    
    /*---------------------------------------
     ==| Declarations of public functions |==
     --------------------------------------*/
    this.onMouseDown = onMouseDown;
    this.onMouseMove = onMouseMove;
    this.onMouseUp = onMouseUp;
    
    this.tick = tick;
};

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


Klotski.level1 = [new KlotskiToken(0, 0, 2, 1),
                  new KlotskiToken(2, 0, 2, 1),
                  new KlotskiToken(0, 1, 2, 1),
                  new KlotskiToken(0, 2, 2, 1),
                  new KlotskiToken(2, 2, 2, 1),
                  new KlotskiToken(0, 3, 1, 1),
                  new KlotskiToken(1, 3, 1, 1),
                  new KlotskiToken(0, 4, 1, 1),
                  new KlotskiToken(1, 4, 1, 1),
                  new KlotskiToken(2, 3, 2, 2, true) // Main block
                  ];

