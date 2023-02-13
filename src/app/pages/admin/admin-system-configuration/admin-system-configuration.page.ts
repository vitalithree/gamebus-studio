/* eslint-disable max-len */
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MenuController, Platform, ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { ActivityScheme } from 'src/app/models/gamebus/activity-scheme.model';
import { DataProvider } from 'src/app/models/gamebus/data-provider.model';
import { User } from 'src/app/models/gamebus/user.model';
import { ApiRequest } from 'src/app/models/general/api-request.model';
import { ApiService } from 'src/app/services/api.service';
import { AuthorizationService } from 'src/app/services/authorization.service';
import { environment } from 'src/environments/environment';


@Component({
  selector: 'app-admin-system-configuration',
  templateUrl: './admin-system-configuration.page.html',
  styleUrls: ['./admin-system-configuration.page.scss'],
})
export class AdminSystemConfigurationPage implements OnInit, OnDestroy {

  uris = environment.uris;
  client = environment.client;

  isReady = false;
  isBrowseriOS = false;
  isAuthenticated: boolean;
  isAdmin = false;
  isLocked = false;
  hasAllPropertyPermissions = false;

  loginForm: FormGroup;

  dataprovider!: DataProvider;

  schemes!: ActivityScheme[];
  permissions: {
    desired: { activity: string; property: string }[]; actual?: { activity: string; property: string }[];
    combinations?: { activity: string; property: string; isDesired: boolean; isActual: boolean }[];
  } = {
      desired: [
        { activity: 'GENERAL_ACTIVITY', property: 'SECRET' },
        { activity: 'GENERAL_ACTIVITY', property: 'DESCRIPTION' },
        { activity: 'GENERAL_ACTIVITY', property: 'DURATION' },
        { activity: 'GENERAL_ACTIVITY', property: 'ACTIVITY_TYPE' },
        { activity: 'GENERAL_ACTIVITY', property: 'VIDEO' },

        { activity: 'WALK', property: 'SECRET' },
        { activity: 'WALK', property: 'DESCRIPTION' },
        { activity: 'WALK', property: 'DURATION' },
        { activity: 'WALK', property: 'STEPS' },
        { activity: 'WALK', property: 'DISTANCE' },
        { activity: 'WALK', property: 'VIDEO' },

        { activity: 'RUN', property: 'SECRET' },
        { activity: 'RUN', property: 'DESCRIPTION' },
        { activity: 'RUN', property: 'DURATION' },
        { activity: 'RUN', property: 'STEPS' },
        { activity: 'RUN', property: 'DISTANCE' },
        { activity: 'RUN', property: 'VIDEO' },

        { activity: 'BIKE', property: 'SECRET' },
        { activity: 'BIKE', property: 'DESCRIPTION' },
        { activity: 'BIKE', property: 'DURATION' },
        { activity: 'BIKE', property: 'DISTANCE' },
        { activity: 'BIKE', property: 'VIDEO' },

        { activity: 'LOCATION', property: 'SECRET' },
        { activity: 'LOCATION', property: 'DESCRIPTION' },
        { activity: 'LOCATION', property: 'DURATION' },
        { activity: 'LOCATION', property: 'COORDINATES' },
        { activity: 'LOCATION', property: 'VIDEO' },

        { activity: 'Nutrition_Diary', property: 'SECRET' },
        { activity: 'Nutrition_Diary', property: 'DESCRIPTION' },
        { activity: 'Drinking_Diary', property: 'VIDEO' },

        { activity: 'Drinking_Diary', property: 'SECRET' },
        { activity: 'Drinking_Diary', property: 'DESCRIPTION' },
        { activity: 'Drinking_Diary', property: 'VIDEO' },


        { activity: 'DAY_AGGREGATE_WALK', property: 'SECRET' },
        { activity: 'DAY_AGGREGATE_WALK', property: 'DESCRIPTION' },
        { activity: 'DAY_AGGREGATE_WALK', property: 'START_DATE' },
        { activity: 'DAY_AGGREGATE_WALK', property: 'END_DATE' },
        { activity: 'DAY_AGGREGATE_WALK', property: 'STEPS_SUM' },
        { activity: 'DAY_AGGREGATE_WALK', property: 'VIDEO' },

        { activity: 'DAY_AGGREGATE_RUN', property: 'SECRET' },
        { activity: 'DAY_AGGREGATE_RUN', property: 'DESCRIPTION' },
        { activity: 'DAY_AGGREGATE_RUN', property: 'START_DATE' },
        { activity: 'DAY_AGGREGATE_RUN', property: 'END_DATE' },
        { activity: 'DAY_AGGREGATE_RUN', property: 'STEPS_SUM' },
        { activity: 'DAY_AGGREGATE_RUN', property: 'VIDEO' },

        { activity: 'CONSENT', property: 'DESCRIPTION' },
        { activity: 'CONSENT', property: 'FOR_CAMPAIGN' },

        { activity: 'VISUALIZATION_STRATEGY', property: 'FOR_CAMPAIGN' },
        { activity: 'VISUALIZATION_STRATEGY', property: 'MOTIVATIONAL_STRATEGY_PREFERENCE' },
        { activity: 'VISUALIZATION_STRATEGY', property: 'LEADERBOARD_CIRCLES' },
        { activity: 'VISUALIZATION_STRATEGY', property: 'DASHBOARD_WIDGETS' },

        { activity: 'GENERAL_SURVEY', property: 'SECRET' },
        { activity: 'GENERAL_SURVEY', property: 'DESCRIPTION' },

        { activity: 'PLAY_LOTTERY', property: 'LOTTERY' },
        { activity: 'PLAY_LOTTERY', property: 'FOR_CHALLENGE' },
        { activity: 'PLAY_LOTTERY', property: 'WIN' },
        { activity: 'PLAY_LOTTERY', property: 'REWARD' },

        { activity: 'SOCIAL_SELFIE', property: 'SECRET' },
        { activity: 'SOCIAL_SELFIE', property: 'DESCRIPTION' },
        { activity: 'SOCIAL_SELFIE', property: 'GROUP_SIZE' },
        { activity: 'SOCIAL_SELFIE', property: 'VIDEO' },

        { activity: 'NAVIGATE_APP', property: 'APP' },
        { activity: 'NAVIGATE_APP', property: 'SESSION' },
        { activity: 'NAVIGATE_APP', property: 'UID' },
        { activity: 'NAVIGATE_APP', property: 'FOR_CAMPAIGN' },
        { activity: 'NAVIGATE_APP', property: 'URI' },
      ]
    };
  atypes: { activity: string; properties: { actual: string[]; desired: string[]; optional: string[] } }[] = [];

