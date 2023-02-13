import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import * as moment from 'moment';
import { CampaignConfig } from 'src/app/models/airbridge/campaign-config.model';
import { Group } from 'src/app/models/airbridge/group.model';
import { Wave } from 'src/app/models/airbridge/wave.model';
import { Challenge } from 'src/app/models/gamebus/challenge.model';
import { ApiRequest } from 'src/app/models/general/api-request.model';
import { ApiService } from 'src/app/services/api.service';
import { AuthorizationService } from 'src/app/services/authorization.service';
import { CampaignService } from 'src/app/services/campaign.service';
import { ChallengeService } from 'src/app/services/challenge.service';
import { environment } from 'src/environments/environment';


@Component({
  selector: 'app-admin-tasks',
  templateUrl: './admin-tasks.page.html',
  styleUrls: ['./admin-tasks.page.scss'],
})
export class AdminTasksPage implements OnInit {

  uris = environment.uris;

  isReady = false;
  isLocked = false;
  config: CampaignConfig;

  treatments: { wave: Wave; groups: { group: Group; xid?: number }[] }[];

  constructor(
    private router: Router,
    private api: ApiService,
    private as: AuthorizationService,
    private cs: CampaignService,
    private xs: ChallengeService,
  ) {
  }


  async ngOnInit() {
    await this.parseData();

    this.isReady = true;
  }


  async parseData(refresh = false, $event?: CustomEvent): Promise<void> {
    this.config = await this.cs.getConfig(refresh);

    const getChallengesWithFFAEnforcedTasks: ApiRequest = {
      uri: '/challenges',
      method: 'GET',
      requestParams: [
        { key: 'q', value: `${this.config.campaign.abbr}-ffa-tasks:enforced` },
        { key: 'creator', value: this.config.campaign.organizers[0] },
        { key: 'limit', value: 100 },
        { key: 'fields', value: ['id', 'name', 'image', 'description', 'startDate', 'endDate', 'creator.id', 'participations.points'] },
        { key: 'sort', value: '-startDate' },
      ],
    };
    const challenges: Challenge[] = await this.api.promise(getChallengesWithFFAEnforcedTasks);

    const treatments: { wave: Wave; groups: { group: Group; xid?: number }[] }[] = [];
    for (const task of this.config.tasks.filter(t => t.enforced)) {
      for (const wave of task.waves) {
        if (!treatments.find(t => t.wave.id === wave.id)) {
          treatments.push({ wave, groups: [] });
        }
        const treatment = treatments.find(t => t.wave.id === wave.id);
        for (const group of task.groups) {
          if (!treatment.groups.find(g => g.group.cid === group.cid)) {
            let xid: number;
            // eslint-disable-next-line max-len
            const challenge: Challenge = challenges.find(x => x.name.includes('tasks:enforced') && x.name.includes(`w${wave.id}-c${group.cid}`));
            if (challenge) { xid = challenge.id; }
            treatment.groups.push({ group, xid });
          }
        }
      }
    }
    this.treatments = treatments;

    if ($event) {
      ($event.target as any).complete();
    }
    return new Promise(resolve => resolve());
  }





  async createChallenge(wid: number, cid: number, $event?: CustomEvent): Promise<any> {
    this.isLocked = true;
    if ($event) {
      $event.preventDefault();
      $event.stopPropagation();
    }
    const authuser = this.as.getAuthUser();

    const tasks = this.config.tasks.filter(task => task.enforced
      && task.waves.find(w => w.id === wid) && task.groups.find(c => c.cid === cid));

    const wave = this.config.waves.find(w => w.id === wid);
    const group = this.config.groups.find(g => g.cid === cid);

    if (!authuser || !tasks.length || !wave || !group) { return; }

    const rules = await this.xs.convertTasksToRules(tasks);
    if (!rules.length) { return; };

    const challengeForm = {
      creator: this.config.campaign.organizers[0],
      isPublic: false,
      name: `${this.config.campaign.abbr}-ffa-tasks:enforced-w${wave.id}-c${group.cid}-`,
      image: this.uris.assets + '/placeholders/ph-challenge-tasks.svg',
      minCircleSize: 999,
      maxCircleSize: 999,
      availableDate: moment().subtract(10, 'seconds').valueOf(),
      startDate: moment(wave.start).valueOf(),
      endDate: moment(wave.end).valueOf(),
      target: 0,
      contenders: 0,
      rules,
      circles: [cid],
    };

    const requestBody = new FormData();
    requestBody.append('challenge', JSON.stringify(challengeForm));

    const createChallenge: ApiRequest = {
      uri: '/challenges',
      method: 'POST',
      requestBody,
    };
    const gbchallenge: Challenge = await this.api.promise(createChallenge);

    await this.parseData(true);

    this.isLocked = false;
    return new Promise(resolve => resolve(gbchallenge));
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






}
