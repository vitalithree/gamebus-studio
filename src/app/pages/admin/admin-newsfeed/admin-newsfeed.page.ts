import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonInfiniteScroll } from '@ionic/angular';
import { Activity } from 'src/app/models/gamebus/activity.model';
import { UserState } from 'src/app/models/gamebus/user-state.model';
import { ApiRequest } from 'src/app/models/general/api-request.model';
import { ApiService } from 'src/app/services/api.service';
import { StateService } from 'src/app/services/state.service';
import { environment } from 'src/environments/environment';



@Component({
  selector: 'app-admin-newsfeed',
  templateUrl: './admin-newsfeed.page.html',
  styleUrls: ['./admin-newsfeed.page.scss'],
})
export class AdminNewsfeedPage implements OnInit {

  @ViewChild(IonInfiniteScroll) infinite: IonInfiniteScroll;

  uris = environment.uris;

  isReady = false;
  isLocked = false;

  state: UserState;
  activities: Activity[];

  form: FormGroup;


  constructor(
    private api: ApiService,
    private ss: StateService,
    private fb: FormBuilder,
  ) {

  }


  async ngOnInit() {

    this.form = this.fb.group({
      aids: [null, Validators.compose([Validators.required])],
    });

    this.state = await this.ss.getState();
    await this.parseData();

    this.ss.state$.subscribe(state => { this.state = state; this.parseData(); });

    this.isReady = true;
  }



  async parseData(reset = false, $event?: CustomEvent): Promise<void> {
    if (this.isLocked) { return; }

    const curlen = this.state?.newsfeed?.items?.length || 0;

    this.isLocked = true;

    if ($event?.type === 'ionRefresh') {
      reset = true;
      this.infinite.disabled = false;
    }

    if ($event || !curlen) {
      await this.ss.parseNewsfeed(reset);
    }
    this.state = await this.ss.getState();

    const newlen = this.state?.newsfeed?.items?.length || 0;

    if (newlen) {
      this.activities = this.state.newsfeed.items.sort((a, b) => b.id - a.id);
    }

    if ($event) {
      ($event.target as any).complete();
      if (curlen === newlen && $event?.type === 'ionInfinite') {
        ($event.target as any).disabled = true;
      }
    }

    this.isLocked = false;
    return new Promise(resolve => resolve());
  }



  async recalculatePoints() {
    try {
      this.isLocked = true;

      let aids = this.form.value.aids;
      aids = aids.replace(/\s/g, '');
      aids = this.form.value.aids.split(',');
      for (const aid of aids) {
        const recalculatePoints: ApiRequest = {
          uri: '/activities/{aid}/recalculate-points',
          method: 'POST',
          pathVariables: [
            { key: 'aid', value: aid },
          ]
        };

        await this.api.promise(recalculatePoints);
      }
      this.isLocked = false;
    } catch (e) {
    }
    this.parseData(true);
  }



}
