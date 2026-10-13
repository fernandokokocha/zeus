import * as THREE from 'three';
import { tileHash } from '../palette';

export const COLORS = {
  whitewash: 0xffffff,
  aegean: 0x2f6fb3,
  deepAegean: 0x1d4e8c,
  mudBrick: 0xcfa874,
  earth: 0xb39566,
  stone: 0xa89d8c,
  thatch: 0xc9a55a,
  timber: 0x6b4a2b,
  clay: 0xc0643b,
  hide: 0xe6dcc6,
  dark: 0x2a1d12,
  foliage: 0x5a7a34,
  ember: 0xf08a2a,
};

type Painter = (ctx: CanvasRenderingContext2D, size: number, rand: () => number) => void;

function seeded(seed: number): () => number {
  let n = seed;
  return () => tileHash(n++, seed);
}

function canvasTexture(seed: number, paint: Painter): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  paint(canvas.getContext('2d')!, size, seeded(seed));
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

const hex = (color: number) => `#${color.toString(16).padStart(6, '0')}`;

function shade(color: number, amount: number): string {
  const c = new THREE.Color(color).offsetHSL(0, 0, amount);
  return `#${c.getHexString()}`;
}

function speckle(ctx: CanvasRenderingContext2D, size: number, rand: () => number, base: number, count: number, spread: number) {
  for (let i = 0; i < count; i++) {
    ctx.fillStyle = shade(base, (rand() - 0.5) * spread);
    const s = 1 + rand() * 3;
    ctx.fillRect(rand() * size, rand() * size, s, s);
  }
}

