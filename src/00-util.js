// ---- util: deterministic helpers (every frame is a pure function of t)
THREE.ColorManagement.enabled = false;   // hex colours are display colours; the grade does the rest
const FPS = 24, DURATION = 5, FRAMES = FPS * DURATION;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const invLerp = (a, b, x) => clamp((x - a) / (b - a));
const smooth = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
const easeIn = (t, p = 2) => Math.pow(clamp(t), p);
const easeOut = (t, p = 2) => 1 - Math.pow(1 - clamp(t), p);
const deg = (d) => (d * Math.PI) / 180;
const onTwos = (t) => Math.floor(t * 12 + 1e-6) / 12;
const onThrees = (t) => Math.floor(t * 8 + 1e-6) / 8;
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
class Rng {
  constructor(s) { this.r = mulberry32(s); }
  next() { return this.r(); }
  range(a, b) { return a + (b - a) * this.r(); }
}
// keyframes: [[time, value(number|array), ease?], ...]
function track(keys, t) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1, ease] = keys[i], [t0, v0] = keys[i - 1];
    if (t <= t1) {
      const u = (ease || smooth)((t - t0) / (t1 - t0));
      return Array.isArray(v0) ? v0.map((x, j) => lerp(x, v1[j], u)) : lerp(v0, v1, u);
    }
  }
  return keys[keys.length - 1][1];
}
function noise1(x, seed = 0) {
  const h = (n) => { const s = Math.sin(n * 127.1 + seed * 311.7) * 43758.5453; return s - Math.floor(s); };
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return lerp(h(i), h(i + 1), u) * 2 - 1;
}

// story beats (film seconds); picture and sound both key off these
const CUES = { bulge: 0.55, call: 0.35, breach: 1.5, apex: 2.75, crash: 3.7, white: 4.05, title: 4.2, end: 5 };
const SHOTS = [
  { id: 'calm', start: 0, end: 1.5 },
  { id: 'breach', start: 1.5, end: 3.7 },
  { id: 'crash', start: 3.7, end: 5 },
];
const shotAt = (t) => SHOTS.find((s) => t < s.end) || SHOTS[SHOTS.length - 1];

// ShaderMaterial in the MRT format used by every pass (GLSL from the build: GLSL[name])
function shaderMat(vs, fs, uniforms, opts = {}) {
  return new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: GLSL[vs], fragmentShader: GLSL[fs], uniforms, ...opts });
}
