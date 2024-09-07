/* Assignment 2: Hole in the Ground
 * CSCI 4611, Spring 2023, University of Minnesota
 * Instructor: Evan Suma Rosenberg <suma@umn.edu>
 * License: Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International
 */

import * as gfx from 'gophergfx'
import { RigidBody } from './RigidBody';
import { Arrow } from './Arrow'
import { VERSION, VertexLayout } from '@gltf-transform/core';

export class PhysicsGame extends gfx.GfxApp {
    // State variable to store the current stage of the game
    private stage: number;

    // Current hole radius
    private holeRadius: number;

    // Mesh of a ground plane with a hole in it
    private hole: gfx.Mesh3;

    // Template mesh to create sphere instances
    private sphere: gfx.Mesh3;

    // Bounding box that defines the dimensions of the play area
    private playArea: gfx.BoundingBox3;

    // Group that will hold all the rigid bodies currently in the scene
    private rigidBodies: gfx.Node3;

    // A plane mesh that will be used to display dynamic text
    private textPlane: gfx.Mesh3;

    // A dynamic texture that will be displayed on the plane mesh
    private text: gfx.Text;

    // A sound effect to play when an object falls inside the hole
    private holeSound: HTMLAudioElement;

    // A sound effect to play when the user wins the game
    private winSound: HTMLAudioElement;

    // Vector used to store user input from keyboard or mouse
    private inputVector: gfx.Vector2;

    private gameStart: boolean;

    private spawnWhiteBall: boolean;

    private whiteball;

    private arrow = new Arrow();
    private mouseStart = new gfx.Vector2();
    private ballInitialPos = new gfx.Vector3(0, 0, -10);
    private rotations: gfx.Vector3[] = [];

    constructor() {
        super();

        this.stage = 0;

        this.holeRadius = 1;
        this.hole = gfx.MeshLoader.loadOBJ('./assets/hole.obj');
        this.sphere = gfx.Geometry3Factory.createSphere(1, 2);

        this.playArea = new gfx.BoundingBox3();
        this.rigidBodies = new gfx.Node3();

        this.textPlane = gfx.Geometry3Factory.createPlane();
        this.text = new gfx.Text('press a button to start', 512, 256, '48px Helvetica');
        this.holeSound = new Audio('./assets/hole.mp3');
        this.winSound = new Audio('./assets/win.mp3');

        this.inputVector = new gfx.Vector2();
        this.whiteball = new RigidBody(this.sphere);

        this.gameStart = false;
        this.spawnWhiteBall = false;

    }

    createScene(): void {
        // Setup the camera projection matrix, position, and look direction.
        // We will learn more about camera models later in this course.
        this.camera.setPerspectiveCamera(60, 1920 / 1080, 0.1, 50)
        this.camera.position.set(0, 12, 12);
        this.camera.lookAt(gfx.Vector3.ZERO);

        // Create an ambient light that illuminates everything in the scene
        const ambientLight = new gfx.AmbientLight(new gfx.Color(0.3, 0.3, 0.3));
        this.scene.add(ambientLight);

        // Create a directional light that is infinitely far away (sunlight)
        const directionalLight = new gfx.DirectionalLight(new gfx.Color(0.6, 0.6, 0.6));
        directionalLight.position.set(0, 2, 1);
        this.scene.add(directionalLight);

        // Set the hole mesh material color to green
        this.hole.material.setColor(new gfx.Color(83 / 255, 209 / 255, 110 / 255));

        // Create a bounding box for the game
        this.playArea.min.set(-10, 0, -16);
        this.playArea.max.set(10, 30, 8);

        // Position the text plane mesh on the ground
        this.textPlane.position.set(0, 0.1, 4.5);
        this.textPlane.scale.set(16, 8, 1);
        this.textPlane.rotation.setEulerAngles(-Math.PI / 2, 0, Math.PI);

        // Set up the dynamic texture for the text plane
        const textMaterial = new gfx.UnlitMaterial();
        textMaterial.texture = this.text;
        this.textPlane.material = textMaterial;

        // Draw lines for the bounding box
        const playBounds = new gfx.Line3();
        playBounds.createFromBox(this.playArea);
        playBounds.color.set(1, 1, 1);
        this.scene.add(playBounds);

        // Add the objects to the scene
        this.scene.add(this.hole);
        this.scene.add(this.textPlane);
        this.scene.add(this.rigidBodies);

        this.arrow = new Arrow(gfx.Color.RED);
        this.arrow.visible = false;
        this.scene.add(this.arrow);
    }

