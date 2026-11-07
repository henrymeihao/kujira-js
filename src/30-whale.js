// ---- the whale: a bent, rolled tube with flippers and flukes, rebuilt on the CPU every drawing
const W_L = 58, W_R = 8.2, W_NS = 110, W_NR = 36;
const W_PROFILE = [[0, 0.04], [0.03, 0.36], [0.1, 0.68], [0.24, 1.0], [0.42, 0.94], [0.62, 0.62], [0.8, 0.3], [0.93, 0.13], [1, 0.07]];
function profile(u) { for (let i = 1; i < W_PROFILE.length; i++) if (u <= W_PROFILE[i][0]) { const [a, ra] = W_PROFILE[i - 1], [b, rb] = W_PROFILE[i]; return lerp(ra, rb, smooth((u - a) / (b - a))); } return 0.07; }

function gridGeometry(ns, nr, closed) {
  const g = new THREE.BufferGeometry();
  const pos = new Float32Array(ns * nr * 3), uv = new Float32Array(ns * nr * 2), idx = [];
  for (let i = 0; i < ns; i++) for (let j = 0; j < nr; j++) {
    uv[(i * nr + j) * 2] = i / (ns - 1); uv[(i * nr + j) * 2 + 1] = (j / (closed ? nr : nr - 1)) * 2 - 1;
  }
  const jm = closed ? nr : nr - 1;
  for (let i = 0; i < ns - 1; i++) for (let j = 0; j < jm; j++) {
    const a = i * nr + j, b = i * nr + ((j + 1) % nr), c = a + nr, d = b + nr;
    idx.push(a, c, b, b, c, d);
  }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aUV', new THREE.BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

function buildWhale(scene) {
  const root = new THREE.Group(); scene.add(root);
  const mk = (part, id, ns, nr) => {
    const m = new THREE.Mesh(gridGeometry(ns, nr, true), shaderMat('whale_vs', 'whale_fs', { ...U, uPart: { value: part }, uId: { value: id }, uWet: { value: 1 } }, { side: THREE.DoubleSide }));
    m.frustumCulled = false; m.userData.nr = nr; root.add(m); return m;
  };
  const body = mk(0, 1, W_NS, W_NR);
  const fins = [mk(1, 2, 26, 14), mk(1, 2, 26, 14)];
  const flukes = [mk(2, 3, 22, 12), mk(2, 3, 22, 12)];
  const P = new THREE.Vector3(), T = new THREE.Vector3(), N = new THREE.Vector3(), B = new THREE.Vector3();
  const f = new THREE.Vector3(), n = new THREE.Vector3(), tmp = new THREE.Vector3();
  const q = new THREE.Quaternion(), eul = new THREE.Euler();
  function setDir(pose) {
    q.setFromEuler(eul.set(pose.pitch, pose.yaw, pose.roll, 'YXZ'));
    f.set(0, 0, -1).applyQuaternion(q); n.set(0, 1, 0).applyQuaternion(q);
  }
  // spine frame at body fraction u
  function frame(pose, u) {
    const s = u * W_L, k = pose.bend / W_L, a = k * s;
    if (Math.abs(k) < 1e-5) P.copy(pose.head).addScaledVector(f, -s);
    else P.copy(pose.head).addScaledVector(f, -Math.sin(a) / k).addScaledVector(n, (1 - Math.cos(a)) / k);
    T.copy(f).multiplyScalar(Math.cos(a)).addScaledVector(n, -Math.sin(a));
    N.copy(n).multiplyScalar(Math.cos(a)).addScaledVector(f, Math.sin(a));
    const wv = pose.stroke * Math.sin(Math.PI * 2 * (u * 0.7 - pose.phase)) * u * u * u * 5;
    P.addScaledVector(N, wv);
    B.crossVectors(T, N).normalize();
  }
  // flat tapered limb from root along dir, chord along cdir, thickness along tdir
  function limb(mesh, root0, dir, cdir, tdir, len, chordAt, thickAt, sweep) {
    const g = mesh.geometry, pa = g.attributes.position.array;
    const nr = mesh.userData.nr, nsg = g.attributes.aUV.count / nr;
    for (let i = 0; i < nsg; i++) {
      const v = i / (nsg - 1), c = chordAt(v), th = thickAt(v);
      for (let j = 0; j < nr; j++) {
        const ph = (j / nr) * Math.PI * 2;
        const x = Math.cos(ph) * c * 0.5 - c * 0.15, y = Math.sin(ph) * th * (0.6 + 0.4 * Math.cos(ph));
        tmp.copy(root0).addScaledVector(dir, v * len).addScaledVector(cdir, x + sweep(v)).addScaledVector(tdir, y);
        pa.set([tmp.x, tmp.y, tmp.z], (i * nr + j) * 3);
      }
    }
    g.attributes.position.needsUpdate = true; g.computeVertexNormals();
  }
  const d = new THREE.Vector3(), cd = new THREE.Vector3(), td = new THREE.Vector3(), r0 = new THREE.Vector3();
  return {
    root,
    // pose: { head: Vector3, pitch, yaw, roll (rad), bend, stroke, phase, flap }
    pose(pose) {
      setDir(pose);
      const pa = body.geometry.attributes.position.array;
      for (let i = 0; i < W_NS; i++) {
        const u = i / (W_NS - 1); frame(pose, u);
        const r = profile(u) * W_R;
        for (let j = 0; j < W_NR; j++) {
          const th = (j / W_NR) * Math.PI * 2 - Math.PI, c = Math.cos(th), s = Math.sin(th);
          const top = u < 0.2 ? lerp(0.62, 0.86, u / 0.2) : 0.86;
          const groove = s < 0 && u < 0.45 ? 1.0 + 0.04 * Math.sin(th * 18) * (1 - u / 0.45) : 1;
          const ry = s > 0 ? r * top : r * 0.8 * groove;
          const ridge = s > 0.97 && u > 0.55 && u < 0.85 ? r * 0.25 * (s - 0.97) / 0.03 * Math.sin((u - 0.55) / 0.3 * Math.PI) : 0;
          tmp.copy(P).addScaledVector(B, c * r * 1.04 * groove).addScaledVector(N, s * ry + ridge);
          pa.set([tmp.x, tmp.y, tmp.z], (i * W_NR + j) * 3);
        }
      }
      body.geometry.attributes.position.needsUpdate = true; body.geometry.computeVertexNormals();
      // pectoral flippers (humpback: a third of the body, knobbed leading edge)
      frame(pose, 0.25);
      const rr = profile(0.25) * W_R;
      for (const side of [1, -1]) {
        const sp = side > 0 ? pose.flap : pose.flap * 0.8 + 0.1;
        r0.copy(P).addScaledVector(B, side * rr * 0.92).addScaledVector(N, -rr * 0.35);
        d.copy(B).multiplyScalar(side * Math.cos(sp)).addScaledVector(T, -0.55).addScaledVector(N, -Math.sin(sp) * 0.9).normalize();
        cd.copy(T).addScaledVector(d, -T.dot(d)).normalize().negate();
        td.crossVectors(d, cd).normalize().multiplyScalar(side);
        limb(fins[side > 0 ? 0 : 1], r0, d, cd, td, W_L * 0.32, (v) => 3.4 * Math.pow(1 - v, 0.55) * (0.55 + 0.45 * Math.sin(Math.min(1, v * 4) * 1.57)) + 0.25 * Math.max(0, Math.sin(v * 46)) * (1 - v),
          (v) => 0.55 * (1 - v) + 0.12, (v) => -v * v * 1.5);
      }
      // flukes at the tail stock
      frame(pose, 0.985);
      for (const side of [1, -1]) {
        r0.copy(P);
        d.copy(B).multiplyScalar(side).addScaledVector(T, -0.5).normalize();
        cd.copy(T).addScaledVector(d, -T.dot(d)).normalize().negate();
        td.copy(N);
        limb(flukes[side > 0 ? 0 : 1], r0, d, cd, td, 9.5, (v) => 4.2 * Math.pow(1 - v * v, 0.8) * (0.5 + 0.5 * Math.min(1, v * 5)) + 0.2, (v) => 0.5 * (1 - v) + 0.08, (v) => v * v * 2.2);
      }
    },
    // world point on the spine at body fraction u (uses the last pose)
    spineAt(pose, u, out) { setDir(pose); frame(pose, u); return out.copy(P); },
  };
}
