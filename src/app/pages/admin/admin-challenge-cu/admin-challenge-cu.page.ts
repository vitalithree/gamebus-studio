/* eslint-disable max-len */
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IonModal } from '@ionic/angular';
import * as moment from 'moment';
import { Task } from 'src/app/models/airbridge/task.model';
import { Challenge } from 'src/app/models/gamebus/challenge.model';
import { Circle } from 'src/app/models/gamebus/circle.model';
import { UserState } from 'src/app/models/gamebus/user-state.model';
import { ApiRequest } from 'src/app/models/general/api-request.model';
import { AuthUser } from 'src/app/models/general/auth-user.model';
import { ApiService } from 'src/app/services/api.service';
import { AuthorizationService } from 'src/app/services/authorization.service';
import { ChallengeService } from 'src/app/services/challenge.service';
import { StateService } from 'src/app/services/state.service';
import { environment } from 'src/environments/environment';
import { CampaignConfig } from '../../../models/airbridge/campaign-config.model';
import { CampaignService } from '../../../services/campaign.service';



@Component({
  selector: 'app-admin-challenge-cu',
  templateUrl: './admin-challenge-cu.page.html',
  styleUrls: ['./admin-challenge-cu.page.scss'],
})
export class AdminChallengeCuPage implements OnInit {

  @ViewChild('tasksmodal', { static: false }) tasksmodal: IonModal;

  uris = environment.uris;

  isReady = false;
  isLocked = false;

  config: CampaignConfig;
  state: UserState;

  authuser: AuthUser;
  form: FormGroup;

  circles: {
    individuals: { cid: number; uid: number; pid: number; firstname: string; lastname: string; image: string; selected?: boolean; inTeam?: boolean }[];
    teams: { cid: number; name: string; image: string; size?: number; selected?: boolean }[];
    individualsOfTeams: { cid: number; name: string; image: string; size?: number; selected?: boolean }[];
  } = { individuals: [], teams: [], individualsOfTeams: [], };
  view = {
    nonrequired: false,
    participations: 'individuals',
  };

  atypes: string[];
  providers: string[];
  rtypes: any[] = [];

  tasks: Task[];


  constructor(
    private router: Router,
    private api: ApiService,
    private as: AuthorizationService,
    private cs: CampaignService,
    private ss: StateService,
    private xs: ChallengeService,
    private fb: FormBuilder,
  ) {

  }

  async ngOnInit() {
    this.authuser = this.as.getAuthUser();

    this.config = await this.cs.getConfig();
    this.state = await this.ss.getState();

    this.tasks = this.config.tasks;

    this.atypes = this.xs.getKnownTypes();
    this.providers = this.xs.getKnownProviders();

    const grt: ApiRequest = {
      uri: '/users/{uid}/rewardtypes',
      method: 'GET',
      pathVariables: [
        { key: 'uid', value: this.authuser.details?.uid },
      ],
    };
    this.rtypes = await this.api.promise(grt);

    this.form = this.fb.group({
      image: [this.uris.assets + '/placeholders/ph-challenge.svg'],
      fortasks: ['false', [Validators.required]],
      forviz: ['viz:general', [Validators.required]],
      issilent: [false, [Validators.required]],
      ispublic: [false],
      mincsize: [999],
      maxcsize: [999],
      wave: ['false', [Validators.required]],
      available: [null],
      start: [null, [Validators.required]],
      end: [null, [Validators.required]],
      target: [null],
      contenders: [null],

      tasks: this.fb.array([], [Validators.required]),

      // createChallengePerParticipant: [false, [Validators.required]],
    });

    if (this.config.rewards?.length) {
      this.form.addControl('rewards', this.fb.array([]));
      this.form.addControl('lotteries', this.fb.array([]));
    }

    await this.parseCircles();

    this.isReady = true;
  }






