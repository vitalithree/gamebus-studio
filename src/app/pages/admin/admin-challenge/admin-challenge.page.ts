/* eslint-disable max-len */
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import * as moment from 'moment';
import { LeaderboardSettings } from 'src/app/components/specific/gb-leaderboard/gb-leaderboard.component';
import { CampaignConfig } from 'src/app/models/airbridge/campaign-config.model';
import { Challenge } from 'src/app/models/gamebus/challenge.model';
import { Circle } from 'src/app/models/gamebus/circle.model';
import { UserState } from 'src/app/models/gamebus/user-state.model';
import { ApiRequest } from 'src/app/models/general/api-request.model';
import { ApiService } from 'src/app/services/api.service';
import { CampaignService } from 'src/app/services/campaign.service';
import { ChallengeService } from 'src/app/services/challenge.service';
import { StateService } from 'src/app/services/state.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-admin-challenge',
  templateUrl: './admin-challenge.page.html',
  styleUrls: ['./admin-challenge.page.scss'],
})
export class AdminChallengePage implements OnInit {

  uris = environment.uris;

  isReady = false;
  isLocked = false;

  config: CampaignConfig;
  state: UserState;

  circles: {
    individuals: { cid: number; uid: number; pid: number; firstname: string; lastname: string; image: string; selected?: boolean; inTeam?: boolean; disabled?: boolean }[];
    teams: { cid: number; name: string; image: string; size?: number; selected?: boolean; disabled?: boolean }[];
    individualsOfTeams: { cid: number; name: string; image: string; size?: number; selected?: boolean }[];
  } = { individuals: [], teams: [], individualsOfTeams: [], };

  xid: number;
  challenge: Challenge;
  view: { segment: string; add: boolean; circles: string } = { segment: 'leaderboard', add: false, circles: 'individuals' };

  settings: LeaderboardSettings;
  sform: FormGroup;

  cuform: FormGroup;



  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private cs: CampaignService,
    private ss: StateService,
    private xs: ChallengeService,
    private fb: FormBuilder,
  ) { }

  async ngOnInit() {
    const xid = this.route.snapshot.paramMap.get('xid');
    if (xid) {
      this.xid = Number(xid);
      this.config = await this.cs.getConfig();
      this.state = await this.ss.getState();
      await this.parseData();
    }

    this.settings = LeaderboardSettings.from({ individuals: true, groups: true });

    this.ss.state$.subscribe(state => this.parseData());

    this.sform = this.fb.group({ individuals: true, groups: true });

    this.cuform = this.fb.group({
      name: [this.challenge.name],
      available: [null],
      start: [null],
      end: [null],
    });

    this.isReady = true;
  }


  async parseData($event?: CustomEvent): Promise<void> {
    const getChallenge: ApiRequest = {
      uri: '/challenges/{xid}',
      method: 'GET',
      pathVariables: [
        { key: 'xid', value: this.xid },
      ],
    };
    this.challenge = await this.api.promise(getChallenge);

    this.challenge.duration = moment(this.challenge.endDate).diff(moment(this.challenge.startDate), 'days');

    if (this.challenge.rewards.length > 0) {
      this.challenge.rewards = this.challenge.rewards.sort((a, b) => b.wonDate - a.wonDate);
    }

    // Parse circles...
    const cids = this.config.groups.filter(g => g.cid).map(g => g.cid);
    const teams = this.state.circles.all.filter(c => cids.includes(c.id)).map(c => ({ cid: c.id, name: c.name, image: c.image, size: c.memberships.length }));
    this.circles.teams = JSON.parse(JSON.stringify(teams));
    this.circles.individualsOfTeams = JSON.parse(JSON.stringify(teams));

    const gpcs: ApiRequest = {
      uri: '/private-circles',
      method: 'GET',
      requestParams: [
        { key: 'canSignUp', value: true },
        { key: 'fields', value: ['id', 'memberships.player'] },
      ],
    };
    const pcs: Circle[] = await this.api.promise(gpcs);
    if (pcs?.length && this.state.circles.campaign) {
      const individuals = pcs.map(c => ({ cid: c.id, uid: c.memberships[0].player.user.id, pid: c.memberships[0].player.id, firstname: c.memberships[0].player.user.firstName, lastname: c.memberships[0].player.user.lastName, image: c.image, }));

      const uids = this.state.circles.campaign.memberships.map(m => m.player.user.id);

      this.circles.individuals = individuals.filter(i => uids.includes(i.uid));
    }

    const pcids = this.challenge.participations.map(p => p.circle.id);
    this.circles.individuals = this.circles.individuals.map((g: any) => ({ ...g, selected: pcids.includes(g.cid), disabled: pcids.includes(g.cid) }));
    this.circles.teams = this.circles.teams.map((g: any) => ({ ...g, selected: pcids.includes(g.cid), disabled: pcids.includes(g.cid) }));

    if ($event) {
      ($event.target as any).complete();
    }

    return new Promise((resolve) => resolve());
  }


  updateSettings() { this.settings = this.sform.value; }

  async updateChallenge() {
    this.isLocked = true;

    let form = this.cuform.value;
    Object.keys(form).forEach(k => (!form[k] && form[k] !== undefined) && delete form[k]);

    form = {
      ...form,
      minCircleSize: this.challenge.minCircleSize,
      maxCircleSize: this.challenge.maxCircleSize,
    };

    const requestBody = new FormData();
    requestBody.append('challenge', JSON.stringify(form));

    const uc: ApiRequest = {
      uri: '/challenges/{xid}',
      method: 'PUT',
      pathVariables: [
        { key: 'xid', value: this.xid },
      ],
      requestBody,
    };
    await this.api.promise(uc);

    await this.ss.parseChallenges();
    this.ss.publishState();

    this.isLocked = false;
  }


  async addParticipants() {

    let participants = [];
    const individuals = this.circles.individuals.filter(individual => (individual.selected || individual.inTeam) && !individual.disabled);
    const teams = this.circles.teams.filter(team => team.selected && !team.disabled);
    if (individuals?.length) { participants = participants.concat(individuals.map(individual => individual.cid)); }
    if (teams?.length) { participants = participants.concat(teams.map(team => team.cid)); }
    if (!participants?.length) { return; }

    await this.xs.joinChallenge(this.xid, participants);

    await this.parseData();
  }


  selectIndividualsOfTeams() {
    this.circles.individuals.forEach(individual => delete individual.inTeam);

    const cids = this.circles.individualsOfTeams.filter(t => t.selected).map(t => t.cid);
    for (const cid of cids) {
      const circle = this.state.circles.all.find(c => c.id === cid);
      if (circle) {
        const pids = circle.memberships.map(m => m.player.id);

        this.circles.individuals.forEach(individual => {
          if (pids.includes(individual.pid)) {
            individual.inTeam = true;
          }
        });
      }
    }
  }

}
