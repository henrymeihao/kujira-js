// ---- water FX, drawn on threes: curtains, droplets, spray clouds
const GRAV = -9.8 * 1.6;   // a little heavier than real: big things read slow, drops read snappy
function buildFx(scene, whale) {
  const curtains = [];
  const curtain = (id) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 140, 20, true),
      shaderMat('splash_vs', 'splash_fs', { ...U, uShape: { value: new THREE.Vector4() }, uAnim: { value: new THREE.Vector4() }, uId: { value: id } }, { side: THREE.DoubleSide }));
    m.frustumCulled = false; m.visible = false; scene.add(m); curtains.push(m); return m;
  };
  // [start, end, x, z, r0, flare, peak height, seed, lean]
  const CURT = [
    [CUES.breach - 0.05, CUES.breach + 1.5, X0 + 13, Z0, 8, 8, 22, 1.0, -0.4],
    [CUES.breach + 0.1, CUES.breach + 1.9, X0 + 13, Z0, 12, 12, 12, 2.0, 0.2],
    [CRASH_AT.t, CRASH_AT.t + 1.8, CRASH_AT.x, CRASH_AT.z, 18, 22, 34, 3.0, 0.0],
    [CRASH_AT.t + 0.12, CRASH_AT.t + 2.0, CRASH_AT.x - 12, CRASH_AT.z + 5, 6, 10, 70, 4.0, 0.3],
    [CRASH_AT.t + 0.05, CRASH_AT.t + 2.0, CRASH_AT.x + 14, CRASH_AT.z - 2, 5, 9, 60, 5.0, -0.3],
    [CRASH_AT.t + 0.25, CRASH_AT.t + 2.2, CRASH_AT.x, CRASH_AT.z, 30, 24, 14, 6.0, 0.0],
  ];
  CURT.forEach((c, i) => curtain(60 + (i % 3)));
  // droplets: precomputed seeded launches (birth, origin, velocity, size)
  const rng = new Rng(7);
  const drops = [];
  const BREACH_N = 420, CRASH_N = 900, CLOUD_N = 110;
  for (let i = 0; i < BREACH_N; i++) {
    const tb = CUES.breach + rng.range(-0.05, 1.3) * rng.range(0.3, 1), a = rng.range(0, Math.PI * 2), r = rng.range(6, 14);
    const sp = rng.range(10, 30);
    drops.push({ tb, o: [X0 + 13 + Math.cos(a) * r, 0, Z0 + Math.sin(a) * r], v: [Math.cos(a) * sp * 0.35, sp * rng.range(0.9, 1.6), Math.sin(a) * sp * 0.35], s: rng.range(0.12, 0.5), body: rng.next() < 0.35 ? rng.range(0.15, 0.85) : -1 });
  }
  for (let i = 0; i < CRASH_N; i++) {
    const tb = CRASH_AT.t + rng.range(0, 0.6) * rng.next(), a = rng.range(0, Math.PI * 2), r = rng.range(8, 34);
    const sp = rng.range(16, 44);
    drops.push({ tb, o: [CRASH_AT.x + Math.cos(a) * r, 0, CRASH_AT.z + Math.sin(a) * r * 0.6], v: [Math.cos(a) * sp * 0.45, sp * rng.range(0.8, 1.5), Math.sin(a) * sp * 0.45 + 4], s: rng.range(0.15, 0.85), body: -1 });
  }
  const dropGeo = new THREE.IcosahedronGeometry(1, 1);
  const dropMesh = new THREE.InstancedMesh(dropGeo, celMat('#ffffff', 63, { mode: 1 }), drops.length);
  dropMesh.frustumCulled = false; scene.add(dropMesh);
  // spray clouds: big slow cel puffs (no ink) rolling out of the crash
  const clouds = [];
  for (let i = 0; i < CLOUD_N; i++) {
    const a = rng.range(0, Math.PI * 2), r = rng.range(5, 40);
    clouds.push({ tb: CRASH_AT.t + rng.range(0.05, 0.5), o: [CRASH_AT.x + Math.cos(a) * r, rng.range(0, 6), CRASH_AT.z + Math.sin(a) * r * 0.6], v: [Math.cos(a) * rng.range(3, 12), rng.range(6, 22), Math.sin(a) * rng.range(3, 10) + 6], s: rng.range(4, 10) });
  }
  const cloudMesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 4), celMat('#ffffff', 101, { mode: 1 }), CLOUD_N);
  cloudMesh.frustumCulled = false; scene.add(cloudMesh);
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), Sv = new THREE.Vector3(), Pv = new THREE.Vector3(), tmp = new THREE.Vector3();
  const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
  return {
    update(st) {
      const t = onThrees(st.t);
      CURT.forEach((c, i) => {
        const [t0, t1, x, z, r0, fl, hp, seed, lean] = c, m = curtains[i];
        const k = invLerp(t0, t1, t);
        m.visible = t >= t0 && t < t1;
        if (!m.visible) return;
        const h = hp * easeOut(Math.min(1, k * 2.4), 2) * (1 - easeIn(invLerp(0.45, 1, k), 2) * 0.85);
        m.material.uniforms.uShape.value.set(x, z, r0 + k * fl * 0.35, fl * (0.4 + k));
        m.material.uniforms.uAnim.value.set(h, smooth(invLerp(0.2, 1, k)), seed, lean);
      });
      drops.forEach((d, i) => {
        let tau = t - d.tb;
        if (tau < 0 || tau > 2.6) { dropMesh.setMatrixAt(i, ZERO); return; }
        if (d.body >= 0) {
          // water sheeting off the rising whale: launched from the body at the launch time
          whale.spineAt(poseAt(d.tb), d.body, tmp);
          Pv.set(tmp.x + d.v[0] * 0.2, tmp.y + 3, tmp.z + d.v[2] * 0.2).addScaledVector(new THREE.Vector3(d.v[0], 2, d.v[2]), tau * 0.25);
          Pv.y += 0.5 * GRAV * tau * tau;
        } else {
          Pv.set(d.o[0] + d.v[0] * tau, d.o[1] + d.v[1] * tau + 0.5 * GRAV * tau * tau, d.o[2] + d.v[2] * tau);
        }
        const s = d.s * (1 - smooth(invLerp(1.4, 2.6, tau))) * (Pv.y < -1 ? 0 : 1);
        const vy = d.v[1] + GRAV * tau;
        // stretch along the fall a bit: drawn drops are teardrops
        Q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tmp.set(d.v[0], vy, d.v[2]).normalize());
        Sv.set(s, s * (1 + Math.min(1.5, Math.abs(vy) * 0.04)), s);
        M.compose(Pv, Q, Sv); dropMesh.setMatrixAt(i, M);
      });
      dropMesh.instanceMatrix.needsUpdate = true;
      clouds.forEach((c, i) => {
        const tau = t - c.tb;
        if (tau < 0) { cloudMesh.setMatrixAt(i, ZERO); return; }
        const drag = (1 - Math.exp(-tau * 1.4)) / 1.4;
        Pv.set(c.o[0] + c.v[0] * drag, c.o[1] + c.v[1] * drag, c.o[2] + c.v[2] * drag);
        const s = c.s * (0.4 + easeOut(Math.min(1, tau * 1.2))) ;
        Q.identity(); Sv.set(s, s * 0.85, s);
        M.compose(Pv, Q, Sv); cloudMesh.setMatrixAt(i, M);
      });
      cloudMesh.instanceMatrix.needsUpdate = true;
    },
  };
}
