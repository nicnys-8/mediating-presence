/**
 An online multiplayer version of the classic board game Klotski
 */

// Camera constants
const VIEW_ANGLE = 45;
const NEAR = 0.01;
const FAR = 100;

/**
 Constructor of the Klotski object
 @param blockSnappedCallback Method to be called when a block moves to
 an even gridpoint
 @param levelFinishedCallback Method to be called when a level is finished;
 takes the a string representing the finish time as input
 @param container The HTML element in which the game will be displayed
 */
Klotski = function(blockSnappedCallback, levelFinishedCallback, container) {
    
    /*--------------------------
     ===| Private variables |===
     -------------------------*/
    var scene;
    var camera
    var renderer;
    var obstacles;
    var externalMoves;
    var particleSystem;
    var blocks;
    var activeBlock;
    var mainBlock;
    var levelIndex;
    var floor;
    var mouseInterface;
    var clickOffset;
    var hasTurn;
    var timer;
    
    /*------------------------
     ===| Setup functions |===
     -----------------------*/
    /**
     Sets up the camera and renderer
     */
    var setView = function() {
        var gameScreenWidth = container.offsetWidth;
        var gameScreenHeight = container.offsetHeight;
        var aspect = gameScreenWidth / gameScreenHeight;
        // If a camera already exists, remove it
        if (camera) {
            camera.aspect = aspect;
            camera.updateProjectionMatrix();
        } else {
            camera = new THREE.PerspectiveCamera(VIEW_ANGLE, aspect, NEAR, FAR);
            scene.add(camera);
        }
        camera.position.set(2, 3.5, 13);
        camera.lookAt(new THREE.Vector3(2, 3.5, 0));
        // Rotate the camera to make y grow downwards
        camera.rotation.z = Math.PI;
        
        // If a renderer does not already exist, create it
        if (!renderer) {
            renderer = new THREE.WebGLRenderer({antialias: true});
            container.appendChild(renderer.domElement);
        }
        renderer.setSize(gameScreenWidth, gameScreenHeight);
    };
    
    /**
     Empty the current level
     */
    var clearLevel = function() {
        for (var i = 0; i < blocks.length; i++) {
            var block = blocks[i];
            scene.remove(block);
            // Remove the block from the obstacle list
            // All objects popped here should be blocks, not walls
            var obj = obstacles.pop();
            if (!(obj instanceof MovingBlock)) {
                console.log("Invalid level! Problems will probably ensue.");
            }
        }
        blocks = [];
        activeBlock = null;
    };
    
    /**
     Adds all blocks to the level
     @param index The index of the level to be loaded
     */
    var loadLevel = function(index) {
        var level = levels[index];
        var token;
        for (var i = 0; i < level.length; i++) {
            token = level[i];
            var id = i;
            var block = new MovingBlock(id, token.x,
                                        token.y,
                                        token.width,
                                        token.height,
                                        obstacles);
            block.setColor(token.color);
            if (token.color == "green") mainBlock = block;
            scene.add(block);
            blocks.push(block);
            obstacles.push(block);
        }
    };
    
    /**
     Adds the walls to the level
     - The origin of the level is at the lower left
     inner corner of the walls
     */
    var initWalls = function() {
        var wall = new KlotskiWall(-1, -1, 1, 7);
        scene.add(wall);
        obstacles.push(wall);
        
        wall = new KlotskiWall(-1, -1, 6, 1);
        scene.add(wall);
        obstacles.push(wall);
        
        wall = new KlotskiWall(4, -1, 1, 7);
        scene.add(wall);
        obstacles.push(wall);
        
        wall = new KlotskiWall(-1, 5, 2, 1);
        scene.add(wall);
        obstacles.push(wall);
        
        wall = new KlotskiWall(3, 5, 2, 1);
        scene.add(wall);
        obstacles.push(wall);
        
        wall = new KlotskiWall(0, 6, 4, 1);
        scene.add(wall);
        obstacles.push(wall);
        
        wall = new KlotskiWall(0, 5, 1, 2);
        scene.add(wall);
        obstacles.push(wall);
        
        wall = new KlotskiWall(3, 5, 1, 2);
        scene.add(wall);
        obstacles.push(wall);
    };
    
    /**
     Adds a floor object to the level
     */
    var initFloor = function() {
        
        var floorMaterial = new THREE.MeshLambertMaterial({map: THREE.ImageUtils.loadTexture('../images/grass.png')});
        
        floorMaterial.map.wrapS = floorMaterial.map.wrapT = THREE.RepeatWrapping;
        floorMaterial.map.repeat.set(3, 3);
        
        //var floorMaterial = new THREE.MeshPhongMaterial();
        
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
    };
    
    /**
     Adds lights to the level
     */
    var initLights = function() {
        // Point light
        var light = new THREE.PointLight(0xffffff);
        light.position.set(0, 0, 20);
        scene.add(light);
        
        // Ambient light
        var light = new THREE.AmbientLight(0x404040); // soft white light
        scene.add(light);
    };
    
    /*-----------------------
     ==| Constructor code |==
     -----------------------*/
    scene = new THREE.Scene();
    
    blocks = [];
    obstacles = [];
    externalMoves = [];
    activeBlock = null;
    clickOffset = new THREE.Vector3(0, 0, 0);
    hasTurn = false;
    
    initWalls();
    initFloor();
    initLights();
    
    particleSystem = new TouchParticleSystem();
    scene.add(particleSystem);
    
    timer = new Timer(document.getElementById("timer"));
    setView();
    window.addEventListener("resize", setView, false);
    mouseInterface = new MouseInterface(container, camera);
    
    /*---------------------
     ==| Game mechanics |==
     --------------------*/
    /**
     Starts the game from the first level
     */
    var startGame = function(hasTurn) {
        this.hasTurn = hasTurn;
        this.playerColor = (hasTurn) ? "red" : 'blue';
        levelIndex = 0;
        loadLevel(levelIndex);
        timer.start();
        // Set the view correctly
        setView();
    };
    
    /**
     Move blocks toward their target positions
     */
    var localBlockUpdate = function() {
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
    };
    
    /**
     Updates block movements based on an external message
     */
    var remoteBlockUpdate = function() {
        // Get the first item in the list
        var move = externalMoves[0];
        if (move) {
            var block = blocks[move.id];
            // Check if the block is already
            // at the specified position
            if (block.position.x == move.x &&
                block.position.y == move.y) {
                // If so, remove that move from the list
                externalMoves.shift();
            } else {
                // Else move the block toward that position
                block.updateTargetPosition(move.x, move.y);
                block.stepTowardTarget();
            }
        }
    };
    
    /**
     React when a block update is received from another player
     */
    var onReceivedMove = function(move) {
        externalMoves.push(move);
    };
    
    /**
     Update the game state
     */
    var updateScene = function() {
        // If the tab is active, render the current frame
        if (this.shouldRender) {
            renderer.render(scene, camera);
        }
        
        // Stupid code for finishing a level
        if (
            mainBlock.position.x == 1 &&
            mainBlock.position.y == 4) {
            var finishTime = timer.getTimeString();
            timer.stop();
            levelFinishedCallback(levelIndex, finishTime);
        }
        
        if (this.hasTurn) {
            localBlockUpdate();
        } else {
            remoteBlockUpdate();
        }
        
        // Update particle system
        particleSystem.update();
    };
    
    /**
     Called when the a level is finished
     */
    var nextLevel = function() {
        /* Stop the current touch
        onMouseUp();*/
        clearLevel();
        levelIndex++;
        levelIndex = levelIndex % levels.length;
        loadLevel(levelIndex);
        timer.start();
    };
    
    /*-----------------------
     ==| Mouse input code |==
     ----------------------*/
    /**
     If a MovingBlock is clicked, make it controllable
     */
    var onMouseDown = function(x, y) {
        var mouse3D = mouseInterface.getMouse3D(x, y);
        particleSystem.setOrigin(mouse3D.x, mouse3D.y, mouse3D.z);
        particleSystem.active = true;
        
        if (!this.hasTurn) return;
        for (var i = 0; i < blocks.length; i++) {
            var blockHit = mouseInterface.getMouseHit(blocks, x, y);
            if (blockHit) {
                // Select the block if it is the right color
                var block = blockHit.object.parent;
                if (this.playerColor != block.color &&
                    block.color != "green") continue;
                activeBlock = block;
                
                // Get the offset between hitpoint and the block
                floorHit = mouseInterface.getMouseHit([floor], x, y);
                if (floorHit) {
                    clickOffset.subVectors(floorHit.point, activeBlock.position);
                }
            }
        }
    };
    
    /**
     If a block is active, move it
     */
    var onMouseMove = function(x, y) {
        var mouse3D = mouseInterface.getMouse3D(x, y);
        //particleSystem.position.set(mouse3D.x, mouse3D.y, mouse3D.z);
        particleSystem.setOrigin(mouse3D.x, mouse3D.y, mouse3D.z);
        
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
    };
    
    /**
     When the user input is released, deactivate the active block
     */
    var onMouseUp = function(x, y) {
        particleSystem.active = false;
        if (activeBlock) {
            activeBlock = null;
        }
    };
    
    /*-----------------------
     ==| Public functions |==
     ----------------------*/
    this.onMouseDown = onMouseDown;
    this.onMouseMove = onMouseMove;
    this.onMouseUp = onMouseUp;
    this.onReceivedMove = onReceivedMove;
    this.startGame = startGame;
    this.updateScene = updateScene;
    this.nextLevel = nextLevel;
    
    /*-----------------------
     ==| Public variables |==
     ----------------------*/
    this.playerColor;
    this.shouldRender = true;
    this.hasTurn = true;
};

