/**
 Interface for using the mouse with a Three.js scene
 Requires Three.js to be included in html
 */


var MouseInterface = MouseInterface || {};

var mouse3D = new THREE.Vector3();

/**
 Get current mouse position as a 3D vector
 */
MouseInterface.setMousePosition = function(x, y) {
    mouse3D.x = (x / window.innerWidth) * 2 - 1;
    mouse3D.y = -(y / window.innerHeight) * 2 + 1;
    mouse3D.z = 0.5;
}


/**
 Returns the intersection point if an object is hit
 */
MouseInterface.getMouseHit = function(objects, x, y) {
    MouseInterface.setMousePosition(x, y);
    var mousePosition = mouse3D.clone();
    var projector = new THREE.Projector();
    projector.unprojectVector(mousePosition, camera);
    
    // Set up the normal vector pointing from the
    // camera to the target position
    var v = new THREE.Vector3();
    v.subVectors(mousePosition, camera.position);
    v.normalize();
    
    var ray = new THREE.Raycaster(camera.position, v);
    var hits = ray.intersectObjects(objects, true);
    
    if (hits[0]) {
        return hits[0];
    }
}