// ---- a small fishing boat in the foreground, for scale
const celMat = (color, id, extra = {}) => shaderMat('cel_vs', 'cel_fs', { ...U, uColor: { value: new THREE.Color(color) }, uId: { value: id }, uGloss: { value: extra.gloss ?? 0.6 }, uMode: { value: extra.mode ?? 0 } }, { side: THREE.DoubleSide });
function buildBoat(scene) {
  const root = new THREE.Group(); scene.add(root);
  const hull = new THREE.Shape();
  hull.moveTo(-5.5, -1.6); hull.lineTo(2.2, -1.7); hull.quadraticCurveTo(5.0, -1.4, 6.2, 0); hull.quadraticCurveTo(5.0, 1.4, 2.2, 1.7); hull.lineTo(-5.5, 1.6); hull.lineTo(-5.5, -1.6);
  const ex = (shape, depth, bevel) => { const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 16 }); g.rotateX(-Math.PI / 2); return g; };
  const add = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); root.add(m); return m; };
  add(ex(hull, 1.1, 0.08), celMat('#d8423a', 10), 0, -0.9, 0);
  const upper = add(ex(hull, 0.75, 0.06), celMat('#f6f4ef', 11), 0, 0.2, 0); upper.scale.set(1.0, 1, 1.04);
  add(new THREE.BoxGeometry(11.4, 0.18, 3.5), celMat('#2b4a8a', 16), 0.3, 1.0, 0).scale.set(1, 1, 1);
  add(new THREE.BoxGeometry(3.0, 2.0, 2.4), celMat('#f7f6f2', 12), -2.2, 2.1, 0);
  add(new THREE.BoxGeometry(3.06, 0.55, 2.46), celMat('#203050', 15, { gloss: 1.5 }), -2.2, 2.45, 0);
  add(new THREE.BoxGeometry(3.4, 0.25, 2.8), celMat('#2f6fc4', 13), -2.2, 3.2, 0);
  add(new THREE.CylinderGeometry(0.09, 0.12, 6.0, 8), celMat('#e8e6df', 14), -2.6, 5.2, 0);
  add(new THREE.CylinderGeometry(0.06, 0.06, 2.4, 6), celMat('#e8e6df', 17), -2.6, 6.4, 0).rotation.x = Math.PI / 2;
  const flag = add(new THREE.PlaneGeometry(1.2, 0.7, 6, 2), celMat('#ff8a1e', 18), -3.25, 7.8, 0);
  add(new THREE.BoxGeometry(1.2, 0.8, 1.0), celMat('#f0c237', 19), 2.6, 1.5, 0.6);
  add(new THREE.CylinderGeometry(0.35, 0.35, 0.3, 14), celMat('#ff6a3a', 20), 1.2, 1.3, -1.1).rotation.x = Math.PI / 2;
  return {
    root,
    update(st, at, heading, ring) {
      const t = onTwos(st.t);
      const y = swellAt(at.x, at.y, t, ring);
      const dx = swellAt(at.x + 3, at.y, t, ring) - swellAt(at.x - 3, at.y, t, ring);
      const dz = swellAt(at.x, at.y + 3, t, ring) - swellAt(at.x, at.y - 3, t, ring);
      root.position.set(at.x, y + 0.15, at.y);
      root.rotation.set(Math.atan(dz / 6) * 0.8 + noise1(t * 1.3, 3) * 0.02, heading, -Math.atan(dx / 6) * 0.8 + noise1(t * 1.1, 5) * 0.03, 'YXZ');
      const fp = flag.geometry.attributes.position;
      for (let i = 0; i < fp.count; i++) { const x = (i % 7) / 6; fp.setZ(i, Math.sin(x * 4 - t * 9) * 0.15 * x); }
      fp.needsUpdate = true;
    },
  };
}
