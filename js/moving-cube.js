// function superclass() {this.stuff="stuff";}

const CUBE_SIDE = 50;
var geometry = new THREE.CubeGeometry(CUBE_SIDE, CUBE_SIDE, CUBE_SIDE);

// Temp variables
var v1 = new THREE.Vector3();
var v2 = new THREE.Vector3();

/**
 Constructor
 */

MovingCube = function() {
    
    THREE.Object3D.call(this);
    
    this.selected = false;
    this.targetPosition = this.position;
    
    // Meshes
    this.meshes = [];
    this.material = new THREE.MeshLambertMaterial();
    this.material.color.setHex(0xff0000);
    
    var mesh1 = new THREE.Mesh(geometry, this.material);
    
    var mesh2 = new THREE.Mesh(geometry, this.material);
    mesh2.translateX(CUBE_SIDE);
    
    var mesh3 = new THREE.Mesh(geometry, this.material);
    mesh3.translateX(CUBE_SIDE);
    mesh3.translateZ(CUBE_SIDE);
    
    this.meshes.push(mesh1);
    this.meshes.push(mesh2);
    this.meshes.push(mesh3);
    this.add(mesh1);
    this.add(mesh2);
    this.add(mesh3);
};

//MovingCube.prototype = new THREE.Object3D();
MovingCube.prototype = Object.create(THREE.Object3D.prototype);

MovingCube.prototype.setPosition = function(x, y, z) {
    this.position.set(x, y, z);
}

/**
 */
MovingCube.prototype.setSelected = function(bool) {
    this.selected = bool;
    if (this.selected) {
        this.material.color.setHex(0x00ff00);
    } else {
        this.material.color.setHex(0xff0000);
    }
}


/**
 Returns a boolean telling us whether the cube has been selected
 */
MovingCube.prototype.isSelected = function() {
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


/**
 Sets the position the cube moves toward
 */
MovingCube.prototype.setTargetPosition = function(position) {
    this.targetPosition = position;
}


/**
 Move (at most) the specified distance toward the specified point along the x-axis
 */
MovingCube.prototype.xStep = function(dx) {
    var dir = ((this.position.z < this.targetPosition.z) ? 1 : -1);
    
    if (Math.abs(this.position.x - this.targetPosition.x) < dx)  {
        // Move to contact position
        while (!this.collides()) {
            this.translateX(dir);
        }
    } else {
            // Translate by dx in the specified direction
            var xMovement = dir * dx;
            this.translateX(xMovement);
            if (this.collides()) { //If the translation resulted in a collision...
                this.translateX(-xMovement); //Undo!
                console.log("x-collision");
            }
        }
    }
    
    
    /**
     Move (at most) the specified distance toward the specified point along the z-axis
     */
    MovingCube.prototype.zStep = function(dz) {
        var dir = ((this.position.z < this.targetPosition.z) ? 1 : -1);
        
        if (Math.abs(this.position.z - this.targetPosition.z) < dz)  {
            // Move to contact position
            while (!this.collides()) {
                this.translateZ(dir);
            }
        } else {
            var zMovement = dir * dz;
            this.translateZ(zMovement);
            if (this.collides()) { //If the translation resultet in a collision...
                this.translateZ(-zMovement); //Undo!
                console.log("z-collision");
            }
        }
    }
    
    
    /**
     OBS! Det här är en svammelmetod, ska förstås ändras sen...
     */
    MovingCube.prototype.collides = function() {
        var collides = false;
        var offset = CUBE_SIDE / 2;
        var obstacle;
        var mesh;
        
        for (var j = 0; j < this.meshes.length; j++) {
            mesh = this.meshes[j];
            
            for (var i = 0; i < obstacles.length; i++) {
                
                obstacle = obstacles[i];
                /*
                 v1.getPositionFromMatrix(mesh.matrixWorld);
                 v2.getPositionFromMatrix(obstacle.matrixWorld);
                 
                 if ((obstacle.parent !== mesh.parent) && !(
                 v1.x + offset < v2.x - offset ||
                 v1.x - offset > v2.x + offset ||
                 v1.z + offset < v2.z - offset ||
                 v1.z - offset > v2.z + offset
                 )) {
                 */
                
                if ((obstacle.parent !== mesh.parent) && !(
                                                           mesh.parent.position.x + mesh.position.x + offset < obstacle.position.x + obstacle.parent.position.x - offset ||
                                                           mesh.parent.position.x + mesh.position.x - offset > obstacle.position.x + obstacle.parent.position.x + offset ||
                                                           
                                                           mesh.parent.position.z + mesh.position.z + offset < obstacle.position.z + obstacle.parent.position.z - offset ||
                                                           mesh.parent.position.z + mesh.position.z - offset > obstacle.position.z + obstacle.parent.position.z + offset
                                                           ))
                {
                    collides = true;
                }
            }
        }
        return collides;
    }
    
    
    
    
    
