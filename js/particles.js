
function TouchParticleSystem() {};

/**
 Particle constructor
 */
TouchParticleSystem = function() {
    // create the particle variables
    this.particles = new THREE.Geometry();
    // create the particle variables
    var pMaterial = new THREE.ParticleBasicMaterial({color: 0xFFFFFF,
                                                    size: 1,
                                                    map: THREE.ImageUtils.loadTexture(
                                                                                      "../images/particle.png"
                                                                                      ),
                                                    blending: THREE.AdditiveBlending,
                                                    transparent: true
                                                    });
    
    THREE.ParticleSystem.call(this, this.particles, pMaterial);
    
    this.particleCount = 100;
    // now create the individual particles
    var particle;
    for (var p = 0; p < particleCount; p++) {
        // create a particle with random
        var pX = Math.random() * 2;
        var pY = Math.random() * 2;
        var pZ = Math.random() * 2;
        particle = new THREE.Vertex(new THREE.Vector3(pX, pY, pZ));
        
        // add it to the geometry
        this.particles.vertices.push(particle);
    }
    
    
    /* also update the particle system to
     sort the particles which enables
     the behaviour we want */
    this.sortParticles = true;
}

TouchParticleSystem.prototype = Object.create(THREE.ParticleSystem.prototype);


/**
 ...
 */
TouchParticleSystem.prototype.update = function() {

    // add some rotation to the system
    this.rotation.y += 0.01;
    
    for (var pCount = 0; pCount < particleCount; pCount++){
        // get the particle
        var particle = this.particles.vertices[pCount];
        
        if (!particle.position) console.log("Not y: " + pCount);
        // check if we need to reset
        if (particle.position.y < -200) {
            particle.position.y = 200;
            particle.velocity.y = 0;
        }
        
        // update the velocity with
        // a splat of randomniz
        particle.velocity.y -=
        Math.random() * .1;
        
        // and the position
        particle.position.addSelf(particle.velocity);
    }
    
    // flag to the particle system
    // that we've changed its vertices.
    this.geometry.__dirtyVertices = true;


}