    reset(): void {
        this.whiteball.position = this.ballInitialPos;
        this.whiteball.velocity = gfx.Vector3.ZERO;
        this.arrow.position = this.ballInitialPos;
        this.arrow.vector = gfx.Vector3.ZERO;
    }

    update(deltaTime: number): void {
        // This code defines the gravity and friction parameters used in the
        // instructor's example implementation.  You can change them if you 
        // want to adjust your game mechanics and difficulty. 
        // However, note that the spheres in the initial scene are placed purposefully
        // to allow you to visually check that your physics code is working.

        // The movement speed of the hole in meters / sec
        const holeSpeed = 10;

        // The friction constant will cause physics objects to slow down upon collision
        const frictionSlowDown = 0.9;

        // Hole radius scale factor
        const holeScaleFactor = 1.25;

        // Move hole based on the user input
        if (this.gameStart == false) {
            this.hole.position.x += this.inputVector.x * holeSpeed * deltaTime;
            this.hole.position.z -= this.inputVector.y * holeSpeed * deltaTime;
        } else {
            this.whiteball.velocity.x += this.inputVector.x * holeSpeed;
            this.whiteball.velocity.z -= this.inputVector.y * holeSpeed;
        }

        //=========================================================================
        // PART 1: HOLE MOVEMENT
        // The code above allows the user to move the hole in the X and Z directions.
        // However, we want to add some boundary checks to prevent the hole from
        // leaving the boundaries, which are defined in the playArea member variable.

        // ADD YOUR CODE
        //=========================================================================

        if (this.playArea.min.x + this.holeRadius > this.hole.position.x) {
            this.hole.position.x = this.playArea.min.x + this.holeRadius;
        }
        if (this.playArea.max.x < this.hole.position.x + this.holeRadius) {
            this.hole.position.x = this.playArea.max.x - this.holeRadius;
        }
        if (this.playArea.min.z + this.holeRadius > this.hole.position.z) {
            this.hole.position.z = this.playArea.min.z + this.holeRadius;
        }
        if (this.playArea.max.z < this.hole.position.z + this.holeRadius) {
            this.hole.position.z = this.playArea.max.z - this.holeRadius;
        }

        if (this.playArea.min.x + this.whiteball.getRadius() > this.whiteball.position.x) {
            this.whiteball.position.x = this.playArea.min.x + this.whiteball.getRadius();
        }
        if (this.playArea.max.x < this.whiteball.position.x + this.whiteball.getRadius()) {
            this.whiteball.position.x = this.playArea.max.x - this.whiteball.getRadius();
        }
        if (this.playArea.min.z + this.whiteball.getRadius() > this.hole.position.z) {
            this.whiteball.position.z = this.playArea.min.z + this.whiteball.getRadius();
        }
        if (this.playArea.max.z < this.whiteball.position.z + this.whiteball.getRadius()) {
            this.whiteball.position.z = this.playArea.max.z - this.whiteball.getRadius();
        }

        if (this.gameStart == true && this.spawnWhiteBall == false) {


            this.whiteball.material = new gfx.GouraudMaterial();
            this.whiteball.material.setColor(gfx.Color.WHITE);
            this.whiteball.position.set(0, 0, -10);
            this.whiteball.setRadius(0.75);
            this.whiteball.velocity.set(0, 0, 0);
            this.rigidBodies.add(this.whiteball);
            this.spawnWhiteBall = true;
        }

        // Update rigid body physics
        // You do not need to modify this code
        this.rigidBodies.children.forEach((transform: gfx.Node3) => {
            const rb = transform as RigidBody;
            rb.update(deltaTime);
        });

        // Handle object-object collisions
        // You do not need to modify this code
        for (let i = 0; i < this.rigidBodies.children.length; i++) {
            for (let j = i + 1; j < this.rigidBodies.children.length; j++) {
                const rb1 = this.rigidBodies.children[i] as RigidBody;
                const rb2 = this.rigidBodies.children[j] as RigidBody;

                this.handleObjectCollision(rb1, rb2, frictionSlowDown)
            }
        }
        var count = 0;
        // Handle object-environment collisions
        // You do not need to modify this code
        this.rigidBodies.children.forEach((transform: gfx.Node3) => {

            const rb = transform as RigidBody;

            //rotation 
            if (this.gameStart) {
                const velocity = rb.velocity.clone();
                var position = rb.position.clone();
                var x; var y; var z;

                this.rotations[count].y += 0.01 * rb.velocity.x;
                y = Math.cos(this.rotations[count].y);
                position.y += y;
                // this.rotations[count].x += 0.01 * rb.velocity.x;
                // x = Math.sin(this.rotations[count].x);
                // position.x += x;
                // this.rotations[count].z += 0.01 * rb.velocity.z;
                // z = Math.sin(this.rotations[count].z);
                // position.z += z;

                if (rb.velocity.z != 0 && rb.velocity.x != 0 && rb.velocity.y != 0) {
                    rb.lookAt(position);
                    // const Q1 = gfx.Quaternion.makeRotationZ(-position.x);
                    // const Q2 = gfx.Quaternion.makeRotationY(position.z);
                    // const Q3 = gfx.Quaternion.makeRotationX(position.y);
                    // rb.rotation = gfx.Quaternion.multiply(Q1, Q2);
                    // rb.rotation = gfx.Quaternion.multiply(rb.rotation, Q3);

                    const Q1 = gfx.Quaternion.makeRotationZ(-position.x);
                    const Q2 = gfx.Quaternion.makeRotationX(-position.z);
                    rb.rotation = gfx.Quaternion.multiply(Q1, Q2);
                }
            }

            // The object has fallen far enough to score a point
            if (rb.position.y < -10) {
                this.holeSound.play();

                // Remove the object from the scene
                rb.remove();

                //Check if we captured the last sphere
                if (this.rigidBodies.children.length == 0)
                    this.startNextStage();
                else {
                    if (this.gameStart != true) {
                        this.setHoleRadius(this.holeRadius * holeScaleFactor);
                    }
                }
            }
            // The object is within range of the hole and can fit inside
            else if (rb.getRadius() < this.holeRadius && rb.position.distanceTo(this.hole.position) < this.holeRadius) {
                this.handleRimCollision(rb, frictionSlowDown);
            }
            // The object has not fallen all the way into the hole yet
            else if (rb.position.y + rb.getRadius() > 0) {
                this.handleBoundaryCollision(rb, frictionSlowDown);
            }

            this.ballInitialPos = this.whiteball.position;
            count++;
        });

    }


