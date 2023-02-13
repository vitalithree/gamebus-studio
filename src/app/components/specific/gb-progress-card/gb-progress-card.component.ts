import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Challenge } from 'src/app/models/gamebus/challenge.model';
import { UserState } from 'src/app/models/gamebus/user-state.model';
import { StateService } from 'src/app/services/state.service';
import { CampaignConfig } from '../../../models/airbridge/campaign-config.model';
import { CampaignService } from '../../../services/campaign.service';


@Component({
  selector: 'app-progress-card',
  templateUrl: './gb-progress-card.component.html',
  styleUrls: ['./gb-progress-card.component.scss'],
})
export class ProgressCardComponent implements OnInit, OnChanges {

  @Input() challenge: Challenge;
  @Input() settings: ProgressSettings;

  math = Math;

  isReady = false;

  config: CampaignConfig;
  state: UserState;

  wallet: number;

  constructor(
    private cs: CampaignService,
    private ss: StateService,
  ) { }

  async ngOnInit() {
    this.settings = ProgressSettings.from(this.settings);

    this.config = await this.cs.getConfig();

    this.state = await this.ss.getState();
    await this.parseData();

    this.ss.state$.subscribe(state => { this.state = state; this.parseData(); });

    this.isReady = true;
  }

  async ngOnChanges(changes: SimpleChanges) {
    this.settings = ProgressSettings.from(this.settings);

    this.config = await this.cs.getConfig();
    this.state = await this.ss.getState();
    await this.parseData();
  }

  async parseData(): Promise<void> {
    if (!this.challenge?.participations?.length) { return; }

    const participation = this.challenge.participations.find(p => p.circle.id === this.state.circles.private.id);
    if (participation) { this.wallet = participation.points; }
    else { this.wallet = 0; }

    return new Promise(resolve => resolve());
  }
}

export class ProgressSettings {
  description: string;
  milestones?: number;
  milestoneLabel?: string;

  public static from(obj: any): ProgressSettings {
    const {
      description = null,
      milestones = 3,
      milestoneLabel = `✓`,
    } = obj || {};
    return { description, milestones, milestoneLabel };
  }
}
