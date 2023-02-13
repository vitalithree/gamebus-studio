import { Component, OnInit } from '@angular/core';
import * as moment from 'moment';
import { CampaignConfig } from 'src/app/models/airbridge/campaign-config.model';
import { Task } from 'src/app/models/airbridge/task.model';
import { Wave } from 'src/app/models/airbridge/wave.model';
import { Challenge } from 'src/app/models/gamebus/challenge.model';
import { UserState } from 'src/app/models/gamebus/user-state.model';
import { ApiRequest } from 'src/app/models/general/api-request.model';
import { ApiService } from 'src/app/services/api.service';
import { CampaignService } from 'src/app/services/campaign.service';
import { ChallengeService } from 'src/app/services/challenge.service';
import { StateService } from 'src/app/services/state.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-admin-challenges',
  templateUrl: './admin-challenges.page.html',
  styleUrls: ['./admin-challenges.page.scss'],
})
export class AdminChallengesPage implements OnInit {

  uris = environment.uris;

  isReady = false;
  isLocked = false;
  config: CampaignConfig;
  state: UserState;

  xpws: { wave: Wave; challenges: Challenge[] }[];

  view: { fab: boolean } = { fab: false, };




  constructor(
    private api: ApiService,
    private cs: CampaignService,
    private ss: StateService,
    private xs: ChallengeService,
  ) {
  }


  async ngOnInit() {
    setTimeout(() => this.view.fab = true, 2500);

    this.state = await this.ss.getState();
    await this.parseData();

    this.ss.state$.subscribe(state => { this.state = state; this.parseData(); });

    this.isReady = true;
  }


  async parseData(refresh = false, $event?: CustomEvent): Promise<void> {
    this.isLocked = true;

    this.xpws = [];
    this.config = await this.cs.getConfig(refresh);

    const gx: ApiRequest = {
      uri: '/challenges',
      method: 'GET',
      requestParams: [
        { key: 'q', value: `${this.config.campaign.abbr}-` },
        { key: 'creator', value: this.config.campaign.organizers[0] },
        { key: 'fields', value: ['id', 'name', 'image', 'startDate', 'creator.id', 'participations'] },
        { key: 'sort', value: 'startDate' },
      ],
    };
    const xs: Challenge[] = await this.api.promise(gx);

    let wxs = [];
    this.config.waves.forEach(wave => {
      const challenges = xs.filter(x => x.name.includes(`-w${wave.id}-`));
      challenges.sort((a, b) => a.name.localeCompare(b.name) || b.id - a.id);
      wxs = wxs.concat(challenges.map(c => c.id));
      this.xpws.push({ wave, challenges });
    });

    const xsnw = xs.filter(x => !wxs.includes(x.id));
    xsnw.sort((a, b) => a.name.localeCompare(b.name) || b.id - a.id);
    this.xpws.push({ wave: { id: NaN, start: null, end: null, isLive: false }, challenges: xsnw });

    if ($event) {
      ($event.target as any).complete();
    }
    this.isLocked = false;
    return new Promise(resolve => resolve());
  }


  async deleteChallenge(xid: number, $event?: CustomEvent): Promise<void> {
    this.isLocked = true;
    if ($event) {
      $event.stopPropagation();
    }

    const deleteChallenge: ApiRequest = {
      uri: '/challenges/{xid}',
      method: 'DELETE',
      pathVariables: [
        { key: 'xid', value: xid },
      ],
    };
    await this.api.promise(deleteChallenge);

    await this.parseData(true);

    this.isLocked = false;
    return new Promise(resolve => resolve());
  }


  async createChallenges(wid: number, strategy: string): Promise<void> {
    this.isLocked = true;

    const wave = this.config.waves.find(w => w.id === wid);
    if (!wave) { return; }

    switch (strategy) {
      case 'multilevel-all-individuals':

        const gpcs: ApiRequest = {
          uri: '/private-circles',
          method: 'GET',
          requestParams: [
            { key: 'canSignUp', value: true },
            { key: 'fields', value: ['id', 'memberships.player'] },
          ],
        };
        const pcs: any[] = await this.api.promise(gpcs);
        if (!pcs?.length || !this.state.circles.campaign) { break; }
        const uids = this.state.circles.campaign.memberships.map(m => m.player.user.id);
        const participants = pcs.filter(c => uids.includes(c.memberships[0].player.user.id)).map(c => c.id);
        const circles = [...new Set([this.state.circles.campaign?.id, ...participants])];

        const task: Task = Task.from({ name: 'Multilevel rule', types: ['scorePoints'], providers: ['gamebusSystem'], points: 0 });
        const rules = await this.xs.convertTasksToRules([task]);

        const challengeForm = {
          creator: this.config.campaign.organizers[0],
          name: `${this.config.campaign.abbr}-ffa-viz:general-w${wave.id}-c${this.state.circles.campaign.id}-`,
          image: this.uris.assets + '/placeholders/ph-challenge.svg',
          minCircleSize: 999,
          maxCircleSize: 999,
          availableDate: moment.utc(wave.start).toISOString(false),
          startDate: moment.utc(wave.start).toISOString(false),
          endDate: moment.utc(wave.end).toISOString(false),
          target: 0,
          contenders: 0,
          rules,
          circles,
        };

        const requestBody = new FormData();
        requestBody.append('challenge', JSON.stringify(challengeForm));

        const cc: ApiRequest = {
          uri: '/challenges',
          method: 'POST',
          requestBody,
        };
        const gbchallenge: Challenge = await this.api.promise(cc);

        await this.xs.joinChallenge(gbchallenge.id, participants);

        await this.ss.parseChallenges();
        this.ss.publishState();
        break;
    }

    this.isLocked = false;

    return new Promise(resolve => resolve());
  }



}