function tilePainter(color: number): Painter {
  return (ctx, size, rand) => {
    ctx.fillStyle = shade(color, -0.12);
    ctx.fillRect(0, 0, size, size);
    const rows = 6;
    const h = size / rows;
    for (let row = 0; row < rows; row++) {
      const offset = row % 2 ? size / 12 : 0;
      for (let col = -1; col < 6; col++) {
        ctx.fillStyle = shade(color, (rand() - 0.5) * 0.1);
        ctx.beginPath();
        ctx.roundRect(offset + col * (size / 6) + 1, row * h + 1, size / 6 - 2, h - 3, 3);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(60,20,10,0.35)';
      ctx.fillRect(0, row * h + h - 3, size, 2);
    }
  };
}

const painters = {
  mudBrick: ((ctx, size, rand) => {
    ctx.fillStyle = shade(COLORS.mudBrick, -0.12);
    ctx.fillRect(0, 0, size, size);
    const courses = 8;
    const h = size / courses;
    for (let row = 0; row < courses; row++) {
      const offset = row % 2 ? size / 8 : 0;
      for (let col = -1; col < 4; col++) {
        ctx.fillStyle = shade(COLORS.mudBrick, (rand() - 0.5) * 0.1);
        ctx.fillRect(offset + col * (size / 4) + 2, row * h + 2, size / 4 - 3, h - 3);
      }
    }
    speckle(ctx, size, rand, COLORS.mudBrick, 260, 0.2);
  }) as Painter,
  whitewash: ((ctx, size, rand) => {
    ctx.fillStyle = hex(COLORS.whitewash);
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `rgba(150,150,160,${rand() * 0.03})`;
      ctx.beginPath();
      ctx.arc(rand() * size, rand() * size, 6 + rand() * 20, 0, Math.PI * 2);
      ctx.fill();
    }
    speckle(ctx, size, rand, 0xf2f2f4, 40, 0.02);
  }) as Painter,
  patchyWhitewash: ((ctx, size, rand) => {
    ctx.fillStyle = hex(0xe9e2d2);
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 60; i++) {
      ctx.fillStyle = `rgba(140,115,80,${rand() * 0.12})`;
      ctx.beginPath();
      ctx.arc(rand() * size, rand() * size, 4 + rand() * 18, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(120,95,60,0.35)';
    ctx.fillRect(0, size * 0.86, size, size * 0.14);
    for (let i = 0; i < 5; i++) {
      const px = rand() * size;
      const py = rand() * size;
      const pw = 14 + rand() * 26;
      const ph = 10 + rand() * 18;
      ctx.fillStyle = shade(COLORS.mudBrick, -0.06);
      ctx.beginPath();
      ctx.ellipse(px, py, pw / 2, ph / 2, rand(), 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = shade(COLORS.mudBrick, -0.2);
      ctx.lineWidth = 1;
      for (let row = py - ph / 2 + 5; row < py + ph / 2; row += 7) {
        ctx.beginPath();
        ctx.moveTo(px - pw / 3, row);
        ctx.lineTo(px + pw / 3, row);
        ctx.stroke();
      }
    }
    speckle(ctx, size, rand, 0xd8cfbb, 120, 0.1);
  }) as Painter,
  rubble: ((ctx, size, rand) => {
    ctx.fillStyle = shade(COLORS.stone, -0.22);
    ctx.fillRect(0, 0, size, size);
    let y = 0;
    while (y < size) {
      const h = 10 + rand() * 12;
      let x = -rand() * 20;
      while (x < size) {
        const w = 14 + rand() * 22;
        ctx.fillStyle = shade(COLORS.stone, (rand() - 0.4) * 0.18);
        ctx.beginPath();
        ctx.roundRect(x + 1.5, y + 1.5, w - 3, h - 3, 4);
        ctx.fill();
        x += w;
      }
      y += h;
    }
    speckle(ctx, size, rand, COLORS.stone, 120, 0.15);
  }) as Painter,
  thatch: ((ctx, size, rand) => {
    ctx.fillStyle = shade(COLORS.thatch, -0.15);
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 420; i++) {
      ctx.strokeStyle = shade(COLORS.thatch, (rand() - 0.5) * 0.25);
      ctx.lineWidth = 1 + rand();
      const x = rand() * size;
      const y = rand() * size;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (rand() - 0.5) * 3, y + 14 + rand() * 18);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(70,50,20,0.35)';
    for (const y of [size * 0.33, size * 0.83]) ctx.fillRect(0, y, size, 3);
  }) as Painter,
  earth: ((ctx, size, rand) => {
    ctx.fillStyle = hex(COLORS.earth);
    ctx.fillRect(0, 0, size, size);
    speckle(ctx, size, rand, COLORS.earth, 700, 0.18);
  }) as Painter,
  planks: ((ctx, size, rand) => {
    ctx.fillStyle = hex(COLORS.aegean);
    ctx.fillRect(0, 0, size, size);
    for (let x = 0; x < size; x += size / 4) {
      ctx.fillStyle = 'rgba(10,30,60,0.45)';
      ctx.fillRect(x, 0, 2, size);
    }
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = `rgba(120,90,60,${0.2 + rand() * 0.3})`;
      ctx.fillRect(rand() * size, rand() * size, 2 + rand() * 6, 1 + rand() * 3);
    }
  }) as Painter,
  tiles: tilePainter(COLORS.clay),
  blueTiles: tilePainter(COLORS.aegean),
  slate: tilePainter(0x6f7378),
  hide: ((ctx, size, rand) => {
    ctx.fillStyle = hex(COLORS.hide);
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = hex(COLORS.aegean);
    ctx.fillRect(0, size * 0.72, size, size * 0.1);
    ctx.fillStyle = hex(COLORS.deepAegean);
    ctx.fillRect(0, size * 0.86, size, size * 0.04);
    speckle(ctx, size, rand, COLORS.hide, 200, 0.1);
  }) as Painter,
};

export type Surface = keyof typeof painters;

const WHITEWASH_GLOW = 0x60626c;

const textures = new Map<Surface, THREE.Texture>();
const surfaces = new Map<Surface, THREE.Material>();

export function surface(kind: Surface): THREE.Material {
  if (!surfaces.has(kind)) {
    textures.set(kind, canvasTexture(kind.length * 31, painters[kind]));
    const glow = kind === 'whitewash' ? WHITEWASH_GLOW : 0x000000;
    surfaces.set(kind, new THREE.MeshLambertMaterial({ map: textures.get(kind), emissive: glow }));
  }
  return surfaces.get(kind)!;
}

const flats = new Map<number, THREE.Material>();

