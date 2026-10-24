import { bakedOnce } from '../render/bake';
import { doricVotive, ionicSphinx, laurelVotive } from '../render/column-models';
import type { DesignOption } from './options';

export const COLUMN_OPTIONS: DesignOption[] = [
  { name: 'A · Doric votive', build: bakedOnce(doricVotive) },
  { name: 'B · Ionic sphinx', build: bakedOnce(ionicSphinx) },
  { name: 'C · Laurel and eagle', build: bakedOnce(laurelVotive) },
];
