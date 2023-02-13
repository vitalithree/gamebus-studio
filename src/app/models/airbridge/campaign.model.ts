import { ConsentItem } from './consent-item.model';

export class Campaign {

  abbr: string;
  href: string;
  name: string;
  logo: string;
  organizers: number[];
  description: string;
  contactEmail: string;
  contactPerson: string;
  start: Date;
  end: Date;
  consent: ConsentItem[];

}
