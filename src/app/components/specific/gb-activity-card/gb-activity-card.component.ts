import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonTextarea, NavController, PopoverController } from '@ionic/angular';
import { PlyrComponent } from 'ngx-plyr';
import { CampaignConfig } from 'src/app/models/airbridge/campaign-config.model';
import { Activity, Chat, Support } from 'src/app/models/gamebus/activity.model';
import { UserState } from 'src/app/models/gamebus/user-state.model';
import { ApiRequest } from 'src/app/models/general/api-request.model';
import { AuthUser } from 'src/app/models/general/auth-user.model';
import { ApiService } from 'src/app/services/api.service';
import { AuthorizationService } from 'src/app/services/authorization.service';
import { CampaignService } from 'src/app/services/campaign.service';
import { StateService } from 'src/app/services/state.service';
import { environment } from 'src/environments/environment';
import { ActivityCardPopoverComponent } from './gb-activity-card-popover/gb-activity-card-popover.component';

@Component({
  selector: 'app-activity-card',
  templateUrl: './gb-activity-card.component.html',
  styleUrls: ['./gb-activity-card.component.scss'],
})
export class ActivityCardComponent implements OnInit {

  @Input() activity: Activity;

  @ViewChild(IonTextarea, { static: false }) input: IonTextarea;
  @ViewChild(PlyrComponent, { static: false }) plyr: PlyrComponent;
  plyrOptions = {
    controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'fullscreen'],
    loop: { active: true },
    muted: true,
  };


  uris = environment.uris;

  properties: { allowed: { general: string[]; survey: string[] }; filtered: { key: string; value: string }[] } = {
    allowed: {
      general: ['DESCRIPTION', 'STEPS', 'DISTANCE', 'DURATION', 'STEPS_SUM'],
      survey: ['MIPIP_EXTRAVERSION', 'MIPIP_AGREEABLENESS', 'MIPIP_CONSCIENTIOUSNESS', 'MIPIP_NEUROTICISM', 'MIPIP_INTELLECT']
    },
    filtered: []
  };
  surveys: { keys: string[] } = { keys: ['MIPIP'] };

  state: UserState;
  config: CampaignConfig;

  points = 0;
  token: string;

  messageForm: FormGroup;

  authuser: AuthUser;
  isAdmin = false;
  pid: number;
  gaveSupport = false;
  cid: number;
  view: { challenges: boolean; supports: boolean; reactions: boolean } = { challenges: false, supports: false, reactions: false };


  constructor(
    private as: AuthorizationService,
    private cs: CampaignService,
    private ss: StateService,
    private api: ApiService,
    private fb: FormBuilder,
    public navCtrl: NavController,
    private popoverCtrl: PopoverController,
  ) {
    this.messageForm = this.fb.group({
      text: [null, Validators.compose([Validators.required, Validators.maxLength(512)])],
    });
  }

  async ngOnInit() {
    this.token = this.as.getAccessToken();
    this.authuser = this.as.getAuthUser();
    this.isAdmin = this.as.isAdmin();
    this.pid = this.authuser.details?.pid;

    this.config = await this.cs.getConfig();
    this.state = await this.ss.getState();

    if (this.surveys.keys.includes(this.activity.gameDescriptor.translationKey)) {
      this.activity.isSurvey = true;
    }

    if (this.activity.propertyInstances?.length > 0) {
      const properties = this.activity.propertyInstances
        .map(pi => ({ key: pi.property.translationKey, value: pi.value }))
        .filter(p => p.value !== undefined && p.value != null && p.value !== '');

      if (properties.find(p => p.key === 'VIDEO')) {
        this.activity.video = properties.find(p => p.key === 'VIDEO').value + '?access_token=' + this.token;
      }

      if (!this.activity.isSurvey) {
        this.properties.filtered = [];
        for (const ap of this.properties.allowed.general) {
          const property = properties.find(p => p.key === ap);
          if (property !== undefined && property !== null) {
            this.properties.filtered.push(property);
          }
        }
      } else {
        this.properties.filtered = properties.filter(p => this.properties.allowed.survey.includes(p.key));
      }
    }

    if (this.activity.personalPoints !== undefined && this.activity.personalPoints != null) {
      for (const point of this.activity.personalPoints) {
        this.points += point.value;
      }
    }

    if (this.activity.chats !== undefined && this.activity.chats != null) {
      this.activity.chats = this.activity.chats.filter(c => c.messages && c.messages.length > 0)
        .sort((a, b) => b.messages[0].date - a.messages[0].date);
    }

    this.gaveSupport = this.activity.supports.map(s => s.supporter.id).includes(this.pid);
  }


  async supportActivity() {
    const putSupport: ApiRequest = {
      uri: '/activities/{aid}/supports',
      method: 'PUT',
      pathVariables: [
        { key: 'aid', value: this.activity.id },
      ]
    };
    const supports: Support[] = await this.api.promise(putSupport);
    this.activity.supports = supports;

    this.gaveSupport = supports.map(s => s.supporter.id).includes(this.pid);
  }

  async postMessage() {
    if (this.messageForm.valid) {
      const postActivityMessage: ApiRequest = {
        uri: '/activities/{aid}/messages',
        method: 'POST',
        pathVariables: [
          { key: 'aid', value: this.activity.id },
        ],
        requestBody: this.messageForm.value,
      };
      const chats: Chat[] = await this.api.promise(postActivityMessage);
      if (chats?.length) {
        this.activity.chats = chats.filter(c => c.messages && c.messages.length > 0)
          .sort((a, b) => b.messages[0].date - a.messages[0].date);
      }
      this.messageForm.reset();

    }
  }


  async presentOptionsPopover($event: Event) {
    const popover = await this.popoverCtrl.create({
      component: ActivityCardPopoverComponent,
      componentProps: {
        activity: this.activity,
      },
      event: $event,
      translucent: false,
      mode: 'md',
      // showBackdrop: false,
    });

    await popover.present();

    const { data } = await popover.onWillDismiss();
    if (data && data.delete) {
      this.activity = null;
    }
  }

}
