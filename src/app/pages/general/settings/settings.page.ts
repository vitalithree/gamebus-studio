import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController, NavController } from '@ionic/angular';
import { CampaignConfig } from 'src/app/models/airbridge/campaign-config.model';
import { DataProvider } from 'src/app/models/gamebus/data-provider.model';
import { UserState } from 'src/app/models/gamebus/user-state.model';
import { ApiRequest } from 'src/app/models/general/api-request.model';
import { AuthUser } from 'src/app/models/general/auth-user.model';
import { ApiService } from 'src/app/services/api.service';
import { AuthorizationService } from 'src/app/services/authorization.service';
import { CampaignService } from 'src/app/services/campaign.service';
import { StateService } from 'src/app/services/state.service';
import { RecoverPasswordPage } from '../recover-password/recover-password.page';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage implements OnInit {

  isLocked = false;

  user: AuthUser;
  userForm: FormGroup;

  config: CampaignConfig;
  state: UserState;

  providers: DataProvider[];
  allowedDataproviders = ['Google Fit', 'Fitbit', 'Strava'];

  constructor(
    private nav: NavController,
    private api: ApiService,
    private as: AuthorizationService,
    private cs: CampaignService,
    private ss: StateService,
    private fb: FormBuilder,
    private modalCtrl: ModalController,
  ) {
  }

  async ngOnInit() {
    this.user = this.as.getAuthUser();

    this.config = await this.cs.getConfig();
    this.state = await this.ss.getState();

    this.userForm = this.fb.group({
      firstname: [this.user.details.firstname,
      Validators.compose([Validators.required, Validators.minLength(2), Validators.maxLength(40)])],
      lastname: [this.user.details.lastname, Validators.compose([Validators.required, Validators.minLength(2), Validators.maxLength(40)])],
      image: [this.user.details.image],
    });

    this.getProviders();
  }




  async putUser() {
    // // TODO

    let requestBody = new FormData();
    let form: any = {
      firstName: this.userForm.get('firstname').value,
      lastName: this.userForm.get('lastname').value,
    };

    requestBody.append('user', JSON.stringify(form));

    const image = this.userForm.get('image').value;
    if (image !== undefined && image != null && (image instanceof File || image instanceof Blob)) {
      requestBody.append('image', image, 'GAMEBUS_USER_IMAGE.jpg');
    }

    const pu: ApiRequest = {
      uri: '/users/{uid}',
      method: 'PUT',
      pathVariables: [
        { key: 'uid', value: this.user.details?.uid },
      ],
      requestBody,
    };
    const user = await this.api.promise(pu);
    this.user.details.firstname = user.firstName;
    this.user.details.lastname = user.lastName;
    this.user.details.image = user.image;

    this.as.setAuthUser(this.user);

    const circle = this.state.circles.all.find((c: any) => c.isPrivate);
    if (circle !== undefined && circle != null) {
      const putCircleRequest = new Promise<void>(
        (resolve) => {
          requestBody = new FormData();
          form = {
            name: this.userForm.get('firstname').value + ' ' + this.userForm.get('lastname').value,
          };

          requestBody.append('circle', JSON.stringify(form));

          if (image !== undefined && image != null && (image instanceof File || image instanceof Blob)) {
            requestBody.append('image', image, 'GAMEBUS_CIRCLE_IMAGE.jpg');
          }
          const putPrivateCircle: ApiRequest = {
            uri: '/circles/{cid}',
            method: 'PUT',
            pathVariables: [
              { key: 'cid', value: circle.id },
            ],
            requestBody,
          };
          this.api.request(putPrivateCircle).subscribe(
            (c: any) => {
              resolve();
            },
          );
        }
      );
      await putCircleRequest;
    }
  }


  async presentPasswordModal() {
    const modal = await this.modalCtrl.create({
      component: RecoverPasswordPage,
      swipeToClose: true,
      presentingElement: await this.modalCtrl.getTop()
    });
    return await modal.present();
  }







  async getProviders($event?: CustomEvent) {
    const gp: ApiRequest = {
      uri: '/gis/data-providers',
      method: 'GET',
    };
    const dataproviders: DataProvider[] = await this.api.promise(gp);
    this.providers = dataproviders.filter(p => this.allowedDataproviders.includes(p.name) && (p.connectUrl || p.disconnectUrl));

    if ($event) {
      ($event.target as any).complete();
    }

    return new Promise<void>(resolve => resolve());
  }



  doLogout() {
    this.ss.destroyState();
    this.nav.navigateRoot(['/landing', this.config.campaign.href]);
  }

}
