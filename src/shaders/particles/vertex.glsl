uniform float uSize;
uniform float uTime;
attribute float aScale;
attribute vec3 aRandomness;
varying float vZ;
varying float vScale;


void main()
{
    // Position
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec4 viewPosition =  viewMatrix * modelPosition;
    vec4 projectionPosition = projectionMatrix * viewPosition;

    gl_Position = projectionPosition;
    gl_PointSize = 1250.0 * aScale;
    gl_PointSize *= (1.0 / - viewPosition.z);
    vZ = viewPosition.z;
    vScale = aScale;


}