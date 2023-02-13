import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';
import { filter } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { CampaignConfig } from './models/airbridge/campaign-config.model';
import { Page } from './models/airbridge/page.model';
import { PersonalPoint } from './models/gamebus/activity.model';
import { UserState } from './models/gamebus/user-state.model';
import { ApiRequest } from './models/general/api-request.model';
import { AuthUser } from './models/general/auth-user.model';
import { ApiService } from './services/api.service';
import { AuthorizationService } from './services/authorization.service';
import { CampaignService } from './services/campaign.service';
import { ConnectivityService } from './services/connectivity.service';
import { StateService } from './services/state.service';


@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss', 'app-fireworks.component.scss'],
})
export class AppComponent implements OnInit {

  uris = environment.uris;
  languages = environment.languages;
  cient = environment.client;

  session: string;

  user: AuthUser;
  permissions: { isAuthenticated: boolean; isOrganizer: boolean; isAdmin: boolean } =
    { isAuthenticated: false, isOrganizer: false, isAdmin: false };


  config: CampaignConfig;
  mpis: Page[] = [];
  tpis: Page[] = [];
  adminmpis: Page[] = [];

  state: UserState;

  points: PersonalPoint[];
  rewards: any[];

  view: { noconnection: boolean } = { noconnection: false };

  constructor(
    private router: Router,
    private translate: TranslateService,
    private connectivity: ConnectivityService,
    private api: ApiService,
    private as: AuthorizationService,
    private cs: CampaignService,
    private ss: StateService,
  ) {
    this.session = Math.random().toString(36).substring(2, 7) + '-' + Date.now().toString(36);

    let language = this.translate.getBrowserLang();
    if (!this.languages.includes(language)) {
      language = this.languages[0];
    }
    this.translate.use(language);
    moment.locale(language);
  }



  async ngOnInit() {
    this.connectivity.isOnline$.subscribe(isOnline => {
      if (!isOnline) { this.view.noconnection = true; }
      else { this.view.noconnection = false; }
    });

    this.config = await this.cs.getConfig();
    this.cs.config$.subscribe(config => this.config = config);

    this.permissions.isAuthenticated = this.as.isAuthenticated();
    this.updateAuthUser();

    this.as.isAuthenticated$.subscribe(ia => {
      this.permissions.isAuthenticated = ia;
      this.updateAuthUser();
    });
    this.ss.state$.subscribe(state => this.updatePages());

    this.ss.points$.subscribe(points => this.points = points);
    // this.ss.rewards$.subscribe((rewards: any[]) => this.rewards = rewards);

    this.router.events.pipe(
      filter($event => $event instanceof NavigationEnd)
    ).subscribe(($event: NavigationEnd) => {

      if (!this.permissions.isAuthenticated) { return; }
      if (!this.user?.details?.pid) { return; }

      const uri = window.location.href.replace(this.uris.self, '') || '/';

      const requestBody = new FormData();
      const form = {
        gameDescriptorTK: 'NAVIGATE_APP',
        dataProviderName: this.cient.dataprovider,
        date: moment().valueOf(),
        propertyInstances: [],
        players: [this.user?.details?.pid],
      };
      form.propertyInstances.push({ propertyTK: 'APP', value: window.location.hostname });
      form.propertyInstances.push({ propertyTK: 'SESSION', value: this.session });
      form.propertyInstances.push({ propertyTK: 'UID', value: this.user?.details?.uid || 'unknown' });
      form.propertyInstances.push({ propertyTK: 'FOR_CAMPAIGN', value: this.config?.campaign?.abbr || 'unknown' });
      form.propertyInstances.push({ propertyTK: 'URI', value: uri });

      requestBody.append('activity', JSON.stringify(form));

      const pa: ApiRequest = {
        uri: '/activities',
        method: 'POST',
        requestParams: [
          { key: 'dryrun', value: false },
          { key: 'fields', value: ['id'] },
        ],
        requestBody,
      };
      this.api.promise(pa);

    });
  }

  async updateAuthUser() {
    if (!this.permissions.isAuthenticated) { this.user = null; return; }

    this.user = this.as.getAuthUser();
    this.permissions.isOrganizer = await this.cs.isOrganizer();
    this.permissions.isAdmin = this.as.isAdmin();

    if (this.user && this.user.details) {
      let language = this.user.details.language;
      if (!this.languages.includes(language)) {
        language = this.languages[0];
      }
      this.translate.use(language);
      moment.locale(language);
    }

    this.updatePages();
  }

  async updatePages() {
    if (!this.permissions.isAuthenticated) { return; }

    this.state = await this.ss.getState();
    if (this.state?.pages?.length) {
      this.mpis = this.state.pages.filter(p => !p.forOrganizer && p.inMenu);
      this.tpis = this.state.pages.filter(p => !p.forOrganizer && p.inTabbar);
      this.adminmpis = this.state.pages.filter(p => p.forOrganizer && p.inMenu);
    }
  }



}
