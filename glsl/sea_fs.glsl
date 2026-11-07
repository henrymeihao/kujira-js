// painted sea: turquoise near, cobalt far, cel bands on the swell, sun glitter, foam
uniform vec3 uSun, uKey;
uniform float uTime, uDraw;
uniform vec4 uFoam;     // x z radius amount (white water around the whale)
uniform vec4 uRing;     // x z radius height (crash ring)
uniform vec4 uShadow;   // x z length strength (the whale under the surface)
uniform vec2 uShadowDir;
#include common
#include mrt
varying vec3 vWorld; varying vec3 vNW; varying vec3 vNV; varying float vDepth;
void main(){
  vec3 n = normalize(vNW);
  vec3 v = normalize(cameraPosition - vWorld);
  vec2 p = vWorld.xz;
  float dist = length(p - cameraPosition.xz);
  // a painted summer sea: clear turquoise close by, deep ultramarine further out
  vec3 nearC = vec3(0.22, 0.74, 0.78), midC = vec3(0.10, 0.50, 0.74), farC = vec3(0.10, 0.30, 0.64);
  vec3 col = mix(nearC, midC, smoothstep(8.0, 120.0, dist));
  col = mix(col, farC, smoothstep(120.0, 700.0, dist));
  // big soft shadows of the clouds drifting over the water
  float cs = fbm2(p * 0.004 + vec2(uTime * 0.01, 0.0));
  col *= mix(1.0, 0.86, smoothstep(0.52, 0.6, cs));
  // the swell in two painted tones
  vec2 sd = normalize(uSun.xz);
  float s = dot(n.xz, -sd) * 4.0 + (vnoise(p * 0.06 + uDraw * 0.3) - 0.5) * 0.3;
  col *= mix(0.93, 1.0, smoothstep(-0.12, 0.0, s));
  // hand-drawn wave lines: short curved strokes in rows that follow the swell, thinner with distance
  float row = p.y * 0.11 + vnoise(p * vec2(0.05, 0.02)) * 2.2 + sin(p.x * 0.35 + floor(p.y * 0.11) * 2.1 + uDraw * 0.8) * 0.18;
  float fr = abs(fract(row) - 0.5);
  float wpx = fwidth(row) * 1.1;
  float dash = step(0.66, vnoise(vec2(p.x * 0.3 + floor(row) * 7.3, floor(row)) + uDraw * 0.15));
  float lines = (1.0 - smoothstep(wpx * 0.6, wpx * 1.3, fr)) * dash * smoothstep(500.0, 60.0, dist) * smoothstep(12.0, 30.0, dist);
  col = mix(col, vec3(0.80, 0.95, 0.96), lines * 0.85);
  // darker under-strokes beneath each white line
  float under = (1.0 - smoothstep(wpx * 0.5, wpx * 1.2, abs(fract(row + 0.08) - 0.5))) * dash * smoothstep(300.0, 40.0, dist);
  col = mix(col, col * 0.82, under * 0.6);
  // sky in the water toward the horizon
  float fres = pow(1.0 - max(dot(n, v), 0.0), 4.0);
  col = mix(col, vec3(0.62, 0.82, 0.95), fres * 0.55);
  // the whale's shadow before the breach
  vec2 dq = p - uShadow.xy;
  vec2 ax = vec2(dot(dq, uShadowDir), dot(dq, vec2(-uShadowDir.y, uShadowDir.x)));
  float sh = length(ax / vec2(uShadow.z, uShadow.z * 0.45)) + (vnoise(p * 0.15) - 0.5) * 0.25;
  col = mix(col, vec3(0.05, 0.20, 0.42), uShadow.w * smoothstep(1.0, 0.9, sh));
  // sparkles on the sun's path: little four-pointed stars, drawn on twos
  vec3 r = reflect(-v, n);
  float sp = dot(r, uSun);
  vec2 gc = p * 0.35; vec2 gi = floor(gc), gf = fract(gc) - 0.5;
  vec2 gh = hash22(gi + floor(uDraw * 12.0));
  float star = max(1.0 - abs(gf.x) * 9.0 - abs(gf.y) * 30.0, 1.0 - abs(gf.y) * 9.0 - abs(gf.x) * 30.0);
  col = mix(col, vec3(1.0, 0.99, 0.92), step(0.0, star) * step(0.86, gh.x) * smoothstep(0.93, 0.985, sp));
  // white water around the whale and the crash ring
  float rf = length(p - uFoam.xy) / max(uFoam.z, 0.01);
  float fn = fbm2(p * 0.12 + uDraw * 0.7);
  float foam = step(rf + (fn - 0.5) * 0.9, 1.0) * uFoam.w;
  foam *= step(0.38, fbm2(p * 0.3 - uDraw * 0.5) + (1.0 - rf) * 0.4);
  float rr = length(p - uRing.xy);
  float ring = step(abs(rr - uRing.z) + (fn - 0.5) * 9.0, 6.0) * step(0.01, uRing.w);
  ring += step(rr + (fn - 0.5) * 14.0, uRing.z - 4.0) * step(0.01, uRing.w) * step(0.42, fn) * 0.85;
  float f = clamp(foam + ring, 0.0, 1.0);
  vec3 foamC = mix(vec3(0.74, 0.90, 0.94), vec3(1.0, 0.995, 0.97), step(0.0, dot(n, uKey) - 0.2 + fn * 0.3));
  col = mix(col, foamC, f);
  // haze into the horizon
  col = mix(col, vec3(0.74, 0.86, 0.94), smoothstep(400.0, 2400.0, dist));
  writeOut(col, normalize(vNV), vDepth, 0.0);
}
