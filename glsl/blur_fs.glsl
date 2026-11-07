uniform sampler2D tColor; uniform vec2 uDir;
varying vec2 vUv; out vec4 o;
void main(){
  vec3 s = texture(tColor, vUv).rgb * 0.227;
  s += (texture(tColor, vUv + uDir * 1.385).rgb + texture(tColor, vUv - uDir * 1.385).rgb) * 0.316;
  s += (texture(tColor, vUv + uDir * 3.231).rgb + texture(tColor, vUv - uDir * 3.231).rgb) * 0.070;
  o = vec4(s, 1.0); }