    handleBoundaryCollision(rb: RigidBody, frictionSlowDown: number): void {


        // PART 3: BOUNDARY COLLISIONS

        // As a first step, you should review the explanations about detecting collisions,
        // updating position after a collision, and updating velocity after a collision.
        // In this method, you will need to:
        // 1. Check if the sphere is intersecting each boundary of the play area. 
        // 2. Correct the intersection by adjusting the position of the sphere.
        // 3. Compute the reflected velocity after the collision. Note that because the ground
        // and walls are aligned with the XYZ axes, this is the simple case of negating one
        // dimension of the velocity vector.
        // 4. After a collision, slow down the velocity due to friction.

        // ADD YOUR CODE HERE
        if (rb.position.x - rb.getRadius() < this.playArea.min.x) {
            rb.position.x = this.playArea.min.x + rb.getRadius();
            rb.velocity.x = -rb.velocity.x;
            rb.velocity.multiplyScalar(frictionSlowDown);
        } else if (rb.position.x + rb.getRadius() > this.playArea.max.x) {
            rb.position.x = this.playArea.max.x - rb.getRadius();
            rb.velocity.x = -rb.velocity.x;
            rb.velocity.multiplyScalar(frictionSlowDown);
        }

        if (rb.position.y - rb.getRadius() < this.playArea.min.y) {
            rb.position.y = this.playArea.min.y + rb.getRadius();
            rb.velocity.y = -rb.velocity.y;
            if (this.gameStart == false) {
                rb.velocity.multiplyScalar(frictionSlowDown);
            }
        } else if (rb.position.y + rb.getRadius() > this.playArea.max.y) {
            rb.position.y = this.playArea.max.y - rb.getRadius();
            rb.velocity.y = -rb.velocity.y;
            if (this.gameStart == false) {
                rb.velocity.multiplyScalar(frictionSlowDown);
            }
        }

        if (rb.position.z - rb.getRadius() < this.playArea.min.z) {
            rb.position.z = this.playArea.min.z + rb.getRadius();
            rb.velocity.z = -rb.velocity.z;
            rb.velocity.multiplyScalar(frictionSlowDown);
        } else if (rb.position.z + rb.getRadius() > this.playArea.max.z) {
            rb.position.z = this.playArea.max.z - rb.getRadius();
            rb.velocity.z = -rb.velocity.z;
            rb.velocity.multiplyScalar(frictionSlowDown);
        }

    }

