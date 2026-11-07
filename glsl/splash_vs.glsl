// water curtain: an open cylinder that flares into a crown and tears into fingers at the top
uniform vec4 uShape;   // x z baseRadius flare
uniform vec4 uAnim;    // height, life(0..1 break-up), seed, lean
uniform float uDraw;
varying vec2 vUv2;
#include common
#include vstd
void main(){
  float a = uv.x * 6.2831853, v = uv.y;
  float seed = uAnim.z;
  float jag = vnoise(vec2(uv.x * 7.0 + seed * 7.0, seed)) * 0.7 + vnoise(vec2(uv.x * 19.0, seed + 1.0)) * 0.3;
  float r = uShape.z + uShape.w * v * v * (0.7 + 0.6 * vnoise(vec2(uv.x * 9.0, seed + 3.0)));
  float h = uAnim.x * v * (0.6 + 0.7 * jag);
  vec3 p = vec3(uShape.x + cos(a) * r + uAnim.w * v * v * uAnim.x * 0.3, h, uShape.y + sin(a) * r);
  vec3 nrm = normalize(vec3(cos(a), 0.25, sin(a)));
  vUv2 = vec2(uv.x, v);
  stdVertex(p, nrm);
}
