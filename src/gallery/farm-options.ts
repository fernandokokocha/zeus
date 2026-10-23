// sim/food sits in an import cycle with sim/materials; loading materials first is the order the game uses
import '../sim/materials';
import { CROP_STAGES } from '../sim/food';
import { wheatFarm } from '../render/farm-models';
import type { DesignOption } from './options';

const GROWTH_LABELS = ['0% · ploughed', '25% · sprouting', '50% · growing', '75% · ripe'];

export const FARM_OPTIONS: DesignOption[] = [
  {
    name: 'Field house',
    notes: [
      'A white reed-roofed farmhouse in one corner; the rest of the lot is wheat rows',
      'Growth shows in the rows: bare furrows, green sprouts, tall green-gold, ripe gold',
      'Staffed: a farmer in a blue tunic and straw hat rests on his hoe by the door, swaying and looking around; the door is open',
      'Empty: both hoes lean on the wall and the door is shut',
    ],
    build: () => wheatFarm(CROP_STAGES - 1, true, true),
    variants: Array.from({ length: CROP_STAGES }, (_, stage) => [
      { label: `${GROWTH_LABELS[stage]} — no workers`, build: () => wheatFarm(stage, false, true) },
      { label: `${GROWTH_LABELS[stage]} — with workers`, build: () => wheatFarm(stage, true, true) },
    ]).flat(),
  },
];
