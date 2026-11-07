// cel lighting: two hard tones with a lavender shade, sharp highlight, rim on the lit side
uniform vec3 uKey; uniform vec3 uShade;
vec3 cel(vec3 base, vec3 n, vec3 v, float gloss, float jit){
  float ndl = dot(n, uKey) + jit;
  float lit = smoothstep(-0.015, 0.015, ndl);
  vec3 col = mix(base * uShade, base, lit);
  col *= 1.0 - smoothstep(-0.55, -0.58, ndl) * 0.1;
  vec3 h = normalize(uKey + v);
  col += gloss * smoothstep(0.955, 0.965, dot(n, h)) * lit * 0.5;
  float rim = smoothstep(0.66, 0.69, 1.0 - max(dot(n, v), 0.0)) * smoothstep(-0.1, 0.3, ndl);
  col = mix(col, col * 1.12 + 0.07, rim * 0.7);
  return col;
}
