import { Component, Input, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Rule } from 'src/app/models/gamebus/challenge.model';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-rule-list-item',
  templateUrl: './gb-rule-list-item.component.html',
  styleUrls: ['./gb-rule-list-item.component.scss'],
})
export class RuleListItemComponent implements OnInit {

  @Input() rule: Rule;

  uris = environment.uris;

  role = 1;

  constructor(
    private translate: TranslateService,
    private toastCtrl: ToastController,
  ) { }

  ngOnInit() {
  }

  isRewardedByThisApp() {
    if (!this.rule.pointMappings.find(point => point.dataProviders.find(provider => provider.id === 1))) {
      return false;
    }
    return true;
  }

  isStillRewarded() {
    if (this.rule.maxTimesFired === undefined || this.rule.maxTimesFired == null
      || this.rule.minDaysBetweenFire === undefined || this.rule.minDaysBetweenFire == null) {
      return true;
    }

    if (this.rule.numberOfFiresInTimeWindow < this.rule.maxTimesFired) {
      return true;
    }
  }




  async presentInformativeToast() {
    let message: string;
    if (!this.isRewardedByThisApp()) {
      message = this.translate.instant('c.s.rule-list-item.not-rewarded-anymore');
      this.rule.pointMappings.map(point => point.dataProviders)
        .reduce((a, b) => a.concat(b), [])
        .forEach((provider, i: number) => {
          if (i > 0) { message += ', '; }
          message += provider.name;
        });
      message += '.';
    } else if (!this.isStillRewarded()) {
      message = this.translate.instant('c.s.rule-list-item.not-rewarded-anymore') + this.rule.numberOfFiresInTimeWindow + '/'
        + this.rule.maxTimesFired + ' ' + this.translate.instant('c.s.rule-list-item.times') + ' ';
      if (this.rule.minDaysBetweenFire === 1) {
        message += this.translate.instant('c.s.rule-list-item.the-past-day');
      } else if (this.rule.minDaysBetweenFire === 7) {
        message += this.translate.instant('c.s.rule-list-item,the-past-week');
      } else {
        message += this.translate.instant('c.s.rule-list-item.in-the-past') + ' '
          + this.rule.minDaysBetweenFire + ' ' + this.translate.instant('c.s.rule-list-item.days');
      }
      message += '.';
    }

    if (message !== undefined && message != null) {
      const toast = await this.toastCtrl.create({
        message,
        duration: 8000,
        position: 'bottom',
        color: 'dark',
        buttons: [{ icon: 'close', role: 'cancel', }]
      });
      toast.present();
    }
  }
}
