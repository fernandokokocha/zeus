import type { GameState } from '../sim/state';
import { populationReport } from '../sim/population';
import { productionReport } from '../sim/production';
import { treasuryReport } from '../sim/treasury';
import { createCharterChapter } from './charters';
import { byId } from './dom';
import { populationChapter, prioritiesChapter, productionChapter, treasuryChapter } from './ledger-chapters';
import { SAMPLE_PRIORITIES, type PrioritiesReport } from './ledger-samples';

type ChapterId = 'population' | 'production' | 'priorities' | 'treasury' | 'charter';

interface Chapter {
  title: string;
  sample: boolean;
  body: HTMLElement;
}

function samplePriorities(): HTMLElement {
  const report: PrioritiesReport = { ...SAMPLE_PRIORITIES, industries: SAMPLE_PRIORITIES.industries.map((row) => ({ ...row })) };
  const body = document.createElement('div');
  const render = () =>
    body.replaceChildren(
      prioritiesChapter(report, {
        setPriority(industry, priority) {
          report.industries[industry].priority = priority;
          render();
        },
        setOpen(industry, open) {
          report.industries[industry].open = open;
          render();
        },
      }),
    );
  render();
  return body;
}

export function createLedger(state: GameState): { update(): void } {
  const ledger = byId('ledger');
  const nav = byId('ledger-chapters');
  const title = byId('ledger-title');
  const sampleBadge = byId('ledger-sample');
  const page = byId('ledger-page');
  const charter = createCharterChapter(state);
  const population = document.createElement('div');
  const production = document.createElement('div');
  const treasury = document.createElement('div');

  const chapters: Record<ChapterId, Chapter> = {
    population: { title: 'Population', sample: false, body: population },
    production: { title: 'Production', sample: false, body: production },
    priorities: { title: 'Priorities', sample: true, body: samplePriorities() },
    treasury: { title: 'Treasury', sample: false, body: treasury },
    charter: { title: 'Charter', sample: false, body: charter.body },
  };

  const tabs = (Object.keys(chapters) as ChapterId[]).map((id) => {
    const tab = document.createElement('button');
    tab.textContent = chapters[id].title;
    tab.addEventListener('click', () => show(id));
    nav.append(tab);
    return { id, tab };
  });

  function show(id: ChapterId): void {
    const chapter = chapters[id];
    for (const { id: tabId, tab } of tabs) tab.classList.toggle('active', tabId === id);
    title.textContent = chapter.title;
    sampleBadge.hidden = !chapter.sample;
    page.replaceChildren(chapter.body);
  }

  function toggle(): void {
    ledger.hidden = !ledger.hidden;
  }

  show('population');
  byId('ledger-button').addEventListener('click', toggle);
  byId('ledger-close').addEventListener('click', toggle);
  window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'l' && !e.repeat) toggle();
    if (e.key === 'Escape') ledger.hidden = true;
  });

  return {
    update() {
      if (ledger.hidden) return;
      charter.update();
      population.replaceChildren(populationChapter(populationReport(state)));
      production.replaceChildren(productionChapter(productionReport(state)));
      treasury.replaceChildren(treasuryChapter(treasuryReport(state)));
    },
  };
}
