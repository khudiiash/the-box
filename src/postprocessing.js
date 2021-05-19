import * as THREE from 'three'
import { BokehShader, BokehDepthShader } from 'three/examples/jsm/shaders/BokehShader2.js';
import {postprocessing, camera} from './script'

const shaderSettings = {
    rings: 3,
    samples: 4
};
export function initPostprocessing() {

    postprocessing.scene = new THREE.Scene();

    postprocessing.camera = new THREE.OrthographicCamera( window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, - 10000, 10000 );
    postprocessing.camera.position.z = 100;

    postprocessing.scene.add( postprocessing.camera );

    const pars = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat };
    postprocessing.rtTextureDepth = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight, pars );
    postprocessing.rtTextureColor = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight, pars );

    const bokeh_shader = BokehShader;

    postprocessing.bokeh_uniforms = THREE.UniformsUtils.clone( bokeh_shader.uniforms );

    postprocessing.bokeh_uniforms[ 'tColor' ].value = postprocessing.rtTextureColor.texture;
    postprocessing.bokeh_uniforms[ 'tDepth' ].value = postprocessing.rtTextureDepth.texture;
    postprocessing.bokeh_uniforms[ 'textureWidth' ].value = window.innerWidth;
    postprocessing.bokeh_uniforms[ 'textureHeight' ].value = window.innerHeight;

    postprocessing.materialBokeh = new THREE.ShaderMaterial( {

        uniforms: postprocessing.bokeh_uniforms,
        vertexShader: bokeh_shader.vertexShader,
        fragmentShader: bokeh_shader.fragmentShader,
        defines: {
            RINGS: shaderSettings.rings,
            SAMPLES: shaderSettings.samples
        }

    } );

    postprocessing.quad = new THREE.Mesh( new THREE.PlaneGeometry( window.innerWidth, window.innerHeight ), postprocessing.materialBokeh );
    postprocessing.quad.position.z = - 500;
    postprocessing.scene.add( postprocessing.quad );

}

export function shaderUpdate() {

    postprocessing.materialBokeh.defines.RINGS = shaderSettings.rings;
    postprocessing.materialBokeh.defines.SAMPLES = shaderSettings.samples;
    postprocessing.materialBokeh.needsUpdate = true;

}

export function linearize( depth ) {

    const zfar = camera.far;
    const znear = camera.near;
    return - zfar * znear / ( depth * ( zfar - znear ) - zfar );

}

export function smoothstep( near, far, depth ) {

    const x = saturate( ( depth - near ) / ( far - near ) );
    return x * x * ( 3 - 2 * x );

}

function saturate( x ) {

    return Math.max( 0, Math.min( 1, x ) );

}
