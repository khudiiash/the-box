import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js' 
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import {resize, isMobile, openFullscreen, closeFullscreen} from './helpers'
import Stats from 'three/examples/jsm/libs/stats.module.js';
import gsap from 'gsap'
import {JoyStick} from './libs/joy.js'
import Cube from './shapes/Cube'
import Health from './shapes/Health'
import titleImage from './assets/images/title.png'
import startImage from './assets/images/start.png'
import fullScreenImage from './assets/images/full_screen.png'

import particlesVertex from './shaders/particles/vertex.glsl'
import particlesFragment from './shaders/particles/fragment.glsl'

import bgVertex from './shaders/background/vertex.glsl'
import bgFragment from './shaders/background/fragment.glsl'


import './style.css'




const LoadingManager = new THREE.LoadingManager()
const modelLoader = new GLTFLoader(LoadingManager)
const textureLoader = new THREE.TextureLoader(LoadingManager)
let joystick = null
modelLoader.setDRACOLoader(new DRACOLoader().setDecoderPath('/draco/'))
const box_texture = textureLoader.load('/textures/box_texture.jpg')
export const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}
const canvas = document.querySelector('.webgl')
let loop;
let pixelRatio = window.devicePixelRatio
let AA = true
if (pixelRatio > 1) {
    AA = false
}
export let scene
export let camera 
export let renderer
export let objectsToUpdate = []
export let elapsedTime = 0;



// Sounds


const boxSounds = Array(3).fill('').map((_,i) => new Audio(`/sounds/box_sound_${i + 1}.mp3`))
const wasted = new Audio('/sounds/wasted.mp3')
const music = new Audio('/sounds/sinatra.mp3')
const healedSound = new Audio('/sounds/healed.mp3')
const winSound = new Audio('/sounds/win.mp3')
let soundsPlaying = 0
const mobile = isMobile()
music.volume = 0.1
let workerProcess = null;
let soundOff = false;

const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);



