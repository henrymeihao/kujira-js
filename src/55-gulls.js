// ---- gulls: gliding over the sea, scattering when the whale comes up. Wings flap on twos.
function buildGulls(scene) {
  const rng = new Rng(31), N = 7;
  const birds = [];
  const white = celMat('#fbfaf5', 70, { gloss: 0 }), tip = celMat('#3b3f4a', 71, { gloss: 0 });
  const grey = celMat('#c9ced8', 73, { gloss: 0 });
  // planforms in (span, chord) with chord running back along +z; extruded thin and laid flat
  const plan = (pts, depth) => {
    const s = new THREE.Shape(); s.moveTo(...pts[0]);
    for (let i = 1; i < pts.length; i++) pts[i].length === 4 ? s.quadraticCurveTo(...pts[i]) : s.lineTo(...pts[i]);
    const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 8 });
    g.translate(0, 0, -depth / 2); g.rotateX(Math.PI / 2); return g;
  };
  const mirror = (g) => { const m = g.clone(); m.scale(-1, 1, 1); return m; };
  // inner wing: broad, a rounded trailing edge; outer wing: swept back to a pointed hand, black at the tip
  const innerG = plan([[0, -0.13], [0.5, -0.11], [0.5, 0.1], [0.25, 0.16, 0, 0.13]], 0.025);
  const outerG = plan([[0, -0.11], [0.28, -0.09, 0.55, 0.13], [0.3, 0.12], [0, 0.1]], 0.02);
  const tipG = plan([[0.3, -0.05], [0.42, -0.02, 0.555, 0.135], [0.3, 0.125]], 0.026);
  const tailG = plan([[-0.06, 0], [0.06, 0], [0.1, 0.2, 0, 0.22], [-0.1, 0.2, -0.06, 0]], 0.02);
  const bodyG = new THREE.SphereGeometry(0.12, 14, 10); bodyG.scale(0.9, 0.85, 2.3);
  for (let i = 0; i < N; i++) {
    const root = new THREE.Group(); scene.add(root);
    const body = new THREE.Mesh(bodyG, white); root.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.095, 12, 10), white); head.position.set(0, 0.06, -0.3); root.add(head);
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.13, 8), celMat('#f2b33d', 72)); beak.rotation.x = -Math.PI / 2; beak.position.set(0, 0.04, -0.43); root.add(beak);
    const tail = new THREE.Mesh(tailG, white); tail.position.set(0, 0.0, 0.2); root.add(tail);
    // each wing: an inner and an outer panel, hinged at the shoulder and the wrist
    const wings = [-1, 1].map((s) => {
      const sh = new THREE.Group(); sh.position.set(s * 0.08, 0.04, -0.05); root.add(sh);
      const pick = (g) => (s > 0 ? g : mirror(g));
      const inner = new THREE.Mesh(pick(innerG), grey); sh.add(inner);
      const wr = new THREE.Group(); wr.position.x = s * 0.5; sh.add(wr);
      const outer = new THREE.Mesh(pick(outerG), grey); wr.add(outer);
      const end = new THREE.Mesh(pick(tipG), tip); end.position.y = 0.001; wr.add(end);
      return { s, sh, wr };
    });
    root.scale.setScalar(1.6);
    birds.push({ root, wings, a0: rng.range(0, Math.PI * 2), r: rng.range(8, 16), w: rng.range(0.25, 0.4) * (rng.next() < 0.5 ? -1 : 1),
      h: rng.range(9, 17), cx: rng.range(-4, 14), cz: rng.range(-40, -22), ph: rng.next(), flee: new THREE.Vector3(rng.range(-1, 1), rng.range(0.4, 0.9), rng.range(0.2, 1)).normalize() });
  }
  const P = new THREE.Vector3(), Q = new THREE.Vector3();
  const place = (b, t, out) => {
    const a = b.a0 + b.w * t;
    out.set(b.cx + Math.cos(a) * b.r, b.h + Math.sin(t * 1.3 + b.ph * 6) * 0.6, b.cz + Math.sin(a) * b.r * 0.6);
    const run = Math.max(0, t - (CUES.breach - 0.1));
    return out.addScaledVector(b.flee, run * run * 9 + run * 6);
  };
  return {
    update(st) {
      const t = onTwos(st.t);
      for (const b of birds) {
        place(b, t, P); place(b, t + 0.05, Q);
        b.root.position.copy(P);
        b.root.lookAt(Q.sub(P).negate().add(P));   // Object3D.lookAt aims +Z; the model looks down -Z, so aim behind
        const alarm = smooth(invLerp(CUES.breach - 0.2, CUES.breach + 0.3, t));
        const glide = Math.sin(t * 0.7 + b.ph * 6) > 0.3 && alarm < 0.5;
        const beat = glide ? 0.12 : Math.sin(t * (6 + 5 * alarm) * Math.PI + b.ph * 6);
        for (const w of b.wings) { w.sh.rotation.z = w.s * (0.15 + 0.55 * beat); w.wr.rotation.z = w.s * (-0.25 - 0.35 * beat); }
        b.root.visible = P.y < 120;
      }
    },
  };
}
