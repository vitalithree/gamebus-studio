export class Group {

  name: string;
  cid: number;
  image: string;
  type: string;
  parents: Group[];
  assignment: string;
  shareActivities: boolean;

  isMember?: boolean;
  members?: number;

}
