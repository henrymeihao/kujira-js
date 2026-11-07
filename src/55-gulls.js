// ---- gulls: gliding over the sea, scattering when the whale comes up. Wings flap on twos.
function buildGulls(scene) {
  const rng = new Rng(31), N = 7;
  const birds = [];
  const white = celMat('#fbfaf5', 70, { gloss: 0 }), tip = celMat('#3b3f4a', 71, { gloss: 0 });
  for (let i = 0; i < N; i++) {
    const root = new THREE.Group(); scene.add(root);
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.42, 4, 8), white); body.rotation.x = Math.PI / 2; root.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), white); head.position.set(0, 0.04, -0.33); root.add(head);
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.12, 6), celMat('#f2b33d', 72)); beak.rotation.x = -Math.PI / 2; beak.position.set(0, 0.03, -0.46); root.add(beak);
    // each wing: an inner and an outer panel, hinged at the shoulder and the wrist
    const wings = [-1, 1].map((s) => {
      const sh = new THREE.Group(); sh.position.set(s * 0.08, 0.04, -0.05); root.add(sh);
      const inner = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.025, 0.24), white); inner.position.x = s * 0.25; sh.add(inner);
      const wr = new THREE.Group(); wr.position.x = s * 0.5; sh.add(wr);
      const outer = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.02, 0.17), white); outer.position.set(s * 0.23, 0, 0.03); wr.add(outer);
      const end = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.021, 0.15), tip); end.position.set(s * 0.4, 0.001, 0.04); wr.add(end);
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
