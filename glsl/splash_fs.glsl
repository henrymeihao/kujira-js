uniform vec4 uAnim;
uniform float uId, uDraw;
#include common
#include mrt
uniform vec3 uKey;
varying vec3 vWorld; varying vec3 vNW; varying vec3 vNV; varying float vDepth;
varying vec2 vUv2;
void main(){
  float seed = uAnim.z;
  float fingers = vnoise(vec2(vUv2.x * 60.0 + seed, vUv2.y * 3.0 + uDraw * 2.0));
  float holes = fbm2(vec2(vUv2.x * 30.0 + seed * 3.0, vUv2.y * 6.0 - uDraw * 1.5));
  float top = 1.0 - uAnim.y * 0.9;
  if(vUv2.y > top - (fingers - 0.5) * 0.5) discard;
  if(holes < 0.36 + uAnim.y * 0.4 && vUv2.y > 0.18) discard;
  if(fingers < 0.3 + vUv2.y * 0.35) discard;
  vec3 n = normalize(vNW);
  if(!gl_FrontFacing) n = -n;
  float ndl = dot(n, uKey) + (holes - 0.5) * 0.9 + 0.35;
  vec3 col = mix(vec3(0.76, 0.91, 0.98), vec3(1.0, 1.0, 0.99), step(-0.1, ndl));
  col = mix(col, vec3(0.42, 0.76, 0.90), step(vUv2.y, 0.06) * 0.7);
  writeOut(col, normalize(mat3(viewMatrix) * n), vDepth, uId);
}
