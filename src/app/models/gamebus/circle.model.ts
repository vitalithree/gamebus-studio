import { Player } from './user.model';


export class Circle {
  id: number;
  name: string;
  image?: string;
  isPrivate: boolean;
  memberships: Membership[];
}

export class Membership {
  id: number;
  state: string;
  player: Player;
}
