import type { GameState } from '../sim/state';
import { prioritiesReport, setIndustryOpen, setIndustryPriority, type PrioritiesReport } from '../sim/labor';
import { populationReport } from '../sim/population';
import { productionReport } from '../sim/production';
import { treasuryReport } from '../sim/treasury';
import { createCharterChapter } from './charters';
import { byId } from './dom';
import { populationChapter, prioritiesChapter, productionChapter, treasuryChapter } from './ledger-chapters';

type ChapterId = 'population' | 'production' | 'priorities' | 'treasury' | 'charter';

interface Chapter {
  title: string;
  body: HTMLElement;
}

function createPrioritiesChapter(state: GameState): { body: HTMLElement; update(): void } {
  const body = document.createElement('div');
  let shown = '';
  const render = (report: PrioritiesReport) =>
    body.replaceChildren(
      prioritiesChapter(report, {
        setPriority(industry, priority) {
          setIndustryPriority(state, industry, priority);
          update();
        },
        setOpen(industry, open) {
          setIndustryOpen(state, industry, open);
          update();
        },
      }),
    );
  function update(): void {
    const report = prioritiesReport(state);
    const key = JSON.stringify(report);
    if (key === shown) return;
    shown = key;
    render(report);
  }
  return { body, update };
}

export function createLedger(state: GameState): { update(): void } {
  const ledger = byId('ledger');
  const nav = byId('ledger-chapters');
  const title = byId('ledger-title');
  const page = byId('ledger-page');
  const charter = createCharterChapter(state);
  const priorities = createPrioritiesChapter(state);
  const population = document.createElement('div');
  const production = document.createElement('div');
  const treasury = document.createElement('div');

  const chapters: Record<ChapterId, Chapter> = {
    population: { title: 'Population', body: population },
    production: { title: 'Production', body: production },
    priorities: { title: 'Priorities', body: priorities.body },
    treasury: { title: 'Treasury', body: treasury },
    charter: { title: 'Charter', body: charter.body },
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
      priorities.update();
      population.replaceChildren(populationChapter(populationReport(state)));
      production.replaceChildren(productionChapter(productionReport(state)));
      treasury.replaceChildren(treasuryChapter(treasuryReport(state)));
    },
  };
}
