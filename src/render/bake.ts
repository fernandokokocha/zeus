import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const MERGED_ATTRIBUTES = ['position', 'normal', 'uv'];

function flattened(mesh: THREE.Mesh): THREE.BufferGeometry {
  const geometry = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
  geometry.applyMatrix4(mesh.matrixWorld);
  for (const name of Object.keys(geometry.attributes)) {
    if (!MERGED_ATTRIBUTES.includes(name)) geometry.deleteAttribute(name);
  }
  if (!geometry.getAttribute('normal')) geometry.computeVertexNormals();
  if (!geometry.getAttribute('uv')) {
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(geometry.getAttribute('position').count * 2), 2));
  }
  return geometry;
}

export function bake(model: THREE.Object3D): THREE.Object3D {
  model.updateMatrixWorld(true);
  const byMaterial = new Map<THREE.Material, THREE.BufferGeometry[]>();
  model.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return;
    const material = node.material as THREE.Material;
    byMaterial.set(material, [...(byMaterial.get(material) ?? []), flattened(node)]);
  });
  const baked = new THREE.Group();
  for (const [material, geometries] of byMaterial) {
    const merged = mergeGeometries(geometries);
    if (!merged) throw new Error(`Cannot merge meshes sharing ${material.type}`);
    baked.add(new THREE.Mesh(merged, material));
    for (const geometry of geometries) geometry.dispose();
  }
  return baked;
}

export function bakedOnce(build: () => THREE.Object3D): () => THREE.Object3D {
  let template: THREE.Object3D | undefined;
  return () => {
    template ??= bake(build());
    return template.clone();
  };
}
