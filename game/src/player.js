var gamepadManager = new BABYLON.GamepadManager();

var deviceSourceManager;

const obstacleSpawnInterval = 3.5;

class Player extends GameObject {
    constructor() {
        super();
    }

    init() {
        this.obstacleSpawnTimer = 0;
        // A Vector2 is a 2 dimensional vector with X and Y dimension - track velocity with this.
        this.velocity = new BABYLON.Vector3(0, 0);
        this.setupInputs();

        // Create the player object - a 1 unit sphere
        this.playerMesh = BABYLON.MeshBuilder.CreateSphere("playerBall", { diameter: 1 }, scene);

        // Create a glowing material
        this.playerMaterial = new BABYLON.StandardMaterial("PlayerMaterial", scene);
        this.playerMaterial.emissiveColor = BABYLON.Color3.FromHexString("#00FF00"); // Glowing green
        this.playerMesh.material = this.playerMaterial;

        // Add a glow layer to enhance the glow effect
        const glowLayer = new BABYLON.GlowLayer("glow", scene);
        glowLayer.intensity = 1.0;

        // Add a fire effect using a particle system
        const fireParticleSystem = new BABYLON.ParticleSystem("fire", 2000, scene);
        fireParticleSystem.particleTexture = new BABYLON.Texture("/game/img/fire.png", scene); // Ensure this path is correct
        fireParticleSystem.emitter = this.playerMesh; // Emitter is the player mesh

        // Adjust the size and rate of particles for the fire effect
        fireParticleSystem.minSize = 0.1;
        fireParticleSystem.maxSize = 0.5;
        fireParticleSystem.emitRate = 100;
        fireParticleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;

        // Set the lifetime of particles so they last as long as desired
        fireParticleSystem.minLifeTime = 0.2;
        fireParticleSystem.maxLifeTime = 0.5;

        // Set speed of the particles to match the fire effect
        fireParticleSystem.minEmitPower = 1;
        fireParticleSystem.maxEmitPower = 3;

        // Emit particles in a leftward direction
        fireParticleSystem.direction1 = new BABYLON.Vector3(-1, 0, 0);
        fireParticleSystem.direction2 = new BABYLON.Vector3(-1, 0, 0);

        // Adjust the gravity of the particles if needed
        fireParticleSystem.gravity = new BABYLON.Vector3(0, -9.81, 0); // Optional

        // Start the particle system
        fireParticleSystem.start();

        // Store the particle system for cleanup
        this.fireParticleSystem = fireParticleSystem;
    }

    onDestroy() {
        if (this.playerMesh) {
            scene.removeMesh(this.playerMesh);
            this.playerMesh.dispose();
        }
        if (this.fireParticleSystem) {
            this.fireParticleSystem.stop();
            this.fireParticleSystem.dispose();
        }
    }

    update(deltaTime) {
        // Update the players physics:
        this.velocity.y += gravity.y * deltaTime;
        this.capVelocity(20);
        this.playerMesh.position.y += this.velocity.y * deltaTime;
        if (this.testGameOver()) {
            this.endGame();
        }

        // Adjust the fire effect based on the player's velocity
        if (this.velocity.y > 0) {
            this.fireParticleSystem.emitRate = 100 + this.velocity.y * 50; // Increase fire intensity
        } else {
            this.fireParticleSystem.emitRate = Math.max(0, 100 + this.velocity.y * 50); // Decrease fire intensity
        }

        // To simplify game code the Player handles spawning obstacles (this makes it easier to track for collisions without writing a full handler)
        // A side effect of this is that creating or destroying the Player can pause or start the game.
        this.obstacleSpawnTimer -= deltaTime;
        if (this.obstacleSpawnTimer <= 0) {
            this.obstacleSpawnTimer = obstacleSpawnInterval;

            createObject(new Barrier());
        }
    }

    endGame() {
        // This is used to identify and remove barrier objects from the scene
        destroyMatchingObjects((gobj) => gobj.location !== undefined);

        mainMenu.visible = true;
        destroyObject(this);
        resetScore();
    }

    testGameOver() {
        let outOfBounds = this.playerMesh.position.y > gameHeight || this.playerMesh.position.y < -gameHeight;

        let collision = testMatchingObjects(
            (gameObject) => gameObject.testCollision !== undefined,
            (gameObject) => gameObject.testCollision(this.playerMesh.position.y)
        );

        if (collision) {
            console.log("IMPACT");
        }

        return outOfBounds || collision;
    }

    onPlayerFlight() {
        this.velocity.y += flightForce;
    }

    capVelocity(cap) {
        this.velocity.y = Math.min(cap, Math.max(-cap, this.velocity.y));
    }

    setupInputs() {
        deviceSourceManager = new BABYLON.DeviceSourceManager(scene.getEngine());
        /**
         * onDeviceConnectedObservable is fired after a device is connected so any code that we
         * put in here should be able to reliably work against an existing device.
         *
         * For onInputChangedObservable, this will only work with Mouse, Touch, and Keyboards because
         * the Gamepad API currently does not fire input changed events (polling only)
         */
        deviceSourceManager.onDeviceConnectedObservable.add((deviceSource) => {
            // If Mouse/Touch, add an Observer to change text
            if (
                deviceSource.deviceType === BABYLON.DeviceType.Mouse ||
                deviceSource.deviceType === BABYLON.DeviceType.Touch
            ) {
                deviceSource.onInputChangedObservable.add((eventData) => {
                    if (eventData.type === "pointerdown" && eventData.inputIndex === BABYLON.PointerInput.LeftClick) {
                        this.onPlayerFlight();
                    }
                });
            }
            // If Keyboard, add an Observer to change text
            else if (deviceSource.deviceType === BABYLON.DeviceType.Keyboard) {
                deviceSource.onInputChangedObservable.add((eventData) => {
                    if (eventData.type === "keydown" && eventData.key === " ") {
                        this.onPlayerFlight();
                    }
                });
            }
        });

        // This callback is invoked when a new controller is attached:
        gamepadManager.onGamepadConnectedObservable.add((gamepad, state) => {
            // When a new controller is connected add support for detecting button presses
            gamepad.onButtonDownObservable.add((button, state) => {
                this.onPlayerFlight();
            });
        });
    }
}