/**
 A token representing a Klotski block
 -used for creating levels
 */
KlotskiToken = function(x, y, width, height, color) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
}

levels = [];

var level1 = [new KlotskiToken(0, 0, 2, 1, "blue"),
              new KlotskiToken(2, 0, 2, 1, "blue"),
              new KlotskiToken(0, 1, 2, 1, "red"),
              new KlotskiToken(0, 2, 2, 1, "red"),
              new KlotskiToken(2, 2, 2, 1, "blue"),
              new KlotskiToken(0, 3, 1, 1, "blue"),
              new KlotskiToken(1, 3, 1, 1, "red"),
              new KlotskiToken(0, 4, 1, 1, "blue"),
              new KlotskiToken(1, 4, 1, 1, "red"),
              new KlotskiToken(2, 3, 2, 2, "green") // Main block
              ];
levels.push(level1);

var level2 = [new KlotskiToken(0, 3, 1, 2, "blue"),
              new KlotskiToken(1, 3, 1, 2, "red"),
              new KlotskiToken(2, 3, 2, 2, "green"), // Main block
              new KlotskiToken(1, 2, 1, 1, "red"),
              new KlotskiToken(2, 2, 1, 1, "red"),
              new KlotskiToken(0, 1, 2, 1, "blue"),
              new KlotskiToken(2, 1, 2, 1, "blue"),
              new KlotskiToken(0, 0, 2, 1, "red"),
              new KlotskiToken(2, 0, 2, 1, "blue")
              ];
levels.push(level2);

var level3 = [new KlotskiToken(0, 4, 1, 1, "red"),
              new KlotskiToken(1, 4, 1, 1), "red",
              new KlotskiToken(2, 4, 1, 1, "red"),
              new KlotskiToken(3, 4, 1, 1, "red"),
              new KlotskiToken(0, 3, 1, 1, "red"),
              new KlotskiToken(1, 3, 1, 1, "red"),
              new KlotskiToken(2, 2, 2, 2, "green"), // Main block
              new KlotskiToken(0, 2, 1, 1, "red"),
              new KlotskiToken(1, 2, 1, 1, "red"),
              new KlotskiToken(0, 1, 1, 1, "red"),
              new KlotskiToken(2, 1, 1, 1, "red"),
              new KlotskiToken(3, 1, 1, 1, "red"),
              new KlotskiToken(0, 0, 1, 1, "red"),
              new KlotskiToken(2, 0, 1, 1, "red"),
              new KlotskiToken(3, 0, 1, 1, "red")
              ];
levels.push(level3);

