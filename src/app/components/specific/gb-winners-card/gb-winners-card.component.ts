import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ApiRequest } from 'src/app/models/general/api-request.model';
import { AuthUser } from 'src/app/models/general/auth-user.model';
import { UserState } from 'src/app/models/gamebus/user-state.model';
import { ApiService } from 'src/app/services/api.service';
import { AuthorizationService } from 'src/app/services/authorization.service';
import { CampaignService } from 'src/app/services/campaign.service';
import { StateService } from 'src/app/services/state.service';
import { environment } from 'src/environments/environment';
import { Challenge } from 'src/app/models/gamebus/challenge.model';

@Component({
  selector: 'app-winners-card',
  templateUrl: './gb-winners-card.component.html',
  styleUrls: ['./gb-winners-card.component.scss'],
})
export class WinnersCardComponent implements OnInit, OnChanges {

  @Input() challenge: Challenge;

  uris = environment.uris;

  isReady = false;
  isLocked = false;
  isOrganizer = false;

  authuser: AuthUser;
  state: UserState;

  rewards: any[];

  view: number[] = [];

  constructor(
    private api: ApiService,
    private as: AuthorizationService,
    private cs: CampaignService,
    private ss: StateService,
  ) { }

  async ngOnInit() {
    this.authuser = this.as.getAuthUser();
    this.isOrganizer = await this.cs.isOrganizer();

    this.state = await this.ss.getState();
    await this.parseData();

    this.ss.state$.subscribe(state => { this.state = state; this.parseData(); });

    this.isReady = true;
  }


  async ngOnChanges(changes: SimpleChanges) {
    this.state = await this.ss.getState();
    await this.parseData();
  }

  parseData(): Promise<void> {
    if (!this.challenge.rewardConfig?.length) { return; }


    this.rewards = [];
    for (const rc of this.challenge.rewardConfig) {
      let reward: any = {
        id: rc.id,
        name: rc.rewardType.name,
        image: rc.rewardType.image,
        description: rc.rewardType.description,
        amount: rc.amount,
        challenge: {
          id: this.challenge.id,
          name: this.challenge.name,
          startDate: this.challenge.startDate,
          endDate: this.challenge.endDate,
          target: this.challenge.target,
          contenders: this.challenge.contenders,
        },
      };

      reward.instances = this.challenge.rewards.filter(r => r.rewardType.name === reward.name);
      reward.stillLeft = reward.amount - reward.instances.length;

      for (const instance of reward.instances) {
        const membership = this.state.circles.campaign.memberships.find(m => m.player.id === instance.player.id);
        if (membership !== undefined && membership != null) {
          const player = membership.player;
          const user = {
            pid: player.id, uid: player.user.id,
            self: this.authuser.details?.uid === player.user.id,
            firstname: player.user.firstName, lastname: player.user.lastName, image: player.user.image,
          };
          instance.user = user;
        }
      }

      if (reward.description && reward.description.startsWith('{') && reward.description.endsWith('}')) {
        reward = { ...JSON.parse(reward.description), ...reward };
      }

      this.rewards.push(reward);
    }

    return new Promise(resolve => resolve());
  }






  async removeReward(rid: number, $event: CustomEvent) {
    if ($event) {
      $event.stopPropagation();
    }

    const dr: ApiRequest = {
      uri: '/rewards/{rid}',
      method: 'DELETE',
      pathVariables: [
        { key: 'rid', value: rid },
      ],
    };
    await this.api.promise(dr);

    await this.ss.parseChallenges();
    this.ss.publishState();

    await this.parseData();
  }


  async createRewards(rtype: string,) {
    const participations = this.challenge.participations.filter(p => p.checked);
    if (!participations?.length) { return; }

    const cids = participations.map((p: any) => p.circle.id);

    const cr: ApiRequest = {
      uri: '/challenges/{xid}/rewards',
      method: 'POST',
      pathVariables: [
        { key: 'xid', value: this.challenge.id },
      ],
      requestParams: [
        { key: 'circles', value: cids },
        { key: 'reward', value: rtype },
      ],
    };
    await this.api.promise(cr);

    await this.ss.parseChallenges();
    this.ss.publishState();

    await this.parseData();
  }




  updateView(uid: number) {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    this.view.includes(uid) ? this.view = this.view.filter((u: number) => u !== uid) : this.view.push(uid);
  }

}
