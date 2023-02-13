/* eslint-disable max-len */
// tslint:disable:max-line-length
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MenuController, ModalController, ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { CampaignConfig } from 'src/app/models/airbridge/campaign-config.model';
import { ApiRequest } from 'src/app/models/general/api-request.model';
import { AuthUser } from 'src/app/models/general/auth-user.model';
import { ApiService } from 'src/app/services/api.service';
import { AuthorizationService } from 'src/app/services/authorization.service';
import { CampaignService } from 'src/app/services/campaign.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-recover-password',
  templateUrl: './recover-password.page.html',
  styleUrls: ['./recover-password.page.scss'],
})
export class RecoverPasswordPage implements OnInit, OnDestroy {

  uris = environment.uris;
  client = environment.client;

  isModal = false;
  isLocked = false;

  config: CampaignConfig;

  isAuthenticated = false;
  user: AuthUser;

  passwordForm: FormGroup;

  constructor(
    private translate: TranslateService,
    private router: Router,
    private route: ActivatedRoute,
    private menu: MenuController,
    private api: ApiService,
    private as: AuthorizationService,
    private cs: CampaignService,
    private fb: FormBuilder,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
  ) { }

  ngOnDestroy() {
    document.body.classList.remove('hide-tab');
    this.menu.enable(true, 'side');
  }

  async ngOnInit() {
    this.isModal = await this.modalCtrl.getTop() ? true : false;

    if (!this.isModal) {
      document.body.classList.add('hide-tab');
      this.menu.enable(false, 'side');
    }

    this.config = await this.cs.getConfig();
    this.cs.config$.subscribe(config => this.config = config);

    const email = this.route.snapshot.paramMap.get('email');
    const token = this.route.snapshot.paramMap.get('token');

    this.passwordForm = this.fb.group({
      email: [email, Validators.compose([Validators.required, Validators.pattern('[a-z0-9!#$%&\'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&\'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?')])],
      token: [token],
      oldPassword: [null, Validators.compose([Validators.minLength(6), Validators.maxLength(40)])],
      password: [null, Validators.compose([Validators.minLength(6), Validators.maxLength(40)])],
      passwordconfirm: [null, Validators.compose([Validators.minLength(6), Validators.maxLength(40)])],
    }, { validator: this.doPasswordsMatch('password', 'passwordconfirm') });

    this.isAuthenticated = this.as.isAuthenticated();
    if (this.isAuthenticated) {
      this.user = this.as.getAuthUser();
      const getEmail: ApiRequest = {
        uri: '/players/{pid}',
        method: 'GET',
        pathVariables: [
          { key: 'pid', value: this.user.details?.pid },
        ],
        requestParams: [
          { key: 'fields', value: ['user.email'] },
        ],
      };
      await this.api.promise(getEmail).then((p: any) => this.passwordForm.get('email').setValue(p.user.email));
    }

    if (this.passwordForm.get('email').value) {
      this.passwordForm.get('password').setValidators([Validators.required, this.passwordForm.get('password').validator]);
      this.passwordForm.get('password').updateValueAndValidity();
      this.passwordForm.get('passwordconfirm').setValidators([Validators.required, this.passwordForm.get('passwordconfirm').validator]);
      this.passwordForm.get('passwordconfirm').updateValueAndValidity();
      if (this.isAuthenticated) {
        this.passwordForm.get('oldPassword').setValidators([Validators.required, this.passwordForm.get('oldPassword').validator]);
        this.passwordForm.get('oldPassword').updateValueAndValidity();
      } else {
        this.passwordForm.get('token').setValidators([Validators.required]);
        this.passwordForm.get('token').updateValueAndValidity();
      }
    }

  }

  closeModal() {
    if (this.isModal) {
      this.modalCtrl.dismiss(null, 'cancel');
    }
  }


  async requestResetPassword() {

    let message: string = await this.api.getAsset('/assets/email/default-min.html');

    message = message.replace(/\{title\}/gi, `[${this.config.campaign.name}] ${this.translate.instant('p.g.recover-password.mail-title')}`);
    message = message.replace(/\{preview\}/gi, this.translate.instant('p.g.recover-password.mail-title'));
    message = message.replace(/\{salutation\}/gi, this.translate.instant('p.g.recover-password.mail-salutation'));
    message = message.replace(/\{message-header\}/gi, this.translate.instant('p.g.recover-password.mail-header'));
    message = message.replace(/\{cta\}/gi, this.translate.instant('p.g.recover-password.mail-cta'));
    message = message.replace(/\{cta-uri\}/gi, `{path}`);
    message = message.replace(/\{message-footer\}/gi, this.translate.instant('p.g.recover-password.mail-footer'));
    message = message.replace(/\{closing\}/gi, this.translate.instant('p.g.recover-password.mail-closing'));
    message = message.replace(/\{campaign\}/gi, `${this.config.campaign.name}`);
    message = message.replace(/\{campaign-uri\}/gi, `${this.uris.self}`);

    const requestBody = {
      email: this.passwordForm.get('email').value,
      uri: this.uris.self + '/onboarding/recover-password',
      from: this.config.campaign.name,
      subject: `[${this.config.campaign.name}] ` + this.translate.instant('p.g.recover-password.recover-password'),
      message,
    };

    const rpr: ApiRequest = {
      uri: '/oauth/request-password-reset',
      method: 'POST',
      isAuthorized: false,
      requestBody,
    };
    await this.api.promise(rpr);

    const toast = await this.toastCtrl.create({
      header: this.translate.instant('p.g.recover-password.email-1'),
      message: this.translate.instant('p.g.recover-password.email-2'),
      position: 'bottom',
      color: 'dark',
      duration: 8000,
      buttons: [{ icon: 'close', role: 'cancel', }]
    });
    toast.present();
    this.passwordForm.reset();
    // this.router.navigateByUrl('/');
  }


