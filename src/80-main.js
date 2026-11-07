// ---- main: build the film, render frame n, title card, player
const P = new URLSearchParams(location.search);
const LOW = P.get('q') === 'low';
const W = LOW ? 1280 : 1920, H = LOW ? 720 : 1080;
const canvas = document.getElementById('c'), tcan = document.getElementById('title');
canvas.width = tcan.width = W; canvas.height = tcan.height = H;
const post = new Post(canvas, W, H);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, W / H, 0.5, 9000);
const env = buildEnv(scene);
const whale = buildWhale(scene);
const boat = buildBoat(scene);
const fx = buildFx(scene, whale);
const gulls = buildGulls(scene);
const _v = new THREE.Vector3();

// title card on paper: brush-revealed kanji, a red seal, a credit line
const tctx = tcan.getContext('2d');
const SPECK = (() => { const r = new Rng(21), a = []; for (let i = 0; i < 260; i++) a.push([r.range(-0.5, 0.5), r.range(-0.5, 0.5), r.range(0.002, 0.009), r.next()]); return a; })();
function drawTitle(st) {
  tctx.clearRect(0, 0, W, H);
  const k = st.title;
  if (k <= 0) return;
  const cx = W * 0.5, cy = H * 0.46, S = H * 0.46;
  tctx.save();
  const rev = easeOut(invLerp(0, 0.38, k), 2);
  tctx.beginPath();
  for (let i = 0; i <= 24; i++) { const x = cx - S * 0.6 + (S * 1.2 * i) / 24; tctx.lineTo(x, cy - S * 0.6 + S * 1.25 * rev + noise1(i * 0.7, 3) * S * 0.04); }
  tctx.lineTo(cx + S * 0.6, cy - S * 0.62); tctx.lineTo(cx - S * 0.6, cy - S * 0.62); tctx.closePath(); tctx.clip();
  tctx.fillStyle = '#1a1c2a';
  tctx.font = '900 ' + Math.round(S) + 'px "Hiragino Mincho ProN", "Yu Mincho", "Noto Serif CJK JP", "Songti SC", serif';
  tctx.textAlign = 'center'; tctx.textBaseline = 'middle';
  tctx.fillText('鯨', cx, cy);
  // dry-brush speckle: punch paper back through the ink
  tctx.globalCompositeOperation = 'destination-out';
  for (const [x, y, r, a] of SPECK) { tctx.globalAlpha = 0.25 + 0.6 * a; tctx.beginPath(); tctx.arc(cx + x * S, cy + y * S, r * S, 0, Math.PI * 2); tctx.fill(); }
  tctx.restore();
  // seal
  const ks = easeOut(invLerp(0.32, 0.46, k), 3);
  if (ks > 0) {
    const sx = cx + S * 0.47, sy = cy + S * 0.3, ss = S * 0.2 * (1.25 - 0.25 * ks);
    tctx.save(); tctx.globalAlpha = ks; tctx.translate(sx, sy); tctx.rotate(-0.06);
    tctx.fillStyle = '#d33a2c'; tctx.fillRect(-ss / 2, -ss / 2, ss, ss * 1.5);
    tctx.fillStyle = '#fbf8f1'; tctx.font = '700 ' + Math.round(ss * 0.42) + 'px "Hiragino Mincho ProN", serif';
    tctx.textAlign = 'center'; tctx.textBaseline = 'middle';
    ['く', 'じ', 'ら'].forEach((c, i) => tctx.fillText(c, 0, -ss * 0.25 + i * ss * 0.45));
    tctx.restore();
  }
  const kc = smooth(invLerp(0.5, 0.75, k));
  if (kc > 0) {
    tctx.globalAlpha = kc; tctx.fillStyle = '#3a3c4e';
    tctx.font = '500 ' + Math.round(H * 0.022) + 'px "Avenir Next", "Helvetica Neue", sans-serif';
    tctx.textAlign = 'center';
    tctx.fillText('K U J I R A   ·   a five-second short drawn entirely in code', cx, cy + S * 0.78);
    tctx.globalAlpha = 1;
  }
}