  view: any[] = [];

  constructor(
    private translate: TranslateService,
    private platform: Platform,
    private api: ApiService,
    private as: AuthorizationService,
    private menu: MenuController,
    private fb: FormBuilder,
    private toastCtrl: ToastController,
  ) {
  }


  async ngOnInit() {
    document.body.classList.add('hide-tab');
    this.menu.enable(false, 'side');

    if (this.platform.is('ios') && !this.platform.is('desktop')) {
      this.isBrowseriOS = true;
    }

    this.isAuthenticated = this.as.isAuthenticated();

    this.loginForm = this.fb.group({
      email: [null, Validators.compose([Validators.required, Validators.pattern('[a-z0-9!#$%&\'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&\'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?')])],
      password: [null, Validators.compose([Validators.required, Validators.minLength(6), Validators.maxLength(40)])],
    });

    if (this.isAuthenticated) {
      this.isAdmin = this.as.isAdmin();
      await this.parseData();
    }

    this.isReady = true;
  }

  ngOnDestroy() {
    document.body.classList.remove('hide-tab');
    this.menu.enable(true, 'side');
  }



  async parseData($event?: CustomEvent): Promise<void> {

    // Check if dataprovider exists
    const dataproviders: DataProvider[] = await this.api.promise({ uri: '/data-providers', method: 'GET' } as ApiRequest);
    const dataprovider = dataproviders.find(p => p.name === this.client.dataprovider);
    if (!dataprovider) { if ($event) { ($event.target as any).complete(); } return; }

    this.dataprovider = dataprovider;

    // Check if correct property permissions exist
    this.schemes = await this.api.promise({ uri: '/activityschemes', method: 'GET' } as ApiRequest);
    const schemes: { activity: { id: number; name: string; image: string }; property: { id: number; name: string }; dataprovider: { id: number; name: string } }[] = this.schemes.flatMap(s => s.propertyPermissions.map(pp => ({ activity: { id: s.id, name: s.translationKey, image: s.image }, property: { id: pp.property.id, name: pp.property.translationKey }, dataprovider: { id: pp.dataProvider.id, name: pp.dataProvider.name } })));
    const actual = schemes.filter(s => s.dataprovider.name === this.client.dataprovider).map(s => ({ activity: s.activity.name, property: s.property.name }));
    this.permissions.actual = actual;

    const combinations = [];
    for (const combination of [...this.permissions.desired, ...this.permissions.actual]) {
      const { activity, property } = combination;
      if (!combinations.filter(c => c.activity === activity && c.property === property).length) {
        combinations.push(combination);
      }
    }
    for (const combination of combinations) {
      const { activity, property } = combination;
      combination.isDesired = !!this.permissions.desired.filter(c => c.activity === activity && c.property === property).length;
      combination.isActual = !!this.permissions.actual.filter(c => c.activity === activity && c.property === property).length;
    }
    this.permissions.combinations = combinations;

    this.atypes = [...new Set(this.permissions.combinations.map(c => c.activity))].map(
      (activity: string) => ({
        activity,
        properties: {
          actual: this.permissions.combinations.filter(c => c.activity === activity && c.isDesired && c.isActual).map(c => c.property),
          desired: this.permissions.combinations.filter(c => c.activity === activity && c.isDesired && !c.isActual).map(c => c.property),
          optional: this.permissions.combinations.filter(c => c.activity === activity && !c.isDesired && c.isActual).map(c => c.property),
        }
      }));

    if (!this.permissions.combinations.filter(c => c.isDesired && !c.isActual).length) {
      this.hasAllPropertyPermissions = true;
    }

    if ($event) {
      ($event.target as any).complete();
    }
    return new Promise(resolve => resolve());
  }


