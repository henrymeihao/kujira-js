// Anisotropic Kuwahara "gouache" brush on painted pixels only (adapted from 0xCodez/leviathan, MIT).
uniform sampler2D tColor, tData;
uniform vec2 uRes;
uniform float uRadius, uS;
varying vec2 vUv;
out vec4 o;
#include common
void main(){
  vec4 c0 = texture(tColor, vUv);
  if(c0.a < 0.5){ o = vec4(c0.rgb, 0.0); return; }
  vec2 px = 1.0 / uRes;
  vec2 fc = gl_FragCoord.xy / uS;
  float ang = (fbm2(fc / 140.0) - 0.5) * 3.2 + 0.4;
  vec2 dA = vec2(cos(ang), sin(ang)), dB = vec2(-dA.y, dA.x);
  float depth = texture(tData, vUv).b;
  float rad = uRadius * mix(1.0, 0.55, smoothstep(30.0, 900.0, depth)) * uS;
  vec3 m[8]; vec3 s[8]; float n[8];
  for(int k = 0; k < 8; k++){ m[k] = c0.rgb; s[k] = c0.rgb * c0.rgb; n[k] = 1.0; }
  for(int r = 1; r <= 3; r++){
    float rr = rad * float(r) / 3.0;
    for(int k = 0; k < 16; k++){
      float a = float(k) * 0.39269908 + (r == 2 ? 0.19634954 : 0.0);
      vec2 off = (dA * cos(a) * 1.45 + dB * sin(a) * 0.8) * rr;
      vec4 t = texture(tColor, vUv + off * px);
      vec3 tc = t.rgb * t.a, tq = t.rgb * t.rgb * t.a;
      if(k / 2 * 2 == k){ int i0 = k / 2; m[i0] += tc; s[i0] += tq; n[i0] += t.a; }
      else { int i0 = (k - 1) / 2, i1 = ((k + 1) / 2) % 8;
        m[i0] += tc * 0.5; s[i0] += tq * 0.5; n[i0] += t.a * 0.5;
        m[i1] += tc * 0.5; s[i1] += tq * 0.5; n[i1] += t.a * 0.5; }
    }
  }
  vec3 acc = vec3(0.0); float wsum = 0.0;
  for(int k = 0; k < 8; k++){
    vec3 mu = m[k] / n[k];
    vec3 v = abs(s[k] / n[k] - mu * mu);
    float sd = sqrt(v.r + v.g + v.b);
    float w = 1.0 / (1.0 + pow(sd * 22.0, 8.0));
    acc += mu * w; wsum += w;
  }
  vec3 col = wsum > 1e-5 ? acc / wsum : c0.rgb;
  mat2 R = mat2(dA.x, dA.y, dB.x, dB.y);
  vec2 sp = R * fc;
  col *= 0.985 + 0.03 * vnoise(vec2(sp.x / 26.0, sp.y / 2.2));
  // pigment pools at the edge of a wash: darken where the colour changes
  vec3 cx = texture(tColor, vUv + vec2(px.x * 2.0 * uS, 0.0)).rgb, cy = texture(tColor, vUv + vec2(0.0, px.y * 2.0 * uS)).rgb;
  float ed = length(cx - c0.rgb) + length(cy - c0.rgb);
  col *= 1.0 - 0.18 * smoothstep(0.03, 0.12, ed);
  // granulation: pigment settles in the paper grain
  float gr = vnoise(fc / 1.8) * 0.6 + vnoise(fc / 5.0) * 0.4;
  col *= 0.97 + 0.05 * gr;
  o = vec4(col, 1.0);
}
