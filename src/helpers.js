import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import { sizes, objectsToUpdate, camera, renderer, world, scene, defaultMaterial, elapsedTime} from './script'
import { Object3D } from 'three';

const boxGeometry = new THREE.BoxBufferGeometry(1,1,1);
const redMaterial = new THREE.MeshBasicMaterial({color: 'red'})
let nam = 0;
export const markVec3 = (x,y,z) => {
    const mark = new THREE.Mesh(new THREE.BoxBufferGeometry(.1,.1,.1), redMaterial)
    mark.position.copy(new THREE.Vector3(x,y,z))
    scene.add(mark)
}
export const makeBox = ({width, height, depth, position, mass, color}) => {
        // THREE.js Mesh
        const mesh = new THREE.Mesh(
            boxGeometry,
            new THREE.MeshStandardMaterial({ color: color || 'white'})
        )
        mesh.scale.set(width, height, depth)
        mesh.geometry.needsUpdate = true 
        mesh.castShadow = true
        mesh.position.copy(position)    
        // Cannon Body
        const shape = new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, depth / 2))
        const body = new CANNON.Body({
            mass: mass || 0,
            position: position,
            shape: shape,
            material: defaultMaterial
        })
        world.addBody(body)
        // body.addEventListener('collide', playHitSound)
        // Save the object to update
        return {mesh, body}
}

export const resize = () => {
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))


}

export const createBodyFromMesh = (mesh) => {
    let {width, height, depth} = mesh.geometry.parameters
    const position = mesh.getWorldPosition()
    const shape = new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, depth / 2))
    const body = new CANNON.Body({
            mass: 1,
            position: position,
            shape: shape,
            quaternion: mesh.quaternion,
            material: defaultMaterial
        })
    world.addBody(body)

    return body
}

export const showMessage = (message) => {
    if (Math.floor(elapsedTime) > nam) {
        console.log(message)
        nam = Math.floor(elapsedTime)
    }

}
export const limitBodyVelocity = (body, limit) => {
    if (body.velocity.x > limit) body.velocity.x = limit
    if (body.velocity.y > limit) body.velocity.y = limit
    if (body.velocity.z > limit) body.velocity.z = limit

    if (body.velocity.x < -limit) body.velocity.x = -limit
    if (body.velocity.y < -limit) body.velocity.y = -limit
    if (body.velocity.z < -limit) body.velocity.z = -limit

}


