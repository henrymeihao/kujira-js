// ---- soundtrack: synthesized offline (48 kHz stereo, exactly 5 s), keyed to CUES.
// Gentle throughout: a little piano tune over soft strings, the sea, gulls, a whale's call.
// The breach and the fall back into the sea are soft swells of water, never a hit.
async function renderSoundtrack() {
  const SR = 48000, ac = new OfflineAudioContext(2, SR * DURATION, SR);
  const rng = new Rng(11);
  const NOISE = ac.createBuffer(2, SR * DURATION, SR);
  for (let c = 0; c < 2; c++) { const d = NOISE.getChannelData(c); for (let i = 0; i < d.length; i++) d[i] = rng.next() * 2 - 1; }
  // a warm, airy room
  const ir = ac.createBuffer(2, SR * 3, SR);
  for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); let y = 0; for (let i = 0; i < d.length; i++) { y += ((rng.next() * 2 - 1) - y) * 0.2; d[i] = y * Math.exp(-i / (SR * 0.8)); } }
  const master = ac.createGain(); master.gain.value = 0.7;
  const comp = ac.createDynamicsCompressor(); comp.threshold.value = -20; comp.knee.value = 12; comp.ratio.value = 2.5; comp.attack.value = 0.03; comp.release.value = 0.4;
  master.connect(comp); comp.connect(ac.destination);
  const verb = ac.createConvolver(); verb.buffer = ir; const vg = ac.createGain(); vg.gain.value = 0.55; verb.connect(vg); vg.connect(master);
  master.gain.setValueAtTime(0.0, 0); master.gain.linearRampToValueAtTime(0.7, 0.35);
  master.gain.setValueAtTime(0.7, 4.5); master.gain.linearRampToValueAtTime(0.0, 5.0);
  const gain = (v, wet = 0) => { const g = ac.createGain(); g.gain.value = v; g.connect(master); if (wet) { const s = ac.createGain(); s.gain.value = wet; g.connect(s); s.connect(verb); } return g; };
  const filt = (type, f, q = 0.7) => { const b = ac.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b; };
  const noise = (t0, t1, out) => { const s = ac.createBufferSource(); s.buffer = NOISE; s.connect(out); s.start(t0, t0); s.stop(t1); return s; };
  const osc = (type, f, t0, t1, out, detune = 0) => { const o = ac.createOscillator(); o.type = type; o.frequency.value = f; o.detune.value = detune; o.connect(out); o.start(t0); o.stop(t1); return o; };
  const env = (g, pts) => { g.gain.setValueAtTime(pts[0][1], pts[0][0]); for (const [t, v] of pts.slice(1)) g.gain.linearRampToValueAtTime(v, t); };
  const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12);
  const B = CUES.breach, C = CUES.crash, T = CUES.title;

  // the sea: a slow wash and a little air
  { const g = gain(0, 0.25), f = filt('lowpass', 520); f.connect(g); noise(0, 5, f);
    env(g, [[0, 0.0], [0.5, 0.07], [1.2, 0.05], [2.2, 0.08], [3.6, 0.06], [4.4, 0.08], [5, 0.04]]); }
  { const g = gain(0.008), f = filt('highpass', 4000); f.connect(g); noise(0, 5, f); }
  // gulls, far off
  for (const [t0, f0] of [[0.3, 1500], [0.7, 1350], [1.9, 1600]]) { const g = gain(0, 0.6), o = osc('triangle', f0, t0, t0 + 0.32, g);
    o.frequency.setValueAtTime(f0, t0); o.frequency.exponentialRampToValueAtTime(f0 * 0.66, t0 + 0.24);
    env(g, [[t0, 0], [t0 + 0.03, 0.014], [t0 + 0.24, 0.008], [t0 + 0.3, 0]]); }
  // the whale's call: low, slow, round
  { const g = gain(0, 1.0), f = filt('lowpass', 900); f.connect(g);
    const o = osc('sine', 180, CUES.call, 1.9, f), o2 = osc('sine', 90, CUES.call, 1.9, f);
    for (const [oo, k] of [[o, 1], [o2, 0.5]]) { oo.frequency.setValueAtTime(180 * k, CUES.call); oo.frequency.linearRampToValueAtTime(270 * k, 1.0); oo.frequency.linearRampToValueAtTime(220 * k, 1.8); }
    env(g, [[CUES.call, 0], [0.8, 0.05], [1.4, 0.045], [1.9, 0.0]]); }

  // piano: a soft felt tone, short attack, long fade
  const piano = (f, t0, a, len = 2.2) => {
    const g = gain(0, 0.6), lp = filt('lowpass', 2200); lp.connect(g);
    for (const [m, w] of [[1, 1], [2, 0.3], [3, 0.08]]) { const gg = ac.createGain(); gg.gain.value = w; gg.connect(lp); osc('sine', f * m, t0, t0 + len, gg); }
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(a, t0 + 0.012); g.gain.exponentialRampToValueAtTime(a * 0.01, t0 + len);
  };
  // an original tune in A major: it climbs with the whale, settles as it falls back
  const TUNE = [[0.3, 76], [0.7, 73], [1.1, 71], [1.5, 69], [1.9, 76], [2.2, 78], [2.5, 81], [2.9, 80], [3.4, 78], [3.75, 76], [4.1, 73], [4.45, 81]];
  for (const [t0, n] of TUNE) piano(NOTE(n), t0, 0.045, 2.0);
  for (const [t0, notes] of [[0.3, [57, 64]], [1.5, [54, 61]], [2.5, [50, 57]], [3.4, [52, 59]], [4.1, [45, 57, 64]]]) for (const n of notes) piano(NOTE(n), t0, 0.03, 2.6);
  // strings: a soft pad that swells under the breach and opens out over the fall
  { const g = gain(0, 0.9), f = filt('lowpass', 900, 0.4); f.connect(g);
    const chords = [[0.2, 1.5, [57, 64, 69, 73]], [1.5, 2.5, [54, 61, 66, 69]], [2.5, 3.4, [50, 57, 62, 66]], [3.4, 4.1, [52, 59, 64, 68]], [4.1, 5.0, [45, 57, 64, 69, 73]]];
    for (const [t0, t1, notes] of chords) for (const n of notes) for (const dt of [-4, 4]) osc('sawtooth', NOTE(n), t0, t1 + 0.25, f, dt);
    f.frequency.setValueAtTime(700, 0.2); f.frequency.linearRampToValueAtTime(1400, C); f.frequency.linearRampToValueAtTime(1000, 5);
    env(g, [[0.2, 0], [1.2, 0.006], [B, 0.008], [2.8, 0.011], [C, 0.012], [4.4, 0.010], [5, 0.006]]); }

  // the breach: water rising and pouring off it, a slow swell
  { const g = gain(0, 0.4), f = filt('bandpass', 500, 0.7); f.connect(g); noise(B - 0.3, C, f);
    f.frequency.setValueAtTime(400, B - 0.3); f.frequency.linearRampToValueAtTime(1100, B + 0.7); f.frequency.linearRampToValueAtTime(800, C);
    env(g, [[B - 0.3, 0], [B + 0.25, 0.11], [B + 1.0, 0.08], [C - 0.1, 0.04], [C, 0.02]]); }
  // water falling back from the whale: a soft patter
  for (let i = 0; i < 26; i++) { const t0 = B + 0.5 + rng.next() * 1.5, g = gain(0, 0.4), f = filt('bandpass', 1800 + rng.next() * 1600, 2); f.connect(g); noise(t0, t0 + 0.08, f);
    env(g, [[t0, 0], [t0 + 0.005, 0.02 + rng.next() * 0.02], [t0 + 0.08, 0]]); }
  // the fall back into the sea: a deep, slow 'whoosh' with a gentle low swell, no hit
  { const g = gain(0, 0.5), f = filt('lowpass', 700, 0.5); f.connect(g); noise(C - 0.05, 5, f);
    f.frequency.setValueAtTime(700, C); f.frequency.linearRampToValueAtTime(380, C + 1.2);
    env(g, [[C - 0.05, 0], [C + 0.18, 0.13], [C + 0.6, 0.09], [C + 1.3, 0.03], [5, 0]]); }
  { const g = gain(0), o = osc('sine', 82, C, C + 1.2, g); o.frequency.linearRampToValueAtTime(62, C + 1.0);
    env(g, [[C, 0], [C + 0.15, 0.05], [C + 1.1, 0]]); }
  { const g = gain(0, 0.6), f = filt('bandpass', 2400, 0.8); f.connect(g); noise(C + 0.2, C + 1.3, f);
    env(g, [[C + 0.2, 0], [C + 0.45, 0.025], [C + 1.3, 0]]); }

  // the title: a quiet glockenspiel note and its octave
  for (const [fr, a] of [[NOTE(81), 0.03], [NOTE(93), 0.012]]) {
    const g = gain(0, 0.9); osc('sine', fr, T + 0.05, 5, g);
    g.gain.setValueAtTime(0, T + 0.05); g.gain.linearRampToValueAtTime(a, T + 0.07); g.gain.exponentialRampToValueAtTime(a * 0.05, 5);
  }
  return ac.startRendering();
}
