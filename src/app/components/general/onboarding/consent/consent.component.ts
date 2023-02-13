import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { CampaignConfig } from 'src/app/models/airbridge/campaign-config.model';
import { ConsentItem } from 'src/app/models/airbridge/consent-item.model';
import { UserState } from 'src/app/models/gamebus/user-state.model';
import { AuthUser } from 'src/app/models/general/auth-user.model';
import { AuthorizationService } from 'src/app/services/authorization.service';
import { CampaignService } from 'src/app/services/campaign.service';
import { StateService } from 'src/app/services/state.service';

@Component({
  selector: 'app-consent',
  templateUrl: './consent.component.html',
  styleUrls: ['./consent.component.scss'],
})
export class OnboardingConsentComponent implements OnInit {

  @Output() segmentEvent = new EventEmitter<string>();

  isLocked = false;

  authuser: AuthUser;

  config: CampaignConfig;
  state: UserState;

  consent: ConsentItem[];
  form: FormGroup;


  constructor(
    private translate: TranslateService,
    private as: AuthorizationService,
    private cs: CampaignService,
    private ss: StateService,
    private fb: FormBuilder,
  ) { }

  async ngOnInit() {

    this.config = await this.cs.getConfig();
    this.state = await this.ss.getState();

    await this.parseData();

    this.cs.config$.subscribe(config => { this.config = config; this.parseData(); });
    this.ss.state$.subscribe(state => { this.state = state; this.parseData(); });

    this.as.isAuthenticated$.subscribe(ia => this.parseData());
  }


  async parseData() {
    if (!this.as.isAuthenticated()) { return; }

    this.authuser = this.as.getAuthUser();

    // Consent form
    this.consent = JSON.parse(JSON.stringify(this.config.campaign.consent.map((item, index) => ({ ...item, key: index.toString() }))));

    const form = this.fb.group({});
    this.consent.forEach(item => {
      let validators = [];
      if (item.required) { validators = [Validators.required, Validators.requiredTrue]; }
      let value = false;
      const history = this.state.consent?.campaign?.find(c => c.tk === item.tk);
      if (history) {
        value = history.accepted;
      }
      form.addControl(item.key, this.fb.control(value, validators));
    });

    this.form = form;
  }


  async storeConsent() {
    this.isLocked = true;

    const consent = [];
    this.consent.forEach(item => {
      // eslint-disable-next-line max-len
      consent.push({ tk: item.tk, condition: this.translate.instant(`c.g.onboarding.consent.${item.tk}`), accepted: this.form.get(item.key).value });
    });
    await this.ss.storeConsent(consent);
    await this.ss.parseConsent(consent);
    this.ss.publishState();

    this.isLocked = false;

    this.segmentEvent.emit();
    return new Promise<void>(resolve => resolve());
  }

}
