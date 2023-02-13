import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, PopoverController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Activity } from 'src/app/models/gamebus/activity.model';
import { ApiRequest } from 'src/app/models/general/api-request.model';
import { ApiService } from 'src/app/services/api.service';
import { AuthorizationService } from 'src/app/services/authorization.service';
import { StateService } from 'src/app/services/state.service';

@Component({
  selector: 'app-activity-card-popover',
  templateUrl: './gb-activity-card-popover.component.html',
  styleUrls: ['./gb-activity-card-popover.component.scss'],
})
export class ActivityCardPopoverComponent implements OnInit {

  @Input() activity: Activity;

  isAdmin = false;

  pid: number;

  constructor(
    private translate: TranslateService,
    private router: Router,
    private api: ApiService,
    private as: AuthorizationService,
    private ss: StateService,
    private popoverCtrl: PopoverController,
    private alertCtrl: AlertController,
  ) { }

  async ngOnInit() {
    const authuser = this.as.getAuthUser();
    this.pid = authuser.details?.pid;
    this.isAdmin = this.as.isAdmin();
  }



  async deleteActivity() {

    const alert = await this.alertCtrl.create({
      header: this.translate.instant('c.s.activity-card.delete-alert-1'),
      message: this.translate.instant('c.s.activity-card.delete-alert-2'),
      buttons: [
        {
          text: this.translate.instant('g.cancel'),
          role: 'cancel',
          cssClass: 'alert-button-light',
        }, {
          text: this.translate.instant('c.s.activity-card.delete-alert-3'),
          cssClass: 'alert-button-danger',
          handler: async () => {

            const deleteActivity: ApiRequest = {
              uri: '/activities/{aid}',
              method: 'DELETE',
              pathVariables: [
                { key: 'aid', value: this.activity.id },
              ],
            };
            this.api.promise(deleteActivity);
            this.popoverCtrl.dismiss({ delete: true, });
            this.ss.observePoints(null);
          },
        }
      ]
    });

    await alert.present();
  }

  async confirmResetPoints() {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('c.s.activity-card.fraud-alert-1'),
      message: this.translate.instant('c.s.activity-card.fraud-alert-2'),
      buttons: [
        {
          text: this.translate.instant('g.cancel'),
          role: 'cancel',
          cssClass: 'alert-button-light',
        }, {
          text: this.translate.instant('c.s.activity-card.fraud-alert-3'),
          cssClass: 'alert-button-danger',
          handler: () => {
            this.resetPoints();
          }
        }
      ]
    });

    await alert.present();
  }

  async resetPoints() {

    const postActivityMessage: ApiRequest = {
      uri: '/activities/{aid}/messages',
      method: 'POST',
      pathVariables: [
        { key: 'aid', value: this.activity.id },
      ],
      requestBody: { text: this.translate.instant('c.s.activity-card.fraud-message') },
    };
    await this.api.promise(postActivityMessage);



    const requestBody = new FormData();
    const form = {
      gameDescriptor: this.activity.gameDescriptor.id,
      dataProvider: this.activity.dataProvider.id,
      date: this.activity.date,
      image: this.activity.image,
      propertyInstances: [
        { propertyTK: 'SECRET', value: 'fraud' },
      ],
      players: [this.activity.player.id],
    };

    if (this.activity.propertyInstances?.length) {
      const properties = this.activity.propertyInstances
        .map(pi => ({ key: pi.property.translationKey, value: pi.value }))
        .filter(p => p.value !== undefined && p.value != null && p.value !== '');

      if (properties.find(p => p.key === 'VIDEO')) {
        form.propertyInstances.push(
          { propertyTK: 'VIDEO', value: properties.find(p => p.key === 'VIDEO').value }
        );
      }
    }

    requestBody.append('activity', JSON.stringify(form));

    const putActivity: ApiRequest = {
      uri: '/activities/{aid}',
      method: 'PUT',
      pathVariables: [
        { key: 'aid', value: this.activity.id },
      ],
      requestParams: [
        { key: 'dryrun', value: false },
      ],
      requestBody,
    };

    await this.api.promise(putActivity);

    this.popoverCtrl.dismiss({ delete: true, });
    this.router.navigate(['/activities', this.activity.id]);
  }


}