    handleObjectCollision(rb1: RigidBody, rb2: RigidBody, frictionSlowDown: number): void {


        // PART 4: RIGID BODY COLLISIONS
        // This is the most challenging part of this assignment, so make sure to
        // read all the information described in the README.  If you are struggling 
        // with understanding the math or have questions about how to implement the 
        // equations, then you should seek help from the instructor or TA. 

        // ADD YOUR CODE HERE
        if (rb1.intersects(rb2, gfx.IntersectionMode3.BOUNDING_SPHERE)) {
            var norm1 = gfx.Vector3.subtract(rb1.position, rb2.position);
            const penetrationDepth = rb1.getRadius() + rb2.getRadius() - rb1.position.distanceTo(rb2.position);
            const separationVector = gfx.Vector3.multiplyScalar(norm1, penetrationDepth * 0.5);
            rb1.position.add(separationVector);
            rb2.position.subtract(separationVector);

            const vrel1 = gfx.Vector3.subtract(rb1.velocity, rb2.velocity);
            const vrel2 = gfx.Vector3.subtract(rb2.velocity, rb1.velocity);

            norm1 = gfx.Vector3.subtract(rb1.position, rb2.position);
            var norm2 = gfx.Vector3.subtract(rb2.position, rb1.position);
            norm1.normalize();
            norm2.normalize();

            rb1.velocity = gfx.Vector3.reflect(vrel1, norm1);
            rb2.velocity = gfx.Vector3.reflect(vrel2, norm2);

            rb1.velocity.multiplyScalar(0.5);
            rb2.velocity.multiplyScalar(0.5);
            rb1.velocity.multiplyScalar(frictionSlowDown);
            rb2.velocity.multiplyScalar(frictionSlowDown);

        }
    }

    // This method handles collisions between the rigid body and the rim
    // of the hole. You do not need to modify this code
    handleRimCollision(rb: RigidBody, frictionSlowDown: number): void {
        // Compute the rigid body's position, ignoring any vertical displacement
        const rbOnGround = new gfx.Vector3(rb.position.x, 0, rb.position.z);

        // Find the closest point along the rim of the hole
        const rimPoint = gfx.Vector3.subtract(rbOnGround, this.hole.position);
        rimPoint.normalize();
        rimPoint.multiplyScalar(this.holeRadius);
        rimPoint.add(this.hole.position.clone());

        // If the rigid body is colliding with the point on the rim
        if (rb.position.distanceTo(rimPoint) < rb.getRadius()) {
            // Correct the position of the rigid body so that it is no longer intersecting
            const correctionDistance = rb.getRadius() - rb.position.distanceTo(rimPoint);
            const correctionMovement = gfx.Vector3.subtract(rb.position, rimPoint);
            correctionMovement.normalize();
            correctionMovement.multiplyScalar(correctionDistance);
            rb.position.add(correctionMovement);

            // Compute the collision normal
            const rimNormal = gfx.Vector3.subtract(this.hole.position, rimPoint);
            rimNormal.normalize();

            // Reflect the velocity about the collision normal
            rb.velocity.reflect(rimNormal);

            // Slow down the velocity due to friction
            rb.velocity.multiplyScalar(frictionSlowDown);
        }
    }

