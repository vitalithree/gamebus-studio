import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { AuthUser } from 'src/app/models/general/auth-user.model';
import { UserState } from 'src/app/models/gamebus/user-state.model';
import { AuthorizationService } from 'src/app/services/authorization.service';
import { StateService } from 'src/app/services/state.service';
import { environment } from 'src/environments/environment';
import { Challenge } from 'src/app/models/gamebus/challenge.model';

@Component({
  selector: 'app-lotteries-card',
  templateUrl: './gb-lotteries-card.component.html',
  styleUrls: ['./gb-lotteries-card.component.scss'],
})
export class LotteriesCardComponent implements OnInit, OnChanges {

  @Input() challenge: Challenge;

  uris = environment.uris;

  isReady = false;
  isLocked = false;

  authuser: AuthUser;
  state: UserState;

  lotteries: any[];

  view: any[] = [];

  constructor(
    private as: AuthorizationService,
    private ss: StateService,
  ) { }

  async ngOnInit() {
    this.authuser = this.as.getAuthUser();

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
    if (!this.challenge.lottery?.length) { return; }

    this.lotteries = JSON.parse(JSON.stringify(this.challenge.lottery));
    this.lotteries.forEach(lottery => {
      lottery.odds = lottery.lotteryConfig.map((a: any) => a.odds).reduce((a: number, b: number) => a + b, 0);
    });

    return new Promise(resolve => resolve());
  }



  updateView(uid: number) {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    this.view.includes(uid) ? this.view = this.view.filter((u: number) => u !== uid) : this.view.push(uid);
  }

}
