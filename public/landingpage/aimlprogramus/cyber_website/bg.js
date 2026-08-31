/* =============================================================
   ONROL — hero background.

   A GPU particle organism rendered with a small custom pipeline:

     fog quad  ─┐
                ├─► rtScene ─► bright-pass ─► blur H ─► blur V ─┐
     particles ─┘                                  ▲            │
                                                   └── 2 iters ─┘
                                                                │
                                    composite (scene + bloom) ──┴─► screen

   • vertex shader: 3D simplex noise, curl-style tangential flow,
     periodic dissolve/reform burst
   • fragment shader: depth + light driven green ramp
   • post: threshold bright-pass, separable gaussian, additive composite

   Requires lib/three.min.js loaded before this file.
   ============================================================= */
(() => {
  const canvas = document.getElementById('scene');
  if (!canvas || typeof THREE === 'undefined') return;

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = innerWidth < 800;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas, alpha: true, antialias: false, powerPreference: 'high-performance'
    });
  } catch (e) { return; }                       // no WebGL → CSS fog stays
  if (!renderer.getContext()) return;

  const PR = Math.min(devicePixelRatio || 1, mobile ? 1.5 : 2);
  renderer.setPixelRatio(PR);
  renderer.setSize(innerWidth, innerHeight);
  renderer.autoClear = false;
  renderer.setClearColor(0x000000, 0);

  // WebGL owns the hero backdrop now — retire the CSS fallback fog.
  const cssFog = document.getElementById('fog');
  if (cssFog) cssFog.style.display = 'none';

  const COUNT = mobile ? 40000 : 140000;
  const DUST  = mobile ? 1200 : 4000;

  /* ================= shared GLSL ================= */
  const SIMPLEX = `
  vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
  float snoise(vec3 v){
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
               i.z + vec4(0.0, i1.z, i2.z, 1.0))
             + i.y + vec4(0.0, i1.y, i2.y, 1.0))
             + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
  float fbm(vec3 p){
    float f = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++){ f += a * snoise(p); p *= 2.02; a *= 0.5; }
    return f;
  }`;

  const QUAD_VERT = `
  varying vec2 vUv;
  void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

  /* ================= animated volumetric fog ================= */
  const fogMat = new THREE.ShaderMaterial({
    vertexShader: QUAD_VERT,
    fragmentShader: SIMPLEX + `
    precision highp float;
    varying vec2 vUv;
    uniform float uTime, uProgress, uAspect;
    uniform vec2  uMouse;

    void main(){
      vec2 uv = vUv;
      vec2 c  = vec2(0.47 + uMouse.x * 0.02, 0.47 - uMouse.y * 0.02);
      vec2 d  = (uv - c) * vec2(uAspect, 1.0);
      float r = length(d);

      // slow drifting density so the medium itself breathes
      float n = fbm(vec3(uv * 3.0, uTime * 0.05)) * 0.5 + 0.5;

      // core glow -> mid -> deep edge
      float core = smoothstep(0.58, 0.0, r) * (0.42 + n * 0.34);
      // deep iris edge -> teal mid -> aurora core
      vec3 col = mix(vec3(0.030, 0.016, 0.062),
                     vec3(0.020, 0.140, 0.140),
                     smoothstep(0.85, 0.05, r));
      col += vec3(0.060, 0.300, 0.265) * core * (0.5 + uProgress * 0.45);

      // light shafts raking down from above
      float sh = 0.0;
      for (int i = 0; i < 3; i++){
        float fi = float(i);
        float ang = (uv.x - 0.42 + fi * 0.11) / max(uv.y + 0.30, 0.05);
        float band = smoothstep(0.16, 0.0, abs(ang - 0.05 - fi * 0.16));
        sh += band * smoothstep(1.15, 0.05, uv.y);
      }
      sh *= 0.055 * (0.6 + fbm(vec3(uv * 2.0, uTime * 0.09)) * 0.7);
      col += vec3(0.45, 1.0, 0.92) * sh;

      // grain keeps the gradient from banding
      float grain = fract(sin(dot(uv * 1024.0, vec2(12.9898, 78.233))) * 43758.5453);
      col += (grain - 0.5) * 0.014;

      col *= smoothstep(1.30, 0.20, r);              // vignette
      gl_FragColor = vec4(col, 1.0);
    }`,
    uniforms: {
      uTime:     { value: 0 },
      uProgress: { value: 0 },
      uAspect:   { value: innerWidth / innerHeight },
      uMouse:    { value: new THREE.Vector2() }
    },
    depthTest: false, depthWrite: false
  });

  /* ================= particle organism ================= */
  const positions = new Float32Array(COUNT * 3);
  const seeds     = new Float32Array(COUNT);
  const GA = Math.PI * (3 - Math.sqrt(5));
  let sd = 987654321;
  const rnd = () => ((sd = (sd * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);

  for (let i = 0; i < COUNT; i++){
    const y  = 1 - (i / (COUNT - 1)) * 2;
    const r  = Math.sqrt(Math.max(0, 1 - y * y));
    const th = GA * i;
    const rad = 0.80 + Math.pow(rnd(), 0.55) * 0.28;   // shell thickness
    positions[i * 3]     = Math.cos(th) * r * rad;
    positions[i * 3 + 1] = y * rad;
    positions[i * 3 + 2] = Math.sin(th) * r * rad;
    seeds[i] = rnd();
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('aSeed',    new THREE.BufferAttribute(seeds, 1));

  const mat = new THREE.ShaderMaterial({
    vertexShader: SIMPLEX + `
    attribute float aSeed;
    uniform float uTime, uSize, uProgress, uPixelRatio, uBurst;
    varying float vLit, vSeed, vDepth, vEdge;

    void main(){
      vec3 p = position;
      vec3 n = normalize(position);

      // --- surface displacement: two octaves flowing through time ---
      float n1 = snoise(p * 1.45 + vec3(uTime * 0.26, 0.0, -uTime * 0.18));
      float n2 = snoise(p * 3.70 + vec3(-uTime * 0.14, uTime * 0.21, 0.0));
      p *= 1.0 + n1 * 0.29 + n2 * 0.12;

      // --- curl-style tangential flow: churns like a fluid ---
      vec3 f = vec3(
        snoise(p * 1.15 + vec3(uTime * 0.19,  0.0,   0.0)),
        snoise(p * 1.15 + vec3(31.4, uTime * 0.16,   0.0)),
        snoise(p * 1.15 + vec3(78.2,  0.0,  -uTime * 0.13))
      );
      p += cross(n, f) * 0.19;

      // --- filaments peeling off the surface ---
      p += n * pow(max(n1, 0.0), 4.0) * aSeed * 0.46;

      // --- periodic dissolve / reform, as in the reference ---
      p += n * uBurst * (0.12 + aSeed * 0.92);

      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_Position = projectionMatrix * mv;

      vLit   = n1 * 0.5 + 0.5;
      vSeed  = aSeed;
      vDepth = clamp((3.6 + mv.z) / 2.4, 0.0, 1.0);
      vEdge  = 1.0 - abs(dot(n, vec3(0.0, 0.0, 1.0)));   // rim brightening

      float size = uSize * (0.42 + aSeed * 0.95) * (1.0 + uProgress * 1.35);
      gl_PointSize = size * uPixelRatio * (1.0 / -mv.z);
    }`,
    fragmentShader: `
    // must match the vertex stage's default highp, or uBurst fails to link
    precision highp float;
    uniform float uOpacity, uBurst;
    varying float vLit, vSeed, vDepth, vEdge;

    void main(){
      vec2 d = gl_PointCoord - 0.5;
      float r = dot(d, d);
      if (r > 0.25) discard;
      float falloff = pow(1.0 - r * 4.0, 1.7);

      vec3 dark = vec3(0.055, 0.070, 0.230);   // iris violet, deep in the volume
      vec3 mid  = vec3(0.070, 0.720, 0.640);   // aurora cyan
      vec3 hot  = vec3(0.640, 1.000, 0.880);   // near-white rim

      float k = clamp(vLit * 0.60 + vDepth * 0.52 + vEdge * 0.18, 0.0, 1.0);
      vec3 col = mix(dark, mid, smoothstep(0.0, 0.60, k));
      col = mix(col, hot, smoothstep(0.66, 1.0, k) * (0.32 + vSeed * 0.68));

      // scattering particles cool off as they fly out
      col = mix(col, vec3(0.30, 0.26, 0.72), uBurst * 0.55 * vSeed);

      float a = falloff * (0.17 + vDepth * 0.80) * uOpacity * (1.0 - uBurst * 0.28);
      gl_FragColor = vec4(col, a);
    }`,
    transparent: true, depthWrite: false, depthTest: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 }, uSize: { value: mobile ? 7.0 : 8.5 },
      uProgress: { value: 0 }, uOpacity: { value: 1 },
      uBurst: { value: 0 }, uPixelRatio: { value: PR }
    }
  });

  /* ================= ambient dust ================= */
  const dpos = new Float32Array(DUST * 3);
  const dsd  = new Float32Array(DUST);
  for (let i = 0; i < DUST; i++){
    dpos[i * 3]     = (rnd() - 0.5) * 11;
    dpos[i * 3 + 1] = (rnd() - 0.5) * 7;
    dpos[i * 3 + 2] = (rnd() - 0.5) * 6 - 1;
    dsd[i] = rnd();
  }
  const dgeo = new THREE.BufferGeometry();
  dgeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
  dgeo.setAttribute('aSeed',    new THREE.BufferAttribute(dsd, 1));

  const dmat = new THREE.ShaderMaterial({
    vertexShader: `
    attribute float aSeed;
    uniform float uTime, uPixelRatio, uProgress;
    varying float vA;
    void main(){
      vec3 p = position;
      p.y += sin(uTime * (0.10 + aSeed * 0.18) + aSeed * 34.0) * 0.55;
      p.x += cos(uTime * (0.07 + aSeed * 0.13) + aSeed * 17.0) * 0.45;
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_Position = projectionMatrix * mv;
      vA = (0.16 + aSeed * 0.5) * (1.0 - uProgress * 0.6);
      gl_PointSize = (0.9 + aSeed * 2.1) * uPixelRatio * (1.0 / -mv.z) * 2.4;
    }`,
    fragmentShader: `
    precision mediump float;
    uniform float uOpacity;
    varying float vA;
    void main(){
      vec2 d = gl_PointCoord - 0.5;
      float r = dot(d, d);
      if (r > 0.25) discard;
      float f = pow(1.0 - r * 4.0, 2.0);
      gl_FragColor = vec4(vec3(0.55, 1.0, 0.94), f * vA * uOpacity);
    }`,
    transparent: true, depthWrite: false, depthTest: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uPixelRatio: { value: PR },
                uProgress: { value: 0 }, uOpacity: { value: 1 } }
  });

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100);
  camera.position.z = 3.25;
  const cloud = new THREE.Points(geo, mat);
  const dust  = new THREE.Points(dgeo, dmat);
  scene.add(cloud); scene.add(dust);

  /* ================= post-processing chain ================= */
  const quadScene = new THREE.Scene();
  const quadCam   = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quad      = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), fogMat);
  quadScene.add(quad);

  const rtOpts = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
                   depthBuffer: false, stencilBuffer: false };
  let rtScene, rtA, rtB;

  const brightMat = new THREE.ShaderMaterial({
    vertexShader: QUAD_VERT,
    fragmentShader: `
    precision mediump float;
    varying vec2 vUv;
    uniform sampler2D tDiffuse;
    uniform float uThreshold;
    void main(){
      vec4 c = texture2D(tDiffuse, vUv);
      float l = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));
      gl_FragColor = vec4(c.rgb * smoothstep(uThreshold, uThreshold + 0.35, l), 1.0);
    }`,
    uniforms: { tDiffuse: { value: null }, uThreshold: { value: 0.30 } },
    depthTest: false, depthWrite: false
  });

  const blurMat = new THREE.ShaderMaterial({
    vertexShader: QUAD_VERT,
    fragmentShader: `
    precision mediump float;
    varying vec2 vUv;
    uniform sampler2D tDiffuse;
    uniform vec2 uDir;
    void main(){
      // 9-tap gaussian
      vec4 s = texture2D(tDiffuse, vUv) * 0.2270270270;
      s += texture2D(tDiffuse, vUv + uDir * 1.3846153846) * 0.3162162162;
      s += texture2D(tDiffuse, vUv - uDir * 1.3846153846) * 0.3162162162;
      s += texture2D(tDiffuse, vUv + uDir * 3.2307692308) * 0.0702702703;
      s += texture2D(tDiffuse, vUv - uDir * 3.2307692308) * 0.0702702703;
      gl_FragColor = s;
    }`,
    uniforms: { tDiffuse: { value: null }, uDir: { value: new THREE.Vector2() } },
    depthTest: false, depthWrite: false
  });

  const compMat = new THREE.ShaderMaterial({
    vertexShader: QUAD_VERT,
    fragmentShader: `
    precision mediump float;
    varying vec2 vUv;
    uniform sampler2D tScene, tBloom;
    uniform float uStrength, uOpacity;
    void main(){
      vec3 base  = texture2D(tScene, vUv).rgb;
      vec3 bloom = texture2D(tBloom, vUv).rgb;
      vec3 col = base + bloom * uStrength;
      col = col / (col + vec3(1.85));            // gentle highlight rolloff
      col *= 1.85;
      col = pow(col, vec3(0.94));
      gl_FragColor = vec4(col, uOpacity);
    }`,
    uniforms: { tScene: { value: null }, tBloom: { value: null },
                uStrength: { value: 1.15 }, uOpacity: { value: 1 } },
    transparent: true, depthTest: false, depthWrite: false
  });

  function makeTargets(){
    const w = Math.max(1, Math.round(innerWidth  * PR));
    const h = Math.max(1, Math.round(innerHeight * PR));
    const bw = Math.max(1, Math.round(w / 2)), bh = Math.max(1, Math.round(h / 2));
    [rtScene, rtA, rtB].forEach(rt => rt && rt.dispose());
    rtScene = new THREE.WebGLRenderTarget(w, h, rtOpts);
    rtA = new THREE.WebGLRenderTarget(bw, bh, rtOpts);
    rtB = new THREE.WebGLRenderTarget(bw, bh, rtOpts);
  }
  makeTargets();

  function blit(material, target){
    quad.material = material;
    renderer.setRenderTarget(target);
    renderer.render(quadScene, quadCam);
  }

  /* ================= interaction ================= */
  let tx = 0, ty = 0, mx = 0, my = 0, scrollY = window.scrollY || 0;
  addEventListener('pointermove', e => {
    tx = e.clientX / innerWidth - 0.5;
    ty = e.clientY / innerHeight - 0.5;
  });
  addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });
  addEventListener('resize', () => {
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    fogMat.uniforms.uAspect.value = innerWidth / innerHeight;
    makeTargets();
  });

  const plateEl = document.getElementById('plate');
  const clock = new THREE.Clock();
  let paused = false;
  document.addEventListener('visibilitychange', () => { paused = document.hidden; });

  function tick(){
    requestAnimationFrame(tick);
    if (paused) return;

    const t = reduce ? 0 : clock.getElapsedTime();
    mx += (tx - mx) * 0.045;
    my += (ty - my) * 0.045;

    const progress = Math.min(1, scrollY / innerHeight);
    const exit = Math.max(0, Math.min(1, (scrollY - innerHeight * 0.55) / (innerHeight * 0.5)));

    if (plateEl) plateEl.style.opacity = String(exit * 0.97);
    canvas.style.opacity = String(1 - exit);
    if (exit >= 1) return;                       // hero off-screen: stop drawing

    // brief dissolve → reform, once every 22s; intact the rest of the time
    const phase = (t / 22) % 1;
    const burst = reduce ? 0 :
      0.62 * smooth(0.40, 0.50, phase) * (1 - smooth(0.52, 0.72, phase));

    mat.uniforms.uTime.value      = t;
    mat.uniforms.uProgress.value  = progress;
    mat.uniforms.uBurst.value     = burst;
    dmat.uniforms.uTime.value     = t;
    dmat.uniforms.uProgress.value = progress;
    fogMat.uniforms.uTime.value     = t;
    fogMat.uniforms.uProgress.value = progress;
    fogMat.uniforms.uMouse.value.set(mx, my);

    camera.position.z = 3.25 - progress * 1.55;
    camera.position.x = mx * 0.42;
    camera.position.y = -my * 0.30;
    camera.lookAt(0, 0, 0);

    cloud.rotation.y = t * 0.10 + mx * 0.30;
    cloud.rotation.x = Math.sin(t * 0.16) * 0.12 - my * 0.20;

    // 1 · fog + particles into the scene target
    renderer.setRenderTarget(rtScene);
    renderer.clear();
    quad.material = fogMat;
    renderer.render(quadScene, quadCam);
    renderer.render(scene, camera);

    // 2 · bright-pass, then two separable blur iterations
    brightMat.uniforms.tDiffuse.value = rtScene.texture;
    blit(brightMat, rtA);
    const bw = rtA.width, bh = rtA.height;
    for (let i = 0; i < 2; i++){
      const spread = 1 + i * 1.6;
      blurMat.uniforms.tDiffuse.value = rtA.texture;
      blurMat.uniforms.uDir.value.set(spread / bw, 0);
      blit(blurMat, rtB);
      blurMat.uniforms.tDiffuse.value = rtB.texture;
      blurMat.uniforms.uDir.value.set(0, spread / bh);
      blit(blurMat, rtA);
    }

    // 3 · composite to the screen
    compMat.uniforms.tScene.value = rtScene.texture;
    compMat.uniforms.tBloom.value = rtA.texture;
    compMat.uniforms.uOpacity.value = 1;
    quad.material = compMat;
    renderer.setRenderTarget(null);
    renderer.clear();
    renderer.render(quadScene, quadCam);
  }

  function smooth(a, b, x){
    const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  }

  tick();
})();
