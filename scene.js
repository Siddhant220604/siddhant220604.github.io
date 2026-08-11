/* Scroll-driven particle sculpture + ambient dust.
   Purely decorative: without WebGL, with a lost context, or under
   prefers-reduced-motion the page falls back to the CSS gradient
   and no content is lost. */

import * as THREE from './vendor/three.module.min.js';

const canvas = document.getElementById('scene');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({
    canvas, antialias: false, alpha: true, powerPreference: 'high-performance'
  });
} catch (err) {
  document.body.classList.add('no3d');
}

if (renderer) {
  const VIOLET = new THREE.Color('#A855F7');
  const PALE   = new THREE.Color('#E7D9FF');
  const mobile = innerWidth < 760;

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 240);
  camera.position.z = 8;

  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.setSize(innerWidth, innerHeight, false);

  /* ---------- ambient dust ---------- */
  const DUST = mobile ? 1200 : 3000;
  const dPos = new Float32Array(DUST * 3);
  const dSeed = new Float32Array(DUST);
  for (let i = 0; i < DUST; i++) {
    dPos[i * 3]     = (Math.random() - 0.5) * 70;
    dPos[i * 3 + 1] = (Math.random() - 0.5) * 52;
    dPos[i * 3 + 2] = -Math.random() * 80 - 4;
    dSeed[i] = Math.random();
  }
  const dGeo = new THREE.BufferGeometry();
  dGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
  dGeo.setAttribute('aSeed', new THREE.BufferAttribute(dSeed, 1));
  const dMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uSize: { value: mobile ? 30 : 40 }, uCol: { value: PALE } },
    vertexShader: `
      attribute float aSeed;
      uniform float uTime; uniform float uSize;
      varying float vA;
      void main(){
        vec3 p = position;
        p.y += sin(uTime * 0.05 + aSeed * 6.28) * 0.9;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = uSize * (0.3 + aSeed * 0.8) / max(-mv.z, 0.001);
        vA = (0.18 + aSeed * 0.5) * smoothstep(-84.0, -10.0, mv.z);
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
  scene.add(new THREE.Points(dGeo, dMat));

  /* ---------- the sculpture ----------
     One point cloud that morphs between three forms as you scroll:
     a sphere, a rising flame, then an hourglass. */
  const N = mobile ? 4200 : 11000;
  const A = new Float32Array(N * 3);   // sphere
  const B = new Float32Array(N * 3);   // flame
  const C = new Float32Array(N * 3);   // hourglass
  const seed = new Float32Array(N);
  const golden = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const th = golden * i;
    const rnd = Math.random();

    // sphere — even fibonacci distribution
    const sy = 1 - t * 2;
    const sr = Math.sqrt(Math.max(0, 1 - sy * sy));
    A[i * 3]     = Math.cos(th) * sr * 2.1;
    A[i * 3 + 1] = sy * 2.1;
    A[i * 3 + 2] = Math.sin(th) * sr * 2.1;

    // flame — narrow, tall, denser at the base
    const fy = Math.pow(t, 0.65);
    const fr = (1 - fy) * 1.25 * (0.35 + rnd * 0.65);
    B[i * 3]     = Math.cos(th) * fr;
    B[i * 3 + 1] = fy * 5.4 - 2.6;
    B[i * 3 + 2] = Math.sin(th) * fr;

    // hourglass — waist at the centre, flaring to both ends
    const hy = (t - 0.5) * 5.2;
    const hr = (0.16 + Math.abs(hy) * 0.52) * (0.45 + rnd * 0.55);
    C[i * 3]     = Math.cos(th) * hr;
    C[i * 3 + 1] = hy;
    C[i * 3 + 2] = Math.sin(th) * hr;

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
      uA: { value: VIOLET }, uB: { value: PALE }
    },
    vertexShader: `
      attribute vec3 aB; attribute vec3 aC; attribute float aSeed;
      uniform float uTime; uniform float uSize; uniform float uMorph;
      varying float vMix;
      void main(){
        // uMorph runs 0..2: sphere -> flame -> hourglass
        vec3 p = mix(position, aB, clamp(uMorph, 0.0, 1.0));
        p = mix(p, aC, clamp(uMorph - 1.0, 0.0, 1.0));

        // a slow swirl so the form never looks frozen
        float a = uTime * 0.18 + p.y * 0.22 + aSeed * 0.6;
        p.xz = mat2(cos(a), -sin(a), sin(a), cos(a)) * p.xz;
        p += normalize(p + 0.001) * sin(uTime * 0.7 + aSeed * 9.0) * 0.06;

        vMix = clamp(aSeed * 0.55 + (p.y + 2.8) / 6.4 * 0.6, 0.0, 1.0);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = uSize * (0.45 + aSeed * 0.9) / max(-mv.z, 0.001);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 uA; uniform vec3 uB; uniform float uOpacity;
      varying float vMix;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        gl_FragColor = vec4(mix(uA, uB, vMix), smoothstep(0.5, 0.0, d) * uOpacity);
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
  addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });

  let resizeTimer;
  addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight, false);
      measure();
      if (reduced) renderer.render(scene, camera);
    }, 120);
  }, { passive: true });

  canvas.addEventListener('webglcontextlost', e => {
    e.preventDefault();
    document.body.classList.add('no3d');
  });

  /* ---------- loop ---------- */
  const clock = new THREE.Clock();
  const minDelta = mobile ? 1 / 32 : 0;
  let last = -1;
  let morph = 0, px = 0, py = 0;

  function frame() {
    requestAnimationFrame(frame);
    if (document.hidden) return;
    const t = clock.getElapsedTime();
    if (t - last < minDelta) return;
    last = t;

    const p = Math.min(scrollY / docLen, 1);   // 0..1 down the page

    // Sphere through the hero, flame across the middle, hourglass by the end.
    const wantMorph = p < 0.18 ? p / 0.18 * 0.55
                    : p < 0.62 ? 0.55 + (p - 0.18) / 0.44 * 0.75
                    : 1.30 + (p - 0.62) / 0.38 * 0.70;
    morph += (wantMorph - morph) * 0.06;
    mat.uniforms.uMorph.value = morph;
    mat.uniforms.uTime.value = t;
    dMat.uniforms.uTime.value = t;

    mouse.x += (aim.x - mouse.x) * 0.045;
    mouse.y += (aim.y - mouse.y) * 0.045;

    // Drifts right-of-centre in the hero, swings left over the body of the page.
    const wantX = 4.25 - Math.min(p / 0.45, 1) * 7.5;
    const wantY = -0.2 + Math.sin(p * Math.PI) * 0.5;
    px += (wantX - px) * 0.05;
    py += (wantY - py) * 0.05;
    sculpture.position.set(px, py, -1.2);
    sculpture.rotation.z = Math.sin(t * 0.12) * 0.05;

    mat.uniforms.uOpacity.value = 0.7 - Math.min(p / 0.45, 1) * 0.28;

    camera.position.x = mouse.x * 0.4;
    camera.position.y = -mouse.y * 0.25;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }

  if (reduced) renderer.render(scene, camera);
  else requestAnimationFrame(frame);
}
