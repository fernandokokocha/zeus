import { backdropStage } from '../render/drama-school-models';
import { type DesignOption, withoutAndWithWorkers } from './options';

export const DRAMA_SCHOOL_OPTIONS: DesignOption[] = [
  { name: 'Painted backdrop', build: () => backdropStage(true), variants: withoutAndWithWorkers(backdropStage) },
];
