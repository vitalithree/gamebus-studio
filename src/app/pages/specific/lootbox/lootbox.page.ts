import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LootboxSettings } from 'src/app/components/specific/gb-lootbox-card/gb-lootbox-card.component';
import { CampaignConfig } from 'src/app/models/airbridge/campaign-config.model';
import { Page } from 'src/app/models/airbridge/page.model';
import { Challenge } from 'src/app/models/gamebus/challenge.model';
import { UserState } from 'src/app/models/gamebus/user-state.model';
import { StateService } from 'src/app/services/state.service';
import { environment } from 'src/environments/environment';
import { CampaignService } from '../../../services/campaign.service';


@Component({
  selector: 'app-lootbox-viz',
  templateUrl: './lootbox.page.html',
  styleUrls: ['./lootbox.page.scss'],
})
export class LootboxPage implements OnInit {

  uris = environment.uris;

  isReady = false;
  isLocked = false;

  config: CampaignConfig;
  state: UserState;

  page: Page;
  challenges: Challenge[];
  settings: LootboxSettings;

  view: { fab: boolean } = { fab: false };


  constructor(
    private route: ActivatedRoute,
    private cs: CampaignService,
    private ss: StateService,
  ) { }

  async ngOnInit() {

    setTimeout(() => this.view.fab = true, 2500);

    this.config = await this.cs.getConfig();
    this.cs.config$.subscribe(config => this.config = config);

    this.state = await this.ss.getState();
    this.ss.state$.subscribe(state => { this.state = state; this.parseData(); });

    this.ss.points$.subscribe(() => this.parseData(true));

    this.route.queryParams.subscribe(q => this.parseData());

    this.isReady = true;
  }


  async parseData(refresh = false, $event?: CustomEvent): Promise<void> {
    this.isLocked = true;

    let key = '-';
    this.route.queryParams.subscribe(q => {
      if (q.key) { key = q.key; }
    });

    const route = this.cs.getRoutes().find(p => p.route === window.location.pathname);
    if (route) {
      this.page = this.state.pages.find(p => p.page === route.name && (key === '-' || p.config?.q?.key === key));
      if (this.page?.config) {
        this.settings = this.page.config;
      }
    }

    if (refresh) {
      this.state = await this.ss.parseState(refresh);
      this.ss.publishState();
    }

    const challenges = this.state.challenges.active.filter(c => (c.name.includes('viz:general') || c.name.includes('viz:lootbox'))
      && c.name.includes(key));

    challenges.sort((a, b) => a.availableDate - b.availableDate);

    this.challenges = challenges;

    if ($event) {
      ($event.target as any).complete();
    }
    this.isLocked = false;
    return new Promise(resolve => resolve());
  }

}
