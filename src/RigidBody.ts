/* Assignment 2: Hole in the Ground
 * CSCI 4611, Spring 2023, University of Minnesota
 * Instructor: Evan Suma Rosenberg <suma@umn.edu>
 * License: Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International
 */

import * as gfx from 'gophergfx'

export class RigidBody extends gfx.Mesh3 {
    // Parameter to approximate downward acceleration due to gravity
    public static gravity = -10;

    // The current velocity of the rigid body
    public velocity: gfx.Vector3;

    // The current radius of the rigid body's collision sphere
    private radius: number;

    private _defaultHeading = new gfx.Vector3(1, 0, 0);

    constructor(baseMesh: gfx.Mesh3) {
        super();

        // Copy over all the mesh data from the base mesh
        this.positionBuffer = baseMesh.positionBuffer;
        this.normalBuffer = baseMesh.normalBuffer;
        this.colorBuffer = baseMesh.colorBuffer;
        this.indexBuffer = baseMesh.indexBuffer;
        this.texCoordBuffer = baseMesh.texCoordBuffer;
        this.vertexCount = baseMesh.vertexCount;
        this.hasVertexColors = baseMesh.hasVertexColors;
        this.triangleCount = baseMesh.triangleCount;
        this.material = baseMesh.material;
        this.boundingBox = baseMesh.boundingBox;
        this.boundingSphere = baseMesh.boundingSphere;
        this.visible = baseMesh.visible;

        this.velocity = new gfx.Vector3();
        this.radius = baseMesh.boundingSphere.radius;
    }

    public get defaultHeading() {
        return this._defaultHeading;
    }

    public set defaultHeading(value: gfx.Vector3) {
        this._defaultHeading = value;
    }

    update(deltaTime: number): void {

        // PART 2: RIGID BODY PHYSICS
        // In this part, you should use the formulas described in class to
        // 1. Compute the acceleration vector a
        // 2. Update the velocity, v' = v + a * dt
        // 3. Update the position, p' = p + v * dt

        // ADD YOUR CODE HERE
        let heading = this.defaultHeading;

        var a = new gfx.Vector3(0, RigidBody.gravity, 0);
        var v = this.velocity;
        this.velocity.add(gfx.Vector3.multiplyScalar(a, deltaTime));
        this.position.add(gfx.Vector3.multiplyScalar(v, deltaTime))
        heading = gfx.Vector3.normalize(this.velocity);

        // const T = gfx.Matrix4.makeTranslation(this.position);
        // const R = gfx.Matrix4.lookAt(gfx.Vector3.ZERO, heading, gfx.Vector3.UP);
        // const S = gfx.Matrix4.makeScale(new gfx.Vector3(2, 2, 2));
        // this.setLocalToParentMatrix(gfx.Matrix4.multiplyAll(T, R, S), false);
    }

    // You can use this method to set the radius of the collision sphere.  This will also
    // properly scale the object that it is displayed within the collision sphere.
    setRadius(radius: number): void {
        this.radius = radius;

        const scaleFactor = this.radius / this.boundingSphere.radius;
        this.scale.set(scaleFactor, scaleFactor, scaleFactor);
    }

    // Get the current radius of the collision sphere.
    getRadius(): number {
        return this.radius;
    }
}
