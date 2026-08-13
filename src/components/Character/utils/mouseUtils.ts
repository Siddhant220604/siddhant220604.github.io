import * as THREE from "three";

export const handleMouseMove = (
  event: MouseEvent,
  setMousePosition: (x: number, y: number) => void
) => {
  const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
  const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
  setMousePosition(mouseX, mouseY);
};

export const handleTouchMove = (
  event: TouchEvent,
  setMousePosition: (x: number, y: number) => void
) => {
  const mouseX = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
  const mouseY = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
  setMousePosition(mouseX, mouseY);
};

export const handleTouchEnd = (
  setMousePosition: (
    x: number,
    y: number,
    interpolationX: number,
    interpolationY: number
  ) => void
) => {
  setTimeout(() => {
    setMousePosition(0, 0, 0.03, 0.03);
    setTimeout(() => {
      setMousePosition(0, 0, 0.1, 0.2);
    }, 1000);
  }, 2000);
};

/* Additive head aim for the Avaturn (Mixamo) rig.
   The template set absolute rotations with an offset tuned to its own rig's
   rest pose; on this skeleton that pins the chin to the chest and wipes out
   the idle clip's head movement. Offsets are smoothed here and added on top
   of whatever the mixer just posed, so the idle keeps breathing underneath. */
const _aimEuler = new THREE.Euler();
const _aimQuat = new THREE.Quaternion();
let aimX = 0;
let aimY = 0;

export const handleHeadRotation = (
  headBone: THREE.Object3D,
  mouseX: number,
  mouseY: number,
  interpolationX: number,
  interpolationY: number,
  lerp: (x: number, y: number, t: number) => number
) => {
  if (!headBone) return;
  const maxYaw = Math.PI / 9;
  const maxPitch = Math.PI / 12;

  let targetY = 0;
  let targetX = 0;
  if (window.scrollY < 200) {
    targetY = THREE.MathUtils.clamp(mouseX, -1, 1) * maxYaw;
    targetX = THREE.MathUtils.clamp(mouseY, -1, 1) * maxPitch;
  } else if (window.innerWidth > 1024) {
    // Once the page has scrolled the character looks away, down and aside.
    targetY = -0.22;
    targetX = 0.16;
  }

  aimY = lerp(aimY, targetY, interpolationY);
  aimX = lerp(aimX, targetX, interpolationX);

  // Compose in the bone's own space. Adding to the Euler on top of the clip's
  // animated quaternion lets gimbal interplay magnify a small aim into a
  // near-profile turn, so multiply the rotation instead.
  _aimEuler.set(aimX, aimY, 0, "YXZ");
  _aimQuat.setFromEuler(_aimEuler);
  // Aim from the bind pose rather than from the clip's animated head, which
  // is already turned; composing on top of it throws the face into profile.
  const rest = headBone.userData.restQuat as THREE.Quaternion | undefined;
  if (rest) {
    headBone.quaternion.copy(rest).multiply(_aimQuat);
  } else {
    headBone.quaternion.multiply(_aimQuat);
  }
};
