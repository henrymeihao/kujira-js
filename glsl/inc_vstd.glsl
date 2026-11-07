varying vec3 vWorld; varying vec3 vNW; varying vec3 vNV; varying float vDepth;
void stdVertex(vec3 pos, vec3 nrm){
  mat4 M = modelMatrix;
  #ifdef USE_INSTANCING
  M = modelMatrix * instanceMatrix;
  #endif
  vec4 wp = M * vec4(pos, 1.0);
  vWorld = wp.xyz;
  vNW = normalize(mat3(M) * nrm);
  vNV = normalize(mat3(viewMatrix) * vNW);
  vec4 mv = viewMatrix * wp;
  vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}
