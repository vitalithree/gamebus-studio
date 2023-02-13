import { ActivityScheme } from '../gamebus/activity-scheme.model';
import { Condition } from '../gamebus/challenge.model';
import { Group } from './group.model';
import { Wave } from './wave.model';


export class Task {

  name: string;
  desc: string;
  categories: string[];
  image: string;
  video: string;
  enforced: boolean;
  types: string[];
  waves: Wave[];
  groups: Group[];
  providers: string[];
  maxFired: number;
  withinPeriod: number;
  onDays: number[];
  points: number;
  requiresImage: boolean;
  requiresVideo: boolean;
  requiresDescription: boolean;
  minDuration: number;
  minSteps: number;
  hasSecret: string;

  display?: boolean;

  rid?: number;
  numberOfFiresInTimeWindow?: number;
  conditions?: Condition[];
  defaultGameDescriptor?: ActivityScheme;
  restrictedGameDescriptors?: ActivityScheme[];

  public static from(obj: any): Task {
    return obj;
  }
}