function startGame() {

    gsap.set('img, .cube__face', {webkitFilter: 'invert(100%)', filter: 'invert(100%)'})
    gsap.to('.hp', {opacity: 1})
    gsap.set('.cube, .title, .button, .score, .best-score', {autoAlpha: 0})


    if (isMobile() && !joystick) {
        console.log('created joystick')
        joystick = new JoyStick('joyDiv');
        Array.from(document.querySelectorAll('.controls .row')).map(row => row.remove())
    } else if (!isMobile()) {
        document.querySelector('#joyDiv').style.display = 'none'
    }

    scene = new THREE.Scene()
    camera = new THREE.PerspectiveCamera(55, sizes.width / sizes.height, 1, 1000)
    renderer = new THREE.WebGLRenderer({ canvas,
        antialias: AA,
        powerPreference: "high-performance"
    })
    objectsToUpdate = []
    let blocksP
    let blocksS
    let cubeP
    let cubeQ
    let cubeV = new Float32Array([0,0,0])
    let healthP = new Float32Array([0,0,0])
    let sidesP = new Float32Array(6 * 3)
    let sidesQ = new Float32Array(6 * 4)
    let health;
    gsap.to('.sound-toggle', .5, {opacity: 1})
    if (mobile) gsap.to('#joystick', {opacity: .5})
    else gsap.to('.controls-button', .25, {scale: 0, stagger: .05})
    document.onkeydown = e => keyHandler(e.key)
    if (music.paused && !soundOff && !isSafari) music.play()
    if (isSafari) gsap.set('.wave', {scale: 0, transformOrigin: 'left center'})

    document.querySelector('.sound-toggle').onclick = () => 
        {
            if (music.paused) {
                soundOff = false;
                music.play()
                gsap.to('.wave', .6, {scale: 1, transformOrigin: 'left center', stagger: .1})
            }
            else {
                soundOff = true;
                music.pause()
                gsap.to('.wave', .6, {scale: 0, transformOrigin: 'left center', stagger: .1})
            }
        }

    // const cameraZ = mobile ? 50 : 30
    const cameraZ = 30
    camera.position.z = cameraZ;
    camera.position.y = 10;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor( '#000', 1 )
    resize()
    window.onresize = resize
    const stats = new Stats()

    // document.body.appendChild( stats.dom );
    gsap.to('.button, .best-score, .title', {autoAlpha: 0})
    gsap.to('.hp-active', {scale: 1, width: '100%'})

    // Controls
    // const controls = new OrbitControls(camera, canvas)

    // Light
    const ambient = new THREE.AmbientLight(0xffffff, 0.2)
    scene.add(ambient)

    // Resize
    const spotLight = new THREE.DirectionalLight(0xffffff, 1)
    spotLight.shadow.camera.near = 8;
    spotLight.shadow.camera.far = 100;
    spotLight.shadow.mapSize.width = 64;
    spotLight.shadow.mapSize.height = 64;
    spotLight.shadow.bias = -0.0001;
    spotLight.shadow.radius = 15;
    spotLight.castShadow = true;
    spotLight.position.set(5,7.7,18);
    scene.add(spotLight)

    // BG
    const bgMat = new THREE.ShaderMaterial({
        vertexShader: bgVertex,
        fragmentShader: bgFragment,
        uniforms: {
            u_time: {value: 0},
            u_cube_y: {value: 0}
        },
        side: THREE.BackSide
    })

    
    // Background
    const bg = new THREE.Mesh(
        new THREE.SphereBufferGeometry(160, 128, 128),
        bgMat
    )

    // bg.rotation.y = Math.PI / 2


    scene.add(bg)

    // Fog
    {
        scene.fog = new THREE.Fog('#0F6576', 5, 120);
    }
    const sides = []
    let lastBlock = 0;


    const kill = (smashed) => {
        document.querySelector('.hp-active').style.width ='0%'
        wasted.currentTime = 0;
        wasted.volume = .5;
        wasted.play()
        cube.dead = true
        
        gsap.timeline({delay: 2})
            .set('.cube', {autoAlpha: 1})
            .to('.title', 1, {autoAlpha: 1}, '<.2')
            .to('.button', 1, {autoAlpha: 1}, '<.2')


        if (smashed) {
        const pos = new THREE.Vector3(); // create once an reuse it
        const quat = new THREE.Quaternion(); // create once an reuse it
            cube.mesh.children.map((mesh,i) => {
                mesh.getWorldPosition(pos)
                mesh.getWorldQuaternion(quat)
                sidesP[i * 3 + 0] = pos.x
                sidesP[i * 3 + 1] = pos.y
                sidesP[i * 3 + 2] = pos.z
                sidesQ[i * 4 + 0] = quat._x
                sidesQ[i * 4 + 1] = quat._y
                sidesQ[i * 4 + 2] = quat._z
                sidesQ[i * 4 + 3] = quat._w
                sides.push(mesh)
            })
        sides.map(mesh => scene.attach(mesh))

        bubbles.map((bubble,i) => {
             bubblesP[i * 3 + 0] = cube.mesh.position.x
             bubblesP[i * 3 + 1] = cube.mesh.position.y
             bubblesP[i * 3 + 2] = cube.mesh.position.z
             scene.add(bubble)
        })
    }

            

    }
    const shakeCamera = () => {
        if (camera.shake) return
        camera.shake = true
        gsap.timeline({repeat: 1, onComplete: () => camera.shake = false})
        .to(camera.rotation, 0.03, {z: '+=.01', y: '+=.01', x: '+=.01', repeat: 1, yoyo: true})
        .to(camera.rotation, 0.03, {z: '-=.01', y: '-=.01', x: '-=.01', repeat: 1, yoyo: true})
       
    }

    const onDamage = (damage, impact, lastBlock) => {
        if (cube.health <= 0) return
        
        if (soundsPlaying < 10 && impact > 3) {
            const sound = boxSounds[Math.floor(Math.random() * boxSounds.length)]
            const volume = Math.min(Math.abs(impact / 50), 1)
            sound.currentTime = 0
            sound.volume = volume
            sound.play()
            soundsPlaying += 1 
            setTimeout(() => soundsPlaying -= 1, 10)
        }
        
        if (!damage) return


        shakeCamera()
        
        document.getElementById('hp-damage').innerText = '-' + damage

        gsap.fromTo('#hp-damage', 1, {opacity: 1, y: 0, scale: 1, color: 'rgb(255,255,255)'}, {color: 'rgb(255, 0, 0)', opacity: 0, y: -100, scale: 1 + Math.min((damage / 300), 5)})
        gsap.fromTo('.hp-active', {background: '#ff0000'}, {background: '#ffffff'})
        cube.health -= damage
        if (cube.health > 0) document.querySelector('.hp-active').style.width = (cube.health / 10) + '%'
        else {
            kill(true)
        }  
    
        if (lastBlock === 39 && !cube.dead) {
            cube.win = true
            const score = Math.round(cube.health)
            if ((localStorage.bestScore && Number(localStorage.bestScore) < score) || !localStorage.bestScore) {
                localStorage.setItem('bestScore', score)
            }
            winSound.play()
            document.querySelector('.score span').innerText = score;
            gsap.set('.cube', {autoAlpha: 0})
            gsap.timeline({delay: 2})
                .to('.title, .score, .button', 1, {autoAlpha: 1, stagger: .3})
        }
        self.postMessage({damage})
    }
  
    const cube = new Cube({
        width: 2,
        height: 2,
        depth: 2,
        position: {
            x: 0,
            y: 7,
            z: 0
        },
        quaternion: new CANNON.Quaternion().setFromAxisAngle(new CANNON.Vec3(0,1,0), Math.random() * 180),
        mass: 100,
        material: new THREE.MeshStandardMaterial({
            map: box_texture
        }),
        backgroundColor: 0
    })

    cubeP = new Float32Array(3)
    cubeQ = new Float32Array(4)
 
    const bubblesN = 40 ;
    const bubbles = []
    const bubbleMaterial = new THREE.MeshStandardMaterial({color: 'tomato'})
    const bubbleGeometry =  new THREE.SphereBufferGeometry(0.15, 16, 16)

    let bubblesP = new Float32Array(bubblesN * 3)

    for (let i = 0; i < bubblesN; i++) {
        const bubble = new THREE.Mesh(
           bubbleGeometry,
           bubbleMaterial
        )
        bubbles.push(bubble)
    }

    spotLight.target = cube.mesh
    const blocks = []
    const blocksN = 40
    blocksP = new Float32Array(blocksN * 3 )
    blocksS = new Float32Array(blocksN * 3 )
    

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
            y -= 10
        }

        if (i === 0) {
            height = 20
            y = -10
        }
        const block = new THREE.Mesh(
            new THREE.BoxBufferGeometry(width, height, depth),
            (i === blocksN - 1) ? lastMaterial : blockMaterial
        )

        block.position.set(x,y,z)
        // block.castShadow = true 
        block.receiveShadow = true 

        if (i === 20) {
            try {
                health = new Health('#ff0000', 1)
                gsap.to(health.rotation, 3, {y: Math.PI * 2, ease: 'linear', repeat: -1})
                block.add(health)
                const healthWorldP = new THREE.Vector3()
                health.position.set(width / 2 - 0.5, height / 2 + 3, depth / 2 - 0.5)
                health.yShift = height / 2
                health.xShift = width / 2 
                health.zShift = depth / 2
                health.getWorldPosition(healthWorldP)
                healthP[0] = healthWorldP.x
                healthP[1] = healthWorldP.y
                healthP[2] = healthWorldP.z
                
            } catch (e) {console.log(e)}
          
        }

        blocksP[i * 3 + 0] = x
        blocksP[i * 3 + 1] = y
        blocksP[i * 3 + 2] = z

        blocksS[i * 3 + 0] = width
        blocksS[i * 3 + 1] = height
        blocksS[i * 3 + 2] = depth

        blocks.push(block)
        scene.add(block)
    }
    scene.add(cube.mesh)
    objectsToUpdate.push(cube)
    const particlesGeometry = new THREE.BufferGeometry()

    const count = mobile ? 100000 : 200000
    const scales = new Float32Array(count * 1)
    const positions = new Float32Array(count * 3)
    
    for (let i = 0; i < count * 3; i ++) {
        positions[i] = (Math.random() - 0.5) * 500
        scales[i] = Math.random()
    }
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    particlesGeometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1))
    
    const particlesMaterial = new THREE.ShaderMaterial({
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
        vertexShader: particlesVertex,
        fragmentShader: particlesFragment,
        uniforms: {
            uSize: { value: 30 * renderer.getPixelRatio()},
            uTime: { value: 0 }
        }

    })
    // Points
    const particles = new THREE.Points(particlesGeometry, particlesMaterial)
    scene.add(particles)


    // Loop
    const clock = new THREE.Clock()
    let oldElapsedTime = 0;

    let keyPressed = false;
    let force = mobile ? 3 : 4;
    const timeStep = 1 / 60

    const keyHandler = (key) => {
        if (keyPressed || cube.dead || cube.win) return
        keyPressed = true

        if (/^[wasdцфыв]?(a|ф)[wasdцфыв]?$/i.test(key)) cubeV[0] = -force 
        if (/^[wasdцфыв]?(d|в)[wasdцфыв]?$/i.test(key)) cubeV[0] = force
        if (/^[wasdцфыв]?(w|ц)[wasdцфыв]?$/i.test(key)) cubeV[2] = -force
        if (/^[wasdцфыв]?(s|ы)[wasdцфыв]?$/i.test(key)) cubeV[2] = force
        setTimeout(() => keyPressed = false, 10)
    }

    document.onkeyup = () => {
        cubeV[0] = 0
        cubeV[1] = 0
        cubeV[2] = 0
    }

    document.querySelector('.button').onclick = () => {
        scene.children.map(c => scene.remove(c))
        gsap.to('.button, .score, .title', {autoAlpha: 0})
        cancelAnimationFrame(loop)
        startGame()
    }


    // Worker

    // Create worker
    if (window.worker) {
        clearTimeout(workerProcess)
        window.worker.terminate();
        delete window.worker;
    }
    window.worker = new Worker(new URL('./worker.js', import.meta.url));

    // Time when we sent last message
    let sendTime;

    // Send the array buffers that will be populated in the
    // worker with cannon.js' data
    function requestDataFromWorker() {
        sendTime = performance.now()
        worker.postMessage(
            {
            timeStep,
            blocksP,
            blocksS,
            cubeP,
            cubeQ,
            cubeV,
            sidesP,
            sidesQ,
            bubblesP,
            healthP,
            elapsedTime,
            dead: cube.dead
            },
            // Specify that we want actually transfer the memory, not copy it over. This is faster.
            // [blocksP.buffer, cubeP.buffer, cubeQ.buffer, sidesP.buffer, sidesQ.buffer, bubblesP.buffer]
        )
    }

    // The mutated position and quaternion data we
    // get back from the worker
    worker.addEventListener('message', (event) => {
        if ('health' in event.data && !cube.healed) {
            health.parent.remove(health)
            cube.health = 1000
            cube.healed = true
            healedSound.play()
            document.querySelector('.hp-active').style.width = '100%'
        } else if ('damage' in event.data) {
            const {damage, impact, lastBlock} = event.data
            onDamage(damage, impact, lastBlock)
        } else {
            blocksP = event.data.blocksP    
            cubeP = event.data.cubeP
            cubeQ = event.data.cubeQ
            const healthWorldP = new THREE.Vector3()
            health.getWorldPosition(healthWorldP)

            healthP[0] = healthWorldP.x
            healthP[1] = healthWorldP.y
            healthP[2] = healthWorldP.z
            // healthP = event.data.healthP
            if (cube.dead) {
                sidesP = event.data.sidesP.some(i => i > 0) ? event.data.sidesP : sidesP
                sidesQ = event.data.sidesQ.some(i => i > 0) ?  event.data.sidesQ : sidesQ
            }

            bubblesP = event.data.bubblesP.some(i => i > 0) ? event.data.bubblesP : bubblesP
           
            // Update the three.js meshes
            for (let i = 0; i < blocks.length; i++) {
                blocks[i].position.set(blocksP[i * 3 + 0], blocksP[i * 3 + 1], blocksP[i * 3 + 2])
            }
            if (cube.dead && sides.length) {
                for (let i = 0; i < bubbles.length; i++) {
                    bubbles[i].position.set(bubblesP[i * 3 + 0], bubblesP[i * 3 + 1], bubblesP[i * 3 + 2])
                }
                for (let i = 0; i < 6; i++) {
                    sides[i].position.set(sidesP[i * 3 + 0], sidesP[i * 3 + 1], sidesP[i * 3 + 2])
                    sides[i].quaternion.set(sidesQ[i * 4 + 0], sidesQ[i * 4 + 1], sidesQ[i * 4 + 2], sidesQ[i * 4 + 3])
                }
            }
           
            cube.mesh.position.set(cubeP[0], cubeP[1], cubeP[2])
            cube.mesh.quaternion.set(cubeQ[0], cubeQ[1], cubeQ[2], cubeQ[3])
            

            const delay = timeStep * 1000 - (performance.now() - sendTime)
            workerProcess = setTimeout(requestDataFromWorker, Math.max(delay, 0))
        }
    })

    worker.addEventListener('error', (event) => {
        console.error(event.message)
    })

    requestDataFromWorker()

   

    const followCube = () => {
        if (!camera.shake) camera.position.set(cube.mesh.position.x, cube.mesh.position.y + 10, cube.mesh.position.z + cameraZ)
        if (!camera.shake) camera.lookAt(cube.mesh.position)
        spotLight.position.set(cube.mesh.position.x + 10, cube.mesh.position.y + 10,  cube.mesh.position.z + 5)
        bg.position.y = cube.mesh.position.y
        bg.position.z = cube.mesh.position.z - 50

    }
    const tick = () => {
        const start = performance.now()
        loop = requestAnimationFrame(tick) 
        elapsedTime = clock.getElapsedTime()
        const deltaTime = elapsedTime - oldElapsedTime
        oldElapsedTime = elapsedTime

        bgMat.uniforms.u_time.value = elapsedTime
        if (!cube.dead) bgMat.uniforms.u_cube_y.value = cube.mesh.position.y
        particles.position.y -= 0.01
        particles.rotation.y = elapsedTime * 0.05
        particles.rotation.z = elapsedTime * 0.05

        bg.rotation.z = elapsedTime * .05

       if (joystick && joystick.getDir()) keyHandler(joystick.getDir())
       if (joystick && !joystick.getDir()) {
            cubeV[0] = 0
            cubeV[1] = 0
            cubeV[2] = 0
       }

       if (cube.mesh.position.y < (blocksP.slice(-2)[0] - 20) && !cube.dead && !cube.win) kill()


        if (!cube.dead) {
            followCube()

        } else {
            camera.position.x += Math.sin(elapsedTime * .1) * .1 
            if (camera.position.z < 500) camera.position.z += .05
            camera.rotation.x += 0.0001
        }

    stats.update()

    renderer.render(scene, camera)
    const end = performance.now()
    }

    tick()
}