    // This method advances to the next stage of the game
    startNextStage(): void {
        // Create a test scene when the user presses start
        if (this.stage == 0) {
            this.textPlane.visible = false;

            const rb1 = new RigidBody(this.sphere);
            rb1.material = new gfx.GouraudMaterial();
            rb1.material.setColor(gfx.Color.RED);
            rb1.position.set(0, 0.25, 7.5);
            rb1.setRadius(0.25);
            rb1.velocity.set(0, 10, -4);
            this.rigidBodies.add(rb1);

            const rb2 = new RigidBody(this.sphere);
            rb2.material = new gfx.GouraudMaterial();
            rb2.material.setColor(gfx.Color.GREEN);
            rb2.position.set(-8, 1, -5);
            rb2.setRadius(0.5);
            rb2.velocity.set(4, 0, 0);
            this.rigidBodies.add(rb2);

            const rb3 = new RigidBody(this.sphere);
            rb3.material = new gfx.GouraudMaterial();
            rb3.material.setColor(gfx.Color.BLUE);
            rb3.position.set(8, 1, -4.5);
            rb3.setRadius(0.5);
            rb3.velocity.set(-9, 0, 0);
            this.rigidBodies.add(rb3);

            const rb4 = new RigidBody(this.sphere);
            rb4.material = new gfx.GouraudMaterial();
            rb4.material.setColor(gfx.Color.YELLOW);
            rb4.position.set(0, 0.25, -12);
            rb4.setRadius(0.5);
            rb4.velocity.set(15, 10, -20);
            this.rigidBodies.add(rb4);

        }

        else if (this.stage == 1) {
            this.setHoleRadius(0.5);
            this.textPlane.visible = false;

            const rb1 = new RigidBody(this.sphere);
            rb1.material = new gfx.GouraudMaterial();
            rb1.material.setColor(gfx.Color.RED);
            rb1.position.set(5, 3.25, 1.5);
            rb1.setRadius(0.25);
            rb1.velocity.set(3, -4, 1);
            this.rigidBodies.add(rb1);

            const rb2 = new RigidBody(this.sphere);
            rb2.material = new gfx.GouraudMaterial();
            rb2.material.setColor(gfx.Color.GREEN);
            rb2.position.set(3, 6, 3);
            rb2.setRadius(0.5);
            rb2.velocity.set(1, -2, -3);
            this.rigidBodies.add(rb2);

            const rb3 = new RigidBody(this.sphere);
            rb3.material = new gfx.GouraudMaterial();
            rb3.material.setColor(gfx.Color.BLUE);
            rb3.position.set(-7, 3, 5);
            rb3.setRadius(0.5);
            rb3.velocity.set(4, 0, 3);
            this.rigidBodies.add(rb3);

            const rb4 = new RigidBody(this.sphere);
            rb4.material = new gfx.GouraudMaterial();
            rb4.material.setColor(gfx.Color.YELLOW);
            rb4.position.set(-2, 0, 8);
            rb4.setRadius(0.75);
            rb4.velocity.set(4, 0, 20);
            this.rigidBodies.add(rb4);

            const rb5 = new RigidBody(this.sphere);
            rb5.material = new gfx.GouraudMaterial();
            rb5.material.setColor(gfx.Color.PURPLE);
            rb5.position.set(3, 2, -7);
            rb5.setRadius(1);
            rb5.velocity.set(-1, 0, -1);
            this.rigidBodies.add(rb5);

            const rb6 = new RigidBody(this.sphere);
            rb6.material = new gfx.GouraudMaterial();
            rb6.material.setColor(gfx.Color.CYAN);
            rb6.position.set(2, 2, 2);
            rb6.setRadius(1);
            rb6.velocity.set(10, -2, 3);
            this.rigidBodies.add(rb6);

            const rb7 = new RigidBody(this.sphere);
            rb7.material = new gfx.GouraudMaterial();
            rb7.material.setColor(gfx.Color.WHITE);
            rb7.position.set(8, 1, -2);
            rb7.setRadius(1.25);
            rb7.velocity.set(-4, 0, -4);
            this.rigidBodies.add(rb7);

            const rb8 = new RigidBody(this.sphere);
            rb8.material = new gfx.GouraudMaterial();
            rb8.material.setColor(gfx.Color.BLACK);
            rb8.position.set(1, 0, 0);
            rb8.setRadius(1.75);
            rb8.velocity.set(-3, 0, -8);
            this.rigidBodies.add(rb8);

        }

        // The user has finished the test scene
        else if (this.stage == 2) {
            this.textPlane.visible = false;
            this.arrow.visible = true;
            // this.angles = [];

            // PART 5: CREATE YOUR OWN GAME
            // In this part, you should create your own custom scene!  You should
            // refer the code above to see how rigid bodies were created for the
            // test scene. You have a lot of freedom to create your own game,
            // as long as it meets the minimum requirements in the rubric.  
            // Creativity is encouraged!

            const redTexture = new gfx.Texture('./assets/red.jpg');
            const red = new gfx.GouraudMaterial();
            red.texture = redTexture;

            const yellowTexture = new gfx.Texture('./assets/yellow.jpg');
            const yellow = new gfx.GouraudMaterial();
            yellow.texture = yellowTexture;

            const greenTexture = new gfx.Texture('./assets/green.jpg');
            const green = new gfx.GouraudMaterial();
            green.texture = greenTexture;

            const blueTexture = new gfx.Texture('./assets/blue.png');
            const blue = new gfx.GouraudMaterial();
            blue.texture = blueTexture;

            const purpleTexture = new gfx.Texture('./assets/purple.png');
            const purple = new gfx.GouraudMaterial();
            purple.texture = purpleTexture;

            const blackTexture = new gfx.Texture('./assets/black.jpg');
            const black = new gfx.GouraudMaterial();
            black.texture = blackTexture;

            // ADD YOUR CODE HERE
            this.gameStart = true;
            this.setHoleRadius(1.25);
            this.hole.position = new gfx.Vector3(0, 0, 6);
            this.inputVector.x = 0;
            this.inputVector.y = 0;

            const ball2 = new RigidBody(this.sphere);
            ball2.material = red;
            ball2.position.set(0, 0, 0.5);
            ball2.setRadius(0.75);
            ball2.velocity.set(0, 0, 0);
            this.rigidBodies.add(ball2);

            const ball3 = new RigidBody(this.sphere);
            ball3.material = blue;
            ball3.position.set(-0.75, 0, 1.7);
            ball3.setRadius(0.75);
            ball3.velocity.set(0, 0, 0);
            this.rigidBodies.add(ball3);
            const ball4 = new RigidBody(this.sphere);
            ball4.material = green;
            ball4.position.set(0.75, 0, 1.7);
            ball4.setRadius(0.75);
            ball4.velocity.set(0, 0, 0);
            this.rigidBodies.add(ball4);


            const ball5 = new RigidBody(this.sphere);
            ball5.material = yellow;
            ball5.position.set(-1.5, 0, 3);
            ball5.setRadius(0.75);
            ball5.velocity.set(0, 0, 0);
            this.rigidBodies.add(ball5);
            const ball6 = new RigidBody(this.sphere);
            ball6.material = purple;
            ball6.position.set(1.5, 0, 3);
            ball6.setRadius(0.75);
            ball6.velocity.set(0, 0, 0);
            this.rigidBodies.add(ball6);
            const ball7 = new RigidBody(this.sphere);
            ball7.material = black;
            ball7.position.set(0, 0, 3);
            ball7.setRadius(0.75);
            ball7.velocity.set(0, 0, 0);
            this.rigidBodies.add(ball7);

            for (let i = 0; i < 7; i++) {
                this.rotations.push(new gfx.Vector3(0, 0, 0));
            }
        }
        // The user has finished the game
        else {
            this.text.text = 'YOU WIN!';
            this.text.updateTextureImage();
            this.textPlane.visible = true;
            this.winSound.play();
        }
        this.stage++;
    }

