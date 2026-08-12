/* Scroll-driven 3D scene: a camera travelling through a deep particle field,
   with a particle sheet that swells away from the cursor.

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

  /* ---------- interactive sheet ----------
     A grid of points filling the frustum. Each one is pushed away from the
     cursor and lifted toward the camera, so the sheet bulges under the
     pointer instead of sitting there as a decorative object. */
  const COLS = mobile ? 70 : 130;
  const ROWS = mobile ? 44 : 78;
  const N = COLS * ROWS;
  const gPos = new Float32Array(N * 3);
  const gSeed = new Float32Array(N);
  let gi = 0;
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      gPos[gi * 3]     = (x / (COLS - 1) - 0.5);   // unit grid; scaled in the shader
      gPos[gi * 3 + 1] = (y / (ROWS - 1) - 0.5);
      gPos[gi * 3 + 2] = 0;
      gSeed[gi] = Math.random();
      gi++;
    }
  }
  const gGeo = new THREE.BufferGeometry();
  gGeo.setAttribute('position', new THREE.BufferAttribute(gPos, 3));
  gGeo.setAttribute('aSeed', new THREE.BufferAttribute(gSeed, 1));

  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: {
      uTime:   { value: 0 },
      uSize:   { value: mobile ? 26 : 30 },
      uOpacity:{ value: 0.85 },
      uSpan:   { value: new THREE.Vector2(30, 18) },  // world size of the sheet
      uMouse:  { value: new THREE.Vector2(999, 999) },// world-space cursor
      uRadius: { value: 3.2 },
      uPush:   { value: 0.16 },   // sideways spread, kept small
      uLift:   { value: 3.1 },    // toward the camera — this is the bulge
      uA: { value: MAUVE }, uB: { value: SAND }, uC: { value: HAZE }
    },
    vertexShader: `
      attribute float aSeed;
      uniform float uTime, uSize, uRadius, uPush, uLift;
      uniform vec2 uSpan, uMouse;
      varying float vMix, vHit;
      void main(){
        vec3 p = vec3(position.xy * uSpan, 0.0);

        // slow swell so the sheet breathes when nobody is touching it
        p.z += sin(p.x * 0.22 + uTime * 0.5) * cos(p.y * 0.26 - uTime * 0.4) * 0.5;

        // Cursor bulge: a smooth dome lifting toward the camera. The sideways
        // spread stays small on purpose — push it hard and the sheet tears open
        // into a crater instead of swelling.
        vec2 d = p.xy - uMouse;
        float nd = clamp(length(d) / uRadius, 0.0, 1.0);
        float fall = 0.5 + 0.5 * cos(3.14159265 * nd);
        p.xy += normalize(d + 0.0001) * fall * uPush;
        p.z  += fall * uLift;
        vHit = fall;

        vMix = clamp(aSeed * 0.4 + fall * 0.8, 0.0, 1.0);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = uSize * (0.5 + aSeed * 0.5 + fall * 1.6) / max(-mv.z, 0.001);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 uA, uB, uC;
      uniform float uOpacity;
      varying float vMix, vHit;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        // mauve at rest, warming to sand and then to hazy white under the cursor
        vec3 col = vMix < 0.5 ? mix(uA, uB, vMix * 2.0) : mix(uB, uC, (vMix - 0.5) * 2.0);
        gl_FragColor = vec4(col, smoothstep(0.5, 0.0, d) * uOpacity * (0.46 + vHit * 0.85));
      }`
  });

  const sheet = new THREE.Points(gGeo, mat);
  sheet.position.z = -2.0;
  scene.add(sheet);

  /* ---------- input ---------- */
  const mouse = { x: 0, y: 0 }, aim = { x: 0, y: 0 };
  const ndc = { x: 0, y: 0 };
  let pointerSeen = false;
  if (!mobile) {
    addEventListener('pointermove', e => {
      ndc.x = e.clientX / innerWidth;
      ndc.y = e.clientY / innerHeight;
      aim.x = (ndc.x - 0.5) * 2;
      aim.y = (ndc.y - 0.5) * 2;
      pointerSeen = true;
    }, { passive: true });
    addEventListener('pointerleave', () => { pointerSeen = false; }, { passive: true });
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
  let camZ = 8;

  function frame() {
    raf = requestAnimationFrame(frame);
    if (document.hidden) return;
    const t = clock.getElapsedTime();
    if (t - last < minDelta) return;
    last = t;

    const p = Math.min(scrollY / docLen, 1);   // 0..1 down the page

    mat.uniforms.uTime.value = t;
    dMat.uniforms.uTime.value = t;

    mouse.x += (aim.x - mouse.x) * 0.06;
    mouse.y += (aim.y - mouse.y) * 0.06;

    // Camera travels forward through the dust as the page advances.
    camZ += ((8 - p * 3.4) - camZ) * 0.06;
    camera.position.set(mouse.x * 0.35, -mouse.y * 0.2 + p * 1.2, camZ);
    camera.lookAt(0, p * 1.0, -2);

    // Size the sheet to whatever the camera can actually see at its depth,
    // then convert the cursor into that same space so the bulge tracks exactly.
    const dist = camera.position.z - sheet.position.z;
    const visH = 2 * Math.tan((50 * Math.PI / 180) / 2) * dist;
    const visW = visH * camera.aspect;
    mat.uniforms.uSpan.value.set(visW * 1.12, visH * 1.12);
    mat.uniforms.uRadius.value = Math.max(2.2, visH * 0.28);

    if (pointerSeen) {
      mat.uniforms.uMouse.value.set(
        (ndc.x - 0.5) * visW + camera.position.x,
        (0.5 - ndc.y) * visH + camera.position.y
      );
    } else {
      mat.uniforms.uMouse.value.set(9999, 9999);
    }

    mat.uniforms.uOpacity.value = 0.85 - p * 0.25;
    dust.position.y = p * 1.4;

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
