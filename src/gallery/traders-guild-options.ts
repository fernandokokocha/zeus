import { exchangeHall } from '../render/traders-guild-models';
import type { DesignOption } from './options';

export const TRADERS_GUILD_OPTIONS: DesignOption[] = [
  {
    name: 'A · Exchange hall',
    build: () => exchangeHall(true),
    variants: [
      { label: 'Fully supplied', build: () => exchangeHall(true) },
      { label: 'Missing a need', build: () => exchangeHall(false) },
    ],
  },
];
