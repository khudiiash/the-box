import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import { world, scene, defaultMaterial} from '../script'
export default class ComplexCube {
    constructor(config) {
    Object.assign(this, config)
    if (!this.width) this.width = 1 
    if (!this.height) this.height = 1 
    if (!this.depth) this.depth = 1 
    // THREE.js Mesh
    const geometry = new THREE.BoxBufferGeometry(this.width, 0.05, this.depth);
    this.mesh = new THREE.Group()

    // Create Sides Meshes
    this.top = new THREE.Mesh(
        geometry,
        this.material
    )
    this.bottom = new THREE.Mesh(
        geometry,
        this.material
    )
    this.left = new THREE.Mesh(
        geometry,
        this.material
    )
    this.right = new THREE.Mesh(
        geometry,
        this.material
    )
    this.front = new THREE.Mesh(
        geometry,
        this.material
    )
    this.back = new THREE.Mesh(
        geometry,
        this.material
    )
    
    this.mesh.add(this.top)
    this.mesh.add(this.bottom)
    this.mesh.add(this.left)
    this.mesh.add(this.right)
    this.mesh.add(this.front)
    this.mesh.add(this.back)

    this.mesh.children.map(c => c.castShadow = true)


    // Geometry Adjustment
    this.top.position.y += (this.height / 2) - 0.01
    this.bottom.position.y -= (this.height / 2) - 0.01

    this.right.position.x += (this.width / 2) - 0.01
    this.left.position.x -= (this.width / 2) - 0.01
    this.right.rotateZ(Math.PI / 2)
    this.left.rotateZ(Math.PI / 2)

    this.back.position.z -= (this.depth / 2) - 0.01
    this.front.position.z += (this.depth / 2) - 0.01
    this.back.rotateX(Math.PI / 2)
    this.front.rotateX(Math.PI / 2)


    // Cube properties

    this.health = 1000
    this.dead = this.win = false
    this.mesh.castShadow = true
    this.mesh.receiveShadow = true
    this.mesh.position.copy(this.position || new THREE.Vector3(0,0,0))


    }
}