// ---- world: sky dome + sea. The whale breaches at WHALE_AT; the camera looks roughly -Z.
const WHALE_AT = new THREE.Vector2(-8, -70);
const SUN = new THREE.Vector3(-0.42, 0.42, -0.80).normalize();   // ahead-left: glitter path + backlit spray
const KEY = new THREE.Vector3(-0.55, 0.55, 0.62).normalize();    // character key light (anime cheat), front-left
const U = { uKey: { value: KEY }, uShade: { value: new THREE.Color('#a7acd6') }, uSun: { value: SUN },
  uTime: { value: 0 }, uDraw: { value: 0 } };

// same swell as sea_vs.glsl, for things that float
function swellAt(x, z, t, ring) {
  let h = 0.32 * Math.sin(x * 0.050 + z * 0.021 + t * 1.1) + 0.22 * Math.sin(-x * 0.031 + z * 0.067 + t * 1.5)
        + 0.10 * Math.sin(x * 0.13 - z * 0.09 + t * 2.3);
  if (ring && ring.w > 0) {
    const rr = Math.hypot(x - ring.x, z - ring.y);
    h += ring.w * Math.exp(-(((rr - ring.z) / 7) ** 2)) - ring.w * 0.5 * Math.exp(-(((rr - ring.z + 16) / 9) ** 2));
  }
  return h;
}

function buildEnv(scene) {
  const sky = new THREE.Mesh(new THREE.SphereGeometry(4000, 48, 24),
    shaderMat('sky_vs', 'sky_fs', { uSun: U.uSun }, { side: THREE.BackSide, depthWrite: false }));
  sky.renderOrder = -10; sky.frustumCulled = false;
  scene.add(sky);
  // plane on [-1,1]^2, densest at the centre (the vertex shader squares it out to ~2.6 km)
  const g = new THREE.PlaneGeometry(2, 2, 360, 360);
  const seaU = { ...U, uBulge: { value: new THREE.Vector4(WHALE_AT.x, WHALE_AT.y, 20, 0) }, uRing: { value: new THREE.Vector4(WHALE_AT.x, WHALE_AT.y, 0, 0) },
    uCenter: { value: WHALE_AT.clone() }, uFoam: { value: new THREE.Vector4(WHALE_AT.x, WHALE_AT.y, 0, 0) },
    uShadow: { value: new THREE.Vector4(WHALE_AT.x, WHALE_AT.y, 30, 0) }, uShadowDir: { value: new THREE.Vector2(1, 0) } };
  const sea = new THREE.Mesh(g, shaderMat('sea_vs', 'sea_fs', seaU, { side: THREE.DoubleSide }));
  sea.frustumCulled = false;
  scene.add(sea);
  return {
    seaU,
    update(st, cam) {
      sky.position.copy(cam.position);
      const t = st.t, c = CUES;
      // the bulge swells over the rising whale, then the breach and the crash take over
      const bulge = smooth(invLerp(c.bulge, c.breach, t)) * (1 - smooth(invLerp(c.breach, c.breach + 0.25, t)));
      seaU.uBulge.value.set(WHALE_AT.x + 13, WHALE_AT.y, 26, 2.8 * bulge);
      seaU.uShadow.value.set(WHALE_AT.x + 20, WHALE_AT.y, lerp(18, 34, smooth(invLerp(0.0, c.breach, t))), 0.75 * smooth(invLerp(0.15, 1.2, t)) * (1 - smooth(invLerp(c.breach, c.breach + 0.3, t))));
      seaU.uShadowDir.value.set(0.94, 0.34).normalize();
      // white water: boiling during the breach, a big crater at the crash
      const fb = smooth(invLerp(c.bulge + 0.3, c.breach, t)) * (1 - 0.5 * smooth(invLerp(c.apex, c.crash, t)));
      const fc = t > c.crash ? 1 : 0;
      seaU.uFoam.value.set(t > c.crash ? CRASH_AT.x : WHALE_AT.x + 13, t > c.crash ? CRASH_AT.z : WHALE_AT.y, Math.max(lerp(8, 26, smooth(invLerp(c.bulge + 0.3, c.breach + 0.6, t))) * (fc ? 0 : 1), fc * lerp(30, 48, smooth(invLerp(c.crash, c.end, t)))), Math.max(fb, fc));
      const rk = t - c.crash;
      if (rk > 0) seaU.uRing.value.set(CRASH_AT.x, CRASH_AT.z, 30 + rk * 34, 3.2 * Math.exp(-rk * 0.5));
      else seaU.uRing.value.set(0, 0, 0, 0);
    },
  };
}
