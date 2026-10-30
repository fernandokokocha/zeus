import { storeYard } from '../render/storehouse-models';
import { AMPHORA_LOADS_PER_SLOT, type Bay, LOADS_PER_SLOT } from '../sim/storehouse';
import type { DesignOption } from './options';

const full = (good: Bay['good'], capacity = LOADS_PER_SLOT): Bay => ({ good, loads: capacity, capacity });

const FOUR_PER_SLOT: Bay[] = [full('fleece'), full('olives'), full('oil'), full('wood'), full('wood'), full('marble'), full('bronze'), full('sculptures')];

const SIX_PER_SLOT: Bay[] = [
  full('olives', AMPHORA_LOADS_PER_SLOT),
  full('oil', AMPHORA_LOADS_PER_SLOT),
  full('oil', AMPHORA_LOADS_PER_SLOT),
  { good: 'oil', loads: 5, capacity: AMPHORA_LOADS_PER_SLOT },
  full('fleece'),
  full('wood'),
  full('marble'),
  full('bronze'),
];

const option = (name: string): DesignOption => ({
  name,
  build: () => storeYard(true, FOUR_PER_SLOT),
  variants: [
    { label: 'No workers · empty', build: () => storeYard(false, []) },
    { label: '4 per slot · every good, full', build: () => storeYard(true, FOUR_PER_SLOT) },
    { label: '6 per slot · Amphoras upgrade, oil and olives', build: () => storeYard(true, SIX_PER_SLOT) },
  ],
});

export const STOREHOUSE_OPTIONS: DesignOption[] = [
  option('A · Square bays'),
];
