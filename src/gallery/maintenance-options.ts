import { maintenanceOffice } from '../render/maintenance-models';
import { type DesignOption, withoutAndWithWorkers } from './options';

export const MAINTENANCE_OPTIONS: DesignOption[] = [
  { name: 'Lashed stand and plank shed', build: () => maintenanceOffice(true), variants: withoutAndWithWorkers(maintenanceOffice) },
];
