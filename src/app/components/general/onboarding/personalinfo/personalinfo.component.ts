import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CampaignConfig } from 'src/app/models/airbridge/campaign-config.model';
import { Activity } from 'src/app/models/gamebus/activity.model';
import { ApiRequest } from 'src/app/models/general/api-request.model';
import { AuthUser } from 'src/app/models/general/auth-user.model';
import { ApiService } from 'src/app/services/api.service';
import { AuthorizationService } from 'src/app/services/authorization.service';
import { CampaignService } from 'src/app/services/campaign.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-personalinfo',
  templateUrl: './personalinfo.component.html',
  styleUrls: ['./personalinfo.component.scss'],
})
export class OnboardingPersonalInfoComponent implements OnInit {

  @Output() segmentEvent = new EventEmitter<string>();

  @Input() didSignup = false;

  client = environment.client;

  isLocked = false;

  authuser: AuthUser;

  config: CampaignConfig;

  form: FormGroup;


  constructor(
    private api: ApiService,
    private as: AuthorizationService,
    private cs: CampaignService,
    private fb: FormBuilder,
  ) { }

  async ngOnInit() {

    this.config = await this.cs.getConfig();
    await this.parseData();

    this.cs.config$.subscribe(config => { this.config = config; this.parseData(); });

    this.as.isAuthenticated$.subscribe(ia => this.parseData());
  }


  async parseData() {
    if (!this.as.isAuthenticated()) { return; }

    this.authuser = this.as.getAuthUser();

    let gender = null; let age = null;
    const gua: ApiRequest = {
      uri: '/players/{pid}/activities',
      method: 'GET',
      pathVariables: [
        { key: 'pid', value: this.authuser.details?.pid },
      ],
      requestParams: [
        { key: 'gds', value: 'GENERAL_SURVEY' },
        { key: 'limit', value: 1 },
        { key: 'sort', value: ['-date'] },
        { key: 'fields', value: ['propertyInstances.value', 'propertyInstances.property.translationKey'] },
      ],
    };
    const activities: Activity[] = await this.api.promise(gua);

    if (activities?.length) {
      activities[0].propertyInstances.forEach(pi => {
        const [key = null, value = null] = pi.value.split(':');
        if (key === 'gender' && ['male', 'female', 'other'].includes(value)) { gender = value; }
        if (key === 'age' && !isNaN(Number(value))) { age = Number(value); }
      });
    }

    this.form = this.fb.group({
      gender: [gender, Validators.compose([Validators.required])],
      age: [age, Validators.compose([Validators.required])],
      image: [this.authuser.details?.image || null],
    });

  }



  async submitData() {
    this.isLocked = true;

    const image = this.form.get('image').value;
    if (image && (image instanceof File || image instanceof Blob)) {

      const ufd = new FormData();
      ufd.append('user', '{}');
      ufd.append('image', image, 'GAMEBUS_USER_IMAGE.jpg');

      const pu: ApiRequest = {
        uri: '/users/{uid}',
        method: 'PUT',
        pathVariables: [
          { key: 'uid', value: this.authuser?.details?.uid },
        ],
        requestBody: ufd,
      };
      const user = await this.api.promise(pu);
      this.authuser.details.image = user.image;

      this.as.setAuthUser(this.authuser);
    }

    const propertyInstances = [];
    Object.entries(this.form.value).forEach(([key, value]) => {
      if (key !== 'image') {
        propertyInstances.push({ propertyTK: 'DESCRIPTION', value: `${key}:${value}` });
      }
    });

    const requestBody = new FormData();
    const form = {
      gameDescriptorTK: 'GENERAL_SURVEY',
      dataProviderName: this.client.dataprovider,
      propertyInstances,
      players: [this.authuser?.details?.pid],
    };

    requestBody.append('activity', JSON.stringify(form));

    const ca: ApiRequest = {
      uri: '/activities',
      method: 'POST',
      requestParams: [
        { key: 'dryrun', value: false },
        { key: 'fields', value: ['id'] },
      ],
      requestBody,
    };
    await this.api.promise(ca);

    this.segmentEvent.emit();
    this.isLocked = false;
  }









}
