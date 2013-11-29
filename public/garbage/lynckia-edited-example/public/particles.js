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
                                                    size: 0.004,
                                                    map: THREE.ImageUtils.loadTexture(
                                                                                      "particle.png"
                                                                                      ),
                                                    blending: THREE.AdditiveBlending,
                                                    transparent: true
                                                    });
    
    THREE.ParticleSystem.call(this, geometry, material);
    this.scale.set(0.01, 0.01, 0.01);
    
    // Set the point from which particles are emitted
    this.origin = new THREE.Vector3(this.position.x,
                                    this.position.y,
                                    this.position.z
                                    );
    
    // Create the individual particles
    var particle;
    for (var p = 0; p < particleCount; p++) {
        // create a particle with random
        particle = new THREE.Vector3(0, 0, 0);
        particle.velocity = new THREE.Vector3((Math.random() * 0.1) - 0.05,
                                              (Math.random() * 0.1) - 0.05,
                                              (Math.random() * 0.1) - 0.05);
        
        particle.timer = 10 + Math.random() * 10;
        // Add each particle to the geometry
        this.geometry.vertices.push(particle);
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

        particle = this.geometry.vertices[pCount];
        // check if we need to reset the particle
        if (particle.timer <= 0) {
            
            /*
            particle.x = this.origin.x;
            particle.y = this.origin.y;
            particle.z = this.origin.z;
            */
            
            particle.x = 0;
            particle.y = 0;
            particle.z = 0;
            
            particle.velocity.x = (Math.random() * 0.1) - 0.05;
            particle.velocity.y = (Math.random() * 0.1) - 0.05;
            particle.velocity.z = (Math.random() * 0.1) - 0.05;
            
            particle.timer = 10 + Math.random() * 10;
            
        }
        particle.add(particle.velocity); // move the particle
        particle.timer--;
    }
    // flag to the particle system
    // that we've changed its vertices.
    this.geometry.__dirtyVertices = true;
}


/**
 Set the point from which new particles are emitted
 */
TouchParticleSystem.prototype.setOrigin = function(position) {
    this.origin = position;
    
}

