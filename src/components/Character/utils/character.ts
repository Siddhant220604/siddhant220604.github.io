import * as THREE from "three";
import { DRACOLoader, GLTF, GLTFLoader } from "three-stdlib";
import { setCharTimeline, setAllTimeline } from "../../utils/GsapScroll";

const setCharacter = (
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera
) => {
  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath("/draco/");
  loader.setDRACOLoader(dracoLoader);

  const loadCharacter = () => {
    return new Promise<GLTF | null>((resolve, reject) => {
      loader.load(
        "/models/avatar.glb",
        async (gltf) => {
          const character = gltf.scene;
          await renderer.compileAsync(character, camera, scene);

          character.traverse((child: any) => {
            if (child.isMesh) {
              const mesh = child as THREE.Mesh;
              child.castShadow = false;
              child.receiveShadow = false;
              mesh.frustumCulled = true;
              if (mesh.material && !Array.isArray(mesh.material)) {
                (mesh.material as THREE.ShaderMaterial).precision = "mediump";
              }
            }
          });

          // The avatar arrives at real-world scale with its feet on the origin;
          // lift and size it to sit where the landing layout expects a figure.
          character.scale.setScalar(1);
          character.position.set(0, -1.55, 0);

          setCharTimeline(character, camera);
          setAllTimeline();
          resolve(gltf);
        },
        undefined,
        (error) => reject(error)
      );
    });
  };

  return { loadCharacter };
};

export default setCharacter;
