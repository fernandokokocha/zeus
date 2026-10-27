import { BUILDING_SPECS, type BuildingType } from './buildings';
import { adjacentRoadTiles } from './commands';
import { UNITS_PER_LOAD } from './food';
import { recordFlow } from './flows';
import { postNotice } from './notices';
import { findRoadPath, nearestByRoad } from './pathfinding';
import type { Point } from './point';
import { ROAMER_REST_TICKS, exitTile } from './roamers';
import { NO_BUILDING, buildingById, type Artisan, type Building, type GameState, type Good } from './state';
import { isRoad, walkPath } from './walking';

export type Sanctuary = 'demeterSanctuary' | 'athenaSanctuary' | 'hephaestusSanctuary';
export type SanctuaryMaterial = 'marble' | 'wood' | 'sculptures';

export interface SanctuarySpec {
  god: string;
  initialMarbleLoads: number;
  loads: Record<SanctuaryMaterial, number>;
}

export const SANCTUARY_SPECS: Record<Sanctuary, SanctuarySpec> = {
  demeterSanctuary: { god: 'Demeter', initialMarbleLoads: 27, loads: { marble: 110, wood: 20, sculptures: 10 } },
  athenaSanctuary: { god: 'Athena', initialMarbleLoads: 24, loads: { marble: 67, wood: 22, sculptures: 8 } },
  hephaestusSanctuary: { god: 'Hephaestus', initialMarbleLoads: 13, loads: { marble: 48, wood: 14, sculptures: 6 } },
};

export const SANCTUARIES = Object.keys(SANCTUARY_SPECS) as Sanctuary[];
export const SANCTUARY_MATERIALS: SanctuaryMaterial[] = ['marble', 'wood', 'sculptures'];
export const SANCTUARY_STAGES = 5;
export const VISITS_PER_STAGE = 4;
export const SANCTUARY_WORK = SANCTUARY_STAGES * VISITS_PER_STAGE;

export function initialMarble(type: Sanctuary): number {
  return SANCTUARY_SPECS[type].initialMarbleLoads * UNITS_PER_LOAD;
}

export function materialNeeded(type: Sanctuary, material: SanctuaryMaterial): number {
  return SANCTUARY_SPECS[type].loads[material] * UNITS_PER_LOAD;
}

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
  const type = sanctuaryOf(site);
  return Math.min(...SANCTUARY_MATERIALS.map((m) => Math.floor((site[m] * SANCTUARY_STAGES) / materialNeeded(type, m))));
}

export function stillNeeded(type: Sanctuary, stock: Record<Good, number>, good: Good): number {
  const material = good as SanctuaryMaterial;
  return materialNeeded(type, material) - stock[material];
}

export function storedMarble(state: GameState): number {
  return storehouses(state).reduce((sum, s) => sum + s.marble, 0);
}

function storehouses(state: GameState): Building[] {
  return state.buildings.filter((b) => b.type === 'storehouse');
}

export function sanctuaryObstacle(state: GameState, type: Sanctuary): string | null {
  if (state.buildings.some((b) => b.type === type)) return `Only one ${BUILDING_SPECS[type].name} is allowed`;
  const stored = storedMarble(state);
  if (stored >= initialMarble(type)) return null;
  return `Needs ${SANCTUARY_SPECS[type].initialMarbleLoads} loads of marble in storehouses (has ${Math.floor(stored / UNITS_PER_LOAD)})`;
}

export function recordConstruction(state: GameState, good: Good, units: number): void {
  recordFlow(state, 'used', good, units);
  recordFlow(state, 'wanted', good, units);
}

export function takeInitialMarble(state: GameState, site: Building): void {
  let left = initialMarble(sanctuaryOf(site));
  for (const storehouse of storehouses(state).sort((a, b) => b.marble - a.marble)) {
    const taken = Math.min(left, storehouse.marble);
    storehouse.marble -= taken;
    left -= taken;
  }
  site.marble = initialMarble(sanctuaryOf(site));
  recordConstruction(state, 'marble', site.marble);
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
    if (isFinished(site)) postNotice(state, `The ${BUILDING_SPECS[site.type].name} is finished`, site);
  }
  dismiss(state, artisan);
}

function dismiss(state: GameState, artisan: Artisan): void {
  state.artisans = state.artisans.filter((a) => a !== artisan);
}
