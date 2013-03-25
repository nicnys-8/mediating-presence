const particleCount = 32;

function TouchParticleSystem() {
};

//TouchParticleSystem.particleCount = 100;

/**
 Particle constructor
 */
TouchParticleSystem = function() {
    // create the particle variables
    var geometry = new THREE.Geometry();
    // create the particle variables
    var material = new THREE.ParticleBasicMaterial({color: 0xFFFFFF,
                                                    size: 0.005,
                                                    map: THREE.ImageUtils.loadTexture(
                                                                                      "../images/particle.png"
                                                                                      ),
                                                    blending: THREE.AdditiveBlending,
                                                    transparent: true
                                                    });
    
    THREE.ParticleSystem.call(this, geometry, material);
    
    
    // now create the individual particles
    var particle;
    var velocity;
    for (var p = 0; p < particleCount; p++) {
        // create a particle with random
        particle = new THREE.Vector3(0, 0, 0);
        
        velocity = new THREE.Vector3(Math.random(),
                               Math.random(),
                               Math.random());
        
        particle.velocity = velocity;
        
        /*
        particle.velocity = new THREE.Vector3();
        particle.velocity.x = Math.random();
        particle.velocity.y = Math.random();
        particle.velocity.z = Math.random();
        */
        
        // add it to the geometry
        this.geometry.vertices.push(particle);
        this.scale.set(0.0001, 0.0001, 0.0001);
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
    var particle;
    
    for (var pCount = 0; pCount < particleCount; pCount++){
        // get the particle
        particle = this.geometry.vertices[pCount];
        // check if we need to reset
        var distance = Math.sqrt(
                                 particle.x * particle.x +
                                 particle.y * particle.y +
                                 particle.z * particle.z
                                 );
        
        if (distance > 2) {
            particle.x = 0;
            particle.y = 0;
            particle.z = 0;
            
            particle.velocity.x = (Math.random() - 0.001) * 0.05;
            particle.velocity.y = (Math.random() - 0.001) * 0.05;
            particle.velocity.z = Math.random() * 0.001;
        }
        
        // and the position
        particle.add(particle.velocity);
    }
    
    // flag to the particle system
    // that we've changed its vertices.
    this.geometry.__dirtyVertices = true;
}

