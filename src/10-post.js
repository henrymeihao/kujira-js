// ---- post pipeline: main MRT -> paint (backgrounds) -> ink (cels) -> overlay -> bloom -> grade
class Post {
  constructor(canvas, W, H) {
    this.W = W; this.H = H;
    const r = this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
    r.setPixelRatio(1); r.setSize(W, H, false); r.autoClear = false;
    r.outputColorSpace = THREE.LinearSRGBColorSpace;
    const half = { type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false };
    this.rtMain = new THREE.WebGLRenderTarget(W, H, { count: 2, type: THREE.HalfFloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthTexture: new THREE.DepthTexture(W, H) });
    this.rtMain.textures[0].minFilter = this.rtMain.textures[0].magFilter = THREE.LinearFilter;
    this.rtA = new THREE.WebGLRenderTarget(W, H, { ...half, depthBuffer: true });
    this.rtB = new THREE.WebGLRenderTarget(W, H, half);
    const bw = Math.round(W / 4), bh = Math.round(H / 4);
    this.bl = [0, 1, 2, 3].map((i) => new THREE.WebGLRenderTarget(i < 2 ? bw : bw >> 1, i < 2 ? bh : bh >> 1, half));
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2)); this.quad.frustumCulled = false;
    this.qScene = new THREE.Scene(); this.qScene.add(this.quad);
    this.qCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const res = new THREE.Vector2(W, H), S = H / 1080;
    const fs = (name, u) => shaderMat('quad_vs', name, u, { depthTest: false, depthWrite: false });
    this.mPaint = fs('paint_fs', { tColor: { value: null }, tData: { value: null }, uRes: { value: res }, uRadius: { value: 5 }, uS: { value: S } });
    this.mInk = fs('ink_fs', { tColor: { value: null }, tData: { value: null }, uRes: { value: res }, uS: { value: S }, uWidth: { value: 1.05 }, uSeed: { value: 0 }, uInk: { value: new THREE.Color('#3a2b2a') } });
    this.mBright = fs('bright_fs', { tColor: { value: null }, uThreshold: { value: 1.02 } });
    this.mBlur = fs('blur_fs', { tColor: { value: null }, uDir: { value: new THREE.Vector2() } });
    this.mFinal = fs('final_fs', { tColor: { value: null }, tBloom1: { value: null }, tBloom2: { value: null }, uFrame: { value: 0 }, uBloom: { value: 0.35 },
      uFade: { value: 0 }, uFlash: { value: 0 }, uFadeColor: { value: new THREE.Color('#fbf8f1') } });
  }
  pass(m, target) { this.quad.material = m; this.renderer.setRenderTarget(target); this.renderer.render(this.qScene, this.qCam); }
  render(scene, overlay, cam, o) {
    const r = this.renderer;
    r.setRenderTarget(this.rtMain); r.setClearColor(0x000000, 1); r.clear(true, true, false);
    r.render(scene, cam);
    const p = this.mPaint.uniforms; p.tColor.value = this.rtMain.textures[0]; p.tData.value = this.rtMain.textures[1];
    this.pass(this.mPaint, this.rtB);
    const k = this.mInk.uniforms; k.tColor.value = this.rtB.texture; k.tData.value = this.rtMain.textures[1]; k.uSeed.value = o.inkSeed;
    this.pass(this.mInk, this.rtA);
    // overlay FX (flat drawn shapes) over the inked frame, depth-tested against nothing
    if (overlay) { r.setRenderTarget(this.rtA); r.clearDepth(); r.render(overlay, cam); }
    this.mBright.uniforms.tColor.value = this.rtA.texture;
    this.pass(this.mBright, this.bl[0]);
    const blur = (src, dst, dx, dy) => { this.mBlur.uniforms.tColor.value = src.texture; this.mBlur.uniforms.uDir.value.set(dx / src.width, dy / src.height); this.pass(this.mBlur, dst); };
    const [b0, b1, b2, b3] = this.bl;
    blur(b0, b1, 1, 0); blur(b1, b0, 0, 1); blur(b0, b2, 1, 0); blur(b2, b3, 0, 1); blur(b3, b2, 2, 0); blur(b2, b3, 0, 2);
    const f = this.mFinal.uniforms;
    f.tColor.value = this.rtA.texture; f.tBloom1.value = b0.texture; f.tBloom2.value = b3.texture;
    f.uFrame.value = o.frame; f.uFade.value = o.fade; f.uFlash.value = o.flash;
    r.setRenderTarget(null); r.setViewport(0, 0, this.W, this.H);
    this.quad.material = this.mFinal; r.render(this.qScene, this.qCam);
  }
}
