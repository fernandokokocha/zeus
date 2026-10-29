import { AMPHORA_GRANARY_CAPACITY, GRANARY_CAPACITY, ROTATED_LOADS_PER_YEAR, UNITS_PER_LOAD, WHEAT_LOADS_PER_YEAR } from '../sim/food';
import { DEMOCRATIC_WORKING_SHARE, WORKING_SHARE } from '../sim/labor';
import { PLUTOCRATIC_TAX_FACTOR } from '../sim/economy';
import { LYCEUM_PAGES_PER_WORK_OF_ART, PAGES_PER_WORK_OF_ART } from '../sim/scholars';
import type { GameState } from '../sim/state';
import { AMPHORA_LOADS_PER_SLOT, LOADS_PER_SLOT } from '../sim/storehouse';
import { CARAVAN_KM_PER_MONTH, MULE_KM_PER_MONTH } from '../sim/trade';
import { UPGRADES, UPGRADE_COST, UPGRADE_NAMES, buyUpgrade, hasUpgrade, type Upgrade } from '../sim/upgrades';
import { element } from './dom';
import { upgradeArt } from './upgrade-art';

const percent = (share: number) => `${Math.round(share * 100)}%`;
const loads = (units: number) => units / UNITS_PER_LOAD;

const GLOSSES: Record<Upgrade, string> = {
  lyceum: "Aristotle's school",
  cropRotation: "Hesiod's farming poem",
  openFields: 'The grain goddess blesses poorer ground',
  carrots: 'The Greek word for the carrot',
  packMules: 'Sure-footed beasts of the hill country',
  amphoras: "Athens' potters' quarter",
  democracy: 'The assembly of all citizens',
  plutocracy: 'Rank by wealth',
};

const RULES: Record<Upgrade, string> = {
  lyceum: `A Work of Art takes ${LYCEUM_PAGES_PER_WORK_OF_ART} pages instead of ${PAGES_PER_WORK_OF_ART}.`,
  cropRotation: `Farms yield ${ROTATED_LOADS_PER_YEAR} loads a year instead of ${WHEAT_LOADS_PER_YEAR}.`,
  openFields: 'A farm needs meadow on just one of its tiles.',
  carrots: 'Unlocks the Carrot Farm. It harvests in January, half a year from the wheat.',
  packMules: `Caravans travel ${MULE_KM_PER_MONTH} km a month instead of ${CARAVAN_KM_PER_MONTH}.`,
  amphoras: `Storehouse slots of oil or olives hold ${AMPHORA_LOADS_PER_SLOT} loads instead of ${LOADS_PER_SLOT}. Granaries hold ${loads(AMPHORA_GRANARY_CAPACITY)} loads instead of ${loads(GRANARY_CAPACITY)}.`,
  democracy: `${percent(DEMOCRATIC_WORKING_SHARE)} of residents work instead of ${percent(WORKING_SHARE)}.`,
  plutocracy: `Houses pay ${percent(PLUTOCRATIC_TAX_FACTOR - 1)} more tax.`,
};

const COST = `${UPGRADE_COST} Work of Art`;

function upgradeEntry(state: GameState, upgrade: Upgrade, bought: () => void): HTMLElement {
  const owned = hasUpgrade(state, upgrade);
  const art = element('div', 'upgrade-tondo');
  art.innerHTML = upgradeArt(upgrade);
  const action = owned ? element('span', 'upgrade-owned', 'Owned') : element('button', 'upgrade-buy', `Buy for ${COST}`);
  if (action instanceof HTMLButtonElement) {
    action.disabled = state.worksOfArt < UPGRADE_COST;
    if (action.disabled) action.title = 'Scholars make Works of Art';
    action.addEventListener('click', () => {
      buyUpgrade(state, upgrade);
      bought();
    });
  }
  return element(
    'article',
    `upgrade${owned ? ' upgrade-is-owned' : ''}`,
    art,
    element('div', 'upgrade-text', element('h3', '', UPGRADE_NAMES[upgrade]), element('p', 'upgrade-gloss', GLOSSES[upgrade]), element('p', 'upgrade-rule', RULES[upgrade]), action),
  );
}

export function createUpgradesChapter(state: GameState): { body: HTMLElement; update(): void } {
  const body = element('div', 'upgrades-chapter');
  let shown = '';
  function render(): void {
    shown = JSON.stringify([state.worksOfArt, state.upgrades]);
    const works = state.worksOfArt === 1 ? '1 Work of Art' : `${state.worksOfArt} Works of Art`;
    body.replaceChildren(
      element('p', 'ledger-summary', `${works} to spend. Each upgrade costs ${COST} and lasts for good.`),
      element('div', 'upgrade-list', ...UPGRADES.map((upgrade) => upgradeEntry(state, upgrade, render))),
    );
  }
  return {
    body,
    update() {
      if (JSON.stringify([state.worksOfArt, state.upgrades]) !== shown) render();
    },
  };
}
