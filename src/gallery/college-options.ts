import { tholosSchool } from '../render/college-models';
import { type DesignOption, withoutAndWithWorkers } from './options';

export const COLLEGE_OPTIONS: DesignOption[] = [
  { name: 'Tholos and writing yard', build: () => tholosSchool(true), variants: withoutAndWithWorkers(tholosSchool) },
];
