import { START_CITIES, type StartCity } from '../sim/start-cities';
import { byId, element } from './dom';

const CITY_ENTRIES: Record<StartCity, { title: string; about: string }> = {
  scholars: { title: 'Scholars', about: 'A Townhouse district on Ornate streets, a Scholars’ House permit and scrolls in storage.' },
  upgrades: { title: 'Upgrades', about: 'The scholars city with a Work of Art for every upgrade.' },
  monument: {
    title: 'Monument',
    about: 'The scholars city with a Monument block to the west: four Townhouses, a Park on each side, marble for Ornate Roads.',
  },
};

export function createCityGallery(): void {
  const gallery = byId('cities');
  const toggle = () => (gallery.hidden = !gallery.hidden);
  byId('cities-list').append(
    ...START_CITIES.map((city) => cityEntry(`?city=${city}`, CITY_ENTRIES[city].title, CITY_ENTRIES[city].about)),
    cityEntry('./', 'New map', 'A freshly generated map with nothing built.'),
  );
  byId('cities-button').addEventListener('click', toggle);
  byId('cities-close').addEventListener('click', toggle);
}

function cityEntry(href: string, title: string, about: string): HTMLElement {
  const link = element('a', 'city', element('strong', '', title), element('span', '', about));
  link.href = href;
  return element('li', '', link);
}
