import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Group } from 'src/app/models/airbridge/group.model';
import { ApiRequest } from 'src/app/models/general/api-request.model';
import { AuthorizationService } from 'src/app/services/authorization.service';
import { StateService } from 'src/app/services/state.service';
import { environment } from 'src/environments/environment';
import { UserState } from '../../../../models/gamebus/user-state.model';
import { ApiService } from '../../../../services/api.service';

@Component({
  selector: 'app-groups',
  templateUrl: './groups.component.html',
  styleUrls: ['./groups.component.scss'],
})
export class OnboardingGroupsComponent implements OnInit {

  @Input() gtypes: { name: string; groups: Group[] }[];

  @Output() segmentEvent = new EventEmitter<string>();

  uris = environment.uris;

  isReady = false;
  isLocked = false;

  state: UserState;

  form: FormGroup;

  constructor(
    private api: ApiService,
    private as: AuthorizationService,
    private ss: StateService,
    private fb: FormBuilder,
  ) { }

  async ngOnInit() {
    this.form = this.fb.group({});
    if (!this.gtypes?.length) {
      this.segmentEvent.emit();
      return;
    }

    this.state = await this.ss.getState();
    for (const gtype of this.gtypes) {
      let value = null;
      for (const group of gtype.groups) {
        group.isMember = this.state.circles.all.find(c => c.id === group.cid) ? true : false;
        if (group.isMember) { value = group.cid; }
      }

      const disabled = value ? true : false;
      this.form.addControl(gtype.name, this.fb.control({ value, disabled }, [Validators.required]));
    }

    this.isReady = true;
  }

  async submitData() {
    this.isLocked = true;

    const pid = this.as.getAuthUser().details?.pid;

    const form = this.form.value;

    for (const group in form) {
      if (!form[group]) { continue; }

      const cmr: ApiRequest = {
        uri: '/circles/{cid}/memberships',
        method: 'POST',
        pathVariables: [
          { key: 'cid', value: form[group] }
        ],
        requestParams: [
          { key: 'playerIds', value: [pid] },
        ],
      };

      await this.api.promise(cmr);
    }

    await this.ss.parseCircles();
    await this.ss.parseChallenges();
    await this.ss.parsePages();
    this.ss.publishState();

    this.segmentEvent.emit();
    this.isLocked = false;
  }

}
