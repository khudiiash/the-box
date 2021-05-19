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
        this.material
    )
    this.mesh.castShadow = true
    this.mesh.receiveShadow = true
    this.mesh.position.copy(this.positsion || new THREE.Vector3(0,0,0))
    // Cannon Body
    this.shape = new CANNON.Box(new CANNON.Vec3(this.width / 2, this.height / 2, this.depth / 2))
    this.body = new CANNON.Body({
        type: CANNON.Body.STATIC,
        position: this.position ||  new CANNON.Vec3(0,0,0),
        shape: this.shape,
        material: defaultMaterial
    })

    this.mesh.position.copy(this.body.position)
    // Save the object to update
    world.addBody(this.body)

    }
}