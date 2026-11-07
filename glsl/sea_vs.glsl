// sea: swell + the whale's bulge + the crash ring, normals from finite differences
uniform float uTime;
uniform vec4 uBulge;   // x z radius height
uniform vec4 uRing;    // x z radius height
uniform vec2 uCenter;
varying vec3 vWorld; varying vec3 vNW; varying vec3 vNV; varying float vDepth;
float H(vec2 p){
  float t = uTime;
  float h = 0.32 * sin(dot(p, vec2(0.050, 0.021)) + t * 1.1) + 0.22 * sin(dot(p, vec2(-0.031, 0.067)) + t * 1.5)
          + 0.10 * sin(dot(p, vec2(0.13, -0.09)) + t * 2.3);
  float rb = length(p - uBulge.xy);
  h += uBulge.w * exp(-rb * rb / (uBulge.z * uBulge.z));
  float rr = length(p - uRing.xy);
  h += uRing.w * exp(-pow((rr - uRing.z) / 7.0, 2.0)) - uRing.w * 0.5 * exp(-pow((rr - uRing.z + 16.0) / 9.0, 2.0));
  return h;
}
void main(){
  vec2 p = position.xy;
  vec2 wp = uCenter + sign(p) * p * p * 2600.0;
  float e = 0.6 + length(wp - uCenter) * 0.004;
  float h = H(wp);
  vec3 n = normalize(vec3(H(wp - vec2(e, 0.0)) - H(wp + vec2(e, 0.0)), 2.0 * e, H(wp - vec2(0.0, e)) - H(wp + vec2(0.0, e))));
  vec4 w = vec4(wp.x, h, wp.y, 1.0);
  vWorld = w.xyz; vNW = n; vNV = normalize(mat3(viewMatrix) * n);
  vec4 mv = viewMatrix * w; vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}
