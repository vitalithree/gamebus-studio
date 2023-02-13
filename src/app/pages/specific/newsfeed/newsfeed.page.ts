import { Component, OnInit, ViewChild } from '@angular/core';
import { IonInfiniteScroll } from '@ionic/angular';
import { CampaignConfig } from 'src/app/models/airbridge/campaign-config.model';
import { Page } from 'src/app/models/airbridge/page.model';
import { UserState } from 'src/app/models/gamebus/user-state.model';
import { CampaignService } from 'src/app/services/campaign.service';
import { StateService } from 'src/app/services/state.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-newsfeed-viz',
  templateUrl: './newsfeed.page.html',
  styleUrls: ['./newsfeed.page.scss'],
})
export class NewsfeedPage implements OnInit {

  @ViewChild(IonInfiniteScroll) infinite: IonInfiniteScroll;

  uris = environment.uris;

  isReady = false;
  isLocked = false;

  config: CampaignConfig;
  state: UserState;

  page: Page;

  constructor(
    private cs: CampaignService,
    private ss: StateService,
  ) {
  }

  async ngOnInit() {

    this.state = await this.ss.getState();
    await this.parseData();

    this.ss.state$.subscribe(state => { this.state = state; this.parseData(); });

    const route = this.cs.getRoutes().find(p => p.route === window.location.pathname);
    if (route) {
      this.page = this.state.pages.find(p => p.page === route.name);
      // if (this.page?.config) { this.settings = this.page.config; }
    }

    this.isReady = true;
  }



  async parseData($event?: CustomEvent): Promise<void> {
    if (this.isLocked) { return; }
    this.isLocked = true;

    const curlen = this.state?.newsfeed?.items?.length || 0;

    let reset = false;
    if ($event?.type === 'ionRefresh') {
      reset = true;
      this.infinite.disabled = false;
    }

    if ($event || !curlen) {
      await this.ss.parseNewsfeed(reset);
    }
    this.state = await this.ss.getState();

    const newlen = this.state?.newsfeed?.items?.length || 0;

    if ($event) {
      ($event.target as any).complete();
      if (curlen === newlen && $event?.type === 'ionInfinite') {
        ($event.target as any).disabled = true;
      }
    }

    this.isLocked = false;
    return new Promise(resolve => resolve());
  }



}
