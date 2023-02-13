import { Component, OnInit, Input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { PopoverController } from '@ionic/angular';
import { LanguageOptionsComponent } from './language-options/language-options.component';
import { AuthorizationService } from 'src/app/services/authorization.service';
import { AuthUser } from 'src/app/models/general/auth-user.model';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-language-select',
  templateUrl: './language-select.component.html',
  styleUrls: ['./language-select.component.scss'],
})
export class LanguageSelectComponent implements OnInit {

  @Input() isLocked = false;
  @Input() color = 'medium';

  uris = environment.uris;

  languages = environment.languages;
  language: string;

  constructor(
    private as: AuthorizationService,
    private translate: TranslateService,
    private popoverCtrl: PopoverController,
  ) { }

  ngOnInit() {
    this.language = this.translate.currentLang;
    if (this.as.isAuthenticated()) {
      const user: AuthUser = this.as.getAuthUser();
      this.language = user.details.language;
      if (!this.languages.includes(this.language)) {
        this.language = this.languages[0];
      }
    }
  }


  async presentLanguageOptions($event: CustomEvent) {
    const popover = await this.popoverCtrl.create({
      component: LanguageOptionsComponent,
      event: $event,
      mode: 'md',
      translucent: true,
    });
    await popover.present();

    await popover.onWillDismiss();
    this.language = this.translate.currentLang;
  }

}