    // Set the radius of the hole and update the scale of the
    // hole mesh so that it is displayed at the correct size.
    setHoleRadius(radius: number): void {
        this.holeRadius = radius;
        this.hole.scale.set(radius, 1, radius);
    }

    // Set the x or y components of the input vector when either
    // the WASD or arrow keys are pressed.
    onKeyDown(event: KeyboardEvent): void {
        if (this.gameStart == false) {
            if (event.key == 'w' || event.key == 'ArrowUp')
                this.inputVector.y = 1;
            else if (event.key == 's' || event.key == 'ArrowDown')
                this.inputVector.y = -1;
            else if (event.key == 'a' || event.key == 'ArrowLeft')
                this.inputVector.x = -1;
            else if (event.key == 'd' || event.key == 'ArrowRight')
                this.inputVector.x = 1;
        }
    }

    // Reset the x or y components of the input vector when either
    // the WASD or arrow keys are released.
    onKeyUp(event: KeyboardEvent): void {
        if (this.gameStart == false) {
            if ((event.key == 'w' || event.key == 'ArrowUp') && this.inputVector.y == 1)
                this.inputVector.y = 0;
            else if ((event.key == 's' || event.key == 'ArrowDown') && this.inputVector.y == -1)
                this.inputVector.y = 0;
            else if ((event.key == 'a' || event.key == 'ArrowLeft') && this.inputVector.x == -1)
                this.inputVector.x = 0;
            else if ((event.key == 'd' || event.key == 'ArrowRight') && this.inputVector.x == 1)
                this.inputVector.x = 0;
        }
    }

