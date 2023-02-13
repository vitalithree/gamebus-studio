export class Page {
  page: string;
  parent: Page;
  inMenu: boolean;
  inTabbar: boolean;
  tabOrder: number;
  config: any;
  forOrganizer: boolean;
  wids: number[];
  cids: number[];

  q?: { [x: string]: string };

  name?: string;
  tk?: string;
  route?: string;
  icon?: string;

}
