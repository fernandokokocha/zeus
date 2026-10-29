import type { Result } from './commands';
import type { GameState } from './state';

export const UPGRADES = ['lyceum', 'cropRotation', 'openFields', 'carrots', 'packMules', 'amphoras', 'democracy', 'plutocracy'] as const;
export type Upgrade = (typeof UPGRADES)[number];

export const UPGRADE_COST = 1;

export const UPGRADE_NAMES: Record<Upgrade, string> = {
  lyceum: 'The Lyceum',
  cropRotation: 'Works and Days',
  openFields: "Demeter's Furrows",
  carrots: 'Daukos',
  packMules: 'Arcadian Mules',
  amphoras: 'Kerameikos',
  democracy: 'Ekklesia',
  plutocracy: 'Laws of Solon',
};

export function hasUpgrade(state: GameState, upgrade: Upgrade): boolean {
  return state.upgrades.includes(upgrade);
}

export function upgraded<T>(state: GameState, upgrade: Upgrade, base: T, improved: T): T {
  return hasUpgrade(state, upgrade) ? improved : base;
}

export function buyUpgrade(state: GameState, upgrade: Upgrade): Result {
  if (hasUpgrade(state, upgrade)) return { ok: false, reason: 'Already owned' };
  if (state.worksOfArt < UPGRADE_COST) return { ok: false, reason: 'Needs a Work of Art' };
  state.worksOfArt -= UPGRADE_COST;
  state.upgrades = [...state.upgrades, upgrade];
  state.version++;
  return { ok: true };
}
