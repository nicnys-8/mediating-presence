/**
 Interface for using the mouse with a Three.js scene
 Requires Three.js to be included in html
 */


var MouseInterface = MouseInterface || {};
var projector = new THREE.Projector();

var container = document.getElementById("container");

/**
 Returns the intersection point if an object is hit
 */
MouseInterface.getMouseHit = function(objects, x, y) {
    
    var x = ((x - container.offsetLeft) / container.offsetWidth) * 2 - 1;
    var y = -((y - container.offsetTop) / container.offsetHeight) * 2 + 1;
    
    var v = new THREE.Vector3(x, y, 0);
    
    var rayCaster = projector.pickingRay(v, camera);
    var hits = rayCaster.intersectObjects(objects, true);
    
    if (hits[0]) {
        return hits[0];
    }
}


/**
 Returns the intersection point if an object is hit
 */
MouseInterface.getMouse3D = function(x, y) {
    var x = ((x - container.offsetLeft) / container.offsetWidth) * 2 - 1;
    var y = -((y - container.offsetTop) / container.offsetHeight) * 2 + 1;
    var z = 0.8;
    var mouse3D = new THREE.Vector3(x, y, z);
    projector.unprojectVector(mouse3D, camera);
    return mouse3D;
}
