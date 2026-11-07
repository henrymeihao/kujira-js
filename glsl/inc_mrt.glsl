// MRT: colour (alpha 1 = painted background, gets brushwork) + data (view normal xy, view depth, material id)
// ids: 0 painted, 1..99 inked cel, 100+ cel without ink
layout(location = 0) out vec4 oColor;
layout(location = 1) out vec4 oData;
void writeOut(vec3 col, vec3 nV, float depth, float id){
  oColor = vec4(col, id > 0.5 ? 0.0 : 1.0);
  oData = vec4(nV.xy * 0.5 + 0.5, depth, id);
}
