import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CampaignConfig } from 'src/app/models/airbridge/campaign-config.model';
import { Challenge } from 'src/app/models/gamebus/challenge.model';
import { UserState } from 'src/app/models/gamebus/user-state.model';
import { CampaignService } from 'src/app/services/campaign.service';
import { StateService } from 'src/app/services/state.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-streak-card',
  templateUrl: './gb-streak-card.component.html',
  styleUrls: ['./gb-streak-card.component.scss'],
})
export class StreakCardComponent implements OnInit, OnChanges {

  @Input() challenges: Challenge[];
  @Input() settings: StreakSettings;

  uris = environment.uris;

  isReady = false;
  isLocked = false;

  config: CampaignConfig;
  state: UserState;

  streaks: any[];

  view: any[] = [];

  constructor(
    private cs: CampaignService,
    private ss: StateService,
  ) { }

  async ngOnInit() {
    this.settings = StreakSettings.from(this.settings);

    this.config = await this.cs.getConfig();

    this.state = await this.ss.getState();
    await this.parseData();

    this.ss.state$.subscribe(state => { this.state = state; this.parseData(); });

    this.isReady = true;
  }


  async ngOnChanges(changes: SimpleChanges) {
    this.settings = StreakSettings.from(this.settings);

    this.config = await this.cs.getConfig();
    this.state = await this.ss.getState();
    await this.parseData();
  }

  parseData(): Promise<void> {
    if (!this.challenges?.length) { return; }

    const challenges: Challenge[] = JSON.parse(JSON.stringify(this.challenges));

    challenges.sort((a, b) => a.startDate - b.startDate);

    let entries: any[] = [];
    for (const challenge of challenges) {
      for (const participation of challenge.participations) {
        const cid = participation.circle.id;

        if (!entries.find(e => e.participant.cid === cid)) {
          const participant = {
            name: participation.circle.name,
            image: participation.circle.image,
            isPrivate: participation.circle.isPrivate,
            isOwned: participation.owned,
            cid: participation.circle.id,
            pid: participation.circle.isPrivate ? participation.circle.memberships[0].player.id : null,
          };
          const e = { participant, startDate: challenge.startDate, streaks: [0] };
          entries.push(e);
        }

        const entry = entries.find(e => e.participant.cid === cid);
        if (participation.points > 0) {
          entry.streaks[entry.streaks.length - 1]++;
        } else {
          entry.streaks.push(0);
        }
      }
    }

    for (const entry of entries) {
      entry.min = Math.min(...entry.streaks);
      entry.max = Math.max(...entry.streaks);
      entry.cur = entry.streaks[entry.streaks.length - 1];
    }

    entries = entries.filter(e => !e.participant.name.includes(this.config.campaign.abbr));
    if (this.settings.individuals && !this.settings.groups) {
      entries = entries.filter(e => e.participant.isPrivate || (this.settings.forceself && e.participant.isOwned));
    } else if (!this.settings.individuals && this.settings.groups) {
      entries = entries.filter(e => !e.participant.isPrivate || (this.settings.forceself && e.participant.isOwned));
    }

    if (this.settings.onlyself) {
      entries = entries.filter(e => e.participant.isOwned);
    }

    this.streaks = entries;

    return new Promise(resolve => resolve());
  }

}

export class StreakSettings {
  individuals?: boolean;
  groups?: boolean;
  forceself?: boolean;
  onlyself?: boolean;

  public static from(obj: any): StreakSettings {
    const { individuals = true, groups = true, forceself = false, onlyself = false } = obj || {};
    return { individuals, groups, forceself, onlyself };
  }
}
