import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import { world, scene, defaultMaterial} from '../script'
export default class Cube {
    constructor(config) {
    Object.assign(this, config)
    if (!this.width) this.width = 1 
    if (!this.height) this.height = 1 
    if (!this.depth) this.depth = 1 
    // THREE.js Mesh
    this.mesh = new THREE.Mesh(
        new THREE.BoxBufferGeometry(this.width, this.height, this.depth),
        this.material || new THREE.MeshStandardMaterial({ color: this.color || 'white'})
    )
    this.health = 1000
    this.dead = false
    this.mesh.castShadow = true
    this.mesh.receiveShadow = true
    this.mesh.position.copy(this.position || new THREE.Vector3(0,0,0))
    // Cannon Body
    this.shape = new CANNON.Box(new CANNON.Vec3(this.width / 2, this.height / 2, this.depth / 2))
    this.body = new CANNON.Body({
        mass: this.mass || 0,
        position: this.position ||  new CANNON.Vec3(0,0,0),
        shape: this.shape,
        material: defaultMaterial
    })
    if (this.quaternion) {
        this.body.quaternion.copy(this.quaternion)
        this.mesh.quaternion.copy(this.quaternion)
    }
    if (this.onCollide) this.body.addEventListener('collide', this.onCollide)

    // Save the object to update
    world.addBody(this.body)

    }
}