  async addAllPermissions() {
    try {
      for (const combination of this.permissions.combinations.filter(c => c.isDesired && !c.isActual)) {
        await this.addPermision(combination.activity, combination.property);
      }
    } catch (e) { }
  }

  async addPermision(activity: string, property: string): Promise<void> {
    if (this.isLocked) { return; }
    this.isLocked = true;

    if (!this.as.isAdmin()) {
      const toast = await this.toastCtrl.create({
        message: `You do not have admin rights and can therefore not create permissions. Please contact your system administrator.`,
        duration: 8000,
        color: 'dark',
        position: 'bottom',
        buttons: [{ icon: 'close', role: 'cancel', }]
      });
      await toast.present();
      this.isLocked = false;
      return;
    }

    if (!this.dataprovider) { this.isLocked = false; return; }

    const ascheme = this.schemes.find(s => s.translationKey === activity);
    const pscheme = this.schemes.flatMap(s => s.propertyPermissions).find(pp => pp.property.translationKey === property)?.property;

    if (!ascheme || !pscheme) {
      const toast = await this.toastCtrl.create({
        message: `The activity type ${activity} or property type ${property} does not exist. Please contact your system administrator.`,
        duration: 8000,
        color: 'dark',
        position: 'bottom',
        buttons: [{ icon: 'close', role: 'cancel', }]
      });
      await toast.present();
      this.isLocked = false;
      return;
    }


    const dataproviders: { dataProvider: number; permissions: { property: number; allowedValues: { translationKey: string; enumValue: string }[] }[] }[] = [];
    const dpids = [...new Set(ascheme.propertyPermissions.map(pp => pp.dataProvider.id))];
    for (const dpid of dpids) {
      const pps = ascheme.propertyPermissions.filter(pp => pp.dataProvider.id === dpid);


      const permissions = [];
      for (const pp of pps) {
        const p = pp.property?.id;
        if (!p) { continue; }

        let allowedValues = [];
        if (pp.allowedValues?.length) { allowedValues = pp.allowedValues.map(v => ({ translationKey: v.translationKey, enumValue: v.enumValue })); }

        const permission = { property: p, allowedValues };
        permissions.push(permission);
      }

      if (dpid === this.dataprovider.id) {
        const permission = { property: pscheme.id, allowedValues: [] };
        permissions.push(permission);
      }

      const dataprovider = {
        dataProvider: dpid,
        permissions,
      };
      dataproviders.push(dataprovider);
    }

    if (!dpids.includes(this.dataprovider.id)) {
      const dataprovider = {
        dataProvider: this.dataprovider.id,
        permissions: [
          { property: pscheme.id, allowedValues: [] }
        ]
      };
      dataproviders.push(dataprovider);
    }

    const form: any = {
      translationKey: ascheme.translationKey,
      type: ascheme.type,
      dataProviders: dataproviders,
    };

    const requestBody = new FormData();
    requestBody.append('activityScheme', JSON.stringify(form));
    const uas: ApiRequest = {
      uri: '/activityschemes',
      method: 'PUT',
      requestBody,
    };
    const res: ActivityScheme = await this.api.promise(uas);

    await this.parseData();

    this.isLocked = false;

    return new Promise(resolve => resolve());
  }




