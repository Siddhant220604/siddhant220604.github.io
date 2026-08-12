/* Scroll-driven 3D scene: a camera travelling through a deep particle field,
   with one point cloud that morphs between three forms as the page advances.

   Everything here is decorative. Without WebGL, with a lost context, under
   prefers-reduced-motion, or with the 3D toggle off, the page falls back to
   the CSS gradient and no content is lost. */

import * as THREE from './vendor/three.module.min.js';

const canvas = document.getElementById('scene');
const button = document.getElementById('gfx');
const label  = document.getElementById('gfx-label');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* The toggle is the "skip" affordance every immersive page owes its visitors.
   Reduced-motion users start opted out; the choice is remembered either way. */
const STORE = 'sj-gfx';
const stored = localStorage.getItem(STORE);
let enabled = stored ? stored === 'on' : !reduced;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({
    canvas, antialias: false, alpha: true, powerPreference: 'high-performance'
  });
} catch (err) {
  document.body.classList.add('no3d');
}

if (!renderer) {
  if (button) button.remove();
} else {
  const SAND   = new THREE.Color('#D2A98C');
  const MAUVE  = new THREE.Color('#8E82A0');
  const HAZE   = new THREE.Color('#EFE7DC');
  const mobile = innerWidth < 760;

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 260);
  camera.position.set(0, 0, 8);

  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.setSize(innerWidth, innerHeight, false);

  /* ---------- deep particle field ----------
     Spread far along z so the scroll-driven camera dolly produces real
     parallax: near motes sweep past, distant ones barely shift. */
  const DUST = mobile ? 900 : 3000;      // stack guidance: stay near 3k, profile before raising
  const dPos = new Float32Array(DUST * 3);
  const dSeed = new Float32Array(DUST);
  for (let i = 0; i < DUST; i++) {
    dPos[i * 3]     = (Math.random() - 0.5) * 80;
    dPos[i * 3 + 1] = (Math.random() - 0.5) * 60;
    dPos[i * 3 + 2] = -Math.random() * 110 + 6;
    dSeed[i] = Math.random();
  }
  const dGeo = new THREE.BufferGeometry();
  dGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
  dGeo.setAttribute('aSeed', new THREE.BufferAttribute(dSeed, 1));
  const dMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uSize: { value: mobile ? 30 : 42 }, uCol: { value: HAZE } },
    vertexShader: `
      attribute float aSeed;
      uniform float uTime; uniform float uSize;
      varying float vA;
      void main(){
        vec3 p = position;
        p.y += sin(uTime * 0.05 + aSeed * 6.28) * 0.9;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = uSize * (0.3 + aSeed * 0.8) / max(-mv.z, 0.001);
        // fade in at the far plane and out as motes pass the camera
        vA = (0.16 + aSeed * 0.46) * smoothstep(-110.0, -16.0, mv.z) * smoothstep(0.0, -3.0, mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 uCol; varying float vA;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        gl_FragColor = vec4(uCol, smoothstep(0.5, 0.0, d) * vA);
      }`
  });
  const dust = new THREE.Points(dGeo, dMat);
  scene.add(dust);

  /* ---------- the sculpture ----------
     One cloud, three target forms, morphed by scroll position. */
  const N = mobile ? 3000 : 10000;
  const A = new Float32Array(N * 3);   // sphere
  const B = new Float32Array(N * 3);   // flame
  const C = new Float32Array(N * 3);   // hourglass
  const seed = new Float32Array(N);
  const golden = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const th = golden * i;
    const rnd = Math.random();

    const sy = 1 - t * 2;
    const sr = Math.sqrt(Math.max(0, 1 - sy * sy));
    A[i * 3] = Math.cos(th) * sr * 2.1; A[i * 3 + 1] = sy * 2.1; A[i * 3 + 2] = Math.sin(th) * sr * 2.1;

    const fy = Math.pow(t, 0.65);
    const fr = (1 - fy) * 1.25 * (0.35 + rnd * 0.65);
    B[i * 3] = Math.cos(th) * fr; B[i * 3 + 1] = fy * 5.4 - 2.6; B[i * 3 + 2] = Math.sin(th) * fr;

    const hy = (t - 0.5) * 5.2;
    const hr = (0.16 + Math.abs(hy) * 0.52) * (0.45 + rnd * 0.55);
    C[i * 3] = Math.cos(th) * hr; C[i * 3 + 1] = hy; C[i * 3 + 2] = Math.sin(th) * hr;

    seed[i] = rnd;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(A, 3));
  geo.setAttribute('aB', new THREE.BufferAttribute(B, 3));
  geo.setAttribute('aC', new THREE.BufferAttribute(C, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));

  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 }, uSize: { value: mobile ? 24 : 32 },
      uMorph: { value: 0 }, uOpacity: { value: 0.7 },
      uA: { value: MAUVE }, uB: { value: SAND }, uC: { value: HAZE }
    },
    vertexShader: `
      attribute vec3 aB; attribute vec3 aC; attribute float aSeed;
      uniform float uTime; uniform float uSize; uniform float uMorph;
      varying float vMix;
      void main(){
        vec3 p = mix(position, aB, clamp(uMorph, 0.0, 1.0));
        p = mix(p, aC, clamp(uMorph - 1.0, 0.0, 1.0));

        float a = uTime * 0.18 + p.y * 0.22 + aSeed * 0.6;
        p.xz = mat2(cos(a), -sin(a), sin(a), cos(a)) * p.xz;
        p += normalize(p + 0.001) * sin(uTime * 0.7 + aSeed * 9.0) * 0.06;

        vMix = clamp(aSeed * 0.5 + (p.y + 2.8) / 6.4 * 0.6, 0.0, 1.0);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = uSize * (0.45 + aSeed * 0.9) / max(-mv.z, 0.001);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 uA; uniform vec3 uB; uniform vec3 uC; uniform float uOpacity;
      varying float vMix;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        // mauve shade -> sunlit sand -> hazy sky, the video read as a gradient
        vec3 col = vMix < 0.5 ? mix(uA, uB, vMix * 2.0) : mix(uB, uC, (vMix - 0.5) * 2.0);
        gl_FragColor = vec4(col, smoothstep(0.5, 0.0, d) * uOpacity);
      }`
  });

  const sculpture = new THREE.Points(geo, mat);
  scene.add(sculpture);

  /* ---------- input ---------- */
  const mouse = { x: 0, y: 0 }, aim = { x: 0, y: 0 };
  if (!mobile) {
    addEventListener('pointermove', e => {
      aim.x = (e.clientX / innerWidth - 0.5) * 2;
      aim.y = (e.clientY / innerHeight - 0.5) * 2;
    }, { passive: true });
  }

  let scrollY = 0, docLen = 1;
  const measure = () => { docLen = Math.max(1, document.body.scrollHeight - innerHeight); };
  measure();
  scrollY = window.scrollY;
  addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });

  let resizeTimer;
  addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight, false);
      measure();
      if (!running) renderer.render(scene, camera);
    }, 120);
  }, { passive: true });

  canvas.addEventListener('webglcontextlost', e => {
    e.preventDefault();
    running = false;
    document.body.classList.add('no3d');
  });

  /* ---------- loop ---------- */
  const clock = new THREE.Clock();
  const minDelta = mobile ? 1 / 32 : 0;
  let last = -1, running = false, raf = 0;
  let morph = 0, px = 4.25, py = -0.2, camZ = 8;

  function frame() {
    raf = requestAnimationFrame(frame);
    if (document.hidden) return;
    const t = clock.getElapsedTime();
    if (t - last < minDelta) return;
    last = t;

    const p = Math.min(scrollY / docLen, 1);   // 0..1 down the page

    // sphere through the hero, flame across the middle, hourglass by the end
    const wantMorph = p < 0.18 ? p / 0.18 * 0.55
                    : p < 0.62 ? 0.55 + (p - 0.18) / 0.44 * 0.75
                    : 1.30 + (p - 0.62) / 0.38 * 0.70;
    morph += (wantMorph - morph) * 0.06;
    mat.uniforms.uMorph.value = morph;
    mat.uniforms.uTime.value = t;
    dMat.uniforms.uTime.value = t;

    mouse.x += (aim.x - mouse.x) * 0.045;
    mouse.y += (aim.y - mouse.y) * 0.045;

    // Where the sculpture can sit without landing on the headline depends on
    // how wide the frustum is at its depth — a fixed world x collides on
    // narrow screens and drifts into the margin on wide ones.
    const dist = camZ + 1.2;
    const visW = 2 * Math.tan((50 * Math.PI / 180) / 2) * dist * camera.aspect;
    const narrow = innerWidth < 900;
    const homeX = narrow ? 0 : visW * 0.16 + 2.1;

    px += ((homeX - Math.min(p / 0.45, 1) * (narrow ? 0 : visW * 0.55)) - px) * 0.05;
    py += ((-0.2 + Math.sin(p * Math.PI) * 0.5) - py) * 0.05;
    sculpture.position.set(px, py, -1.2);
    sculpture.rotation.z = Math.sin(t * 0.12) * 0.05;
    // Centred behind stacked content it has to be much fainter to stay readable.
    const base = narrow ? 0.3 : 0.7;
    mat.uniforms.uOpacity.value = base - Math.min(p / 0.45, 1) * (narrow ? 0.1 : 0.28);

    // The camera itself travels forward through the field — this is what
    // turns a flat backdrop into depth. Lerped, so it scrubs rather than snaps.
    camZ += ((8 - p * 3.4) - camZ) * 0.06;
    camera.position.set(mouse.x * 0.4, -mouse.y * 0.25 + p * 1.2, camZ);
    camera.rotation.z = p * 0.06;
    camera.lookAt(0, p * 1.0, -2);

    renderer.render(scene, camera);
  }

  function start() {
    if (running) return;
    running = true;
    last = -1;
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(raf);
    renderer.clear();
  }

  function apply() {
    document.body.classList.toggle('no3d', !enabled);
    if (button) {
      button.setAttribute('aria-pressed', String(enabled));
      if (label) label.textContent = enabled ? '3D on' : '3D off';
    }
    if (enabled) start(); else stop();
  }

  if (button) {
    button.classList.add('ready');
    button.addEventListener('click', () => {
      enabled = !enabled;
      localStorage.setItem(STORE, enabled ? 'on' : 'off');
      apply();
    });
  }

  apply();
}
