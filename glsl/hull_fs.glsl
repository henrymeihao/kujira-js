// painted hull: red bottom, a navy boot stripe at the waterline, white topsides, a blue sheer stripe, a grey-green deck
uniform float uId;
#include common
#include mrt
#include cel
varying vec3 vWorld; varying vec3 vNW; varying vec3 vNV; varying float vDepth;
varying vec2 vHull; varying vec3 vLocal;
void main(){
  vec3 n = normalize(vNW);
  if(!gl_FrontFacing) n = -n;
  vec3 v = normalize(cameraPosition - vWorld);
  float y = vLocal.y, s = vHull.y;
  vec3 base;
  float gloss = 0.7;
  if(vHull.x < 0.5){
    base = vec3(0.97, 0.96, 0.93);
    base = mix(base, vec3(0.80, 0.25, 0.22), step(y, 0.18));            // anti-fouling red below the boot line
    base = mix(base, vec3(0.13, 0.19, 0.33), step(0.18, y) * step(y, 0.30));   // boot stripe
    base = mix(base, vec3(0.18, 0.40, 0.72), step(0.84, s) * step(s, 0.93));   // sheer stripe
    base = mix(base, vec3(0.13, 0.19, 0.33), step(0.965, s));            // rubbing strake along the top
    // a little rust and grime streaking down from the scuppers
    float streak = step(0.8, vnoise(vec2(vLocal.x * 3.1, 0.0))) * smoothstep(0.84, 0.5, s) * step(0.30, y);
    base *= 1.0 - streak * 0.07 * vnoise(vec2(vLocal.x * 9.0, y * 2.0));
  } else if(vHull.x < 1.5){
    base = vec3(0.86, 0.87, 0.84); gloss = 0.2;
  } else {
    // deck planking in a worn grey-green, plank seams along the length
    base = vec3(0.43, 0.56, 0.52); gloss = 0.0;
    float seam = smoothstep(0.42, 0.5, abs(fract(vLocal.z * 2.6) - 0.5));
    base *= 1.0 - seam * 0.12;
  }
  writeOut(cel(base, n, v, gloss, 0.0), normalize(mat3(viewMatrix) * n), vDepth, uId);
}