    // These mouse events are not necessary to play the game on a computer. However, they
    // are included so that the game is playable on touch screen devices without a keyboard.
    onMouseMove(event: MouseEvent): void {
        if (this.gameStart == false) {
            // Only update the mouse position if only the left button is currently pressed down
            if (event.buttons == 1) {
                const mouseCoordinates = this.getNormalizedDeviceCoordinates(event.x, event.y);

                if (mouseCoordinates.x < -0.5)
                    this.inputVector.x = -1;
                else if (mouseCoordinates.x > 0.5)
                    this.inputVector.x = 1;

                if (mouseCoordinates.y < -0.5)
                    this.inputVector.y = -1;
                else if (mouseCoordinates.y > 0.5)
                    this.inputVector.y = 1;
            }
        } else {
            if (event.buttons == 1) {
                const mouseEnd = this.getNormalizedDeviceCoordinates(event.x, event.y);
                const mouseVec = gfx.Vector2.subtract(mouseEnd, this.mouseStart);
                this.arrow.vector = new gfx.Vector3(10 * mouseVec.x, 0, -10 * mouseVec.y);
                this.whiteball.defaultHeading = this.arrow.vector;
            }
        }
    }

    onMouseUp(event: MouseEvent): void {
        if (this.gameStart == false) {
            // Left mouse button
            if (event.button == 0)
                this.inputVector.set(0, 0);
        } else {
            if (event.button == 0) {
                this.arrow.visible = false;
                this.whiteball.velocity = this.arrow.vector;
                this.whiteball.velocity.multiplyScalar(3);
                this.whiteball.defaultHeading = gfx.Vector3.RIGHT;
            }
        }
    }

    onMouseDown(event: MouseEvent): void {
        if (this.gameStart == false) {
            if (this.stage == 0) {
                // this.stage = 2;
                this.startNextStage();
            }
            else
                this.onMouseMove(event);
        } else {
            if (event.button == 0) {
                this.reset();
                this.mouseStart = this.getNormalizedDeviceCoordinates(event.x, event.y);
                this.arrow.visible = true;
            }
        }
    }

}