import { BUILDING_SPECS, type BuildingType } from './buildings';
import { adjacentRoadTiles } from './commands';
import { UNITS_PER_LOAD } from './food';
import { findRoadPath, nearestByRoad } from './pathfinding';
import type { Point } from './point';
import { ROAMER_REST_TICKS, exitTile } from './roamers';
import { NO_BUILDING, buildingById, type Artisan, type Building, type GameState, type Good } from './state';
import { isRoad, walkPath } from './walking';

export type Sanctuary = 'demeterSanctuary' | 'athenaSanctuary' | 'hephaestusSanctuary';
export type SanctuaryMaterial = 'marble' | 'wood' | 'sculptures';

export interface SanctuarySpec {
  god: string;
  initialMarble: number;
  needs: Record<SanctuaryMaterial, number>;
}

function inLoads(initialMarble: number, marble: number, wood: number, sculptures: number): Omit<SanctuarySpec, 'god'> {
  return {
    initialMarble: initialMarble * UNITS_PER_LOAD,
    needs: { marble: marble * UNITS_PER_LOAD, wood: wood * UNITS_PER_LOAD, sculptures: sculptures * UNITS_PER_LOAD },
  };
}

export const SANCTUARY_SPECS: Record<Sanctuary, SanctuarySpec> = {
  demeterSanctuary: { god: 'Demeter', ...inLoads(27, 110, 20, 10) },
  athenaSanctuary: { god: 'Athena', ...inLoads(24, 67, 22, 8) },
  hephaestusSanctuary: { god: 'Hephaestus', ...inLoads(13, 48, 14, 6) },
};

export const SANCTUARIES = Object.keys(SANCTUARY_SPECS) as Sanctuary[];
export const SANCTUARY_MATERIALS: SanctuaryMaterial[] = ['marble', 'wood', 'sculptures'];
export const SANCTUARY_STAGES = 5;
export const VISITS_PER_STAGE = 4;
export const SANCTUARY_WORK = SANCTUARY_STAGES * VISITS_PER_STAGE;

export function isSanctuary(type: BuildingType): type is Sanctuary {
  return type in SANCTUARY_SPECS;
}

export function isFinished(site: Building): boolean {
  return site.production >= SANCTUARY_WORK;
}

export function isUnderConstruction(building: Building): boolean {
  return isSanctuary(building.type) && !isFinished(building);
}

export function builtStages(site: Building): number {
  return Math.floor(site.production / VISITS_PER_STAGE);
}

function sanctuaryOf(site: Building): Sanctuary {
  if (!isSanctuary(site.type)) throw new Error(`Building ${site.id} is no sanctuary`);
  return site.type;
}

export function suppliedStages(site: Building): number {
  const { needs } = SANCTUARY_SPECS[sanctuaryOf(site)];
  return Math.min(...SANCTUARY_MATERIALS.map((m) => Math.floor((site[m] * SANCTUARY_STAGES) / needs[m])));
}

export function stillNeeded(type: Sanctuary, stock: Record<Good, number>, good: Good): number {
  const material = good as SanctuaryMaterial;
  return SANCTUARY_SPECS[type].needs[material] - stock[material];
}

export function storedMarble(state: GameState): number {
  return storehouses(state).reduce((sum, s) => sum + s.marble, 0);
}

function storehouses(state: GameState): Building[] {
  return state.buildings.filter((b) => b.type === 'storehouse');
}

export function sanctuaryObstacle(state: GameState, type: Sanctuary): string | null {
  if (state.buildings.some((b) => b.type === type)) return `Only one ${BUILDING_SPECS[type].name} is allowed`;
  const { initialMarble } = SANCTUARY_SPECS[type];
  const stored = storedMarble(state);
  if (stored >= initialMarble) return null;
  return `Needs ${initialMarble / UNITS_PER_LOAD} loads of marble in storehouses (has ${Math.floor(stored / UNITS_PER_LOAD)})`;
}

export function takeInitialMarble(state: GameState, site: Building): void {
  let left = SANCTUARY_SPECS[sanctuaryOf(site)].initialMarble;
  for (const storehouse of storehouses(state).sort((a, b) => b.marble - a.marble)) {
    const taken = Math.min(left, storehouse.marble);
    storehouse.marble -= taken;
    left -= taken;
  }
  site.marble = SANCTUARY_SPECS[sanctuaryOf(site)].initialMarble;
}

function visitsLeft(state: GameState, site: Building): number {
  const coming = state.artisans.filter((a) => a.destinationId === site.id).length;
  return suppliedStages(site) * VISITS_PER_STAGE - site.production - coming;
}

export function sitesToBuild(state: GameState): Building[] {
  return state.buildings.filter((b) => isSanctuary(b.type) && visitsLeft(state, b) > 0);
}

export function tickSanctuaries(state: GameState): void {
  for (const guild of state.buildings) sendArtisan(state, guild);
  for (const artisan of [...state.artisans]) moveArtisan(state, artisan);
}

function sendArtisan(state: GameState, guild: Building): void {
  if (guild.type !== 'artisansGuild' || guild.workers === 0 || state.artisans.some((a) => a.homeId === guild.id)) return;
  guild.walkerRest += guild.workers / BUILDING_SPECS.artisansGuild.workers;
  if (guild.walkerRest < ROAMER_REST_TICKS) return;

  const exit = exitTile(state, guild);
  if (!exit) throw new Error(`Guild ${guild.id} has workers but no road to leave by`);
  const target = nearestByRoad(state, exit, sitesToBuild(state));
  if (!target) return;
  guild.walkerRest = 0;
  state.artisans.push({ id: state.nextArtisanId++, homeId: guild.id, destinationId: target.building.id, path: target.path, step: 0, progress: 0 });
}

function moveArtisan(state: GameState, artisan: Artisan): void {
  if (!buildingById(state, artisan.homeId)) throw new Error(`Artisan ${artisan.id} outlived his guild ${artisan.homeId}`);
  if (!isRoad(state, artisan.path[artisan.step])) return dismiss(state, artisan);
  if (!buildingById(state, artisan.destinationId) && !replan(state, artisan)) return;
  walkPath(state, artisan, () => replan(state, artisan), () => arrive(state, artisan));
}

function replan(state: GameState, artisan: Artisan): boolean {
  const here = artisan.path[artisan.step];
  const site = buildingById(state, artisan.destinationId);
  const path = site ? findRoadPath(state, here, adjacentRoadTiles(state, site)) : null;
  if (path) {
    restartOn(artisan, path);
    return true;
  }
  artisan.destinationId = NO_BUILDING;
  const target = nearestByRoad(state, here, sitesToBuild(state));
  if (!target) {
    dismiss(state, artisan);
    return false;
  }
  artisan.destinationId = target.building.id;
  restartOn(artisan, target.path);
  return true;
}

function restartOn(artisan: Artisan, path: Point[]): void {
  artisan.path = path;
  artisan.step = 0;
}

function arrive(state: GameState, artisan: Artisan): void {
  const site = buildingById(state, artisan.destinationId);
  if (!site) throw new Error(`Artisan ${artisan.id} arrived at missing building ${artisan.destinationId}`);
  if (site.production < suppliedStages(site) * VISITS_PER_STAGE) {
    site.production++;
    state.version++;
  }
  dismiss(state, artisan);
}

function dismiss(state: GameState, artisan: Artisan): void {
  state.artisans = state.artisans.filter((a) => a !== artisan);
}
