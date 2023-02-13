import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Challenge, Participation } from 'src/app/models/gamebus/challenge.model';
import { UserState } from 'src/app/models/gamebus/user-state.model';
import { StateService } from 'src/app/services/state.service';
import { environment } from 'src/environments/environment';
import { CampaignConfig } from '../../../models/airbridge/campaign-config.model';
import { CampaignService } from '../../../services/campaign.service';


@Component({
  selector: 'app-leaderboard',
  templateUrl: './gb-leaderboard.component.html',
  styleUrls: ['./gb-leaderboard.component.scss'],
})
export class LeaderboardComponent implements OnInit, OnChanges {


  @Input() challenge: Challenge;
  @Input() settings: LeaderboardSettings;

  uris = environment.uris;

  isReady = false;
  isLocked = false;

  config: CampaignConfig;
  state: UserState;

  view: { followees: boolean } = { followees: false, };

  participants: Participant[];
  followees: {
    preferred?: number[];
    all?: { individuals?: Participant[]; groups?: Participant[] };
    search: { query?: string; individuals?: Participant[]; groups?: Participant[] };
  } = { search: { query: null, } };

  constructor(
    private cs: CampaignService,
    private ss: StateService,
  ) { }

  async ngOnInit() {
    this.settings = LeaderboardSettings.from(this.settings);

    this.config = await this.cs.getConfig();

    this.state = await this.ss.getState();
    await this.parseData();

    this.ss.state$.subscribe(state => { this.state = state; this.parseData(); });

    this.isReady = true;
  }


  async ngOnChanges(changes: SimpleChanges) {
    this.settings = LeaderboardSettings.from(this.settings);

    this.config = await this.cs.getConfig();
    this.state = await this.ss.getState();
    await this.parseData();
  }

  async parseData(): Promise<void> {
    if (!this.challenge.participations?.length) { return; }

    if (this.settings.configurable) {
      try {
        this.followees.preferred = JSON.parse(JSON.stringify(this.state.preferences?.circles));
      } catch (e) { }

      if (!this.followees.preferred) { this.followees.preferred = []; }
    }

    const indexzeroes = this.challenge.participations.findIndex(p => p.points === 0);
    if (indexzeroes !== undefined && indexzeroes != null && !isNaN(indexzeroes)) {
      const sortzeroes = this.challenge.participations.filter(p => p.points === 0)
        .sort((a, b) => Number(b.owned) - Number(a.owned));
      this.challenge.participations.splice(indexzeroes, sortzeroes.length, ...sortzeroes);
    }

    const followees: { individuals?: Participant[]; groups?: Participant[] } = { individuals: [], groups: [] };
    const participations = this.challenge.participations.filter(p =>
      (!p.circle.isPrivate || (!p.owned && p.circle.isPrivate) && !p.circle.name.includes(this.config.campaign.abbr)));
    for (const participation of participations) {
      const participant = {
        name: participation.circle.name,
        image: participation.circle.image,
        points: Math.round(participation.points),
        isOwned: participation.owned,
        cid: participation.circle.id,
        pid: participation.circle.isPrivate ? participation.circle.memberships[0].player.id : null,
      };

      if (participation.circle.isPrivate) {
        followees.individuals.push(participant);
      } else {
        followees.groups.push(participant);
      }
    }
    followees.individuals.sort((a, b) => a.name.localeCompare(b.name));
    followees.groups.sort((a, b) => a.name.localeCompare(b.name));

    this.followees.all = followees;





    let entries: Participation[] = this.challenge.participations.filter(p =>
      (!p.circle.name.includes(this.config.campaign.abbr))
      && (
        (this.settings.groups && !p.circle.isPrivate)
        || (this.settings.individuals && p.circle.isPrivate)
        || (this.settings.forceself && p.owned)
        || (this.settings.forcecids?.length && this.settings.forcecids.includes(p.circle.id))
        || (this.settings.forcepids?.length && p.circle.isPrivate && this.settings.forcepids.includes(p.circle.memberships[0].player.id))
      )
    );

    if (this.settings.configurable) {
      entries = entries.filter(participation => this.followees.preferred.includes(participation.circle.id) || participation.owned);
    }
    const ownedpositions = entries.map((p, i: number) => p.owned ? i + 1 : undefined).filter((x: number) => x === 0 || x);

    this.participants = [];
    for (const [i, participation] of entries.entries()) {
      const curposition = i + 1;

      const participant: Participant = {
        position: curposition,
        name: participation.circle.name,
        image: participation.circle.image,
        points: Math.round(participation.points),
        isOwned: participation.owned,
        isPrivate: participation.circle.isPrivate,
        cid: participation.circle.id,
        pid: participation.circle.isPrivate ? participation.circle.memberships[0].player.id : null,
        break: false,
      };

      participant.isWinning = false;
      if (this.challenge.target && this.challenge.contenders
        && participant.points >= this.challenge.target
        && participant.position <= this.challenge.contenders) {
        participant.isWinning = true;
      } else if (this.challenge.target && !this.challenge.contenders
        && participant.points >= this.challenge.target) {
        participant.isWinning = true;
      } else if (!this.challenge.target && this.challenge.contenders
        && participant.position <= this.challenge.contenders) {
        participant.isWinning = true;
      }

      if (this.participants.length > 0
        && this.participants[this.participants.length - 1].position < curposition - 1) {
        this.participants[this.participants.length - 1].break = true;
      }

      if (participation.owned) {
        this.participants.push(participant);
      } else if (this.settings.stretch > 1000) {
        // this.challenge.participations.length
        this.participants.push(participant);
      } else if (ownedpositions.filter(
        (p: number) => curposition >= p - this.settings.stretch && curposition <= p + this.settings.stretch).length > 0) {
        this.participants.push(participant);
      }
    }

    return new Promise(resolve => resolve());
  }



  searchParticipant($event?: CustomEvent) {
    const q = this.followees.search.query.toLowerCase();

    this.followees.search.groups = this.followees.all.groups.filter(circle => circle.name.toLowerCase().includes(q));
    this.followees.search.individuals = this.followees.all.individuals.filter(individual => individual.name.toLowerCase().includes(q));
  }



  updateFollowees(cid: number) {
    if (this.followees.preferred.includes(cid)) {
      this.followees.preferred = this.followees.preferred.filter((pcid: number) => pcid !== cid);
    } else {
      this.followees.preferred.push(cid);
    }
  }

  async updatePreferences() {
    this.isLocked = true;
    await this.ss.updatePreferences('leaderboard', this.followees.preferred, undefined);
    this.ss.publishState();

    this.view.followees = !this.view.followees;
    this.isLocked = false;
  }
}


export class LeaderboardSettings {
  configurable?: boolean;
  individuals?: boolean;
  groups?: boolean;
  forceself?: boolean;
  onlyself?: boolean;
  stretch?: number;
  forcecids?: number[];
  forcepids?: number[];

  public static from(obj: any): LeaderboardSettings {
    const {
      configurable = false,
      individuals = false,
      groups = false,
      forceself = false,
      forcecids = [],
      forcepids = [],
      stretch = 999
    } = obj || {};
    return { configurable, individuals, groups, forceself, forcecids, forcepids, stretch };
  }
}

export class Participant {
  name: string;
  image: string;
  points: number;
  isOwned: boolean;
  pid: number;
  cid: number;
  position?: number;
  break?: boolean;
  isPrivate?: boolean;
  isWinning?: boolean;
}