function ready(fn) {
    if (document.readyState != 'loading'){
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
}
  
ready(function() {
    document.querySelector('.button').onclick = startGame

        if (localStorage.bestScore) {
            document.querySelector('.best-score span').innerText = localStorage.bestScore
            gsap.fromTo('.best-score', {y: 25}, {opacity: 1, y: 0, delay: .3})
        } 
        if (isMobile()) Array.from(document.querySelectorAll('.controls .row')).map(row => row.remove())

        gsap.to('.cube', 8, {rotateY: 360, rotateX: 360, repeat: -1, ease: 'linear'})
        gsap.to('.title img', 25, {rotate: 360, ease: 'linear', repeat: -1})
        document.querySelector('.title img').setAttribute('src', titleImage)
        document.querySelector('.button img').setAttribute('src', startImage)
        document.querySelector('.full-screen img').setAttribute('src', fullScreenImage)
        document.querySelector('.full-screen').onclick = () => {
            if (!document.fullscreenElement) {
                openFullscreen()
            }
            else {
                closeFullscreen()
            }
        }
        if (mobile) gsap.set('.full-screen', {opacity: 0})
        gsap.timeline()
            .fromTo('.title, .button', 1, {y: 25, opacity: 0}, { opacity: 1, autoAlpha: 1, y: 0, delay: 1, stagger: .3})
            .fromTo('.controls-button', .3, {scale: 0, opacity: 0}, {opacity: 1, scale: 1, stagger: .05}, '<.5')
        console.log('loaded')
  })



