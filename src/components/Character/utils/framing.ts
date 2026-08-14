import * as THREE from "three";

/* The character scene spans ~45 units in X and sits off-centre, while the
   camera only sees ~10 of them. With a fixed vertical FOV that visible slice
   widens and narrows with the viewport's aspect ratio, so the framing differs
   on every laptop — centred on a 16:9 panel, pushed aside on a 16:10 or 3:2.

   Holding the *horizontal* field of view constant instead makes the framing
   identical everywhere: narrower screens get more vertical room rather than
   losing the sides. */

export const BASE_FOV = 14.5;
export const REF_ASPECT = 16 / 9;

const HORIZONTAL_FOV =
  2 * Math.atan(Math.tan((BASE_FOV * Math.PI) / 180 / 2) * REF_ASPECT);

export function applyFraming(camera: THREE.PerspectiveCamera) {
  if (camera.aspect >= REF_ASPECT) {
    camera.fov = BASE_FOV;
  } else {
    camera.fov =
      (2 * Math.atan(Math.tan(HORIZONTAL_FOV / 2) / camera.aspect) * 180) /
      Math.PI;
  }
  camera.updateProjectionMatrix();
}
