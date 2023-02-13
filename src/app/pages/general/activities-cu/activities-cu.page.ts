/* eslint-disable max-len */
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';
import { CampaignConfig } from 'src/app/models/airbridge/campaign-config.model';
import { Page } from 'src/app/models/airbridge/page.model';
import { Wave } from 'src/app/models/airbridge/wave.model';
import { UserState } from 'src/app/models/gamebus/user-state.model';
import { ApiRequest } from 'src/app/models/general/api-request.model';
import { ApiService } from 'src/app/services/api.service';
import { StateService } from 'src/app/services/state.service';
import { environment } from 'src/environments/environment';
import { Task } from '../../../models/airbridge/task.model';
import { CampaignService } from '../../../services/campaign.service';



@Component({
  selector: 'app-activities-cu',
  templateUrl: './activities-cu.page.html',
  styleUrls: ['./activities-cu.page.scss'],
})
export class ActivitiesCUPage implements OnInit {

  uris = environment.uris;

  isReady = false;
  isLocked = false;
  canSelect = false;

  config: CampaignConfig;
  state: UserState;

  page: Page;
  tasks: Task[] = [];
  hasProvider: boolean = undefined;
  view: { explanation: boolean; fab: boolean } = { explanation: false, fab: false, };

  nextwave: Wave;

  constructor(
    private router: Router,
    private translate: TranslateService,
    private api: ApiService,
    private cs: CampaignService,
    private ss: StateService,
    private toastCtrl: ToastController,
  ) { }


  async ngOnInit() {
    setTimeout(() => this.view.fab = true, 2500);

    this.config = await this.cs.getConfig();
    this.cs.config$.subscribe(config => this.config = config);

    const now = moment();
    this.nextwave = this.config.waves.find(w => moment(w.start).isAfter(now));

    this.canSelect = this.config.tasks.filter(t => !t.enforced).length > 0;

    this.state = await this.ss.getState();
    this.ss.state$.subscribe(state => { this.state = state; this.parseData(); });

    const route = this.cs.getRoutes().find(p => p.route === window.location.pathname);
    if (route) {
      this.page = this.state.pages.find(p => p.page === route.name);
      // if (this.page?.config) { this.settings = this.page.config; }
    }

    await this.parseData();

    this.isReady = true;
  }


  async parseData(refresh = false, $event?: CustomEvent): Promise<void> {
    this.isLocked = true;

    if (refresh) {
      this.state = await this.ss.parseState(refresh);
      this.ss.publishState();
    }

    let tasks = JSON.parse(JSON.stringify(this.state.tasks)) as Task[];

    tasks = tasks.map(t => ({ ...t, display: true }));
    if (this.state.wave) {
      const day = moment().diff(this.state.wave.start, 'days');
      tasks.forEach(t => {
        if (t.onDays?.length && !t.onDays.includes(day)) {
          t.display = false;
        }
      });
    }
    tasks = tasks.filter(t => t.display);

    tasks = tasks.map(t => ({ t, sort: Math.random() })).sort((a, b) => a.sort - b.sort).map(({ t }) => t);

    const todo = tasks.filter(t => t.numberOfFiresInTimeWindow !== t.maxFired);
    const done = tasks.filter(t => t.numberOfFiresInTimeWindow === t.maxFired);

    tasks = todo.concat(done);

    this.tasks = tasks;

    if ($event) {
      ($event.target as any).complete();
    }
    this.isLocked = false;
    return new Promise(resolve => resolve());
  }



  async presentActivityModal(task: Task) {
    if (task.maxFired - task.numberOfFiresInTimeWindow <= 0) {
      const toast = await this.toastCtrl.create({
        header: this.translate.instant('p.g.activities-cu.not-rewarded-anymore-alert-1'),
        message: this.translate.instant('p.g.activities-cu.not-rewarded-anymore-alert-2'),
        position: 'bottom',
        color: 'dark',
        duration: 8000,
        cssClass: 'atBottom',
        buttons: [{ icon: 'close', role: 'cancel', }]
      });
      await toast.present();
    } else if (task.rid) {
      this.router.navigate(['/tasks', task.rid]);
    }
  }



  async getProviders() {
    const getProviders: ApiRequest = {
      uri: '/gis/data-providers',
      method: 'GET',
    };

    const providers: any[] = await this.api.promise(getProviders);

    if (providers?.length) {
      this.hasProvider = providers.filter(p => p.isConnected).length > 0;
    }

    return new Promise<void>(resolve => resolve());
  }


}
