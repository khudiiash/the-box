import * as CANNON from 'cannon-es'

const limitBodyVelocity = (body, limit) => {
        if (body.velocity.x > limit / 4) body.velocity.x = limit / 4
        if (body.velocity.y > limit) body.velocity.y = limit
        if (body.velocity.z > limit / 4) body.velocity.z = limit / 4

        if (body.velocity.x < -limit / 4) body.velocity.x = -limit / 4
        if (body.velocity.y < -limit) body.velocity.y = -limit
        if (body.velocity.z < -limit / 4) body.velocity.z = -limit / 4
}
const anyVelocity = (body) => {
    return Object.entries(body.velocity).map(e => e[1]).reduce((a, c) => a + c) > 0
}

let nam = 0;
let lastBlock = 0;
let damage = 0;
let oldElapsedTime = 0;
let healed = false;
let win = false;
 const onCollide = async (collision) => {
    if (collision.body === health && !healed) {
        healed = true
        setTimeout(() => world.removeBody(health))
        self.postMessage({health: true})
        return
    }
    const block = blocks.find(block => block === collision.body)
    if (!block) return
    if (blocks.indexOf(block) === 39) {
        win = true;
    }
    let impact = collision.contact.getImpactVelocityAlongNormal()
    if (impact > 12 && blocks.indexOf(block) > 0) {
        damage = Math.floor((impact) * Math.pow(blocks.indexOf(block) - lastBlock, 1.4))
    }
    lastBlock = blocks.indexOf(block)
    self.postMessage({damage, impact, lastBlock})
    damage = 0
}
// Number of objects, could be also sent via a
// first init message, to avoid duplicatoin
const N = 40

// The bodies shared with three.js
const blocks = []
const bubbles = []
const sides = []
const yIndeces = []

// Setup world
const world = new CANNON.World()
world.gravity.set(0, -9.82, 0)
world.broadphase - new CANNON.SAPBroadphase(world)
world.allowSleep = true



const defaultMaterial = new CANNON.Material('default')
const defaultConcreteMaterial = new CANNON.ContactMaterial(
    defaultMaterial,
    defaultMaterial,
    {
        friction: 1,
        restitution: 0,
        contactEquationRelaxation: 4,
        frictionEquationRelaxation: 1
    }
)
world.defaultContactMaterial = defaultConcreteMaterial
const cubeShape = new CANNON.Box(new CANNON.Vec3(1, 0.01, 1))
const cube = new CANNON.Body({mass: 1, allowSleep: false, material: defaultMaterial})
cube.addShape(cubeShape, new CANNON.Vec3(0, 1, 0))
// Bottom
cube.addShape(cubeShape, new CANNON.Vec3(0, -1, 0))
// Right
cube.addShape(cubeShape, new CANNON.Vec3(1, 0, 0), new CANNON.Quaternion().setFromAxisAngle(new CANNON.Vec3(0,0,1), Math.PI / 2))
// Left
cube.addShape(cubeShape, new CANNON.Vec3(1, 0, 0), new CANNON.Quaternion().setFromAxisAngle(new CANNON.Vec3(0,0,1), Math.PI / 2))
// Front
cube.addShape(cubeShape, new CANNON.Vec3(0, 0, 1), new CANNON.Quaternion().setFromAxisAngle(new CANNON.Vec3(1,0,0), Math.PI / 2))
// Back
cube.addShape(cubeShape, new CANNON.Vec3(0, 0, 1), new CANNON.Quaternion().setFromAxisAngle(new CANNON.Vec3(1,0,1), Math.PI / 2))

world.addBody(cube)
cube.position.set(0, 7, 0)
// Create N cubes
cube.addEventListener('collide', onCollide)

