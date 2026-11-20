import { DEFAULT_SEED } from '../sim/map';
import { START_CITIES, type StartCity } from '../sim/start-cities';
import { byId, element } from './dom';

const MAX_RANDOM_SEED = 1_000_000;

const CITY_ENTRIES: Record<StartCity, { title: string; about: string }> = {
  scholars: { title: 'Scholars', about: 'A Townhouse district on Ornate streets, a Scholars’ House permit and scrolls in storage.' },
  upgrades: { title: 'Upgrades', about: 'The scholars city with a Work of Art for every upgrade.' },
  monument: {
    title: 'Monument',
    about: 'The scholars city with a Monument block to the west: four Townhouses, a Park on each side, marble for Ornate Roads.',
  },
};

export function createMenu(params: URLSearchParams): void {
  const menu = byId('menu');
  const toggle = () => (menu.hidden = !menu.hidden);
  byId('menu-cities').append(...START_CITIES.map((city) => cityEntry(city)));

  const seed = byId<HTMLInputElement>('menu-seed');
  seed.value = params.get('seed') ?? String(DEFAULT_SEED);
  byId('menu-random').addEventListener('click', () => {
    seed.value = String(Math.floor(Math.random() * MAX_RANDOM_SEED));
    byId<HTMLFormElement>('menu-map').submit();
  });

  byId('menu-button').addEventListener('click', toggle);
  byId('menu-close').addEventListener('click', toggle);
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') menu.hidden = true;
  });
}

function cityEntry(city: StartCity): HTMLElement {
  const { title, about } = CITY_ENTRIES[city];
  const link = element('a', 'city', element('strong', '', title), element('span', '', about), element('code', '', `?city=${city}`));
  link.href = `?city=${city}`;
  return element('li', '', link);
}
