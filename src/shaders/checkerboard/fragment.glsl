
varying vec2 vUv;


void main(void)
{
    float color = mod(distance(vUv, vec2(.3)), 2.0);
    gl_FragColor = vec4(color, color, color, 1.0);
}