// drawn water: a camera-facing card per drop or spray puff, stretched along its screen-space motion
attribute vec3 aVel;    // world velocity (drops) or zero (puffs)
attribute vec2 aSeed;   // shape seed, lumpiness
uniform vec3 uKey;
uniform float uKind;    // 0 drops, 1 spray puffs
varying vec2 vQ, vSeed, vL;
varying float vK, vDepth;
void main(){
  vec3 c = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  float s = length(instanceMatrix[0].xyz);
  vec4 cv = viewMatrix * vec4(c, 1.0);
  vec3 vv = mat3(viewMatrix) * aVel;
  vec2 d = length(vv.xy) > 1e-3 ? normalize(vv.xy) : vec2(0.0, -1.0);
  float k = 1.0 + min(0.75, length(aVel) * 0.022) * (1.0 - uKind);
  vec2 perp = vec2(-d.y, d.x);
  cv.xy += d * position.x * s * k + perp * position.y * s;
  vQ = position.xy; vK = k; vSeed = aSeed;
  vec2 L = normalize((mat3(viewMatrix) * uKey).xy);
  vL = vec2(dot(L, d), dot(L, perp));
  vDepth = -cv.z;
  gl_Position = projectionMatrix * cv;
}
