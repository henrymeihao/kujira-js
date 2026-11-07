// ---- performance and cameras: pure functions of film time
const X0 = WHALE_AT.x, Z0 = WHALE_AT.y;
const CRASH_AT = { t: CUES.crash, x: X0 - 10, z: Z0 + 2 };
const BOAT_AT = new THREE.Vector2(23, -45);
// the breach: rises steep, arcs over toward camera-left rolling onto its side, slams down
const W_KEYS = {
  y: [[0.8, -46], [1.5, -6], [2.0, 22], [2.75, 37], [3.25, 30], [3.7, 9], [4.4, -10]],
  x: [[0.8, X0 + 16], [1.5, X0 + 14], [2.0, X0 + 8], [2.75, X0 - 4], [3.25, X0 - 14], [3.7, X0 - 24], [4.4, X0 - 34]],
  pitch: [[0.8, 74], [1.5, 74], [2.0, 68], [2.75, 46], [3.25, 6], [3.7, -26], [4.4, -30]],
  roll: [[1.5, 0], [2.0, -0.2], [2.75, -0.5], [3.25, -0.7], [3.7, -0.95], [4.4, -1.2]],
  bend: [[1.5, 0.1], [2.0, 0.15], [2.75, 0.3], [3.25, 0.4], [3.7, 0.22], [4.4, 0.15]],
  flap: [[1.5, 0.2], [2.2, 0.55], [2.75, 0.75], [3.4, 0.55], [4.0, 0.3]],
};
const lin = (x) => x;
function poseAt(t) {
  const tt = onTwos(t);
  return {
    head: new THREE.Vector3(track(W_KEYS.x, tt), track(W_KEYS.y, tt), Z0),
    pitch: deg(track(W_KEYS.pitch, tt)), yaw: deg(90), roll: track(W_KEYS.roll, tt),
    bend: track(W_KEYS.bend, tt), flap: track(W_KEYS.flap, tt),
    stroke: 0.25 + 0.2 * smooth(invLerp(2.6, 3.2, tt)), phase: tt * 0.9,
  };
}

const CAMS = {
  calm: (lt, d) => ({ pos: [lerp(22, 20, lt / d), 2.6, lerp(16, 12, lt / d)], look: [-2, 8, -70], fov: 38 }),
  breach: (lt, d, t) => {
    const k = lt / d;
    const shake = Math.exp(-Math.max(0, t - CUES.breach) * 2.2) * 0.35;
    return {
      pos: [20 + noise1(t * 9, 1) * shake, 2.2 + noise1(t * 9, 2) * shake, 6],
      look: track([[0, [2, 12, -70]], [0.45, [0, 24, -70]], [0.8, [-2, 26, -70]], [1, [-8, 18, -70]]], k),
      fov: lerp(42, 46, smooth(invLerp(0.5, 1, k))),
    };
  },
  crash: (lt, d, t) => {
    const shake = Math.exp(-lt * 2.5) * 0.7;
    return {
      pos: [34 + noise1(t * 14, 4) * shake, 2.2 + noise1(t * 14, 5) * shake * 0.6, -26],
      look: [CRASH_AT.x + lt * 2, 12 + lt * 6, CRASH_AT.z],
      fov: lerp(46, 52, lt / d),
    };
  },
};

function stateFor(frame) {
  const t = frame / FPS, sh = shotAt(t);
  const lt = t - sh.start, d = sh.end - sh.start;
  const st = { frame, t, shot: sh.id, lt, d };
  st.cam = CAMS[sh.id](lt, d, t);
  st.pose = poseAt(t);
  // one-frame white flash on the slam, then the paper-white fade for the title
  st.flash = (t >= CUES.crash && t < CUES.crash + 2 / FPS ? 0.55 : 0) + (t >= CUES.breach && t < CUES.breach + 1 / FPS ? 0.3 : 0);
  st.fade = smooth(invLerp(CUES.white, CUES.title, t));
  if (t < 0.25) st.fade = Math.max(st.fade, 1 - smooth(t / 0.25));
  st.title = invLerp(CUES.title, CUES.end - 0.2, t);
  return st;
}
