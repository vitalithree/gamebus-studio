/* eslint-disable max-len */
import { Component, OnInit } from '@angular/core';
import { Group } from 'src/app/models/airbridge/group.model';
import { UserState } from 'src/app/models/gamebus/user-state.model';
import { ApiRequest } from 'src/app/models/general/api-request.model';
import { ApiService } from 'src/app/services/api.service';
import { AuthorizationService } from 'src/app/services/authorization.service';
import { StateService } from 'src/app/services/state.service';
import { environment } from 'src/environments/environment';
import { CampaignConfig } from '../../../models/airbridge/campaign-config.model';
import { CampaignService } from '../../../services/campaign.service';


@Component({
  selector: 'app-groups-management',
  templateUrl: './admin-groups.page.html',
  styleUrls: ['./admin-groups.page.scss'],
})
export class AdminGroupsPage implements OnInit {

  uris = environment.uris;

  isReady = false;
  isLocked = false;

  config: CampaignConfig;
  state: UserState;

  gtypes: { name: string; groups: Group[] }[];


  constructor(
    private api: ApiService,
    private as: AuthorizationService,
    private cs: CampaignService,
    private ss: StateService,
  ) {
  }

  async ngOnInit() {

    this.state = await this.ss.getState();
    await this.parseData();

    this.ss.state$.subscribe(state => { this.state = state; this.parseData(); });

    this.isReady = true;
  }


  async parseData(refresh = false, $event?: CustomEvent): Promise<void> {
    this.config = await this.cs.getConfig(refresh);

    const gtypes: { name: string; groups: Group[] }[] = [];
    for (const gtype of [...new Set(['campaign', 'studyarm'].concat(this.config.groups.map(g => g.type)))]) {
      const groups = this.config.groups.filter(g => g.type === gtype);
      groups.forEach(g => {
        const circle = this.state.circles.all.find(c => c.id === g.cid);
        if (circle) { g.members = circle.memberships.length; }
      });
      gtypes.push({ name: gtype, groups });
    }
    this.gtypes = gtypes;



    if ($event) {
      ($event.target as any).complete();
    }
    return new Promise(resolve => resolve());
  }

  async createMissingCircles() {
    const mcs = this.config.groups.filter(g => !g.cid);
    for (const mc of mcs) {
      await this.createCircle(mc.name);
    }
  }


  async createCircle(gname: string, $event?: CustomEvent): Promise<any> {
    this.isLocked = true;
    if ($event) {
      $event.preventDefault();
      $event.stopPropagation();
    }

    const authuser = this.as.getAuthUser();

    const group = this.config.groups.find(g => g.name === gname);
    if (!authuser || !group) { return; }

    const { name, image, shareActivities } = group;
    const type = `${this.config.campaign.abbr}-${group.type}`;



    const circleForm = {
      name, image, type,
      autoAcceptMembershipRequests: true,
      leadersCanLogActivities: true,
      leadersCanSignUpPlayers: true,
      displayPersonalPointsToCircleMembersInMutualChallenges: shareActivities,
      withNudging: false,
      memberships: [authuser.details?.pid],
    };

    const requestBody = new FormData();
    requestBody.append('circle', JSON.stringify(circleForm));

    const createCircle: ApiRequest = {
      uri: '/circles',
      method: 'POST',
      requestBody,
    };
    const gbcircle = await this.api.promise(createCircle);

    if (!gbcircle) { return; }


    const updateAirtable: ApiRequest = {
      uri: `${this.uris.airbridge}/campaigns/{href}`,
      method: 'PATCH',
      isAuthorized: false,
      pathVariables: [
        { key: 'href', value: this.config.campaign.href },
      ],
      requestBody: {
        table: 'groups',
        rref: name,
        rfield: 'cid',
        rvalue: gbcircle.id,
      }
    };
    await this.api.promise(updateAirtable);

    await this.parseData(true);

    this.isLocked = false;
    return new Promise(resolve => resolve(gbcircle));
  }


  async deleteCircle(gname: string, $event?: CustomEvent): Promise<void> {
    this.isLocked = true;
    if ($event) {
      $event.stopPropagation();
    }

    const group = this.config.groups.find(g => g.name === gname);
    if (!group) { return; }

    const deleteCircle: ApiRequest = {
      uri: '/circles/{cid}',
      method: 'DELETE',
      pathVariables: [
        { key: 'cid', value: group.cid },
      ],
    };
    await this.api.promise(deleteCircle);

    // Delete cid in Airtable
    const updateAirtable: ApiRequest = {
      uri: `${this.uris.airbridge}/campaigns/{href}`,
      method: 'PATCH',
      isAuthorized: false,
      pathVariables: [
        { key: 'href', value: this.config.campaign.href },
      ],
      requestBody: {
        table: 'groups',
        rref: gname,
        rfield: 'cid',
        rvalue: null,
      }
    };
    await this.api.promise(updateAirtable);

    this.parseData(true);

    this.isLocked = false;
    return new Promise(resolve => resolve());
  }

}
