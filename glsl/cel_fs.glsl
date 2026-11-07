// generic cel material for props and splash shapes
uniform vec3 uColor; uniform float uId, uGloss, uMode;
#include common
#include mrt
#include cel
varying vec3 vWorld; varying vec3 vNW; varying vec3 vNV; varying float vDepth;
varying vec3 vLocal;
void main(){
  vec3 n = normalize(vNW);
  if(!gl_FrontFacing) n = -n;
  vec3 v = normalize(cameraPosition - vWorld);
  vec3 base = uColor;
  if(uMode > 0.5){
    // water: white crests over cyan shade, slightly translucent-looking core
    float ndl = dot(n, uKey);
    base = mix(vec3(0.70, 0.86, 0.94), vec3(1.0, 0.995, 0.97), smoothstep(-0.2, -0.12, ndl));
    writeOut(mix(base * vec3(0.86, 0.92, 1.0), base, step(-0.1, ndl)), normalize(mat3(viewMatrix) * n), vDepth, uId);
    return;
  }
  writeOut(cel(base, n, v, uGloss, 0.0), normalize(mat3(viewMatrix) * n), vDepth, uId);
}
