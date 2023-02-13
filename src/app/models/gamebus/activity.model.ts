import { ActivityScheme, Property } from './activity-scheme.model';
import { Participation, Rule } from './challenge.model';
import { DataProvider } from './data-provider.model';
import { Player, User } from './user.model';


export class Activity {
  id: number;
  date: number;
  isManual: boolean;
  group: string;
  image: string;
  creator: Player;
  player: Player;
  gameDescriptor: ActivityScheme;
  dataProvider: DataProvider;
  propertyInstances: PropertyInstance[];
  personalPoints: PersonalPoint[];
  supports: Support[];
  chats: Chat[];

  isSurvey?: boolean;
  video?: string;
}

export class PropertyInstance {
  id: number;
  value: string;
  property: Property;
}

export interface PersonalPoint {
  id: number;
  value: number;
  participation: Participation;
  challengeRule: Rule;
}

export interface Support {
  id: number;
  date: number;
  supporter: Player;
}

export interface Chat {
  id: number;
  messages: Message[];
}

export interface Message {
  id: number;
  text: string;
  image?: any;
  date: number;
  user: User;
}