function renderFrame(n) {
  const st = stateFor(clamp(n, 0, FRAMES - 1));
  U.uTime.value = st.t; U.uDraw.value = onTwos(st.t);
  const c = st.cam;
  camera.position.set(...c.pos); camera.up.set(0, 1, 0); camera.lookAt(_v.set(...c.look));
  camera.fov = c.fov; camera.aspect = W / H; camera.near = 0.5; camera.far = 9000; camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  env.update(st, camera);
  whale.pose(st.pose);
  const rv = env.seaU.uRing.value;
  boat.update(st, BOAT_AT, deg(-35), { x: rv.x, y: rv.y, z: rv.z, w: rv.w });
  fx.update(st);
  gulls.update(st);
  scene.updateMatrixWorld(true);
  post.render(scene, null, camera, { frame: st.frame, fade: st.fade, flash: st.flash, inkSeed: Math.floor(st.t * 12) % 5 });
  drawTitle(st);
  return st;
}

// ---- player
const ui = { play: document.getElementById('play'), big: document.getElementById('big'), scrub: document.getElementById('scrub'), lbl: document.getElementById('lbl'), loop: document.getElementById('loop') };
ui.scrub.max = FRAMES - 1;
let audioBuf = null, actx = null, src = null, playing = false, t0 = 0, shown = -1;
const soundReady = renderSoundtrack().then((b) => (audioBuf = b)).catch((e) => console.warn('sound', e));
function show(n) { if (n === shown) return; shown = n; renderFrame(n); ui.scrub.value = n; ui.lbl.textContent = (n / FPS).toFixed(2) + ' s'; }
function stopSound() { if (src) { try { src.stop(); } catch (e) {} src = null; } }
async function play() {
  await soundReady;
  if (!actx && audioBuf) actx = new AudioContext();
  if (actx && actx.state === 'suspended') await actx.resume();
  const startT = shown >= FRAMES - 1 ? 0 : Math.max(0, shown) / FPS;
  const now = actx ? actx.currentTime : performance.now() / 1000;
  t0 = now - startT;
  stopSound();
  if (actx && audioBuf) { src = actx.createBufferSource(); src.buffer = audioBuf; src.connect(actx.destination); src.start(0, startT); }
  playing = true; document.body.classList.add('playing'); ui.play.textContent = '❚❚';
}
function pause() { playing = false; stopSound(); document.body.classList.remove('playing'); ui.play.textContent = '▶'; }
function tick() {
  if (playing) {
    const now = actx ? actx.currentTime : performance.now() / 1000;
    let t = now - t0;
    if (t >= DURATION) {
      if (ui.loop.checked) { show(0); playing = false; play(); }
      else { show(FRAMES - 1); pause(); }
    } else show(Math.floor(t * FPS));
  }
  requestAnimationFrame(tick);
}
ui.play.onclick = ui.big.onclick = () => (playing ? pause() : play());
ui.scrub.oninput = () => { pause(); show(+ui.scrub.value); };
addEventListener('keydown', (e) => {
  if (e.key === ' ') { e.preventDefault(); playing ? pause() : play(); }
  if (e.key === 'ArrowRight') { pause(); show(Math.min(FRAMES - 1, shown + 1)); }
  if (e.key === 'ArrowLeft') { pause(); show(Math.max(0, shown - 1)); }
});
const first = P.get('frame') ? +P.get('frame') : P.get('t') ? Math.round(+P.get('t') * FPS) : Math.round(2.6 * FPS);
show(first);
if (P.get('headless') === '1') document.body.classList.add('headless');
window.FILM = { FPS, FRAMES, renderFrame: (n) => { show(n); return true; }, soundReady };
window.FILM_READY = true;
requestAnimationFrame(tick);
