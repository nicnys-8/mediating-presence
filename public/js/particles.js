const PARTICLE_COUNT = 32;
const PARTICLE_SPEED = 0.0003;
const PARTICLE_TIMER = 40;

function TouchParticleSystem() {
};

/**
 Particle constructor
 */
TouchParticleSystem = function(color) {
    this.active = false;
    var geometry = new THREE.Geometry();
    // Set the color depending on
    var material = new THREE.ParticleBasicMaterial({color: 0xFFFFFF,
                                                   size: 0.004,
                                                   map: THREE.ImageUtils.loadTexture("../images/particle.png"),
                                                   blending: THREE.AdditiveBlending,
                                                   transparent: true
                                                   });
    THREE.ParticleSystem.call(this, geometry, material);
    
    // Set the point from which particles are emitted
    this.position.set(0, 0, 0);
    this.origin = new THREE.Vector3(0, 0, 0);
    
    // Create the individual particles
    var particle;
    for (var p = 0; p < PARTICLE_COUNT; p++) {
        // create a particle with random
        particle = new THREE.Vector3(0, 0, 0);
        particle.timer = 0;
        particle.velocity = new THREE.Vector3();
        this.geometry.vertices.push(particle);
    }
    
    /* also update the particle system to
     sort the particles which enables
     the behaviour we want */
    this.sortParticles = true;
};

TouchParticleSystem.prototype = Object.create(THREE.ParticleSystem.prototype);

/**
 Turns the emitted particles red
 */
TouchParticleSystem.prototype.makeRed = function() {
    var redMaterial = new THREE.ParticleBasicMaterial({color: 0xFFFFFF,
                                                   size: 0.004,
                                                   map: THREE.ImageUtils.loadTexture("../images/particle2.png"),
                                                   blending: THREE.AdditiveBlending,
                                                   transparent: true
                                                   });
    this.material = redMaterial;
};

/**
 Move all particles, and reset them if their timers have expired
 */
TouchParticleSystem.prototype.update = function() {
    var particle;
    for (var pCount = 0; pCount < PARTICLE_COUNT; pCount++){
        particle = this.geometry.vertices[pCount];
        // check if we need to reset the particle
        if (particle.timer <= 0) {
            // If the particle system is not active, hide dead particles 
            if (!this.active) {
                particle.z = 9999;
                continue;
            }
            particle.x = this.origin.x;
            particle.y = this.origin.y;
            particle.z = this.origin.z;
            
            particle.velocity.x = (Math.random() * PARTICLE_SPEED) - 0.5 * PARTICLE_SPEED;
            particle.velocity.y = (Math.random() * PARTICLE_SPEED) - 0.5 * PARTICLE_SPEED;
            particle.velocity.z = (Math.random() * PARTICLE_SPEED) - 0.5 * PARTICLE_SPEED;
            
            particle.timer = Math.random() * PARTICLE_TIMER;
        }
        particle.add(particle.velocity); // move the particle
        particle.timer--;
    }
    // flag to the particle system
    // that we've changed its vertices.
    this.geometry.__dirtyVertices = true;
};

/**
 Set the point from which new particles are emitted
 */
TouchParticleSystem.prototype.setOrigin = function(x, y, z) {
    this.origin.x = x;
    this.origin.y = y;
    this.origin.z = z;
};