const health = new CANNON.Body({mass: 0, shape: new CANNON.Box(new CANNON.Vec3(.5, .5, .5))})
world.addBody(health)
self.addEventListener('message', (event) => {
    if (win && world.gravity.y < 0) world.gravity.y = 0.3
    const { blocksP, blocksS, cubeP, cubeQ, cubeV, sidesP, sidesQ, bubblesP, healthP, timeStep, elapsedTime } = event.data
    if (!blocks.length) {
        for (let i = 0; i < N; i++) {
           
            const width = blocksS[i * 3 + 0]
            const height = blocksS[i * 3 + 1]
            const depth = blocksS[i * 3 + 2]
            const x = blocksP[i * 3 + 0]
            const y = blocksP[i * 3 + 1]
            const z = blocksP[i * 3 + 2]
            const shape = new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, depth / 2))
            const body = new CANNON.Body({ mass: 0, material: defaultMaterial })
            body.addShape(shape)
            body.position.set(x,y,z)
            blocks.push(body)
            world.addBody(body)
            yIndeces.push((Math.random() - 0.5) * .1)
            
        }
    }
    if (health && healthP) {
        health.position.set(healthP[0], healthP[1], healthP[2])
    }
   
   
    if (!sides.length) {
        cube.shapes.map(shape => {
            const side = new CANNON.Body({mass: 1, shape, material: defaultMaterial})
            sides.push(side)
        })
    }


    

    if (!bubbles.length) {
        for (let i = 0; i < N; i++) {
            const shape = new CANNON.Sphere(0.01)
            const bubble = new CANNON.Body({ mass: 0.01, shape, material: defaultMaterial })
            bubbles.push(bubble)
        }
    } 
    if (event.data.dead) {
        

        sides.map((side,i) => {
            if (!world.bodies.includes(side)) {
                world.addBody(side)
                side.position.set(sidesP[i * 3 + 0], sidesP[i * 3 + 1], sidesP[i * 3 + 2])
                side.quaternion.set(sidesQ[i * 4 + 0], sidesQ[i * 4 + 1], sidesQ[i * 4 + 2], sidesQ[i * 4 + 3])
                side.velocity.y = cube.velocity.y
                side.velocity.x = cube.velocity.x
                side.velocity.z = cube.velocity.z

            }
            limitBodyVelocity(side, 30)
            sidesP[i * 3 + 0] = side.position.x
            sidesP[i * 3 + 1] = side.position.y
            sidesP[i * 3 + 2] = side.position.z
            sidesQ[i * 4 + 0] = side.quaternion.x
            sidesQ[i * 4 + 1] = side.quaternion.y
            sidesQ[i * 4 + 2] = side.quaternion.z
            sidesQ[i * 4 + 3] = side.quaternion.w


        })
        if (Math.floor(elapsedTime) > nam && sides.length) {
            nam = Math.floor(elapsedTime)
        }

        bubbles.map((bubble, i) => {
            if (!world.bodies.includes(bubble)) {
                world.addBody(bubble)
                bubble.position.set(bubblesP[i * 3 + 0], bubblesP[i * 3 + 1], bubblesP[i * 3 + 2])
                bubble.velocity.y = cube.velocity.y
                bubble.velocity.x = (Math.random() - .5) * 15
                bubble.velocity.z = (Math.random() - .5) * 15
            }
            limitBodyVelocity(bubble, 30)
            bubblesP[i * 3 + 0] = bubble.position.x
            bubblesP[i * 3 + 1] = bubble.position.y + 0.2
            bubblesP[i * 3 + 2] = bubble.position.z

        })
    }

   
    // Step the world
    const delta = elapsedTime - oldElapsedTime;
    world.step(timeStep, delta * 2, 3)

    blocks.map((block,i) => {
        if (i === (N - 1) || i === 0) return
        if (win) {
            block.position.y += 4 - i * .1

        } else {
            block.position.y += Math.sin((elapsedTime * .6) - yIndeces[i]) * yIndeces[i] * 2 * .7
            block.position.x += Math.cos((elapsedTime * .6) - yIndeces[i]) * yIndeces[i] * 2 * .7
            block.position.z += Math.sin((elapsedTime * .6) - yIndeces[i]) * yIndeces[i] * 1
        }
    })
    if (bodiesAreInContact(cube, blocks[lastBlock])) {
        const block = blocks[lastBlock]
        if (block && blocksP[lastBlock * 3 + 0]) {
            cube.position.x += block.position.x - blocksP[lastBlock * 3 + 0]
            cube.position.z += block.position.z - blocksP[lastBlock * 3 + 2]
        }
    }

    // Copy the cannon.js data into the buffers
    if (blocksP) {
        for (let i = 0; i < blocks.length; i++) {
            const block = blocks[i]
            blocksP[i * 3 + 0] = block.position.x
            blocksP[i * 3 + 1] = block.position.y
            blocksP[i * 3 + 2] = block.position.z
        }
    }
    
    if (Math.abs(cube.velocity.y) < 3 && cubeV) {
        if (cubeV[0]) cube.velocity.x = cubeV[0]
        if (cubeV[1]) cube.velocity.y = cubeV[1]
        if (cubeV[2]) cube.velocity.z = cubeV[2]
    }


    limitBodyVelocity(cube, 30)
    if (cubeP && cubeQ) {
        cubeP[0] = cube.position.x
        cubeP[1] = cube.position.y
        cubeP[2] = cube.position.z
    
        cubeQ[0] = cube.quaternion.x
        cubeQ[1] = cube.quaternion.y
        cubeQ[2] = cube.quaternion.z
        cubeQ[3] = cube.quaternion.w
    }

    


    // Send data back to the main thread
    self.postMessage(
        {
        blocksP,
        cubeP,
        cubeQ,
        sidesP,
        sidesQ,
        bubblesP,
        healthP
        },
        // Specify that we want actually transfer the memory, not copy it over. This is faster.
        // [blocksP.buffer, cubeP.buffer, cubeQ.buffer,sidesP.buffer, sidesQ.buffer, bubblesP.buffer]
    )
    oldElapsedTime = elapsedTime;


})


function bodiesAreInContact(bodyA, bodyB){
    for(var i=0; i<world.contacts.length; i++){
        var c = world.contacts[i];
        if((c.bi === bodyA && c.bj === bodyB) || (c.bi === bodyB && c.bj === bodyA)){
            return true;
        }
    }
    return false;
}







