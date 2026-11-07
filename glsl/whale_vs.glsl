attribute vec2 aUV;
varying vec2 vUV;
#include vstd
void main(){ vUV = aUV; stdVertex(position, normal); }
