import { Component, OnInit } from '@angular/core';
import { AlertController, AlertInput } from '@ionic/angular';
import * as moment from 'moment';
import { CampaignConfig } from 'src/app/models/airbridge/campaign-config.model';
import { Challenge } from 'src/app/models/gamebus/challenge.model';
import { Circle } from 'src/app/models/gamebus/circle.model';
import { UserState } from 'src/app/models/gamebus/user-state.model';
import { ApiRequest } from 'src/app/models/general/api-request.model';
import { ApiService } from 'src/app/services/api.service';
import { AuthorizationService } from 'src/app/services/authorization.service';
import { CampaignService } from 'src/app/services/campaign.service';
import { ChallengeService } from 'src/app/services/challenge.service';
import { StateService } from 'src/app/services/state.service';
import { environment } from 'src/environments/environment';


@Component({
  selector: 'app-admin-user-management',
  templateUrl: './admin-user-management.page.html',
  styleUrls: ['./admin-user-management.page.scss'],
})
export class AdminUserManagementPage implements OnInit {

  uris = environment.uris;

  isReady = false;
  isLocked = false;

  config: CampaignConfig;
  state: UserState;

  users: { enrolled: any[]; pirates: any[] } = { enrolled: [], pirates: [] };
  gtypes: string[];
  challenges: Challenge[];
  privatecircles: { cid: number; uid: number }[];

  view: any[] = [];

  constructor(
    private api: ApiService,
    private as: AuthorizationService,
    private cs: CampaignService,
    private ss: StateService,
    private xs: ChallengeService,
    private alertCtrl: AlertController,
  ) {
  }



  async ngOnInit() {
    const gpcs: ApiRequest = {
      uri: '/private-circles',
      method: 'GET',
      requestParams: [
        { key: 'canSignUp', value: true },
        { key: 'fields', value: ['id', 'memberships.player'] },
      ],
    };
    const pcs: Circle[] = await this.api.promise(gpcs);
    this.privatecircles = pcs.map((c: any) => ({ cid: c.id, uid: c.memberships[0].player.user.id }));



    this.config = await this.cs.getConfig();

    await this.parseData();

    this.isReady = true;
  }


  async parseData(refresh = false, $event?: CustomEvent): Promise<void> {
    this.state = await this.ss.parseState(refresh);
    if (refresh) {
      this.ss.publishState();
    }
    if (!this.state.circles.campaign) {
      if ($event) {
        ($event.target as any).complete();
      }
      return new Promise(resolve => resolve());
    }

    this.gtypes = [...new Set(['campaign', 'studyarm', ...this.config.groups.map(g => g.type)])];

    const gxs: ApiRequest = {
      uri: '/challenges',
      method: 'GET',
      requestParams: [
        { key: 'q', value: this.config.campaign.abbr },
        { key: 'creator', value: this.config.campaign.organizers[0] },
        { key: 'page', value: 0 },
        { key: 'limit', value: 100 },
        { key: 'sort', value: ['-startDate'] },
        { key: 'fields', value: ['id', 'name', 'image', 'startDate', 'endDate', 'participations'] },
      ],
    };
    this.challenges = await this.api.promise(gxs);

    const users = this.state.circles.campaign.memberships.map(m => {
      const u = m.player.user;
      const p = m.player;
      return { uid: u.id, pid: p.id, firstname: u.firstName, lastname: u.lastName, image: u.image, circles: {} };
    });


    users.forEach((user: any) => {
      this.gtypes.forEach(ctype => {
        const circles = this.config.groups.filter(g => g.type === ctype);
        circles.forEach(circle => {
          const gbcircle = this.state.circles.all.find(c => c.id === circle.cid);
          const membership = gbcircle?.memberships.find(m => m.player.user.id === user.uid);
          if (membership) {
            if (!user.circles[ctype]) {
              user.circles[ctype] = [];
            }
            const { id, name, image } = gbcircle;
            const leads = membership.state === 'LEADERSHIP_APPROVED';
            user.circles[ctype].push({ id, name, image, mid: membership.id, leads });
          }
        });
      });


      let xs = this.challenges.filter(
        c => c.participations.find(
          p => p.circle.memberships.find(m => m.player.id === user.pid)));

      xs = xs.map(c => {
        const participation = c.participations.find(
          p => p.circle.memberships.find(m => m.player.id === user.pid));
        const cid = participation.circle.id;
        const isPrivate = participation.circle.isPrivate;
        return { ...c, cid, isPrivate, };
      });

      user.challenges = xs;
    });

    users.sort((a, b) => a.uid - b.uid);

    this.users.enrolled = users.filter((u: any) => u.circles.campaign);

    if ($event) {
      ($event.target as any).complete();
    }
    return new Promise(resolve => resolve());
  }