  async resetPassword() {
    const resetPassword: ApiRequest = {
      uri: '/oauth/password',
      method: 'PUT',
      isAuthorized: false,
      requestParams: [
        { key: 'e', value: this.passwordForm.get('email').value },
        { key: 'p', value: this.passwordForm.get('password').value },
        { key: 't', value: this.passwordForm.get('token').value },
      ],
    };
    this.api.promise(resetPassword).then(
      async () => {
        const toast = await this.toastCtrl.create({
          header: this.translate.instant('p.g.recover-password.success-1'),
          message: this.translate.instant('p.g.recover-password.success-2'),
          position: 'bottom',
          color: 'dark',
          duration: 8000,
          buttons: [{ icon: 'close', role: 'cancel', }]
        });
        toast.present();
        this.passwordForm.reset();
        this.router.navigateByUrl('/');
      },
      async (error) => {
        if (error.status === 422) {
          const toast = await this.toastCtrl.create({
            header: this.translate.instant('p.g.recover-password.error-1'),
            message: this.translate.instant('p.g.recover-password.error-3'),
            position: 'bottom',
            color: 'dark',
            // duration: 8000,
            cssClass: 'atBottom',
            buttons: [{ icon: 'close', role: 'cancel', }]
          });
          toast.present();
        }
      }
    );

  }



  async changePassword() {
    if (!this.isAuthenticated) {
      return;
    }

    this.isLocked = true;

    // First, try to login with original password...
    const formParams = new URLSearchParams();
    formParams.set('grant_type', 'password');
    formParams.set('username', this.passwordForm.value.email);
    formParams.set('password', this.passwordForm.value.oldPassword);

    const loginRequest: ApiRequest = {
      uri: '/oauth/token',
      method: 'POST',
      isAuthorized: false,
      headers: [
        { key: 'Authorization', value: 'Basic ' + btoa(this.client.id + ':' + this.client.secret) },
        { key: 'Content-Type', value: 'application/x-www-form-urlencoded' },
      ],
      requestBody: formParams.toString(),
    };

    let isOldPasswordValid = false;
    await this.api.promise(loginRequest).then(
      async (auth: any) => {
        isOldPasswordValid = true;
      },
      async (error: any) => {
        if (error.status === 400 && error.error.error_description === 'Bad credentials') {
          const toast = await this.toastCtrl.create({
            header: this.translate.instant('p.g.recover-password.error-1'),
            message: this.translate.instant('p.g.recover-password.error-2'),
            position: 'bottom',
            color: 'dark',
            duration: 8000,
            buttons: [{ icon: 'close', role: 'cancel', }]
          });
          toast.present();
        }
      }
    );

    if (!isOldPasswordValid) { return; }

    // Change the password
    const password = this.passwordForm.value.password;
    if (password != null && password !== '') {
      const changePassword: ApiRequest = {
        uri: '/oauth/password',
        method: 'PUT',
        isAuthorized: false,
        requestParams: [
          { key: 'p', value: password },
          { key: 'e', value: this.passwordForm.value.email }
        ],
      };
      await this.api.promise(changePassword).then(
        async (res: any) => {
          const toast = await this.toastCtrl.create({
            header: this.translate.instant('p.g.recover-password.success-1'),
            message: this.translate.instant('p.g.recover-password.success-2'),
            position: 'bottom',
            color: 'dark',
            duration: 8000,
            buttons: [{ icon: 'close', role: 'cancel', }]
          });
          toast.present();
          this.passwordForm.reset();

          setTimeout(() => { this.closeModal(); }, 500);
        }
      );
    }

    this.isLocked = false;
  }









  doPasswordsMatch(password: string, passwordconfirm: string) {
    return (form: FormGroup) => {
      if (form.controls[password].value !== form.controls[passwordconfirm].value) {
        this.passwordForm.get('passwordconfirm').setErrors({ passwordMismatch: true });
      }
      return;
    };
  }
}
