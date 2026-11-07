uniform sampler2D tColor; uniform float uThreshold;
varying vec2 vUv; out vec4 o;
void main(){ vec3 c = texture(tColor, vUv).rgb; float l = max(c.r, max(c.g, c.b));
  o = vec4(c * smoothstep(uThreshold, uThreshold + 0.35, l), 1.0); }