  async promptCircleSelect(gtype: string, user: any, $event?: CustomEvent) {
    if ($event) {
      $event.stopPropagation();
    }

    const groups = this.config.groups.filter(g => g.type === gtype);
    if (!groups?.length) { return; }

    const inputs = groups.map(group => {
      const disabled = !group.cid || user.circles[gtype]?.find((c: Circle) => c.id === group.cid);
      return { name: group.name, type: 'radio', label: group.name, value: group.cid, disabled };
    }) as AlertInput[];

    const alert = await this.alertCtrl.create({
      header: 'Select ' + gtype,
      inputs,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
        }, {
          text: 'Ok',
          handler: (cid) => {
            this.updateMembership('create-force', [user.pid], null, cid);
          }
        }
      ]
    });

    await alert.present();
  }


  async updateMembership(action: string, pids: number[], mid: number, cid: number, $event?: CustomEvent, refresh = true) {
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
      await this.parseData(true);
    }
    return new Promise<void>((resolve) => resolve());
  }






  async removeParticipation(xid: number, cid: number, $event?: CustomEvent, refresh = true) {
    if ($event) {
      $event.stopPropagation();
    }

    const rpx: ApiRequest = {
      uri: '/challenges/{xid}/player/{pid}/participants',
      method: 'DELETE',
      pathVariables: [
        { key: 'xid', value: xid },
        { key: 'pid', value: this.as.getAuthUser().details?.pid },
      ],
      requestParams: [
        { key: 'circles', value: [cid] },
      ],
    };
    await this.api.promise(rpx);

    if (refresh) {
      await this.parseData(true);
    }
    return new Promise<void>((resolve) => resolve());
  }




  async promptChallengeSelect(uid: number, $event?: CustomEvent) {
    if ($event) {
      $event.stopPropagation();
    }

    const user = this.users.enrolled.find((u: any) => u.uid === uid);

    const now = moment();

    const inputs: any[] = this.challenges.filter(x => moment(x.endDate).isAfter(now))
      .map(x => ({
        name: x.name, type: 'radio', label: `${x.name} (${x.id})`, value: x.id,
        disabled: !!user.challenges.find((xx: any) => xx.id === x.id && xx.isPrivate)
      }));

    const alert = await this.alertCtrl.create({
      header: 'Select challenge',
      inputs,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
        }, {
          text: 'Ok',
          handler: async (xid) => {
            const circle = this.privatecircles.find((c: any) => c.uid === uid);
            if (!circle) { return; }
            await this.xs.joinChallenge(xid, [circle.cid]);
            await this.parseData(true);
          }
        }
      ]
    });

    await alert.present();
  }



  async removeUserFromCampaign(user: any) {
    // await this.updateMembership('remove', [user.pid], user.supervisor.mid, this.campaign.supervisorCircle, undefined, false);

    // if (user.departments !== undefined && user.departments != null) {
    //   for (const d of user.departments) {
    //     await this.updateMembership('remove', [user.pid], d.mid, d.cid, undefined, false);
    //   }
    // }

    // if (user.treatments !== undefined && user.treatments != null) {
    //   for (const t of user.treatments) {
    //     await this.updateMembership('remove', [user.pid], t.mid, t.cid, undefined, false);
    //   }
    // }

    // if (user.challenges !== undefined && user.challenges != null) {
    //   for (const x of user.challenges) {
    //     if (x.isPrivate) {
    //       await this.removeParticipation(x.xid, x.cid, undefined, false);
    //     }
    //   }
    // }

    // // await this.ss.parseCircleState().then((state: UserState) => this.state = state);
    // await this.parseData(true);
  }


  async removeAllPirates() {
    // for (const pirate of this.pirates) {
    //   await this.removePirate(pirate, undefined, false);
    // }

    // // await this.ss.parseCircleState().then((state: UserState) => this.state = state);
    // await this.parseData(true);
  }

  async removePirate(pirate: any, $event?: any, refresh = true) {
    // if ($event) {
    //   $event.stopPropagation();
    // }

    // if (pirate.cid !== undefined && pirate.cid != null) {
    //   if (pirate.xid !== undefined && pirate.xid != null && pirate.isPrivate) {
    //     // Remove challenge participation
    //     await this.removeParticipation(pirate.xid, pirate.cid, undefined, false);
    //   } else {
    //     // Remove circle membership
    //     await this.updateMembership('remove', [pirate.pid], pirate.mid, pirate.cid, undefined, false);
    //   }
    // }

    // if (refresh) {
    //   // await this.ss.parseCircleState().then((state: UserState) => this.state = state);
    //   await this.parseData(true);
    // }

    // return new Promise<void>((resolve) => resolve());
  }






  updateView(uid: number) {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    this.view.includes(uid) ? this.view = this.view.filter((u: number) => u !== uid) : this.view.push(uid);
  }


}