  async createChallenges() {
    this.isLocked = true;

    const form: any = this.form.getRawValue();

    const rules = await this.xs.convertTasksToRules(form.tasks);
    if (!rules?.length) { this.isLocked = false; return; }

    const { fortasks, forviz, issilent, wave } = form;

    const csffa = this.circles.individualsOfTeams.filter(team => team.selected);

    let cname = `${this.config.campaign.abbr}-`;
    if (csffa.length) { cname += `ffa-`; }
    if (fortasks !== 'false') { cname += `${fortasks}-`; }
    if (forviz !== 'false') { cname += `${forviz}-`; }
    if (wave !== 'false') { cname += `w${wave}-`; }
    if (csffa.length) { csffa.forEach(c => cname += `c${c.cid}-`); }
    if (issilent) { cname += `silent-`; }

    let participants = [];
    const individuals = this.circles.individuals.filter(individual => individual.selected || individual.inTeam);
    const teams = this.circles.teams.filter(team => team.selected);
    if (individuals?.length) { participants = participants.concat(individuals.map(individual => individual.cid)); }
    if (teams?.length) { participants = participants.concat(teams.map(team => team.cid)); }
    if (!participants?.length) { return; }

    const circles = [...new Set([this.state.circles.campaign.id, ...participants])];

    if (form.lotteries?.length) {
      for (const lottery of form.lotteries) {
        const rule = await this.xs.deriveRuleFromLottery(lottery);
        rules.push(rule);
      }
    }

    const rewards = [];
    if (form.rewards?.length) {
      for (const reward of form.rewards) {
        // Check if rewardtype already exists for user, otherwise create the rewardtype
        if (!this.rtypes.find(rt => rt.name === reward.prize.name)) {
          const rewardtypeForm = {
            name: reward.prize.name,
            type: reward.prize.type,
            description: reward.prize.description,
            image: reward.prize.image,
          };

          const rtf = new FormData();
          rtf.append('rewardType', JSON.stringify(rewardtypeForm));

          const createRewardtype: ApiRequest = {
            uri: '/rewardtypes',
            method: 'POST',
            requestBody: rtf
          };

          const rtype = await this.api.promise(createRewardtype);
          this.rtypes.push(rtype);
        }

        const r = {
          type: reward.prize.name,
          amount: reward.amount,
          forEachMember: false,
        };
        rewards.push(r);
      }
    }

    const challengeForm = {
      creator: this.config.campaign.organizers[0],
      isPublic: form.ispublic,
      name: cname,
      image: form.image || null,
      minCircleSize: form.mincsize,
      maxCircleSize: form.maxcsize,
      availableDate: form.available ? moment(form.available).valueOf() : moment().subtract(10, 'seconds').valueOf(),
      startDate: moment(form.start).valueOf(),
      endDate: moment(form.end).valueOf(),
      target: form.target || 0,
      contenders: form.contenders || 0,
      rules,
      rewards,
      circles,
    };

    const requestBody = new FormData();
    requestBody.append('challenge', JSON.stringify(challengeForm));

    const cc: ApiRequest = {
      uri: '/challenges',
      method: 'POST',
      requestBody,
    };
    const gbchallenge: Challenge = await this.api.promise(cc);

    if (form.lotteries?.length) {
      for (const lottery of form.lotteries) {
        const lrs = form.rewards.filter(r => r.lottery === lottery.name);
        if (!lrs?.length) { continue; }

        const odds = lrs.map((r: any) => ({ reward: r.prize.name, odd: r.odd }));

        const lf = {
          translationKey: lottery.name,
          image: lottery.image,
          pointsRequired: lottery.cost,
          maxTimesFired: lottery.maxFired,
          minDaysBetweenFire: lottery.withinPeriod,
          odds,
        };

        const cl: ApiRequest = {
          uri: '/challenge/{xid}/lottery',
          method: 'POST',
          pathVariables: [
            { key: 'xid', value: gbchallenge.id },
          ],
          requestBody: lf
        };
        await this.api.promise(cl);
      }
    }

    await this.xs.joinChallenge(gbchallenge.id, participants);

    this.router.navigate(['/admin/dashboards/challenges', gbchallenge.id]);

    this.isLocked = false;
    return new Promise(resolve => resolve(gbchallenge));
  }







  matchWaveDates($event: CustomEvent) {
    const wid: number = $event.detail.value;

    if (!isNaN(wid)) {
      const wave = this.config.waves.find(w => w.id === wid);
      // this.form.get('available').setValue(wave.start);
      this.form.get('start').setValue(wave.start);
      this.form.get('start').disable();

      this.form.get('end').setValue(wave.end);
      this.form.get('end').disable();

      this.tasks = this.config.tasks.filter(t => t.waves.find(w => w.id === wid));
    } else {
      this.form.get('start').enable();
      this.form.get('end').enable();

      this.tasks = this.config.tasks;
    }
  }


  async parseCircles(): Promise<void> {
    const cids = this.config.groups.filter(g => g.cid).map(g => g.cid);
    const teams = this.state.circles.all.filter(c => cids.includes(c.id)).map(c => ({ cid: c.id, name: c.name, image: c.image, size: c.memberships.length }));
    this.circles.teams = JSON.parse(JSON.stringify(teams));
    this.circles.individualsOfTeams = JSON.parse(JSON.stringify(teams));

    const gpcs: ApiRequest = {
      uri: '/private-circles',
      method: 'GET',
      requestParams: [
        { key: 'canSignUp', value: true },
        { key: 'fields', value: ['id', 'memberships.player'] },
      ],
    };
    const pcs: Circle[] = await this.api.promise(gpcs);
    if (pcs?.length && this.state.circles.campaign) {
      const individuals = pcs.map(c => ({ cid: c.id, uid: c.memberships[0].player.user.id, pid: c.memberships[0].player.id, firstname: c.memberships[0].player.user.firstName, lastname: c.memberships[0].player.user.lastName, image: c.image, }));

      const uids = this.state.circles.campaign.memberships.map(m => m.player.user.id);

      this.circles.individuals = individuals.filter(i => uids.includes(i.uid));
    }

    return new Promise(resolve => resolve());
  }

