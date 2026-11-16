// drawn water: a teardrop (or a scalloped puff) with a cel shade, one highlight and its own thin outline
uniform float uKind, uDraw, uId;
#include common
#include mrt
varying vec2 vQ, vSeed, vL;
varying float vK, vDepth;
void main(){
  float k = vK;
  vec2 p = vec2(vQ.x * k, vQ.y);           // in units of the drop radius; the head leads, the tail trails
  float hx = k - 1.0;
  vec2 hp = p - vec2(hx, 0.0);
  float a = atan(hp.y, hp.x);
  float boil = floor(uDraw * 8.0 + 0.001) * 0.37 * uKind;   // puffs are redrawn a little every drawing
  float sd = vSeed.x * 6.2831853 + boil;
  float R = uKind > 0.5
    ? 0.86 + 0.14 * sqrt(abs(sin(a * 3.0 + sd)))                       // cauliflower scallops
    : 1.0 - vSeed.y * 0.07 * (0.5 + 0.5 * sin(a * 2.0 + sd));
  float dHead = length(hp) - R;
  float tx = clamp((p.x + k) / max(hx + k, 1e-3), 0.0, 1.0);
  // a thin tail that swells into the round head (concave taper), so drops read as water, not ice
  float dTail = (p.x < hx && p.x > -k) ? abs(p.y) - R * pow(tx, 2.2) : 1e3;
  float d = min(dHead, dTail);
  if(d > 0.0) discard;
  float w = fwidth(d) * (uKind > 0.5 ? 1.1 : 1.5);
  vec2 L = normalize(vL);
  float sh = dot(hp, L) / R;
  vec3 col;
  if(uKind > 0.5){
    float edge = sh + 0.12 * sin(a * 6.0 + sd * 2.0) + 0.25;
    col = mix(vec3(0.77, 0.87, 0.94), vec3(1.0, 0.995, 0.975), step(0.0, edge));
    col = mix(col, vec3(0.52, 0.69, 0.83), step(-w, d));
  } else {
    // flat pale-cyan body, a thin shade along the far rim, one round highlight near the lit rim
    col = mix(vec3(0.66, 0.86, 0.95), vec3(0.88, 0.96, 0.995), step(-0.55, sh));
    col = mix(col, vec3(1.0), step(length(hp / R - L * 0.42), 0.22));
    col = mix(col, vec3(0.23, 0.47, 0.65), step(-w, d));
  }
  writeOut(col, vec3(0.0, 0.0, 1.0), vDepth, uId);
}
