// a painted summer sky in the manner of hand-made animation backgrounds:
// soft cerulean, and a range of towering cumulus built from round billows,
// lit cream-white from the upper left, blue-lavender in their shade, flat-bottomed over the sea
uniform vec3 uSun;
#include common
#include mrt
varying vec3 vWorld; varying vec3 vNW; varying vec3 vNV; varying float vDepth;
// density of the billows and its gradient, in (azimuth, elevation) space
vec3 billows(vec2 p){
  float f = 0.0; vec2 g = vec2(0.0);
  float cell = 0.34;
  float ci = floor(p.x / cell);
  for(int k = -1; k <= 1; k++){
    float c = ci + float(k);
    vec2 h = hash22(vec2(c, 3.7));
    float H = 0.12 + 0.30 * h.x * h.x;              // tower height (radians)
    float W = 0.20 + 0.10 * h.y;
    float cx = (c + 0.5) * cell + (h.y - 0.5) * cell * 0.5;
    if(h.x < 0.22) continue;                         // gaps between towers
    // a solid core up the middle of the tower so the billows never leave holes
    for(int j = 0; j < 4; j++){
      float v = (float(j) + 0.5) / 4.0 * H * 0.8;
      vec2 d = (p - vec2(cx, v + 0.012)) / vec2(W * 0.42 * (1.0 - 0.35 * v / H), H * 0.22);
      float e = exp(-dot(d, d));
      f += e; g += -2.0 * d / vec2(W * 0.42 * (1.0 - 0.35 * v / H), H * 0.22) * e;
    }
    for(int j = 0; j < 26; j++){
      vec2 r = hash22(vec2(c * 17.0 + float(j), 9.1));
      float v = pow(r.x, 0.8) * H;
      float u = cx + (r.y - 0.5) * W * (1.15 - 0.6 * v / H);
      float rad = mix(0.055, 0.028, v / H) * (0.75 + 0.5 * fract(r.x * 13.1));
      vec2 d = p - vec2(u, v + 0.012);
      float e = exp(-dot(d, d) / (rad * rad));
      f += e; g += -2.0 * d / (rad * rad) * e;
    }
  }
  return vec3(f, g);
}
void main(){
  vec3 d = normalize(vWorld - cameraPosition);
  float el = d.y, az = atan(d.x, -d.z);
  // sky: deep cerulean overhead, milky near the horizon
  vec3 col = mix(vec3(0.70, 0.86, 0.96), vec3(0.12, 0.42, 0.88), pow(clamp(el, 0.0, 1.0), 0.5));
  col = mix(col, vec3(0.98, 0.96, 0.88), pow(max(dot(d, uSun), 0.0), 18.0) * 0.35);
  // thin cirrus brush strokes high up
  float ci = vnoise(vec2(az * 4.0, el * 40.0)) * vnoise(vec2(az * 1.3 + 2.0, el * 6.0));
  col = mix(col, vec3(0.95, 0.97, 1.0), smoothstep(0.32, 0.5, ci) * smoothstep(0.25, 0.6, el) * 0.5);
  // cumulus
  vec3 b = billows(vec2(az, el));
  float edge = 0.42 + (vnoise(vec2(az, el) * 220.0) - 0.5) * 0.05;
  float m = smoothstep(edge - 0.04, edge + 0.04, b.x) * smoothstep(0.0, 0.012, el);
  if(m > 0.0){
    vec2 n = -normalize(b.yz + 1e-5);              // outward normal of the billow
    vec2 sunDir = normalize(vec2(-0.55, 0.85));     // light from the upper left
    // at the rim the billow's own normal decides; inside, the cloud brightens toward its top
    float inner = -0.55 + el * 3.2 + (b.x > 2.0 ? 0.0 : 0.15);
    float lit = mix(inner, dot(n, sunDir) * 0.9, smoothstep(2.2, 0.8, b.x));
    vec3 shade = vec3(0.70, 0.75, 0.90), mid = vec3(0.88, 0.90, 0.96), light = vec3(1.0, 0.99, 0.95);
    vec3 cc = mix(shade, mid, smoothstep(-0.35, -0.2, lit));
    cc = mix(cc, light, smoothstep(0.15, 0.28, lit));
    // warm rim where the billow edge faces the sun
    cc += vec3(0.04, 0.02, -0.02) * smoothstep(0.62, 0.55, b.x) * step(0.3, lit);
    // the flat base sits in haze
    cc = mix(cc, vec3(0.76, 0.83, 0.93), smoothstep(0.06, 0.0, el) * 0.6);
    col = mix(col, cc, m);
  }
  // far, small clouds sitting on the horizon
  float low = smoothstep(0.62, 0.66, fbm2(vec2(az * 9.0, 2.0)) + (0.03 - el) * 6.0) * smoothstep(-0.005, 0.005, el);
  col = mix(col, vec3(0.90, 0.92, 0.97), low * 0.8 * (1.0 - m));
  if(el < 0.0) col = vec3(0.70, 0.84, 0.93);
  writeOut(col, vec3(0.0, 0.0, 1.0), 6000.0, 0.0);
}
