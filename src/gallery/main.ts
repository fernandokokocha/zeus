import * as THREE from 'three';
import { PALETTE, TERRAIN_COLORS } from '../render/palette';
import { HUT_OPTIONS } from './hut-options';
import { SHACK_OPTIONS } from './shack-options';
import { HOVEL_OPTIONS } from './hovel-options';
import { HOMESTEAD_OPTIONS } from './homestead-options';
import { TENEMENT_OPTIONS } from './tenement-options';
import { APARTMENT_OPTIONS } from './apartment-options';
import { TOWNHOUSE_OPTIONS } from './townhouse-options';
import { FARM_OPTIONS } from './farm-options';
import { MAINTENANCE_OPTIONS } from './maintenance-options';
import { MASONRY_OPTIONS } from './masonry-options';
import { PALACE_OPTIONS } from './palace-options';
import { TAX_OPTIONS } from './tax-options';
import { AGORA_OPTIONS } from './agora-options';
import { MARBLE_OPTIONS } from './marble-options';
import { COPPER_OPTIONS } from './copper-options';
import { OLIVE_TREE_OPTIONS } from './olive-tree-options';
import { GYMNASIUM_OPTIONS } from './gymnasium-options';
import { PARK_OPTIONS } from './park-options';
import { FOREST_OPTIONS } from './forest-options';
import { COLUMN_OPTIONS } from './column-options';
import { FLOWER_GARDEN_OPTIONS } from './flower-garden-options';
import { FOUNTAIN_OPTIONS } from './fountain-options';
import { TIMBER_MILL_OPTIONS } from './timber-mill-options';
import { COLLEGE_OPTIONS } from './college-options';
import { DRAMA_SCHOOL_OPTIONS } from './drama-school-options';
import { THEATER_OPTIONS } from './theater-options';
import { ARTISANS_GUILD_OPTIONS } from './artisans-guild-options';
import { SCULPTURE_STUDIO_OPTIONS } from './sculpture-studio-options';
import { FOUNDRY_OPTIONS } from './foundry-options';
import { STOREHOUSE_OPTIONS } from './storehouse-options';
import { bake } from '../render/bake';
import type { Animate } from '../render/kit/figure';
import type { DesignSet } from './options';

