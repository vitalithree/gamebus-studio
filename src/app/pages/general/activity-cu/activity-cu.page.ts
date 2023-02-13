/* eslint-disable max-len */
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment';
import { CampaignConfig } from 'src/app/models/airbridge/campaign-config.model';
import { Task } from 'src/app/models/airbridge/task.model';
import { Activity } from 'src/app/models/gamebus/activity.model';
import { UserState } from 'src/app/models/gamebus/user-state.model';
import { ApiRequest } from 'src/app/models/general/api-request.model';
import { AuthUser } from 'src/app/models/general/auth-user.model';
import { ActivityService } from 'src/app/services/activity.service';
import { ApiService } from 'src/app/services/api.service';
import { AuthorizationService } from 'src/app/services/authorization.service';
import { StateService } from 'src/app/services/state.service';
import { environment } from 'src/environments/environment';
import { CampaignService } from '../../../services/campaign.service';
import { ChallengeService } from '../../../services/challenge.service';



@Component({
  selector: 'app-activity-cu',
  templateUrl: './activity-cu.page.html',
  styleUrls: ['./activity-cu.page.scss'],
})
export class ActivityCUPage implements OnInit {

  uris = environment.uris;
  client = environment.client;

  isReady = false;
  isLocked = false;
  segment: string;

  authuser: AuthUser;

  config: CampaignConfig;
  state: UserState;

  rid: number;
  task: Task;

  types: string[];
  providers: string[];

  schemes: { all: { id: number; key: string; image: string }[]; available: { id: number; key: string; image: string }[]; selected?: { id: number; key: string; image: string } } = { all: [], available: [] };
  properties: { allowed: any[]; conditions: any[] }
    = {
      allowed: ['STEPS', 'DISTANCE', 'DURATION'],
      conditions: []
    };
  datetime: { history: string; now: string; tomorrow: string; moment: any };

  users: { all: any[]; selected: any[] } = { all: [], selected: [] };

