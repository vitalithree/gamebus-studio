/* eslint-disable max-len */
import { Location } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, MenuController, NavController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';
import { UserState } from 'src/app/models/gamebus/user-state.model';
import { AuthUser } from 'src/app/models/general/auth-user.model';
import { AuthorizationService } from 'src/app/services/authorization.service';
import { StateService } from 'src/app/services/state.service';
import { environment } from 'src/environments/environment';
import { CampaignConfig } from '../../../models/airbridge/campaign-config.model';
import { Group } from '../../../models/airbridge/group.model';
import { CampaignService } from '../../../services/campaign.service';

@Component({
  selector: 'app-authorization',
  templateUrl: './onboarding.page.html',
  styleUrls: ['./onboarding.page.scss'],
})
export class OnboardingPage implements OnInit, OnDestroy {

  isReady = false;
  isLocked = false;
  isBrowseriOS = false;

  segments = ['authentication', 'consent', 'personalinfo', 'groups'];
  segment: string;

  config: CampaignConfig;
  cid: number;
  gtypes: { name: string; groups: Group[] }[];

  isAuthenticated: boolean;
  authuser: AuthUser;

  state: UserState;

  uris = environment.uris;

  didSignup = false;

  testMailchimp = false;

  constructor(
    private nav: NavController,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private menu: MenuController,
    private translate: TranslateService,
    private as: AuthorizationService,
    private cs: CampaignService,
    private ss: StateService,
    private alertCtrl: AlertController,
  ) {
  }


  ngOnDestroy() {
    document.body.classList.remove('hide-tab');
    this.menu.enable(true, 'side');
  }


  async ngOnInit() {
    document.body.classList.add('hide-tab');
    this.menu.enable(false, 'side');

    await this.parseData();
    this.as.isAuthenticated$.subscribe(ia => this.parseData());

    let chref = null;
    this.route.queryParams.subscribe(params => chref = params?.c);
    if (this.isAuthenticated) { chref = this.authuser.chref; }
    if (!chref) { this.router.navigate(['/landing'], { replaceUrl: true }); return; }

    this.config = await this.cs.parseConfig(chref);

    this.route.queryParams.subscribe(params => this.cid = params?.g);


    const gtypes: { name: string; groups: Group[] }[] = [];
    for (const group of this.config.groups.filter(g => g.type?.startsWith('group') && g.cid)) {
      const gtype = gtypes.find(g => g.name === group.type);
      if (!gtype) {
        gtypes.push({ name: group.type, groups: [group] });
      } else {
        gtype.groups.push(group);
      }
    }
    this.gtypes = gtypes;


    this.ss.state$.subscribe(state => this.state = state);

    const segment = this.route.snapshot.paramMap.get('segment');
    if (this.segments.includes(segment)) {
      this.segment = segment;
    } else {
      this.segment = 'personalinfo';
    }

    if (this.isAuthenticated) {
      this.state = await this.ss.getState();
      if (!this.state.consent?.passing) {
        this.segment = 'consent';
      }
      // this.location.replaceState(`/onboarding/${this.segment}`);
    } else {
      this.segment = 'authentication';
    }

    this.isReady = true;
  }


  async parseData($event?: CustomEvent): Promise<void> {
    this.isAuthenticated = this.as.isAuthenticated();
    if (this.isAuthenticated) {
      this.authuser = this.as.getAuthUser();
      let language = this.authuser.details?.language;
      if (!environment.languages.includes(language)) {
        language = environment.languages[0];
      }
      this.translate.use(language);
      moment.locale(language);
    }

    if ($event) {
      ($event.target as any).complete();
    }
    return new Promise(resolve => resolve());
  }



  async presentConfirmLogout() {
    const user = this.as.getAuthUser();
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('p.g.onboarding.already-authenticated-1'),
      message: this.translate.instant('p.g.onboarding.already-authenticated-2', { name: user.details.firstname + ' ' + user.details.lastname }),
      buttons: [
        {
          text: this.translate.instant('p.g.onboarding.already-authenticated-3'),
          cssClass: 'alert-button-light',
          handler: () => {
            this.ss.destroyState();
            const route: (string | number)[] = ['/landing'];
            if (this.config.campaign?.href) { route.push(this.config.campaign.href); }
            if (this.cid) { route.push(this.cid); }
            this.segment = 'authentication';
            this.router.navigate(route);
          }
        },
        {
          text: this.translate.instant('g.cancel'),
          role: 'cancel',
          handler: () => {
            if (!this.state.consent?.passing) {
              this.segment = 'consent';
            } else {
              this.segment = 'personalinfo';
            }
          }
        },
      ]
    });

    await alert.present();
  }

  setSegment(segment: string) {
    if (segment === 'logout' || segment === 'forward-to-app') {
      return;
    } else if (!this.isAuthenticated) {
      this.segment = 'authentication';
    } else if (this.segments.includes(segment)) {
      this.segment = segment;
    }

    // this.location.replaceState(`/onboarding/${this.segment}`);
  }

  nextSegment() {
    switch (this.segment) {
      case 'authentication':
        if (!this.state.consent?.passing) {
          this.segment = 'consent';
        } else {
          this.segment = 'personalinfo';
        }
        // this.location.replaceState(`/onboarding/${this.segment}`);
        break;
      case 'consent':
        this.segment = 'personalinfo';
        // this.location.replaceState(`/onboarding/${this.segment}`);
        break;
      case 'personalinfo':
        if (this.gtypes?.length) {
          this.segment = 'groups';
          // this.location.replaceState(`/onboarding/${this.segment}`);
        } else {
          this.router.navigate(['/'], { replaceUrl: true });
        }
        break;
      case 'groups':
        this.nav.navigateRoot('/');
        break;
    }
  }



}

