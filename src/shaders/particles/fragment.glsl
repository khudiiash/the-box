varying vec2 vUV;
varying float vZ;
varying float vScale;

void main()
{
    float strength = distance(gl_PointCoord, vec2(0.5));
    strength = 1.0 - strength;
    strength = pow(strength, 10.0);

    // Final color
    gl_FragColor = vec4(strength * vScale * vZ, strength, strength * vScale, clamp(vScale, 0.1, 0.3));
}