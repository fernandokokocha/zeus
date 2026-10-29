import { CROP_STAGES, type Farm } from '../sim/food';
import { farmModelOf } from '../render/farm-models';
import type { DesignOption } from './options';

const GROWTH_LABELS = ['0% · ploughed', '25% · sprouting', '50% · growing', '75% · ripe'];

function growthVariants(farm: Farm): DesignOption['variants'] {
  return Array.from({ length: CROP_STAGES }, (_, stage) => [
    { label: `${GROWTH_LABELS[stage]} — no workers`, build: () => farmModelOf(farm, stage, false, true) },
    { label: `${GROWTH_LABELS[stage]} — with workers`, build: () => farmModelOf(farm, stage, true, true) },
  ]).flat();
}

export const FARM_OPTIONS: DesignOption[] = [
  {
    name: 'Field house',
    notes: [
      'A white reed-roofed farmhouse in one corner; the rest of the lot is wheat rows',
      'Growth shows in the rows: bare furrows, green sprouts, tall green-gold, ripe gold',
      'Staffed: a farmer in a blue tunic and straw hat rests on his hoe by the door, swaying and looking around; the door is open',
      'Empty: both hoes lean on the wall and the door is shut',
    ],
    build: () => farmModelOf('wheatFarm', CROP_STAGES - 1, true, true),
    variants: growthVariants('wheatFarm'),
  },
];

export const CARROT_FARM_OPTIONS: DesignOption[] = [
  {
    name: 'Carrot beds',
    notes: [
      "The Wheat Farm's farmhouse, with rows of leafy carrot tufts instead of wheat",
      'Growth shows in the leaves: bare furrows, small tufts, fuller tufts, and orange tops peeking out when ripe',
    ],
    build: () => farmModelOf('carrotFarm', CROP_STAGES - 1, true, true),
    variants: growthVariants('carrotFarm'),
  },
];
