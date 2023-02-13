import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Circle } from 'src/app/models/gamebus/circle.model';
import { UserState } from 'src/app/models/gamebus/user-state.model';
import { ApiRequest } from 'src/app/models/general/api-request.model';
import { ApiService } from 'src/app/services/api.service';
import { StateService } from 'src/app/services/state.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-circle-challenge',
  templateUrl: './admin-circle.page.html',
  styleUrls: ['./admin-circle.page.scss'],
})
export class AdminCirclePage implements OnInit {

  uris = environment.uris;

  isReady = false;
  isLocked = false;

  cid: number;
  circle: Circle;

  state: UserState;

  nms: any[];

  cuform: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private ss: StateService,
    private fb: FormBuilder,
  ) { }

  async ngOnInit() {
    const cid = this.route.snapshot.paramMap.get('cid');
    if (cid) {
      this.cid = Number(cid);
      this.state = await this.ss.getState();
      await this.parseData();
    }

    this.ss.state$.subscribe(state => { this.state = state; this.parseData(); });

    this.cuform = this.fb.group({
      name: [this.circle.name],
      image: [this.circle.image],
    });

    this.isReady = true;
  }


  async parseData($event?: CustomEvent): Promise<void> {
    const gc: ApiRequest = {
      uri: '/circles/{cid}',
      method: 'GET',
      pathVariables: [
        { key: 'cid', value: this.cid },
      ],
    };
    this.circle = await this.api.promise(gc);


    const pids = this.circle.memberships.map(m => m.player.id);
    let nms: any[] = this.state.circles.campaign.memberships.filter(m => !pids.includes(m.player.id));
    if (nms?.length) {
      nms = nms.map(m => {
        const u = m.player.user;
        const p = m.player;
        return { uid: u.id, pid: p.id, firstname: u.firstName, lastname: u.lastName, image: u.image, circles: {} };
      });
    }
    this.nms = nms;

    if ($event) {
      ($event.target as any).complete();
    }

    return new Promise((resolve) => resolve());
  }


  async updateCircle() {
    this.isLocked = true;

    const form = this.cuform.value;
    Object.keys(form).forEach(k => (!form[k] && form[k] !== undefined) && delete form[k]);

    const requestBody = new FormData();
    requestBody.append('circle', JSON.stringify(form));

    const uc: ApiRequest = {
      uri: '/circles/{cid}',
      method: 'PUT',
      pathVariables: [
        { key: 'cid', value: this.cid },
      ],
      requestBody,
    };
    await this.api.promise(uc);

    await this.ss.parseChallenges();
    this.ss.publishState();

    this.isLocked = false;
  }



  async addMembers() {
    let pids = [];
    const nms = this.nms.filter((nm: any) => nm.selected);
    if (nms?.length) { pids = nms.map((nm: any) => nm.pid); }
    await this.updateMembership('create-force', pids, null, this.cid);
  }


  async updateMembership(action: string, pids: number[], mid: number, cid: number, $event?: CustomEvent, refresh = true) {
    this.isLocked = true;
    if ($event) {
      $event.stopPropagation();
    }

    let um: ApiRequest;
    if (action === 'create') {
      um = {
        uri: '/circles/{cid}/memberships',
        method: 'POST',
        pathVariables: [
          { key: 'cid', value: cid },
        ],
        requestParams: [
          { key: 'playerIds', value: pids },
          { key: 'state', value: 'MEMBERSHIP_REQUESTED' }
        ],
      };
    } else if (action === 'create-force') {
      um = {
        uri: '/circles/{cid}/memberships',
        method: 'POST',
        pathVariables: [
          { key: 'cid', value: cid },
        ],
        requestParams: [
          { key: 'playerIds', value: pids },
          { key: 'state', value: 'MEMBERSHIP_APPROVED' }
        ],
      };
    } else if (action === 'remove') {
      um = {
        uri: '/memberships/{mid}',
        method: 'DELETE',
        pathVariables: [
          { key: 'mid', value: mid },
        ],
      };
    }
    await this.api.promise(um);

    if (refresh) {
      await this.parseData();
    }
    this.isLocked = false;
    return new Promise<void>((resolve) => resolve());
  }

}
