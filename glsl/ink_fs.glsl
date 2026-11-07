// Hand-inked lines on cel pixels: id / depth / normal edges with pen-pressure noise.
uniform sampler2D tColor, tData;
uniform vec2 uRes;
uniform float uS, uWidth, uSeed;
uniform vec3 uInk;
varying vec2 vUv;
out vec4 o;
#include common
bool inked(float id){ return id > 0.5 && id < 99.5; }
vec3 nrm(vec4 d){ vec2 xy = d.rg * 2.0 - 1.0; return vec3(xy, sqrt(max(0.0, 1.0 - dot(xy, xy)))); }
float edgeAt(vec2 uv, vec4 dC, vec3 nC, float w){
  vec2 px = w / uRes;
  float e = 0.0;
  for(int k = 0; k < 8; k++){
    float a = float(k) * 0.78539816;
    vec4 dN = texture(tData, uv + vec2(cos(a), sin(a)) * px);
    bool cC = inked(dC.a), cN = inked(dN.a);
    if(!cC && !cN) continue;
    float ee = 0.0;
    if(abs(dN.a - dC.a) > 0.5){
      if(cC && cN) ee = 1.0;
      else if(cC) ee = (dC.b < dN.b + 0.5) ? 1.0 : 0.0;
      else ee = (dN.b < dC.b + 0.5) ? 1.0 : 0.0;
    } else {
      float rel = abs(dN.b - dC.b) / max(min(dN.b, dC.b), 0.01);
      ee = smoothstep(0.02, 0.045, rel);
      ee = max(ee, smoothstep(0.72, 0.52, dot(nC, nrm(dN))) * 0.8);
    }
    e = max(e, ee);
  }
  return e;
}
void main(){
  vec4 col = texture(tColor, vUv);
  vec4 dC = texture(tData, vUv);
  vec3 nC = nrm(dC);
  vec2 fc = gl_FragCoord.xy / uS;
  float press = 0.85 + 0.3 * vnoise(fc / 60.0 + uSeed * 3.0);
  float dist = clamp(60.0 / max(dC.b, 1.0), 0.55, 1.3);
  float w = uWidth * uS * press * dist;
  float e = 0.5 * edgeAt(vUv, dC, nC, w) + 0.5 * edgeAt(vUv, dC, nC, w * 0.55);
  float alpha = e * (0.82 + 0.18 * vnoise(fc / 7.0 + uSeed));
  vec3 inkc = mix(uInk, col.rgb * vec3(0.42, 0.40, 0.48), 0.6);
  o = vec4(mix(col.rgb, inkc, clamp(alpha, 0.0, 1.0)), 1.0);
}