const SETS: Record<string, DesignSet> = {
  hut: { title: 'Hut', needs: 'Level 1 · 8 people · needs nothing — fresh settlers', options: HUT_OPTIONS, chosen: 2, strip: true },
  shack: { title: 'Shack', needs: 'Level 2 · 16 people · needs food', options: SHACK_OPTIONS, chosen: 2, previous: HUT_OPTIONS[2], strip: true },
  hovel: { title: 'Hovel', needs: 'Level 3 · 24 people · needs food and water', options: HOVEL_OPTIONS, chosen: 1, previous: SHACK_OPTIONS[2], strip: true },
  homestead: { title: 'Homestead', needs: 'Level 4 · 32 people · needs food, water and fleece', options: HOMESTEAD_OPTIONS, chosen: 2, previous: HOVEL_OPTIONS[1], strip: true },
  tenement: { title: 'Tenement', needs: 'Level 5 · 40 people · needs food, water, fleece and more culture and appeal', options: TENEMENT_OPTIONS, chosen: 2, previous: HOMESTEAD_OPTIONS[2], strip: true },
  apartment: { title: 'Apartment', needs: 'Level 6 · 48 people · needs food, water, fleece and oil', options: APARTMENT_OPTIONS, chosen: 0, previous: TENEMENT_OPTIONS[2], strip: true },
  townhouse: { title: 'Townhouse', needs: 'Level 7 · 60 people · needs food, water, fleece, oil and top culture and appeal', options: TOWNHOUSE_OPTIONS, chosen: 1, previous: APARTMENT_OPTIONS[0], strip: true },
  wheatFarm: { title: 'Wheat Farm', needs: '3×3 · 10 workers · every growth stage, without and with workers', options: FARM_OPTIONS, chosen: 0, footprint: [3, 3], strip: true },
  maintenance: { title: 'Maintenance Office', needs: '2×2 · 5 workers · each option without and with workers', options: MAINTENANCE_OPTIONS, chosen: 1, strip: true },
  masonry: { title: 'Masonry Shop', needs: '2×2 · 15 workers · each option without and with workers, holding 3 loads of marble', options: MASONRY_OPTIONS, chosen: 1, strip: true },
  palace: { title: 'Palace', needs: '9×6 · no workers · always animated, guards at the gate', options: PALACE_OPTIONS, chosen: 2, footprint: [9, 6] },
  taxOffice: { title: 'Tax Office', needs: '2×2 · 8 workers · each option without and with workers', options: TAX_OPTIONS, chosen: 2, strip: true },
  agora: { title: 'Agora and vendors', needs: 'Agora 2×6, no workers · Food, Fleece and Oil Vendors 2×2 on its spots, 4 workers each, up to 8 loads', options: AGORA_OPTIONS, chosen: 0, footprint: [2, 6], strip: true },
  marble: { title: 'Marble outcrop', needs: 'Terrain · 1 tile · unbuildable, quarried for marble', options: MARBLE_OPTIONS, chosen: [0, 1, 2, 3, 4], footprint: [1, 1] },
  copper: { title: 'Copper ore', needs: 'Terrain · 1 tile · unbuildable, mined for bronze', options: COPPER_OPTIONS, chosen: [0, 1, 2, 3, 4], footprint: [1, 1] },
  oliveTree: { title: 'Olive Tree', needs: '1×1 · no workers · growing and ripe', options: OLIVE_TREE_OPTIONS, chosen: [0, 1], footprint: [1, 1] },
  gymnasium: { title: 'Gymnasium', needs: '3×3 · 7 workers · each option without and with workers', options: GYMNASIUM_OPTIONS, chosen: 1, footprint: [3, 3] },
  park: { title: 'Park', needs: '1×1 · no workers · decoration', options: PARK_OPTIONS, chosen: [0, 1, 2], footprint: [1, 1] },
  forest: { title: 'Forest', needs: 'Terrain · 1 tile · standing and felled', options: FOREST_OPTIONS, chosen: [0, 1, 2, 3, 4], footprint: [1, 1] },
  column: { title: 'Column', needs: '1×1 · no workers · decoration', options: COLUMN_OPTIONS, chosen: 0, footprint: [1, 1] },
  flowerGarden: { title: 'Flower Garden', needs: '2×2 · no workers · decoration', options: FLOWER_GARDEN_OPTIONS },
  fountain: { title: 'Fountain', needs: '2×2 · 4 workers · each option without and with workers', options: FOUNTAIN_OPTIONS },
  timberMill: { title: 'Timber Mill', needs: '2×2 · 12 workers · each option without and with workers, empty and stocked', options: TIMBER_MILL_OPTIONS },
  college: { title: 'College', needs: '3×3 · 12 workers · each option without and with workers', options: COLLEGE_OPTIONS, footprint: [3, 3] },
  dramaSchool: { title: 'Drama School', needs: '3×3 · 10 workers · each option without and with workers', options: DRAMA_SCHOOL_OPTIONS, footprint: [3, 3] },
  theater: { title: 'Theater', needs: '5×5 · 18 workers · idle and performing', options: THEATER_OPTIONS, footprint: [5, 5] },
  artisansGuild: { title: "Artisans' Guild", needs: '2×2 · 25 workers · without and with workers', options: ARTISANS_GUILD_OPTIONS, chosen: 0 },
  sculptureStudio: { title: 'Sculpture Studio', needs: '2×2 · 12 workers · without and with workers, marble and bronze in, statues out', options: SCULPTURE_STUDIO_OPTIONS, chosen: 0 },
  foundry: { title: 'Foundry', needs: '2×2 · 15 workers · without and with workers, ore and bronze stock', options: FOUNDRY_OPTIONS, chosen: 0 },
  storehouse: { title: 'Storehouse', needs: '3×3 · 12 workers · without and with workers, empty and holding every good', options: STOREHOUSE_OPTIONS, chosen: 0, footprint: [3, 3] },
};

const footprint = (set: DesignSet): [number, number] => set.footprint ?? [2, 2];

const ELEVATION = Math.PI / 6;
const ISO = new THREE.Vector3(Math.cos(ELEVATION) * Math.SQRT1_2, Math.sin(ELEVATION), Math.cos(ELEVATION) * Math.SQRT1_2);
const GAME_PIXELS_PER_TILE = 30;
const MAX_ZOOM = 4;

function scene(): THREE.Scene {
  const s = new THREE.Scene();
  s.background = new THREE.Color(PALETTE.sky);
  s.add(new THREE.HemisphereLight(0xfff4e0, 0x6b5a40, 1.5));
  const sun = new THREE.DirectionalLight(0xfff1d6, 2);
  sun.position.set(-30, 60, 20);
  s.add(sun);
  return s;
}

function ground(x: number, z: number, w: number, d: number, color: number, lift = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, 0.02, d), new THREE.MeshLambertMaterial({ color }));
  mesh.position.set(x + w / 2, -0.01 + lift, z + d / 2);
  return mesh;
}

function renderer(canvas: HTMLCanvasElement): THREE.WebGLRenderer {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true });
  r.setPixelRatio(window.devicePixelRatio);
  r.setSize(canvas.clientWidth, canvas.clientHeight, false);
  return r;
}

function camera(width: number, height: number, target: THREE.Vector3, pixelsPerUnit: number): THREE.OrthographicCamera {
  const halfW = width / pixelsPerUnit / 2;
  const halfH = height / pixelsPerUnit / 2;
  const cam = new THREE.OrthographicCamera(-halfW, halfW, halfH, -halfH, 0.1, 500);
  cam.position.copy(target).addScaledVector(ISO, 100);
  cam.lookAt(target);
  return cam;
}

