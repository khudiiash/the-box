uniform float u_time;
uniform float u_cube_y;

varying float v_cube_y;
varying vec2 v_uv;
varying float v_time;
void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    v_uv = uv;
    v_time = u_time;
    v_cube_y = u_cube_y;
}