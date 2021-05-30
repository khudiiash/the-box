varying vec2 v_uv;
varying float v_time;
varying float v_cube_y;
vec2 rotateUV(vec2 uv, vec2 pivot, float rotation) {
    float sine = sin(rotation);
    float cosine = cos(rotation);

    uv -= pivot;
    uv.x = uv.x * cosine - uv.y * sine;
    uv.y = uv.x * sine + uv.y * cosine;
    uv += pivot;

    return uv;
}
void main() {
    vec2 rotatedUV = rotateUV(v_uv, vec2(0.5), v_time * .5);
    float y = (v_cube_y * .001) - 30.2;
    float r = smoothstep(.1, .8, rotatedUV.x * cos(y));
    float g = smoothstep(.1, .4, rotatedUV.y * cos(y));
    float b = smoothstep(.1, .8, cos(y));
    gl_FragColor = vec4(r, g, b, 1.0);
}