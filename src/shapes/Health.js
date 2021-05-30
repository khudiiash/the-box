import * as THREE from 'three'
import gsap from 'gsap'
export default class LightBulb {
    constructor(color, intensity) {

        const light = new THREE.PointLight(color, intensity || 5000, 15)
        light.castShadow = true;
        const heartShape = new THREE.Shape();
        heartShape.moveTo( 25, 25 );
        heartShape.bezierCurveTo( 25, 25, 20, 0, 0, 0 );
        heartShape.bezierCurveTo( - 30, 0, - 30, 35, - 30, 35 );
        heartShape.bezierCurveTo( - 30, 55, - 10, 77, 25, 95 );
        heartShape.bezierCurveTo( 60, 77, 80, 55, 80, 35 );
        heartShape.bezierCurveTo( 80, 35, 80, 0, 50, 0 );
        heartShape.bezierCurveTo( 35, 0, 25, 25, 25, 25 );
        
        const extrudeSettings = { depth: 20, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 1, bevelThickness: 1 };
        
        const geometry = new THREE.ExtrudeGeometry( heartShape, extrudeSettings );
        geometry.rotateZ(Math.PI)
        geometry.scale(.013,.013,.013)
        const mesh = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial({color}));
        mesh.add(light)
        light.position.y += 1
        light.target = mesh
        return mesh
    }
}