/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable max-len */
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertController, Platform, ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { CampaignConfig } from 'src/app/models/airbridge/campaign-config.model';
import { User } from 'src/app/models/gamebus/user.model';
import { ApiRequest } from 'src/app/models/general/api-request.model';
import { ApiService } from 'src/app/services/api.service';
import { AuthorizationService } from 'src/app/services/authorization.service';
import { CampaignService } from 'src/app/services/campaign.service';
import { StateService } from 'src/app/services/state.service';
import { environment } from 'src/environments/environment';
import { AuthUser } from '../../../../models/general/auth-user.model';

@Component({
  selector: 'app-authentication',
  templateUrl: './authentication.component.html',
  styleUrls: ['./authentication.component.scss'],
})
export class OnboardingAuthenticationComponent implements OnInit {

  @Input() chref: string;
  @Input() testMailchimp = false;
  @Input() cid: number;

  @Output() segmentEvent = new EventEmitter<string>();

  isLocked = false;
  isBrowseriOS = false;
  hasAccount = false;

  isAuthenticated: boolean;
  authuser: AuthUser;

  client = environment.client;
  isProduction = environment.production;

  config: CampaignConfig;

  signupForm: FormGroup;
  loginForm: FormGroup;
  consent: { obj: { key?: string; tk: string; required?: boolean; link?: string }[]; form: FormGroup };

  constructor(
    private platform: Platform,
    private translate: TranslateService,
    private api: ApiService,
    private as: AuthorizationService,
    private cs: CampaignService,
    private ss: StateService,
    private fb: FormBuilder,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
  ) { }

  async ngOnInit() {
    if (this.platform.is('ios') && !this.platform.is('desktop')) {
      this.isBrowseriOS = true;
    }

    this.config = await this.cs.getConfig();
    this.createForms();

    this.cs.config$.subscribe(config => { this.config = config; this.createForms(); });

    this.isAuthenticated = this.as.isAuthenticated();
    this.as.isAuthenticated$.subscribe(ia => this.isAuthenticated = ia);
  }


  createForms() {
    // Signup form
    this.signupForm = this.fb.group({
      email: [null, Validators.compose([Validators.required, Validators.pattern('[a-z0-9!#$%&\'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&\'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?')])],
      password: [null, Validators.compose([Validators.required, Validators.minLength(6), Validators.maxLength(40)])],
      passwordconfirm: [null, Validators.compose([Validators.required, Validators.minLength(6), Validators.maxLength(40)])],

      firstName: [null, Validators.compose([Validators.required, Validators.minLength(2), Validators.maxLength(40)])],
      lastName: [null, Validators.compose([Validators.required, Validators.minLength(2), Validators.maxLength(40)])],
    }, { validator: this.doPasswordsMatch('password', 'passwordconfirm') });

    // Login form
    this.loginForm = this.fb.group({
      email: [null, Validators.compose([Validators.required, Validators.pattern('[a-z0-9!#$%&\'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&\'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?')])],
      password: [null, Validators.compose([Validators.required, Validators.minLength(6), Validators.maxLength(40)])],
    });

    // Consent form
    let obj = this.config.campaign.consent;
    obj = JSON.parse(JSON.stringify(this.config.campaign.consent.map((item, index) => ({ ...item, key: index.toString() }))));

    const form = this.fb.group({});
    obj.forEach(item => {
      let validators = [];
      if (item.required) { validators = [Validators.required, Validators.requiredTrue]; }
      form.addControl(item.key, this.fb.control(false, validators));
    });

    this.consent = { obj, form };
  }




  async doLogin() {
    this.isLocked = true;

    const email = this.loginForm.get('email').value;
    const password = this.loginForm.get('password').value;

    await this.doAuthenticate(email, password);

    this.segmentEvent.emit();

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

    this.authuser = this.as.parseAuthUser(auth);
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


    this.authuser = this.as.setAuthUserDetails(user, roles);
    this.authuser = this.as.setAuthUserCampaign(this.chref);

    const state = await this.ss.parseState(true);

    if (this.cid && !state.circles.all.find(c => c.id === this.cid)) {
      await this.ss.requestCircleMembership(this.cid);
      await this.ss.parseCircles();
    }

    this.as.observeIsAuthenticated(true);
    this.ss.publishState();

    return new Promise((resolve) => resolve());
  }




  async doSignup() {
    this.isLocked = true;

    const language = this.translate.currentLang;
    const credentials = { ...this.signupForm.value, language };

    const sr: ApiRequest = {
      uri: '/oauth/sign-up/',
      method: 'POST',
      requestParams: [
        { key: 'secret', value: true },
      ],
      requestBody: credentials,
      isAuthorized: false,
    };

    let auth: any; let error: any;
    await this.api.promise(sr).then(res => auth = res, e => error = e);

    if (error || !auth) {
      let message: string;
      if (error.status === 422) {
        message = this.translate.instant('c.g.onboarding.account-already-exists');
      } else {
        message = this.translate.instant('c.g.onboarding.signup-error');
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
      return;
    }


    await this.doAuthenticate(credentials.email, credentials.password);

    const consent = [];
    this.consent.obj.forEach(item => {
      consent.push({ tk: item.tk, condition: this.translate.instant(`c.g.onboarding.consent.${item.tk}`), accepted: this.consent.form.get(item.key).value });
    });
    await this.ss.storeConsent(consent);
    await this.ss.parseConsent(consent);
    this.ss.publishState();

    this.segmentEvent.emit();

    this.isLocked = false;
  }






  async presentConfirmEmailAlert() {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('c.g.onboarding.email-check-1'),
      message: this.translate.instant('c.g.onboarding.email-check-2', { email: this.signupForm.value.email }),
      buttons: [
        {
          text: this.translate.instant('g.no'),
          role: 'cancel',
        }, {
          text: this.translate.instant('g.yes'),
          handler: () => {
            this.doSignup();
          }
        }
      ]
    });
    await alert.present();
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

  doPasswordsMatch(password: string, passwordconfirm: string) {
    return (form: FormGroup) => {
      if (form.controls[password].value !== form.controls[passwordconfirm].value) {
        this.signupForm.get('passwordconfirm').setErrors({ passwordMismatch: true });
      }
      return;
    };
  }

}
