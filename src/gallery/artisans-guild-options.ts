import { architectsHall } from '../render/guild-models';
import { type DesignOption, withoutAndWithWorkers } from './options';

export const ARTISANS_GUILD_OPTIONS: DesignOption[] = [
  { name: "Architects' hall", build: () => architectsHall(true), variants: withoutAndWithWorkers(architectsHall) },
];
