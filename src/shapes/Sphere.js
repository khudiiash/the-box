import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import { world, scene, defaultMaterial} from '../script'
export default class Cube {
    constructor(config) {
    Object.assign(this, config)
    if (!this.raidus) this.raidus = .1
    // THREE.js Mesh
    this.mesh = new THREE.Mesh(
        new THREE.SphereBufferGeometry(this.radius, 16, 16),
        this.material || new THREE.MeshStandardMaterial({ color: this.color || 'white'})
    )
    this.mesh.castShadow = true
    this.mesh.receiveShadow = true
    this.mesh.position.copy(this.position || new THREE.Vector3(0,0,0))

    // Save the object to update
    }
}