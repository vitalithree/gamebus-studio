export class User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  image: string;
  language: string;
  player?: Player;
}

export class Player {
  id: number;
  user?: User;
}