export function flat(color: number): THREE.Material {
  if (!flats.has(color)) flats.set(color, new THREE.MeshLambertMaterial({ color, flatShading: true }));
  return flats.get(color)!;
}

export const glowing = new THREE.MeshBasicMaterial({ color: COLORS.ember });
export const smoke = new THREE.MeshLambertMaterial({ color: 0x8a8580, transparent: true, opacity: 0.45 });

export const TEXTURE_WORLD_SIZE = 0.5;

function scaleUVs(geometry: THREE.BufferGeometry, perFace: [number, number][]): void {
  const uv = geometry.getAttribute('uv') as THREE.BufferAttribute;
  const verticesPerFace = uv.count / perFace.length;
  for (let i = 0; i < uv.count; i++) {
    const [su, sv] = perFace[Math.floor(i / verticesPerFace)];
    uv.setXY(i, (uv.getX(i) * su) / TEXTURE_WORLD_SIZE, (uv.getY(i) * sv) / TEXTURE_WORLD_SIZE);
  }
}

export function box(w: number, h: number, d: number, material: THREE.Material, x: number, y: number, z: number): THREE.Mesh {
  const geometry = new THREE.BoxGeometry(w, h, d);
  scaleUVs(geometry, [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]]);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y + h / 2, z);
  return mesh;
}

export function cylinder(top: number, bottom: number, h: number, material: THREE.Material, x: number, y: number, z: number, segments = 16): THREE.Mesh {
  const geometry = new THREE.CylinderGeometry(top, bottom, h, segments);
  const circumference = Math.PI * 2 * Math.max(top, bottom);
  scaleUVs(geometry, [[circumference, h]]);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y + h / 2, z);
  return mesh;
}

export function cone(radius: number, h: number, material: THREE.Material, x: number, y: number, z: number, segments = 18): THREE.Mesh {
  return cylinder(0.001, radius, h, material, x, y, z, segments);
}

export function sphere(radius: number, material: THREE.Material, x: number, y: number, z: number): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 10, 8), material);
  mesh.position.set(x, y, z);
  return mesh;
}

export function stone(size: number, x: number, y: number, z: number, seed: number, color = COLORS.stone): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(size), flat(color));
  mesh.position.set(x, y, z);
  mesh.rotation.set(tileHash(seed, 1) * 3, tileHash(seed, 2) * 3, 0);
  mesh.scale.set(1 + tileHash(seed, 3) * 0.4, 0.6 + tileHash(seed, 4) * 0.3, 1 + tileHash(seed, 5) * 0.3);
  return mesh;
}

export function log(length: number, radius: number, x: number, y: number, z: number, turn: number): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 8).rotateZ(Math.PI / 2), flat(COLORS.timber));
  mesh.position.set(x, y + radius, z);
  mesh.rotation.y = turn;
  return mesh;
}

const JAR_PROFILE = [[0, 0], [0.035, 0.005], [0.075, 0.07], [0.08, 0.13], [0.05, 0.21], [0.028, 0.25], [0.04, 0.27]];

export function jar(x: number, y: number, z: number, scale = 1, color = COLORS.clay): THREE.Mesh {
  const geometry = new THREE.LatheGeometry(JAR_PROFILE.map(([r, h]) => new THREE.Vector2(r, h)), 14);
  const mesh = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({ color, side: THREE.DoubleSide }));
  mesh.position.set(x, y, z);
  mesh.scale.setScalar(scale);
  return mesh;
}

export function tippedJar(x: number, z: number, turn: number): THREE.Object3D {
  const pivot = new THREE.Group();
  const lying = jar(0, 0, 0);
  lying.rotation.z = Math.PI / 2;
  lying.position.set(0.12, 0.075, 0);
  pivot.add(lying);
  pivot.position.set(x, 0.03, z);
  pivot.rotation.y = turn;
  return pivot;
}

export function basket(x: number, z: number, filled: THREE.Material | null): THREE.Object3D {
  const group = new THREE.Group();
  const weave = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.065, 0.08, 14, 1, true), new THREE.MeshLambertMaterial({ color: 0xb08a4a, side: THREE.DoubleSide }));
  weave.position.set(x, 0.07, z);
  group.add(weave, cylinder(0.065, 0.065, 0.005, flat(0x8a6a3a), x, 0.03, z));
  if (filled) group.add(sphere(0.07, filled, x, 0.09, z));
  return group;
}

