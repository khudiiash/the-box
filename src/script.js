import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js' 
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import {createBodyFromMesh, limitBodyVelocity, resize, add, showMessage} from './helpers'
import Stats from 'three/examples/jsm/libs/stats.module.js';
import gsap from 'gsap'
import controlsImage from './controls.png'


import './style.css'
import Cube from './shapes/Cube'
import Block from './shapes/Block'
import Sphere from './shapes/Sphere'
import ComplexCube from './shapes/ComplexCube'
import PCSS from './shaders/shadows/PCSS.glsl'
import PCSSGetShadow from './shaders/shadows/PCSSGetShadow.glsl'


const LoadingManager = new THREE.LoadingManager()
const modelLoader = new GLTFLoader(LoadingManager)
const textureLoader = new THREE.TextureLoader(LoadingManager)

modelLoader.setDRACOLoader(new DRACOLoader().setDecoderPath('/draco/'))
const box_texture = textureLoader.load('/textures/box_texture.jpg')
export const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}
const canvas = document.querySelector('.webgl')
let loop;

// const gui = new dat.GUI()
const params = {color: '#86A790', fogFar: 85, fogNear: 10}
export let scene = new THREE.Scene()
export let camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 1, 1000)
export let renderer = new THREE.WebGLRenderer({ canvas })
export let objectsToUpdate = []
export let world = new CANNON.World()
export let defaultMaterial = new CANNON.Material('default')
export let elapsedTime = 0;



// Sounds

const colors = [params.color, '#86A790', '#C87A90', '#0B7150', '#675B87', '#86A790']

const boxSounds = Array(3).fill('').map((_,i) => new Audio(`/sounds/box_sound_${i + 1}.mp3`))
const wasted = new Audio('/sounds/wasted.mp3')
const music = new Audio('/sounds/sinatra.mp3')
music.volume = .1   


