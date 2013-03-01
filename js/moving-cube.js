// function superclass() {this.stuff="stuff";}

const CUBE_SIDE = 50;
var geometry = new THREE.CubeGeometry(CUBE_SIDE, CUBE_SIDE, CUBE_SIDE);

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
    mesh2.position.set(CUBE_SIDE + 5, 0, 0);
    
    var mesh3 = new THREE.Mesh(geometry, this.material);
    mesh3.position.set(CUBE_SIDE + 5, 0, CUBE_SIDE + 5);
    
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
    if (Math.abs(this.position.x - this.targetPosition.x) < dx)  {
        // MOVE TO THE CONTACT POSITION
    } else {
        // Translate by dx in the specified direction
        var xMovement = ((this.position.x < this.targetPosition.x) ? dx : -dx);
        this.translateX(xMovement);
        if (this.collides()) { //If the translation resultet in a collision...
            this.translateX(-xMovement); //Undo!
        }
    }
}


/**
 Move (at most) the specified distance toward the specified point along the z-axis
 */
MovingCube.prototype.zStep = function(dz) {
    if (Math.abs(this.position.z - this.targetPosition.z) < dz)  {
        // MOVE TO THE CONTACT POSITION
    } else {
        // Translate by dy in the specified direction
        var zMovement = ((this.position.z < this.targetPosition.z) ? dz : -dz);
        this.translateZ(zMovement);
        if (this.collides()) { //If the translation resultet in a collision...
            this.translateZ(-zMovement); //Undo!
        }
    }
}


/**
 Check if the cube is overlapping any obstacles (only checks x and z)
 THIS METHOD WILL BE UPDATED TO TAKE MORE COMPLEX GEOMETRIES INTO ACCOUNT!!!
 */
MovingCube.prototype.collides = function() {
    var collides = false;
    var offset = CUBE_SIDE / 2;
    var obstacle;
    var mesh;
    for (var j = 0; j < this.meshes.length; j++) {
        mesh = this.meshes[j];
        
        var v = new THREE.Vector3();
        v = mesh.position.clone();
        
        console.log(mesh.position);
        console.log(mesh.localToWorld(v));
        
        for (var i = 0; i < obstacles.length; i++) {
            obstacle = obstacles[i];
            
            if (obstacle === this) console.log("Stop hitting yourself!");
            
            if ((obstacle !== this) && (
                                         mesh.parent.position.x + mesh.position.x + offset < obstacle.position.x + obstacle.parent.position.x - offset ||
                                         mesh.parent.position.x + mesh.position.x - offset > obstacle.position.x + obstacle.parent.position.x + offset ||
                                         
                                         mesh.parent.position.z + mesh.position.z + offset < obstacle.position.z + obstacle.parent.position.z - offset ||
                                         mesh.parent.position.z + mesh.position.z - offset > obstacle.position.z + obstacle.parent.position.z + offset
                                         ))
            { return true;
            }
        }
    }
    return false;
}





