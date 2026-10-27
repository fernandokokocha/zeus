import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createWalkerLayer } from '../../src/render/walker-layer';
import { grassGame } from '../sim/helpers';

function settlerMaterials(group: THREE.Group): THREE.MeshLambertMaterial[] {
  return group.children.filter((m): m is THREE.InstancedMesh => m instanceof THREE.InstancedMesh && m.count > 0).map((m) => m.material as THREE.MeshLambertMaterial);
}

describe('walker layer', () => {
  it('recompiles a figure it fades, since a material compiled opaque ignores its opacity', () => {
    const game = grassGame();
    game.settlers.push({ id: 1, destinationId: 0, people: 8, path: [{ x: 1, y: 1 }], step: 0, progress: 0 });
    const layer = createWalkerLayer();
    layer.sync(game, 0, null);
    const materials = settlerMaterials(layer.group);
    const versions = materials.map((m) => m.version);
    layer.sync(game, 0, 'water');
    expect(materials.map((m) => [m.transparent, m.opacity])).toEqual(materials.map(() => [true, 0.25]));
    expect(materials.every((m, i) => m.version > versions[i])).toBe(true);
  });
});