function closeUpPixelsPerTile(canvas: HTMLCanvasElement, [w, d]: [number, number]): number {
  const isoWidth = (w + d) * Math.SQRT1_2;
  return Math.min(GAME_PIXELS_PER_TILE * MAX_ZOOM, (canvas.clientWidth * 0.95) / isoWidth);
}

function closeUp(canvas: HTMLCanvasElement, build: () => THREE.Object3D, [w, d]: [number, number]): void {
  const r = renderer(canvas);
  const s = scene();
  s.add(ground(-3, -3, w + 7, d + 7, TERRAIN_COLORS.grass));
  s.add(ground(-3, d, w + 7, 1, PALETTE.road, 0.005));
  const pivot = new THREE.Group();
  pivot.position.set(w / 2, 0, d / 2);
  const model = build();
  model.position.set(-w / 2, 0, -d / 2);
  pivot.add(model);
  s.add(pivot);
  const cam = camera(canvas.clientWidth, canvas.clientHeight, new THREE.Vector3(w / 2, new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3()).y, d / 2), closeUpPixelsPerTile(canvas, [w, d]));
  const draw = () => r.render(s, cam);
  const animations: Animate[] = [];
  model.traverse((node) => node.userData.animate && animations.push(node.userData.animate));
  if (animations.length) {
    const tick = (ms: number) => {
      for (const animate of animations) animate(ms / 1000);
      draw();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  let dragX: number | null = null;
  canvas.addEventListener('pointerdown', (e) => (dragX = e.clientX));
  window.addEventListener('pointerup', () => (dragX = null));
  window.addEventListener('pointermove', (e) => {
    if (dragX === null) return;
    pivot.rotation.y += (e.clientX - dragX) * 0.01;
    dragX = e.clientX;
    draw();
  });
  draw();
}

const STRIP_PIXELS_PER_DEPTH_TILE = 90;

function strip(canvas: HTMLCanvasElement, set: DesignSet): void {
  canvas.style.height = `${Math.max(canvas.clientHeight, footprint(set)[1] * STRIP_PIXELS_PER_DEPTH_TILE)}px`;
  const r = renderer(canvas);
  r.setScissorTest(true);
  const s = scene();
  s.add(ground(-20, -20, 60, 60, TERRAIN_COLORS.grass));
  const [w, d] = footprint(set);
  s.add(ground(-20, d, 60, 1, PALETTE.road, 0.005));
  const row = set.previous ? [set.previous, ...set.options] : set.options;
  let rowEnd = 0;
  row.forEach((option) => {
    const builds = option.variants?.map((v) => v.build) ?? [option.build, option.build];
    builds.forEach((build) => {
      const model = bake(build());
      model.position.set(rowEnd, 0, 0);
      s.add(model);
      rowEnd += w;
    });
    rowEnd += 1;
  });
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const halves = [{ zoom: 1, x: 0 }, { zoom: 2, x: width / 2 }];
  for (const { zoom, x } of halves) {
    const cam = camera(width / 2, height, new THREE.Vector3(rowEnd / 2 - 0.5, 0, d / 2 + 0.5), GAME_PIXELS_PER_TILE * zoom);
    r.setViewport(x, 0, width / 2, height);
    r.setScissor(x, 0, width / 2, height);
    r.render(s, cam);
  }
}

const level = new URLSearchParams(location.search).get('level') ?? 'hut';
const set = SETS[level];
const stripCaption = set.previous ? 'Chosen previous level first, then the options' : 'The options';
document.getElementById('nav')!.innerHTML = Object.entries(SETS).map(([key, s]) => `<a href="?level=${key}">${s.title}</a>`).join('');
const count = set.options.length;
document.getElementById('title')!.textContent = `${set.title} — ${count} option${count > 1 ? 's' : ''}`;
document.getElementById('needs')!.textContent = `${set.needs}. Close-ups are at max game zoom, or as close as fits; drag to rotate.`;
const cards = document.getElementById('cards')!;
if (set.options.some((o) => o.variants)) cards.classList.add('single');
set.options.forEach((option, i) => {
  const card = document.createElement('div');
  card.className = [set.chosen].flat().includes(i) ? 'card chosen' : 'card';
  const variants = option.variants ?? [{ label: '', build: option.build }];
  const canvases = option.variants
    ? `<div class="variants">${variants.map((v) => `<figure><canvas></canvas><figcaption>${v.label}</figcaption></figure>`).join('')}</div>`
    : '<canvas></canvas>';
  card.innerHTML = `${canvases}<h2>${option.name}</h2>${option.notes ? `<ul>${option.notes.map((n) => `<li>${n}</li>`).join('')}</ul>` : ''}`;
  cards.append(card);
  card.querySelectorAll('canvas').forEach((canvas, v) => closeUp(canvas, variants[v].build, footprint(set)));
});
const stripCanvas = document.getElementById('strip') as HTMLCanvasElement;
const stripHeading = document.getElementById('strip-caption')!;
if (set.strip) {
  stripHeading.textContent = `${stripCaption}, at default game zoom (left) and 2× (right)`;
  strip(stripCanvas, set);
} else {
  stripHeading.remove();
  stripCanvas.remove();
}