  countParticipations(dimension: string) {
    const individuals = this.circles.individuals.filter(individual => individual.selected || individual.inTeam).length;
    const teams = this.circles.teams.filter(circle => circle.selected).length;

    switch (dimension) {
      case 'all':
        return individuals + teams;
      case 'individuals':
        return individuals;
      case 'teams':
        return teams;
    }
  }

  selectIndividualsOfTeams() {
    this.circles.individuals.forEach(individual => delete individual.inTeam);

    const cids = this.circles.individualsOfTeams.filter(t => t.selected).map(t => t.cid);
    for (const cid of cids) {
      const circle = this.state.circles.all.find(c => c.id === cid);
      if (circle) {
        const pids = circle.memberships.map(m => m.player.id);

        this.circles.individuals.forEach(individual => {
          if (pids.includes(individual.pid)) {
            individual.inTeam = true;
          }
        });
      }
    }
  }







  createRuleForm(): FormGroup {
    return this.fb.group({
      name: [null, [Validators.required]],
      image: [null],
      description: [null],
      desc: [null],
      types: [['general'], [Validators.required]],
      providers: [['gamebus'], [Validators.required]],

      points: [null, [Validators.required]],
      maxFired: [null],
      withinPeriod: [null],

      hasSecret: [null],
      requiresImage: [false],
      requiresVideo: [false],
      requiresDescription: [false],
      minDuration: [null],
      minSteps: [null],

      isOpen: [true], // solely for front-end purposes
    });
  }
  createRewardForm(): FormGroup {
    return this.fb.group({
      prize: [null, [Validators.required]],
      amount: [3, [Validators.required]],
      lottery: [null],
      odd: [null],

      isOpen: [true], // solely for front-end purposes
    });
  }
  createLotteryForm(): FormGroup {
    const l = (this.form.get('lotteries').value?.length || 0) + 1;
    return this.fb.group({
      name: [`lottery-${l}`, [Validators.required]],
      image: [null],
      cost: [null, [Validators.required]],
      maxFired: [null],
      withinPeriod: [null],

      isOpen: [true], // solely for front-end purposes
    });
  }



  addChildForm(parent: string, value?: any, isOpen: boolean = true) {
    const parentForm = this.form.get(parent) as FormArray;
    let childForm: FormGroup;
    switch (parent) {
      case 'tasks':
        childForm = this.createRuleForm();

        // Check if there are additional fields on the rule that should be preserved...
        if (value !== undefined && value != null) {
          const attributes = Object.keys(value).filter((key: string) => !['name', 'image', 'desc', 'activityType', 'maxTFired', 'withinPeriod', 'points', 'secret', 'requiresImage', 'requiresVideo', 'requiresDescription', 'minDuration', 'minSteps', 'isOpen'].includes(key));
          for (const attribute of attributes) {
            childForm.addControl(attribute, new FormControl(null));
          }
        }
        break;
      case 'rewards':
        childForm = this.createRewardForm();
        if (value !== undefined && value != null) {
          const attributes = Object.keys(value).filter((key: string) => !['prize', 'amount', 'lottery', 'odd', 'isOpen'].includes(key));
          for (const attribute of attributes) {
            childForm.addControl(attribute, new FormControl(null));
          }
        }
        break;
      case 'lotteries':
        childForm = this.createLotteryForm();
        break;
    }

    if (value) { childForm.patchValue({ ...value, isOpen }); }
    parentForm.push(childForm);
  }
  removeChildForm(parent: string, i: number) {
    const parentForm = this.form.get(parent) as FormArray;
    parentForm.removeAt(i);
  }
  reorderChildForms(parent: string, $event: CustomEvent) {
    ($event.target as any).complete(true);

    const parentForm = this.form.get(parent) as FormArray;
    const from = $event.detail.from;
    const to = $event.detail.to;

    const itemForm = parentForm.at(from);
    parentForm.removeAt(from);
    parentForm.insert(to, itemForm);
  }
  resetChildForms(parent: string) {
    (this.form.get(parent) as FormArray).clear();
  }


}
