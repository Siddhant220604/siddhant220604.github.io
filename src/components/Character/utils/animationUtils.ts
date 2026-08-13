import * as THREE from "three";
import { GLTF } from "three-stdlib";

/* The Avaturn export ships one authored clip for its own rig. It is played on
   a loop as the resting state; everything else the character does (looking at
   the pointer, moving on scroll) is driven from code on top of it. */
const setAnimations = (gltf: GLTF) => {
  const character = gltf.scene;
  const mixer = new THREE.AnimationMixer(character);

  const idle = gltf.animations?.[0];
  if (idle) {
    const action = mixer.clipAction(idle);
    action.setLoop(THREE.LoopRepeat, Infinity);
    action.play();
  } else {
    console.warn("avatar.glb has no animation clips");
  }

  // Kept so the scene can fade the character in once loading finishes.
  function startIntro() {
    character.traverse((child: any) => {
      if (child.isMesh && child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((m: THREE.Material) => {
          m.transparent = true;
          m.opacity = 0;
        });
      }
    });
    const t0 = performance.now();
    const fade = () => {
      const k = Math.min((performance.now() - t0) / 900, 1);
      character.traverse((child: any) => {
        if (child.isMesh && child.material) {
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach((m: THREE.Material) => { m.opacity = k; });
        }
      });
      if (k < 1) requestAnimationFrame(fade);
    };
    requestAnimationFrame(fade);
  }

  return { mixer, startIntro };
};

export default setAnimations;