  async createDataprovider(): Promise<void> {
    this.isLocked = true;

    const authuser = this.as.getAuthUser();

    const gr: ApiRequest = {
      uri: '/users/{uid}/roles',
      method: 'GET',
      pathVariables: [
        { key: 'uid', value: authuser.details.uid },
      ],
    };
    const roles: { id: number; name: string }[] = await this.api.promise(gr);

    if (!roles.find(r => r.name === 'DEV')) {

      if (!this.as.isAdmin()) {
        const toast = await this.toastCtrl.create({
          message: `You do not have admin rights and can therefore not accept DEV-role requests. Please contact your system administrator.`,
          duration: 8000,
          color: 'dark',
          position: 'bottom',
          buttons: [{ icon: 'close', role: 'cancel', }]
        });
        await toast.present();
        this.isLocked = false;
        return;
      }

      // Try to create DEV role request
      try {
        const crr: ApiRequest = {
          uri: '/role_requests',
          method: 'POST',
          requestParams: [
            { key: 'role', value: 'DEV' },
          ],
        };
        await this.api.promise(crr);
      } catch (e) { }

      // Try to accept DEV role request
      try {
        const grr: ApiRequest = {
          uri: '/role_requests',
          method: 'GET',
          requestParams: [
            { key: 'creatorId', value: authuser.details.uid },
          ],
        };
        const rolerequests = await this.api.promise(grr);

        for (const rolerequest of rolerequests.filter((r: any) => r.role.name === 'DEV')) {
          const arr: ApiRequest = {
            uri: '/role_requests/{rrid}',
            method: 'PUT',
            pathVariables: [
              { key: 'rrid', value: rolerequest.id },
            ],
            requestParams: [
              { key: 'decision', value: 'accepted' },
            ],
          };
          await this.api.promise(arr);
        }
      } catch (e) { }
    }

    // Try to create data provider
    try {
      const form: any = {
        name: this.client.dataprovider,
        betaMemberships: [authuser.details.pid],
      };
      const requestBody = new FormData();
      requestBody.append('dataProvider', JSON.stringify(form));
      const cdp: ApiRequest = {
        uri: '/data-providers',
        method: 'POST',
        requestBody,
      };
      const res: DataProvider = await this.api.promise(cdp);
    } catch (e) { }

    await this.parseData();

    this.isLocked = false;

    return new Promise(resolve => resolve());
  }