function startGame() {

    scene = new THREE.Scene()
    camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 1, 1000)
    renderer = new THREE.WebGLRenderer({ canvas })
    objectsToUpdate = []
    world = new CANNON.World()
    defaultMaterial = new CANNON.Material('default')

    document.querySelector('body').style.backgroundColor = params.color
    document.querySelector('.title').style.fontSize = '100px'

    if (music.paused) music.play()

    document.querySelector('.sound-toggle').onclick = () => 
        {
            if (music.paused) {
                music.play()
                gsap.to('.wave', .6, {scale: 1, transformOrigin: 'left center', stagger: .1})
            }
            else {
                music.pause()
                gsap.to('.wave', .6, {scale: 0, transformOrigin: 'left center', stagger: .1})
            }
        }

    let gameSpeed = 2;
    let complexity = 1.4;
    camera.position.z = 20;
    camera.position.y = 10;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor( params.color, 1 )
    resize()
    window.onresize = resize
    const stats = new Stats()
    // document.body.appendChild( stats.dom );
    gsap.to('.button, .glass, .title, .controls', {autoAlpha: 0})
    gsap.to('.hp-active', {scale: 1, width: '100%'})


    // Controls
    // const controls = new OrbitControls(camera, canvas)

    // Light
    const ambient = new THREE.AmbientLight(0xffffff, 0.2)
    scene.add(ambient)
    // Resize

    const spotLight = new THREE.SpotLight(0xffffff, 1)
    spotLight.shadow.camera.near = 8;
    spotLight.shadow.camera.far = 40;
    spotLight.shadow.mapSize.width = 512;
    spotLight.shadow.mapSize.height = 512;
    spotLight.shadow.bias = - 0.002;
    spotLight.shadow.radius = 1;
    spotLight.castShadow = true;
    spotLight.position.set(5,7.7,18);
    scene.add(spotLight)

    // Fog
    {
       
        scene.fog = new THREE.Fog(params.color, params.fogNear, params.fogFar);
    }
    // Shadows


    // Physic World
    world.gravity.set(0, -9.82, 0)
    world.broadphase - new CANNON.SAPBroadphase(world)
    world.allowSleep = true

    // Physical Materials

    const defaultConcreteMaterial = new CANNON.ContactMaterial(
        defaultMaterial,
        defaultMaterial,
        {
            friction: 0.1,
            restitution: .1
        }
    )
    world.defaultContactMaterial = defaultConcreteMaterial
    const sides = []
    let lastBlock = 0;


    const kill = () => {
        cube.mesh.children.map((mesh,i) => {
                const body = createBodyFromMesh(mesh)
                const side = {body, mesh}
                sides.push(side)
                objectsToUpdate.push(side)
                scene.attach(mesh);
        })
        bubbles.map(bubble => {
            bubble.body.position.copy(cube.body.position)
            bubble.body.velocity.y = 10
            objectsToUpdate.push(bubble)
        })
        sides[0].body.velocity.y = 10
        document.querySelector('.hp-active').style.width ='0%'
        document.querySelector('.title').innerText = 'WASTED'
        document.querySelector('.button').innerText = 'PLAY AGAIN'

        wasted.currentTime = 0;
        wasted.volume = .5;
        wasted.play()
        cube.dead = true
        
        gsap.timeline({delay: 2})
            .to('.glass', 1, {autoAlpha: .8})
            .to('.title', 1, {autoAlpha: 1}, '<.2')
            .to('.button', 1, {autoAlpha: 1}, '<.2')
            

    }
    const shakeCamera = () => {
        if (camera.shake) return
        camera.shake = true
        gsap.timeline({repeat: 1, onComplete: () => camera.shake = false})
        .to(camera.rotation, 0.03, {z: '+=.01', y: '+=.01', x: '+=.01', repeat: 1, yoyo: true})
        .to(camera.rotation, 0.03, {z: '-=.01', y: '-=.01', x: '-=.01', repeat: 1, yoyo: true})
       
    }
    const onCollide = (collision) => {
        const block = blocks.find(block => block.body === collision.body)
        if (!block || cube.dead) return
        const impact = collision.contact.getImpactVelocityAlongNormal()
        

       
        const sound = boxSounds[Math.floor(Math.random() * boxSounds.length)]
        sound.currentTime = 0
        sound.volume = Math.min(impact > 1 ? Math.abs(impact / 100) : 0, 1)
        sound.play()

        
        if (impact > 12 && block.id > 0) {
           
            
            const damage = Math.floor((impact) * Math.pow(block.id - lastBlock, complexity))
            shakeCamera()
            if (damage > 0) document.getElementById('hp-damage').innerText = '-' + damage
            gsap.fromTo('#hp-damage', 1, {opacity: 1, y: 0, scale: 1}, {opacity: 0, y: -100, scale: 1 + Math.min((damage / 300), 5)})
            lastBlock = block.id
            cube.health -= damage
            if (cube.health > 0) document.querySelector('.hp-active').style.width = (cube.health / 10) + '%'
            else {
                kill()
            }  
        }

        if (block.last && !cube.dead) {
            cube.win = true
            document.querySelector('.title').innerHTML = `YOU WIN!<br>BOX IS ${Math.round(cube.health / 1000 * 100)}% WHOLE`
            document.querySelector('.title').style.fontSize = '50px'
            document.querySelector('.button').innerText = 'PLAY AGAIN'


            gsap.timeline({delay: 2})
                .to('.glass, .title, .button', 1, {autoAlpha: 1, stagger: .3})
        }
        lastBlock = block.id
    }
   
    
    const cube = new ComplexCube({
        width: 2,
        height: 2,
        depth: 2,
        position: {
            x: 0,
            y: 7,
            z: 0
        },
        onCollide,
        quaternion: new CANNON.Quaternion().setFromAxisAngle(new CANNON.Vec3(0,1,0), Math.random() * 180),
        mass: 100,
        material: new THREE.MeshStandardMaterial({
            map: box_texture
        }),
        backgroundColor: 0
    })

    const bubblesN = 40;
    const bubbles = []
    const bubbleMaterial = new THREE.MeshStandardMaterial({color: 'tomato'})


  
    for (let i = 0; i < bubblesN; i++) {
        const bubble = new Sphere({
            radius: 0.01,
            mass: 0.01,
            position: {
                x: 100,
                z: 100,
                y: 100
            },
            material: bubbleMaterial
        })
        bubble.mesh.scale.set(15,15,15)
        scene.add(bubble.mesh)
        bubbles.push(bubble)
    }

    spotLight.target = cube.mesh
    const blocks = []
    const blocksN = 40
    let x = 0, y = 0, z = 0;

    const blockMaterial = new THREE.MeshStandardMaterial({
        color: '#222'
    })
    const lastMaterial = new THREE.MeshStandardMaterial({
        color: '#67BA87'
    })

    for (let i = 0; i < blocksN; i ++) {
        x = (i % 3 === 0 && i % 2 !== 0 && i > 0) ? x + 8 : (i % 3 === 0 && i % 2 === 0 && i > 0) ? x - 8 : x
        y -= (Math.random() * 5 + 3)
        z = (i % 3 !== 0 && i % 2 === 0 && i > 0) ? z + 8 : z
        let width  = Math.random() * (27 - 7) + 7
        let height = Math.random() * (20 - 7) + 7
        let depth = Math.random() * (27 - 7) + 7
        let last = false;
        if (i === blocksN - 1) {
            height = 1
            width = 50
            depth = 50,
            last = true
        }
        if (i === 0) {
            height = 20
            y = -10
        }
        const block = new Block({
            width: width, 
            height: height, 
            depth: depth, 
            position: {x, y, z}, 
            yIndex: (Math.random() - 0.5) * .1,
            color: i < (blocksN - 1) ? '#222' : '#fff',
            last,
            material: last ? lastMaterial : blockMaterial,
            type: 'block',
            id: i
        })
        blocks.push(block)
        objectsToUpdate.push(block)
        scene.add(block.mesh)
    }
    scene.add(cube.mesh)
    objectsToUpdate.push(cube)
    const particlesGeometry = new THREE.BufferGeometry()

    const count = 200000
    
    const positions = new Float32Array(count * 3)
    
    for (let i = 0; i < count * 3; i ++) {
        positions[i] = (Math.random() - 0.5) * 500
    }
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    
    const particlesMaterial = new THREE.PointsMaterial({
        size: 0.2,
        sizeAttenuation: true,
        // map: particleTexture,
        color: '#2c66cd',
        transparent: true,
        // alphaMap: particleTexture,
        // alphaTest: .001,
        // depthTest: false,
        depthWrite: false,
        vertexColors: true,
        blending: THREE.AdditiveBlending
    })
    // Points
    const particles = new THREE.Points(particlesGeometry, particlesMaterial)
    scene.add(particles)


    // Loop
    const clock = new THREE.Clock()
    let oldElapsedTime = 0;

    let keyPressed = false;
    let force = 6;


    const followCube = () => {
        if (!camera.shake) camera.position.set(cube.mesh.position.x, cube.mesh.position.y + 10, cube.mesh.position.z + 30)
        if (!camera.shake) camera.lookAt(cube.mesh.position)
        spotLight.position.set(cube.mesh.position.x + 10, cube.mesh.position.y + 10,  cube.mesh.position.z + 5)
    }
    const tick = () => {
        loop = requestAnimationFrame(tick) 
        elapsedTime = clock.getElapsedTime()
        const deltaTime = elapsedTime - oldElapsedTime
        oldElapsedTime = elapsedTime

       
        particles.position.y -= 0.01
        particles.rotation.y = elapsedTime * 0.05
        particles.rotation.z = elapsedTime * 0.05

    if ((cube.body.velocity.x + cube.body.velocity.y + cube.body.velocity.z) === 0) cube.body.applyImpulse(new CANNON.Vec3(0,0,0))

    if (!cube.dead) {
        const colorNumber = Math.abs(Math.floor(cube.body.position.y * .01))
        if (colorNumber > cube.backgroundColor) {
            cube.backgroundColor = colorNumber
            gsap.to('body', 3, {backgroundColor: colors[colorNumber], onUpdate: function() {
                renderer.setClearColor(this.targets()[0].style.backgroundColor)
                scene.fog.color = new THREE.Color(this.targets()[0].style.backgroundColor)
            }})
        }
        if (cube.body.position.y < blocks[blocksN - 1].body.position.y - 30) kill()
            blocks.map((block,i) => {
                if (block.last || i === 0) return
                block.body.position.y += Math.sin((elapsedTime * .6) - block.yIndex) * block.yIndex * 2
                block.body.position.x += Math.cos((elapsedTime * .6) - block.yIndex) * block.yIndex * 2
                block.body.position.z += Math.sin((elapsedTime * .6) - block.yIndex) * block.yIndex * 0
            })

            followCube()
        } else {
        camera.lookAt(cube.mesh.position)
        camera.position.x += Math.sin(elapsedTime * .1) * .1 
        camera.position.z += Math.cos(elapsedTime * .1) * .1
        }

    if (cube.win) {
        blocks.map(block => {if (!block.last) block.body.position.y += 1})
        world.gravity.y = -1
        cube.body.velocity.x = 0
        cube.body.velocity.z = 0
        cube.body.velocity.y = 4

        cube.mesh.rotation.y = elapsedTime
    }
    limitBodyVelocity(cube.body, 25)
    objectsToUpdate.map(object => {
        object.mesh.position.copy(object.body.position)
        object.mesh.quaternion.copy(object.body.quaternion)
        if (bubbles.includes(object)) object.mesh.position.y += 0.2
    })



    stats.update()
    
    world.step(1/60, deltaTime * gameSpeed, 3)
    // controls.update()
    renderer.render(scene, camera)
    showMessage(Math.round(cube.body.velocity.x) + ',' + Math.round(cube.body.velocity.y) + ',' +Math.round(cube.body.velocity.z) )



    }

    document.onkeydown = e => {
        if (keyPressed || cube.dead || cube.win || Math.abs(cube.body.velocity.y) > 3) return
        keyPressed = true
        cube.body.applyImpulse(new CANNON.Vec3(0,0,0))
        if (/^(a|ф|ArrowLeft)$/i.test(e.key)) cube.body.velocity.x = -force
        if (/^(d|в|ArrowRight)$/i.test(e.key)) cube.body.velocity.x = force
        if (/^(w|ц|ArrowUp)$/i.test(e.key)) cube.body.velocity.z = -force
        if (/^(s|ы|ArrowDown)$/i.test(e.key)) cube.body.velocity.z = force
    }


    document.onkeyup = () => keyPressed = false

    document.querySelector('.button').onclick = () => {
        scene.children.map(c => scene.remove(c))
        world.bodies.map(body => body = null)
        world = new CANNON.World()
        gsap.to('.button, .glass, .title', {autoAlpha: 0})
        cancelAnimationFrame(loop)
        startGame()
    }

    tick()
}
document.addEventListener('DOMContentLoaded', ()=> {
    document.querySelector('.button').onclick = startGame
    document.querySelector('.controls').style.backgroundImage = `url(${controlsImage})`
    gsap.timeline()
        .set('.title', {fontSize: '100px'})
        .fromTo('.title, .button', 1, {y: 25, opacity: 0} ,{ opacity: 1, autoAlpha: 1, y: 0, delay: 1, stagger: .5})
        .to('.controls', 1, {opacity: .3})
})

