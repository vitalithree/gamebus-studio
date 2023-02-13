import { Group } from './group.model';
import { Wave } from './wave.model';

// TODO: REMOVE = DEPRECATED
export class Treatment {
  wave: Wave;
  groups: TreatmentGroup[];
}

// TODO: REMOVE = DEPRECATED
export class TreatmentGroup extends Group {
  xid: number;
}
