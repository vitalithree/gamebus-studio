import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonInfiniteScroll } from '@ionic/angular';
import { ApiRequest } from 'src/app/models/general/api-request.model';
import { CampaignConfig } from 'src/app/models/airbridge/campaign-config.model';
import { UserState } from 'src/app/models/gamebus/user-state.model';
import { ApiService } from 'src/app/services/api.service';
import { AuthorizationService } from 'src/app/services/authorization.service';
import { CampaignService } from 'src/app/services/campaign.service';
import { StateService } from 'src/app/services/state.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-activities',
  templateUrl: './activities.page.html',
  styleUrls: ['./activities.page.scss'],
})
export class ActivitiesPage implements OnInit {

  @ViewChild(IonInfiniteScroll) infinite: IonInfiniteScroll;

  uris = environment.uris;

  isReady = false;
  isLocked = false;

  config: CampaignConfig;
  state: UserState;


  pid: number;
  user: any;

  page = 0;
  activities: { all: any[]; rewarded: any[] };
  view: { all: boolean } = { all: false };



  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private as: AuthorizationService,
    private cs: CampaignService,
    private ss: StateService,
  ) {
  }

  async ngOnInit() {
    let pid: number | string = this.route.snapshot.paramMap.get('pid');
    if (pid) {
      pid = Number(pid);
    } else {
      pid = this.as.getAuthUser().details?.pid;
    }
    this.pid = pid;

    this.config = await this.cs.getConfig();
    this.state = await this.ss.getState();

    await this.parseUser();
    await this.parseData();


    this.ss.state$.subscribe(state => { this.state = state; this.parseData(); });
    this.as.isAuthenticated$.subscribe(ia => { if (ia) { this.parseUser(); } });

    this.isReady = true;
  }


  async parseUser(): Promise<void> {
    const gp: ApiRequest = {
      uri: '/players/{pid}',
      method: 'GET',
      pathVariables: [
        { key: 'pid', value: this.pid },
      ],
    };
    const player = await this.api.promise(gp);

    if (!player) { return; }

    this.user = {
      uid: player.user.id,
      pid: player.id,
      firstname: player.user.firstName,
      lastname: player.user.lastName,
      image: player.user.image,
      isSelf: false,
      activeness: player.activityFrequency,
    };

    if (this.user.pid === this.pid) {
      this.user.isSelf = true;
    }

    return new Promise(resolve => resolve());
  }




  async parseData($event?: CustomEvent): Promise<void> {
    if (this.isLocked) { return; }
    this.isLocked = true;

    const curlen = this.activities?.all?.length || 0;

    let reset = false;
    if ($event?.type === 'ionRefresh') {
      this.isReady = false;
      reset = true;
    }

    if (!curlen || reset) {
      this.activities = { all: [], rewarded: [] };
      this.page = 0;
    }

    const gas: ApiRequest = {
      uri: '/players/{pid}/activities',
      method: 'GET',
      pathVariables: [
        { key: 'pid', value: this.user.pid },
      ],
      requestParams: [
        {
          key: 'excludedGds', value: ['SCORE_GAMEBUS_POINTS', 'PLAY_LOTTERY', 'FOLLOWEE_CIRCLE_MUTATION', 'FOLLOWEE_CIRCLE_PRIVACY',
            'VISUALIZATION_STRATEGY', 'GENERAL_SURVEY', 'NOTIFICATION(DETAIL)', 'TIZEN(DETAIL)', 'TIZEN_LOG(DETAIL)', 'CONSENT',
            'NAVIGATE_APP']
        },
        { key: 'page', value: this.page },
        { key: 'limit', value: 20 },
        { key: 'sort', value: ['-date'] },
      ],
    };
    let activities: any[] = await this.api.promise(gas);

    // Additional fiter to prevent display of GameBus automatic Day Aggregates...
    activities = activities.filter(a => !(a.gameDescriptor.translationKey === 'DAY_AGGREGATE' && a.dataProvider.id === 1));

    const ractivities = activities.filter(a => a.personalPoints?.length
      && a.personalPoints.find((pp: any) => pp.participation.challenge.name.includes(this.config.campaign.abbr)));

    this.activities.all = this.activities.all.concat(activities);
    this.activities.rewarded = this.activities.rewarded.concat(ractivities);

    const newlen = this.activities?.all?.length || 0;

    if ($event) {
      ($event.target as any).complete();
      if (curlen === newlen && $event?.type === 'ionInfinite') {
        ($event.target as any).disabled = true;
      }
    }

    this.page++;

    this.isReady = true;
    this.isLocked = false;
    return new Promise<void>(resolve => resolve());

  }



}
