var obstacleSpeed = 1.5; // Changing this will impact how quickly obstacles in the game move.
var gapSize = 3; // This determines the size of the gap to create between the floor and ceiling.

class Barrier extends GameObject {
    constructor() {
        super();
        this.hasBeenPassed = false; // Flag to check if the player has passed the obstacle
        this.speed = 5;
        this.location = 15; // Initial location off the right side of the screen
    }

    init() {
        const boxOptions = { width: 1, height: 10, depth: 1 };
        this.ceilingBox = BABYLON.MeshBuilder.CreateBox("ceilingObstacle", boxOptions, scene);
        this.floorBox = BABYLON.MeshBuilder.CreateBox("floorObstacle", boxOptions, scene);

        // Create a material with a texture for the barriers
        let barrierMaterial = new BABYLON.StandardMaterial("BarrierMaterial", scene);
        barrierMaterial.diffuseTexture = new BABYLON.Texture("img/metal_texture.jpg", scene); // Ensure this path is correct
        barrierMaterial.bumpTexture = new BABYLON.Texture("img/metal_bump.jpg", scene); // Optional: add a bump texture for more detail
        barrierMaterial.specularColor = new BABYLON.Color4(0, 0, 0, 0); // Add some specular highlights

        this.ceilingBox.material = barrierMaterial;
        this.floorBox.material = barrierMaterial;

        this.assignLocations();
    }

    onDestroy() {
        // Remember when destroying an object to remove all meshes it creates from the scene!
        scene.removeMesh(this.ceilingBox);
        scene.removeMesh(this.floorBox);
    }

    update(deltaTime) {
        this.location -= deltaTime * obstacleSpeed;

        // Update the barrier's position
        this.ceilingBox.position.x = this.location;
        this.floorBox.position.x = this.location;

        // Check if the player has passed the barrier
        if (this.location < 0 && !this.hasBeenPassed) {
            this.hasBeenPassed = true;
            addScore(1);
        }

        // Destroy the barrier if it goes off-screen
        if (this.location < -25) {
            destroyObject(this);
        }
    }

    assignLocations() {
        // Pick a random center point
        let height = -gameHeight + gapSize / 2 + Math.random() * (gameHeight - gapSize / 2) * 2;
        this.ceilingBox.position.y = height + gapSize / 2 + 5;
        this.floorBox.position.y = height - gapSize / 2 - 5;
        this.ceilingBox.position.x = this.location;
        this.floorBox.position.x = this.location;
    }

    testCollision(playerHeight) {
        if (this.location > -1 && this.location < 1) {
            // In the same location as the player
            if (
                playerHeight + 5.5 > this.ceilingBox.position.y || // 5.5 is the half the height of the box + half the height of the player
                playerHeight - 5.5 < this.floorBox.position.y
            ) {
                return true;
            }
        }
        return false;
    }
}