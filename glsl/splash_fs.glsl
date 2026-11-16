uniform vec4 uAnim;
uniform float uId, uDraw;
#include common
#include mrt
uniform vec3 uKey;
varying vec3 vWorld; varying vec3 vNW; varying vec3 vNV; varying float vDepth;
varying vec2 vUv2;
void main(){
  float seed = uAnim.z;
  // a drawn sheet: solid low down, its top edge rolling in broad tongues that split into a few fingers
  float tongues = vnoise(vec2(vUv2.x * 22.0 + seed, uDraw * 1.3));
  float fingers = vnoise(vec2(vUv2.x * 64.0 + seed * 2.0, vUv2.y * 1.2 + uDraw * 1.7));
  float holes = fbm2(vec2(vUv2.x * 20.0 + seed * 3.0, vUv2.y * 3.0 - uDraw * 1.5));
  float top = 1.0 - uAnim.y * 0.9;
  float tip = top - (tongues - 0.5) * 0.45;
  if(vUv2.y > tip) discard;
  if(holes < 0.3 + uAnim.y * 0.35 && vUv2.y > 0.25) discard;
  if(fingers < 0.55 * smoothstep(tip - 0.35, tip, vUv2.y)) discard;
  vec3 n = normalize(vNW);
  if(!gl_FrontFacing) n = -n;
  float ndl = dot(n, uKey) + (holes - 0.5) * 0.9 + 0.35;
  vec3 col = mix(vec3(0.76, 0.91, 0.98), vec3(1.0, 1.0, 0.99), step(-0.1, ndl));
  // painted flow: cyan streaks running up the sheet, thick at the base and thinning toward the lip,
  // and a band of sea-coloured water where the sheet leaves the surface
  float streak = vnoise(vec2(vUv2.x * 90.0 + seed * 5.0, vUv2.y * 1.5 - uDraw * 0.8));
  float base = 1.0 - smoothstep(0.05, 0.75, vUv2.y);
  col = mix(col, vec3(0.70, 0.88, 0.96), step(0.62 - base * 0.25, streak) * (0.4 + 0.6 * base));
  col = mix(col, vec3(0.42, 0.76, 0.90), step(vUv2.y + (streak - 0.5) * 0.12, 0.14) * 0.85);
  writeOut(col, normalize(mat3(viewMatrix) * n), vDepth, uId);
}