  form: FormGroup;



  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private api: ApiService,
    private as: AuthorizationService,
    private cs: CampaignService,
    private ss: StateService,
    private xs: ChallengeService,
    private acs: ActivityService,
    private fb: FormBuilder,
  ) {
  }


  async ngOnInit() {
    const rid = this.route.snapshot.paramMap.get('rid');
    if (rid) {
      this.rid = Number(rid);
    } else {
      this.router.navigate(['/tasks'], { replaceUrl: true });
    }

    this.authuser = this.as.getAuthUser();

    this.schemes.all = await this.api.promise({ uri: '/activityschemes', method: 'GET' } as ApiRequest);
    this.types = this.xs.getKnownTypes('map');
    this.providers = this.xs.getKnownProviders('map');

    this.config = await this.cs.getConfig();
    this.state = await this.ss.getState();
    await this.parseData();

    this.ss.state$.subscribe(state => { this.state = state; this.parseData(); });

    this.isReady = true;
  }



  async parseData($event?: CustomEvent): Promise<void> {
    this.task = this.state.tasks.find(t => t.rid === this.rid);
    if (!this.task) { this.router.navigate(['/tasks'], { replaceUrl: true }); return; }

    if (this.task.restrictedGameDescriptors?.length) {
      this.schemes.available = this.task.restrictedGameDescriptors
        .map((s: any) => ({ id: s.id, key: s.translationKey, image: s.image }));
    } else if (this.task.types?.length) {
      const types = [];
      for (const type of this.task.types) {
        if (this.types[type]) {
          types.push(this.types[type]);
        }
      }
      this.schemes.available = this.schemes.all.filter((s: any) => types.includes(s.translationKey))
        .map((s: any) => ({ id: s.id, key: s.translationKey, image: s.image }));
    }

    let scheme: any;
    if (this.task.defaultGameDescriptor) {
      scheme = this.schemes.available.find(s => s.id === this.task.defaultGameDescriptor.id);
    } else if (this.task.types?.length) {
      const type = this.types[this.task.types[0]];
      if (type) { scheme = this.schemes.available.find(s => s.key === type); }
    }
    if (scheme) {
      this.schemes.selected = scheme;
    } else {
      this.schemes.selected = this.schemes.all.find(s => s.key === 'GENERAL_ACTIVITY');
    }

    this.datetime = {
      history: moment().subtract(2, 'weeks').format('YYYY-MM-DD'),
      now: moment().format('YYYY-MM-DDTHH:mm'),
      tomorrow: moment().add(1, 'days').format('YYYY-MM-DD'),
      moment: moment(),
    };

    this.form = this.fb.group({
      type: [this.schemes.selected.id, Validators.compose([Validators.required])],
      datetime: [this.datetime.now, Validators.compose([Validators.required])],
      image: [null],
      video: [null],
      description: [null],
      properties: this.fb.array([]),
    });



    if (this.task.conditions?.length) {
      this.task.conditions.filter((condition: any) => this.properties.allowed.includes(condition.property.translationKey))
        .forEach((condition: any) => {
          const property = { id: condition.property.id, key: condition.property.translationKey, value: Number(condition.rhsValue) + 1 };
          if (condition.property.translationKey === 'DURATION') { property.value = ((Number(condition.rhsValue) + 1) / 60); }
          const config = this.acs.getPropertyConf(property.key);
          const form = this.createPropertyForm();
          form.patchValue({ ...property, ...config });
          (this.form.get('properties') as FormArray).push(form);
        });
    }


    this.segment = 'image';
    if (this.task.requiresImage && this.task.requiresVideo) {
      this.form.addValidators(eitherOrValidator);
      this.form.updateValueAndValidity();
    } else {
      if (this.task.requiresImage) {
        this.form.get('image').setValidators([Validators.compose([Validators.required])]);
      }
      this.form.get('image').updateValueAndValidity();

      if (this.task.requiresVideo) {
        this.segment = 'video';
        this.form.get('video').setValidators([Validators.compose([Validators.required])]);
      }
      this.form.get('video').updateValueAndValidity();
    }

    if (this.task.requiresDescription) {
      this.form.get('description').setValidators([Validators.compose([Validators.required])]);
    }
    this.form.get('description').updateValueAndValidity();




    const getUsersToRegisterFor: ApiRequest = {
      uri: '/players/{pid}/log-activities',
      method: 'GET',
      pathVariables: [
        { key: 'pid', value: this.authuser.details?.pid },
      ],
      requestParams: [
        { key: 'fields', value: ['user.id'] },
      ],
    };
    let uids = await this.api.promise(getUsersToRegisterFor) || [];
    if (uids?.length) {
      uids = uids.map((u: any) => u.user.id);
    }
    uids.unshift(this.authuser.details?.uid);

    const users = this.state.circles.campaign.memberships.map((m: any) => {
      const u = m.player.user;
      const p = m.player;
      return { uid: u.id, pid: p.id, firstname: u.firstName, lastname: u.lastName, image: u.image, circles: {} };
    });
    this.users.all = users.filter((u: any) => uids.includes(u.uid)).map((u: any) => ({ ...u, selected: u.uid === this.authuser.details?.uid, disabled: u.uid === this.authuser.details?.uid }));
    this.users.selected = this.users.all.filter(u => u.selected);



    if ($event) {
      ($event.target as any).complete();
    }

    return new Promise((resolve) => resolve());
  }


  selectType($event: CustomEvent) {
    this.schemes.selected = this.schemes.available.find(s => s.id === $event.detail.value);
  }

  selectUsers($event: CustomEvent) {
    this.users.selected = this.users.all.filter(u => u.selected);
  }



  createPropertyForm(): FormGroup {
    return this.fb.group({
      id: [null, Validators.compose([Validators.required])],
      key: [null, Validators.compose([Validators.required])],
      value: [null, Validators.compose([Validators.required])],
      input: [null],  // for front-end purposes
      unit: [null],   // for front-end purposes
      min: [null],    // for front-end purposes
      max: [null],    // for front-end purposes
      step: [null],   // for front-end purposes
      enum: [null],   // for front-end purposes
    });
  }
  addPropertyForm() {
    const formArray = this.form.get('propertyInstances') as FormArray;
    formArray.push(this.createPropertyForm());
  }




  async createActivity() {
    this.isLocked = true;

    const data = this.form.value;
    const properties = data.properties.map((p: any) => ({ property: p.id, value: p.key === 'DURATION' ? (p.value * 60) : p.value }));

    let secret = this.task.hasSecret;
    if (this.task.conditions?.length) {
      const condition = this.task.conditions.find((c: any) => c.property.translationKey === 'SECRET');
      if (condition) { secret = condition.rhsValue; }
    }

    const requestBody = new FormData();
    const form = {
      gameDescriptor: data.type,
      dataProviderName: this.client.dataprovider,
      date: moment(data.datetime).valueOf(),
      propertyInstances: [],
      players: this.users.selected.map(user => user.pid),
    };

    if (secret !== undefined && secret != null) {
      form.propertyInstances.push({ propertyTK: 'SECRET', value: secret });
    }

    if (properties.length > 0) {
      form.propertyInstances = form.propertyInstances.concat(properties);
    }

    const description = this.form.get('description').value;
    if (description && description !== '') {
      form.propertyInstances.push({ propertyTK: 'DESCRIPTION', value: description });
    }

    if (data.image) { requestBody.append('image', data.image, 'GAMEBUS_ACTIVITY_IMAGE.jpg'); }
    if (data.video) { form.propertyInstances.push({ propertyTK: 'VIDEO', value: data.video }); }

    requestBody.append('activity', JSON.stringify(form));

    const postActivity: ApiRequest = {
      uri: '/activities',
      method: 'POST',
      requestParams: [
        { key: 'dryrun', value: false },
        { key: 'fields', value: ['personalPoints'] },
      ],
      requestBody,
    };

    const activities: Activity[] = await this.api.promise(postActivity);

    if (activities?.length) {
      const ractivities = activities.filter(a => a.personalPoints?.length);

      if (ractivities?.length) {
        let points = ractivities.map(a => a.personalPoints).reduce((x, y) => x.concat(y), []);

        points = points.filter(p => {
          const x = p.participation.challenge.name;
          return x.includes(this.config.campaign.abbr) && x.includes('-tasks:');
        });

        if (points?.length) { await this.ss.observePoints(points); }
      } else {
        // TODO: note if not worth points...
      }
    }

    this.router.navigate(['/account'], { replaceUrl: true });
    this.isLocked = false;
  }

}

export const eitherOrValidator: ValidatorFn = (control: FormGroup): ValidationErrors | null => {
  const image = control.get('image').value;
  const video = control.get('video').value;

  if (!image && !video) { return { error: true }; }
};
