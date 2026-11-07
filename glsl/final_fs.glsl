// soft bloom + a warm, gentle grade printed on watercolour paper + flash/fade
uniform sampler2D tColor, tBloom1, tBloom2;
uniform float uFrame, uBloom, uFade, uFlash;
uniform vec3 uFadeColor;
varying vec2 vUv; out vec4 o;
#include common
void main(){
  vec3 c = texture(tColor, vUv).rgb;
  c += (texture(tBloom1, vUv).rgb * 0.6 + texture(tBloom2, vUv).rgb * 0.8) * uBloom;
  c = c / (1.0 + max(c - 1.0, 0.0) * 0.6);
  c *= 1.03;
  c = pow(max(c, 0.0), vec3(0.95));
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  c = mix(vec3(l), c, 1.04);
  c = vec3(0.10, 0.09, 0.12) + c * (vec3(1.0, 0.975, 0.93) - vec3(0.10, 0.09, 0.12));   // lifted, warm blacks and whites
  c *= vec3(1.02, 1.0, 0.96);
  // paper: fibres and tooth, fixed to the frame like a background painted on board
  vec2 fc = gl_FragCoord.xy;
  float tooth = vnoise(fc / 2.2) * 0.5 + vnoise(fc / 7.0) * 0.35 + vnoise(fc / 31.0) * 0.15;
  c *= 0.975 + 0.04 * tooth;
  vec2 q = vUv - 0.5;
  c *= 1.0 - 0.10 * dot(q, q) * 1.6;
  c = mix(c, vec3(1.0), uFlash);
  c = mix(c, uFadeColor, uFade);
  o = vec4(clamp(c, 0.0, 1.0), 1.0);
}
