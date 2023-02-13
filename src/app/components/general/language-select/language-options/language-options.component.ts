import { Component, OnInit } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';
import { User } from 'src/app/models/gamebus/user.model';
import { ApiRequest } from 'src/app/models/general/api-request.model';
import { AuthUser } from 'src/app/models/general/auth-user.model';
import { ApiService } from 'src/app/services/api.service';
import { AuthorizationService } from 'src/app/services/authorization.service';
import { environment } from 'src/environments/environment';


@Component({
  selector: 'app-language-options',
  templateUrl: './language-options.component.html',
  styleUrls: ['./language-options.component.scss'],
})
export class LanguageOptionsComponent implements OnInit {

  uris = environment.uris;

  languages = environment.languages;

  constructor(
    private as: AuthorizationService,
    private api: ApiService,
    private translate: TranslateService,
    private popoverCtrl: PopoverController,
  ) { }

  ngOnInit() { }

  dismiss(role: string = 'cancel', data?: any) {
    this.popoverCtrl.dismiss(data, role);
  }

  async setLanguage(language: string) {
    if (!this.languages.includes(language)) {
      language = this.languages[0];
    }
    this.translate.use(language);
    moment.locale(language);

    if (this.as.isAuthenticated()) {
      const authuser: AuthUser = this.as.getAuthUser();

      const requestBody = new FormData();
      requestBody.append('user', JSON.stringify({ language, }));

      const putUser: ApiRequest = {
        uri: '/users/{uid}',
        method: 'PUT',
        pathVariables: [
          { key: 'uid', value: authuser.details?.uid },
        ],
        requestBody,
      };
      const user: User = await this.api.promise(putUser);
      authuser.details.language = user.language;

      this.as.setAuthUser(authuser);

    }

    this.dismiss();
  }

}
