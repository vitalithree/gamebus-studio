import { Injectable } from '@angular/core';
import { CampaignService } from './campaign.service';
import { StateService } from './state.service';


@Injectable({
  providedIn: 'root'
})
export class AppInitService {

  constructor(
    private cs: CampaignService,
    private ss: StateService,
  ) {
  }

  async init(): Promise<void> {

    return new Promise<void>(
      async (resolve) => {

        try {
          await this.cs.parseConfig();
          await this.ss.parseState();
        } catch (e) { }

        resolve();

        await new Promise(r => setTimeout(r, 250));
        document.getElementById('preloader').style.display = 'none';

      }
    );


  }

}
