import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Challenge } from 'src/app/models/gamebus/challenge.model';
import { UserState } from 'src/app/models/gamebus/user-state.model';
import { ApiRequest } from 'src/app/models/general/api-request.model';
import { AuthUser } from 'src/app/models/general/auth-user.model';
import { ApiService } from 'src/app/services/api.service';
import { AuthorizationService } from 'src/app/services/authorization.service';
import { StateService } from 'src/app/services/state.service';
import { environment } from 'src/environments/environment';
import { CampaignConfig } from '../../../models/airbridge/campaign-config.model';
import { CampaignService } from '../../../services/campaign.service';


@Component({
  selector: 'app-lootbox-card',
  templateUrl: './gb-lootbox-card.component.html',
  styleUrls: ['./gb-lootbox-card.component.scss'],
})
export class LootboxCardComponent implements OnInit, OnChanges {

  @Input() challenge: Challenge;
  @Input() settings: LootboxSettings;

  uris = environment.uris;

  math = Math;

  isReady = false;
  isLocked = false;
  isActive = true;

  authuser: AuthUser;

  config: CampaignConfig;
  state: UserState;

  lotteries: any[];
  wallet: number;

  constructor(
    private api: ApiService,
    private as: AuthorizationService,
    private cs: CampaignService,
    private ss: StateService,
  ) { }

  async ngOnInit() {
    this.settings = LootboxSettings.from(this.settings);

    this.authuser = this.as.getAuthUser();

    this.config = await this.cs.getConfig();

    this.state = await this.ss.getState();
    await this.parseData();

    this.ss.state$.subscribe(state => { this.state = state; this.parseData(); });

    this.isReady = true;
  }

  async ngOnChanges(changes: SimpleChanges) {
    this.settings = LootboxSettings.from(this.settings);

    this.config = await this.cs.getConfig();
    this.state = await this.ss.getState();
    await this.parseData();
  }

  async parseData(): Promise<void> {
    if (!this.challenge?.participations?.length) { return; }
    if (!this.challenge?.lottery?.length) { return; }

    this.lotteries = JSON.parse(JSON.stringify(this.challenge.lottery));

    for (const lottery of this.lotteries) {
      lottery.isSpinning = false;
      lottery.result = null; // result of a spin

      lottery.rewards = [];
      for (const lc of lottery.lotteryConfig) {
        const rc = lc.rewardConfig;
        let reward: any = {
          name: rc.rewardType.name,
          image: rc.rewardType.image,
          description: rc.rewardType.description,
          amount: rc.amount,
          challenge: {
            id: this.challenge.id,
            name: this.challenge.name,
            startDate: this.challenge.endDate,
            endDate: this.challenge.endDate,
            target: this.challenge.target,
            contenders: this.challenge.contenders,
          },
        };

        reward.instances = this.challenge?.rewards?.filter(r => r.rewardType.name === reward.name);
        reward.stillLeft = reward.amount - reward.instances.length;
        reward.count = reward.instances.filter(
          (r: any) => r.rewardType.name === reward.name && r.player.id === this.authuser.details.pid)?.length || 0;

        if (reward.description && reward.description.startsWith('{') && reward.description.endsWith('}')) {
          reward = { ...JSON.parse(reward.description), ...reward };
        }

        lottery.rewards.push(reward);
      }
    }

    const participation = this.challenge.participations.find(p => p.circle.id === this.state.circles.private.id);
    if (participation) { this.wallet = participation.points; }
    else { this.wallet = 0; }

    return new Promise(resolve => resolve());
  }

  async spin(lottery: any) {
    this.isLocked = true;

    lottery.isSpinning = true;
    lottery.result = null;

    const playLottery: ApiRequest = {
      uri: '/challenge/lottery/{lid}',
      method: 'POST',
      pathVariables: [
        { key: 'lid', value: lottery.id },
        // { key: 'fields', value: ['id', 'memberships.player.id'] },
      ],
    };
    const reward: any = await this.api.promise(playLottery);

    await new Promise<void>(resolve => window.setTimeout(() => resolve(), 4000));

    if (reward?.rewardType) { lottery.result = 'lucky'; }
    else { lottery.result = 'empty'; }
    lottery.isSpinning = false;

    await new Promise<void>(resolve => window.setTimeout(() => resolve(), 3000));

    await this.ss.observePoints(null);
    await this.parseData();
  }
}

export class LootboxSettings {
  description: string;

  public static from(obj: any): LootboxSettings {
    const {
      description = null,
    } = obj || {};
    return { description };
  }
}
