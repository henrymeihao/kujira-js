// humpback cel: slate-blue back, pale grooved throat, mottled scars, barnacles, an eye
uniform float uPart, uId, uWet;
#include common
#include mrt
#include cel
varying vec3 vWorld; varying vec3 vNW; varying vec3 vNV; varying float vDepth;
varying vec2 vUV;
float dots(vec2 g, float thr, float r){
  vec2 ci = floor(g), cf = fract(g); vec2 h = hash22(ci);
  return step(thr, h.x) * step(length(cf - 0.25 - 0.5 * h.yx), r);
}
void main(){
  vec3 n = normalize(vNW);
  if(!gl_FrontFacing) n = -n;
  vec3 v = normalize(cameraPosition - vWorld);
  vec3 backC = vec3(0.23, 0.34, 0.50), flankC = vec3(0.36, 0.49, 0.64), bellyC = vec3(0.98, 0.95, 0.89);
  vec3 col;
  float u = vUV.x, th = vUV.y * 3.14159265;
  float jit = 0.0;
  if(uPart < 0.5){
    float s = sin(th), c = cos(th);
    float edge = -0.52 + 0.2 * smoothstep(0.5, 0.95, u) + (vnoise(vec2(u * 26.0, th * 3.0)) - 0.5) * 0.28;
    float belly = step(s, edge);
    col = mix(backC, flankC, smoothstep(0.75, -0.1, s));
    // scars and mottling on the back
    float sc = step(0.86, vnoise(vec2(u * 34.0, th * 3.5))) * step(0.35, s) * step(0.3, u);
    col = mix(col, vec3(0.45, 0.56, 0.70), sc * 0.7);
    col = mix(col, bellyC, belly);
    // ventral grooves on the throat
    if(u < 0.5 && belly > 0.5){
      float gv = abs(fract(th * 9.0 + u * 0.8) - 0.5);
      col = mix(col, vec3(0.86, 0.72, 0.72), step(gv, 0.075) * smoothstep(0.5, 0.35, u));
    }
    // barnacles on the chin and head
    float bar = dots(vec2(u * 140.0, th * 9.0), 0.6, 0.18) * step(u, 0.16);
    col = mix(col, vec3(0.93, 0.92, 0.86), bar);
    // eye, on both flanks just under the midline
    vec2 ed = vec2((u - 0.155) * 52.0, (s + 0.10) * 8.0);
    float side = step(0.55, abs(c));
    float eye = length(ed);
    col = mix(col, vec3(0.93, 0.92, 0.88), step(eye, 1.35) * side);
    col = mix(col, vec3(0.04, 0.05, 0.10), step(eye, 0.85) * side);
    col = mix(col, vec3(1.0), step(length(ed - vec2(-0.25, 0.3)), 0.28) * side);
    // mouth line
    float ml = abs(s - (-0.18 + u * 0.9)) ;
    col = mix(col, vec3(0.08, 0.10, 0.18), step(ml, 0.035) * step(u, 0.19) * step(0.012, u));
    jit = (vnoise(vec2(u * 30.0, th * 4.0)) - 0.5) * 0.12;
  } else if(uPart < 1.5){
    // pectoral flipper: white with a dark mottled top
    float top = step(0.0, sin(vUV.y * 3.14159265));
    float mot = step(0.55, vnoise(vec2(u * 18.0, vUV.y * 6.0))) * top * step(0.15, u);
    col = mix(vec3(0.95, 0.95, 0.94), backC * 1.2, mot);
    col = mix(col, vec3(0.93, 0.92, 0.86), dots(vec2(u * 60.0, vUV.y * 8.0), 0.7, 0.2));
  } else {
    // flukes: dark top, white underside with a dark rim
    float top = step(0.0, sin(vUV.y * 3.14159265));
    float rim = step(0.82, abs(cos(vUV.y * 3.14159265)) + u * 0.15);
    col = mix(mix(bellyC, backC, rim), backC, top);
  }
  col = cel(col, n, v, uWet, jit);
  writeOut(col, normalize(mat3(viewMatrix) * n), vDepth, uId);
}
