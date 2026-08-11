/* Deep-space background + hero point-cloud centrepiece.
   Everything here is decorative: if WebGL is missing or the user prefers
   reduced motion, the page falls back to the CSS gradient and loses nothing. */

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
  const CYAN   = new THREE.Color('#5EE7F0');
  const mobile = innerWidth < 760;

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 220);
  camera.position.z = 6.5;

  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.setSize(innerWidth, innerHeight, false);

  /* ---------- dust field: the depth behind everything ---------- */
  const DUST = mobile ? 1500 : 3800;
  const dustPos = new Float32Array(DUST * 3);
  const dustSeed = new Float32Array(DUST);
  for (let i = 0; i < DUST; i++) {
    dustPos[i * 3]     = (Math.random() - 0.5) * 60;
    dustPos[i * 3 + 1] = (Math.random() - 0.5) * 46;
    dustPos[i * 3 + 2] = -Math.random() * 70 - 2;
    dustSeed[i] = Math.random();
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  dustGeo.setAttribute('aSeed', new THREE.BufferAttribute(dustSeed, 1));

  const dustMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 }, uSize: { value: mobile ? 34 : 46 },
      uA: { value: VIOLET }, uB: { value: CYAN }
    },
    vertexShader: `
      attribute float aSeed;
      uniform float uTime; uniform float uSize;
      varying float vMix; varying float vAlpha;
      void main(){
        vec3 p = position;
        p.x += sin(uTime * 0.06 + aSeed * 6.28) * 0.7;
        p.y += cos(uTime * 0.05 + aSeed * 5.11) * 0.5;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = uSize * (0.35 + aSeed * 0.85) / max(-mv.z, 0.001);
        vMix = aSeed;
        vAlpha = (0.25 + aSeed * 0.6) * smoothstep(-72.0, -8.0, mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 uA; uniform vec3 uB;
      varying float vMix; varying float vAlpha;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        gl_FragColor = vec4(mix(uA, uB, vMix), smoothstep(0.5, 0.0, d) * vAlpha);
      }`
  });
  const dust = new THREE.Points(dustGeo, dustMat);
  scene.add(dust);

  /* ---------- hero centrepiece ---------- */
  // Sits in the empty right-hand margin so it never lands on the headline.
  const hero = new THREE.Group();
  const heroHome = new THREE.Vector3(3.15, 0.15, -0.6);
  hero.position.copy(heroHome);
  scene.add(hero);

  // Points spread evenly over a sphere (fibonacci), displaced by a travelling wave.
  const N = mobile ? 3600 : 9000;
  const shellPos = new Float32Array(N * 3);
  const shellSeed = new Float32Array(N);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const th = golden * i;
    shellPos[i * 3]     = Math.cos(th) * r * 1.7;
    shellPos[i * 3 + 1] = y * 1.7;
    shellPos[i * 3 + 2] = Math.sin(th) * r * 1.7;
    shellSeed[i] = Math.random();
  }
  const shellGeo = new THREE.BufferGeometry();
  shellGeo.setAttribute('position', new THREE.BufferAttribute(shellPos, 3));
  shellGeo.setAttribute('aSeed', new THREE.BufferAttribute(shellSeed, 1));

  const shellMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 }, uSize: { value: mobile ? 26 : 34 },
      uAmp: { value: 0.34 }, uOpacity: { value: 0.55 },
      uA: { value: VIOLET }, uB: { value: CYAN }
    },
    vertexShader: `
      attribute float aSeed;
      uniform float uTime; uniform float uSize; uniform float uAmp;
      varying float vMix;
      void main(){
        vec3 n = normalize(position);
        float w = sin(position.x * 1.7 + uTime * 0.5)
                * cos(position.y * 1.5 - uTime * 0.42)
                * sin(position.z * 1.9 + uTime * 0.36);
        vec3 p = position + n * w * uAmp;
        vMix = clamp((p.y + 2.4) / 4.8, 0.0, 1.0);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = uSize * (0.5 + aSeed * 0.8) / max(-mv.z, 0.001);
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
  hero.add(new THREE.Points(shellGeo, shellMat));

  // Three thin orbit rings — the 3D echo of the CSS orbit further down the page.
  const ringMats = [];
  const ringSpec = [
    { r: 2.35, rx: 1.32, ry: 0.16, o: 0.34 },
    { r: 2.80, rx: -1.15, ry: -0.42, o: 0.24 },
    { r: 2.00, rx: 1.05, ry: 0.72, o: 0.28 }
  ];
  for (const s of ringSpec) {
    const pts = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * s.r, 0, Math.sin(a) * s.r));
    }
    const mat = new THREE.LineBasicMaterial({
      color: VIOLET, transparent: true, opacity: s.o, blending: THREE.AdditiveBlending, depthWrite: false
    });
    ringMats.push({ mat, base: s.o });
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat);
    line.rotation.x = s.rx;
    line.rotation.y = s.ry;
    hero.add(line);
  }

  /* ---------- input ---------- */
  const mouse = { x: 0, y: 0 };
  const target = { x: 0, y: 0 };
  if (!mobile) {
    addEventListener('pointermove', e => {
      target.x = (e.clientX / innerWidth - 0.5) * 2;
      target.y = (e.clientY / innerHeight - 0.5) * 2;
    }, { passive: true });
  }

  let scrollY = 0;
  addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });

  /* ---------- resize ---------- */
  let resizeTimer;
  addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight, false);
      if (reduced) renderer.render(scene, camera);
    }, 120);
  }, { passive: true });

  /* ---------- loop ---------- */
  const clock = new THREE.Clock();
  const heroFade = () => {
    // Hero art dissolves over the first screenful so it never fights the copy below.
    const t = Math.min(scrollY / (innerHeight * 0.9), 1);
    return 1 - t * t;
  };

  // A lost context (driver reset, tab backgrounded on mobile) must not leave
  // the page sitting on a dead black canvas.
  canvas.addEventListener('webglcontextlost', e => {
    e.preventDefault();
    document.body.classList.add('no3d');
  });

  // Phones get half the frame rate; the motion is ambient, nobody can tell,
  // and it roughly halves the GPU cost.
  const minDelta = mobile ? 1 / 32 : 0;
  let last = 0;

  function frame() {
    requestAnimationFrame(frame);
    if (document.hidden) return;
    const t = clock.getElapsedTime();
    if (t - last < minDelta) return;
    last = t;

    dustMat.uniforms.uTime.value = t;
    shellMat.uniforms.uTime.value = t;

    mouse.x += (target.x - mouse.x) * 0.045;
    mouse.y += (target.y - mouse.y) * 0.045;

    hero.rotation.y = t * 0.07 + mouse.x * 0.32;
    hero.rotation.x = mouse.y * 0.20;

    const f = heroFade();
    hero.visible = f > 0.01;
    shellMat.uniforms.uOpacity.value = 0.55 * f;
    for (const r of ringMats) r.mat.opacity = r.base * f;
    hero.position.y = heroHome.y + (1 - f) * 1.6;

    // Whole field drifts as you travel down the page.
    dust.rotation.z = t * 0.006;
    dust.position.y = scrollY * 0.0016;
    camera.position.x = mouse.x * 0.35;
    camera.position.y = -mouse.y * 0.22;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }

  if (reduced) {
    renderer.render(scene, camera);
  } else {
    requestAnimationFrame(frame);
  }
}
