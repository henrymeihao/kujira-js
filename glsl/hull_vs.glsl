// hull: cel vertex + which surface this is (0 outside, 1 bulwark inside, 2 deck) and how far up the side
attribute vec2 aHull;
varying vec2 vHull; varying vec3 vLocal;
#include vstd
void main(){ vHull = aHull; vLocal = position; stdVertex(position, normal); }