export function stoneRing(cx: number, cz: number, radius: number, count: number, size: number, seed: number): THREE.Object3D {
  const group = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    group.add(stone(size, cx + Math.cos(a) * radius, 0.04, cz + Math.sin(a) * radius, seed + i));
  }
  return group;
}

export function campfire(x: number, z: number, burning: boolean): THREE.Object3D {
  const group = new THREE.Group();
  group.add(stoneRing(x, z, 0.11, 8, 0.035, 900));
  group.add(cylinder(0.08, 0.08, 0.01, flat(0x3a332c), x, 0.03, z));
  for (const turn of [0.3, 1.4, 2.5]) group.add(log(0.17, 0.014, x, 0.035, z, turn));
  if (burning) {
    group.add(cone(0.035, 0.09, glowing, x, 0.05, z, 6));
    group.add(sphere(0.045, smoke, x + 0.02, 0.26, z - 0.02), sphere(0.06, smoke, x + 0.05, 0.38, z - 0.05));
  }
  return group;
}

export function woodpile(x: number, z: number, turn: number): THREE.Object3D {
  const group = new THREE.Group();
  for (let row = 0; row < 3; row++) {
    for (let i = 0; i < 3 - row; i++) {
      group.add(log(0.26, 0.025, 0, row * 0.043, (i - (2 - row) / 2) * 0.052, Math.PI / 2));
    }
  }
  group.position.set(x, 0.03, z);
  group.rotation.y = turn;
  return group;
}

export function wattleFence(points: [number, number][], seed: number): THREE.Object3D {
  const group = new THREE.Group();
  const wicker = flat(0x8f7448);
  for (let i = 0; i < points.length - 1; i++) {
    const [ax, az] = points[i];
    const [bx, bz] = points[i + 1];
    const length = Math.hypot(bx - ax, bz - az);
    const posts = Math.max(2, Math.round(length / 0.18) + 1);
    for (let p = 0; p < posts; p++) {
      const t = p / (posts - 1);
      const lean = (tileHash(seed + i, p) - 0.5) * 0.05;
      const post = cylinder(0.012, 0.014, 0.22 + lean, flat(COLORS.timber), ax + (bx - ax) * t, 0.03, az + (bz - az) * t, 5);
      group.add(post);
    }
    for (const y of [0.09, 0.14, 0.19]) {
      const band = box(length, 0.03, 0.02, wicker, (ax + bx) / 2, y, (az + bz) / 2);
      band.rotation.y = -Math.atan2(bz - az, bx - ax);
      group.add(band);
    }
  }
  return group;
}

export function shrubAt(x: number, z: number, scale: number, seed: number): THREE.Object3D {
  const group = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const a = tileHash(seed, i) * Math.PI * 2;
    group.add(sphere(0.08 * scale, flat(COLORS.foliage), x + Math.cos(a) * 0.05 * scale, (0.08 + i * 0.02) * scale, z + Math.sin(a) * 0.05 * scale));
  }
  return group;
}

export function path(points: [number, number][], width: number): THREE.Object3D {
  const group = new THREE.Group();
  const worn = flat(0x9c7f55);
  for (let i = 0; i < points.length - 1; i++) {
    const [ax, az] = points[i];
    const [bx, bz] = points[i + 1];
    const segment = box(Math.hypot(bx - ax, bz - az) + width, 0.006, width, worn, (ax + bx) / 2, 0.03, (az + bz) / 2);
    segment.rotation.y = -Math.atan2(bz - az, bx - ax);
    group.add(segment);
  }
  return group;
}

export const LOT = 2;

export function lotGround(material: THREE.Material = surface('earth'), inset = 0.08): THREE.Mesh {
  return box(LOT - 2 * inset, 0.03, LOT - 2 * inset, material, LOT / 2, 0, LOT / 2);
}

export function scaled<T extends THREE.Object3D>(object: T, x: number, y: number, z: number): T {
  object.scale.multiply(new THREE.Vector3(x, y, z));
  return object;
}