  async updateClient() {
    if (!this.dataprovider?.client?.secret || this.dataprovider.client.secret === '') {
      return;
    }

    this.isLocked = true;

    const uc: ApiRequest = {
      uri: '/data-providers/client-secret',
      method: 'PUT',
      requestParams: [
        { key: 'dp', value: this.dataprovider.id },
        { key: 's', value: this.dataprovider.client.secret }
      ],
    };
    await this.api.promise(uc);

    this.dataprovider.client.secret = '';

    this.isLocked = false;
  }






  async doLogin() {
    this.isLocked = true;

    const email = this.loginForm.get('email').value;
    const password = this.loginForm.get('password').value;

    await this.doAuthenticate(email, password);

    this.isLocked = false;
  }


  async doAuthenticate(email: string, password: string): Promise<void> {

    const formParams = new URLSearchParams();
    formParams.set('grant_type', 'password');
    formParams.set('username', email);
    formParams.set('password', password);

    const lr: ApiRequest = {
      uri: '/oauth/token',
      method: 'POST',
      isAuthorized: false,
      headers: [
        { key: 'Authorization', value: 'Basic ' + btoa(this.client.id + ':' + this.client.secret) },
        { key: 'Content-Type', value: 'application/x-www-form-urlencoded' },
      ],
      requestBody: formParams.toString(),
    };

    let auth: any; let error: any;
    await this.api.promise(lr).then(res => auth = res, e => error = e);

    if (error || !auth) {
      let message: string;
      if (error.status === 400 && error.error.error_description === 'Bad credentials') {
        message = this.translate.instant('c.g.onboarding.bad-credentials');
      }
      if (error.status === 400 && error.error.error_description === 'User is disabled') {
        message = this.translate.instant('c.g.onboarding.account-disabled');
      }
      if (error.status === 401 && error.error.error_description === 'AccountExpiredException') {
        message = this.translate.instant('c.g.onboarding.account-expired-exception');
      }

      const toast = await this.toastCtrl.create({
        header: this.translate.instant('c.g.onboarding.error-general'),
        message,
        duration: 8000,
        color: 'dark',
        buttons: [{ icon: 'close', role: 'cancel', }]
      });
      toast.present();

      this.isLocked = false;
      return new Promise((resolve) => resolve());
    }

    this.as.parseAuthUser(auth);
    this.isAuthenticated = true;

    const getUser: ApiRequest = {
      uri: '/users/current',
      method: 'GET',
      requestParams: [
        { key: 'fields', value: '-notifications' }
      ],
    };
    const user: User = await this.api.promise(getUser);

    const getUserRoles: ApiRequest = {
      uri: '/users/{uid}/roles',
      method: 'GET',
      pathVariables: [
        { key: 'uid', value: user.id }
      ],
    };
    const rs: { id: string; name: string }[] = await this.api.promise(getUserRoles);
    let roles = ['USER'];
    if (rs?.length) { roles = rs.map(r => r.name); }

    this.as.setAuthUserDetails(user, roles);

    this.isAdmin = this.as.isAdmin();

    return new Promise((resolve) => resolve());
  }

  prefillAuth($event: Event) {
    const value = ($event.srcElement as HTMLInputElement).value;
    if (value !== undefined && value != null && value !== '') {
      const name = ($event.srcElement as HTMLInputElement).name;
      if (name === 'username') {
        this.loginForm.get('email').setValue(value);
      } else if (name === 'password') {
        this.loginForm.get('password').setValue(value);
      }
    }
  }

  logout() {
    this.as.destroyAuthUser();
    this.isAuthenticated = false;
  }

}
