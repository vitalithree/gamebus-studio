/* eslint-disable max-len */
import { Injectable } from '@angular/core';
import * as moment from 'moment';
import { Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CampaignConfig } from '../models/airbridge/campaign-config.model';
import { ConsentItem } from '../models/airbridge/consent-item.model';
import { Group } from '../models/airbridge/group.model';
import { Page } from '../models/airbridge/page.model';
import { Task } from '../models/airbridge/task.model';
import { Activity, PersonalPoint } from '../models/gamebus/activity.model';
import { Challenge } from '../models/gamebus/challenge.model';
import { Circle } from '../models/gamebus/circle.model';
import { DataProvider } from '../models/gamebus/data-provider.model';
import { SystemState } from '../models/gamebus/system-state.model';
import { UserState } from '../models/gamebus/user-state.model';
import { ApiRequest } from '../models/general/api-request.model';
import { AuthUser } from '../models/general/auth-user.model';
import { ApiService } from './api.service';
import { AuthorizationService } from './authorization.service';
import { CampaignService } from './campaign.service';


@Injectable({
  providedIn: 'root'
})
export class StateService {

  isProduction = environment.production;
  uris = environment.uris;
  client = environment.client;


  config: CampaignConfig;
  authuser: AuthUser;

  state: UserState = new UserState();
  stateSubject = new Subject<UserState>();
  state$ = this.stateSubject.asObservable();

  sstate: SystemState = new SystemState();

  pointsSubject = new Subject<PersonalPoint[]>();
  points$ = this.pointsSubject.asObservable();

  rewardsSubject = new Subject<any[]>();
  rewards$ = this.rewardsSubject.asObservable();


  constructor(
    private api: ApiService,
    private as: AuthorizationService,
    private cs: CampaignService,
  ) {
  }


  async observePoints(points: PersonalPoint[]): Promise<void> {
    await this.parseChallenges();
    this.publishState();
    this.pointsSubject.next(points);

    return new Promise((resolve) => resolve());
  }

  async observeRewards(rewards: any[]) {
    this.rewardsSubject.next(rewards);
  }




  async parseState(refresh = false): Promise<UserState> {
    if (!this.as.isAuthenticated()) { return; }

    if (!this.authuser || refresh) {
      this.authuser = this.as.getAuthUser();
    }

    // Make sure player is connected to the data provider
    const sstate = await this.getSystemState();
    const cdpc: ApiRequest = {
      uri: '/players/{pid}/data-providers/{did}',
      method: 'POST',
      pathVariables: [
        { key: 'pid', value: this.authuser.details?.pid },
        { key: 'did', value: sstate.dataprovider.id },
      ],
    };
    await this.api.promise(cdpc);

    if (!this.config || refresh) {
      this.config = await this.cs.getConfig();
    }

    if (!this.config) { return; }

    if (!this.state.wave || refresh) {
      const now = moment();
      for (const wave of this.config.waves) {
        if (now.isAfter(wave.start) && now.isBefore(wave.end) && wave.id !== -1) {
          this.state.wave = wave;
          break;
        }
      }
    }

    if (!this.state.consent || refresh) { await this.parseConsent(); }
    if (!this.state.circles || refresh) { await this.parseCircles(); }
    if (!this.state.challenges || refresh) { await this.parseChallenges(); }
    if (!this.state.preferences || refresh) { await this.parsePreferences(); }

    if (!this.state.alerts || refresh) { await this.parseAlerts(0); }

    if (!this.state.pages || refresh) { await this.parsePages(); }

    return new Promise(resolve => resolve(this.state));
  }

  async getState(): Promise<UserState> {
    // if (!this.state || !Object.keys(this.state).length) {
    //   await this.parseState(true);
    //   this.publishState();
    // }
    return new Promise(resolve => resolve(this.state));
  }


  publishState() {
    this.stateSubject.next(this.state);
  }
  destroyState() {
    this.as.destroyAuthUser();
    this.state = new UserState();
    this.publishState();
  }


  async parseSystemState(refresh = false): Promise<SystemState> {
    if (!this.as.isAuthenticated()) { return new Promise(resolve => resolve(null)); }

    if (!this.sstate.dataprovider || refresh) {
      try {
        const gdps: ApiRequest = {
          uri: '/data-providers',
          method: 'GET',
          requestParams: [{ key: 'fields', value: ['id', 'name', 'image'] }]
        };
        const dataproviders: DataProvider[] = await this.api.promise(gdps);
        const dataprovider = dataproviders.find(p => p.name === this.client.dataprovider);
        if (dataprovider) { this.sstate.dataprovider = dataprovider; }
      }
      catch (e) {
        if (e.status === 401) {
          this.as.destroyAuthUser();
          window.location.href = '';
        }
      }
    }

    return new Promise(resolve => resolve(this.sstate));
  }

  async getSystemState(): Promise<SystemState> {
    if (!this.sstate || !Object.keys(this.sstate).length) {
      await this.parseSystemState();
    }

    return new Promise(resolve => resolve(this.sstate));
  }


  async parseConsent(actual?: ConsentItem[]): Promise<void> {

    if (!actual?.length) {
      const gca: ApiRequest = {
        uri: '/players/{pid}/activities',
        method: 'GET',
        pathVariables: [
          { key: 'pid', value: this.as.getAuthUser().details?.pid },
        ],
        requestParams: [
          { key: 'gds', value: 'CONSENT' },
          { key: 'limit', value: 10 },
          { key: 'sort', value: ['-date'] },
          { key: 'fields', value: ['propertyInstances.value', 'propertyInstances.property.translationKey'] },
        ],
      };
      const cas: Activity[] = await this.api.promise(gca);

      actual = [];
      if (cas?.length) {
        const ca = cas.find(a => a.propertyInstances.find(pi => pi.property.translationKey === 'FOR_CAMPAIGN' && pi.value === this.config.campaign.abbr));
        if (ca) {
          const cpi = ca.propertyInstances.find(pi => pi.property.translationKey === 'DESCRIPTION');
          if (cpi?.value && cpi.value.startsWith('[') && cpi.value.endsWith(']')) {
            actual = JSON.parse(cpi.value);
          }
        }
      }
    }

    let consent = this.config.campaign.consent;
    if (!consent?.length) { consent = environment.consent; }

    consent.forEach((c) => {
      const ac = actual.find(a => a.tk === c.tk);
      c.accepted = false;
      if (ac) { c.accepted = ac.accepted; }
    });

    const passing = consent.filter(c => c.required).every(c => c.accepted);

    this.state.consent = { passing, campaign: consent };

    return new Promise((resolve) => resolve());
  }



  async storeConsent(consent: ConsentItem[]) {
    const requestBody = new FormData();
    const form = {
      gameDescriptorTK: 'CONSENT',
      dataProviderName: this.client.dataprovider,
      propertyInstances: [
        { propertyTK: 'FOR_CAMPAIGN', value: this.config.campaign.abbr },
        { propertyTK: 'DESCRIPTION', value: JSON.stringify(consent) },
      ],
      players: [this.authuser.details?.pid],
    };
    requestBody.append('activity', JSON.stringify(form));

    const pa: ApiRequest = {
      uri: '/activities',
      method: 'POST',
      requestParams: [
        { key: 'dryrun', value: false },
        { key: 'fields', value: ['id', 'propertyInstances.value', 'propertyInstances.property.translationKey'] },
      ],
      requestBody,
    };
    await this.api.promise(pa);

    return new Promise<void>(resolve => resolve());
  }


  async parseCircles(): Promise<void> {

    const circles: {
      private: { id: number; name: string; image?: string };
      campaign?: Circle;
      arm?: Group;
      all: Circle[];
    } = { private: null, all: [] };

    const gec = {
      uri: '/players/{pid}/circles',
      method: 'GET',
      pathVariables: [
        { key: 'pid', value: this.authuser.details?.pid },
      ],
      requestParams: [
        { key: 'states', value: ['MEMBERSHIP_REQUESTED', 'MEMBERSHIP_APPROVED', 'LEADERSHIP_REQUESTED', 'LEADERSHIP_APPROVED', 'LEADERSHIP_DENIED'] },
      ],
    };
    const cs: Circle[] = await this.api.promise(gec) || [];

    const cids = this.config.groups.filter(g => g.cid).map(g => g.cid);
    circles.all = cs.filter(c => c.isPrivate || cids.includes(c.id) || c.name.includes(`${this.config.campaign.abbr}-`));

    // Set private circle
    const privatecircle = cs.find(c => c.isPrivate);
    if (privatecircle) {
      const { id, name, image } = privatecircle;
      circles.private = { id, name, image };
    } else {
      console.error('User does not have a private circle');
      this.destroyState();
      location.reload();
    }

    // Join global & child (= 'everybody assigned') group(s) if necessary
    const globalcs = this.config.groups.filter(g => g.assignment === 'everybody' && g.cid);
    for (const gc of globalcs) {
      if (circles.all.find(c => c.id === gc.cid)) { continue; }
      if (gc.parents?.length) {
        const pcids = gc.parents.map(c => c.cid);
        if (!circles.all.some(c => pcids.includes(c.id))) { continue; }
      }
      const circle = await this.requestCircleMembership(gc.cid);
      circles.all.push(circle);
    }

    const campaigncircle = this.config.groups.find(g => g.type === 'campaign');
    circles.campaign = circles.all.find(c => c.id === campaigncircle.cid);

    // Set a (random) study arm if necessary
    const arms = this.config.groups.filter(g => g.type === 'studyarm' && g.assignment === 'random' && g.cid);
    for (const arm of arms) {
      if (circles.all.find(c => c.id === arm.cid)) {
        circles.arm = arm;
        break;
      }
    }

    if (!circles.arm && arms?.length) {
      const arm = arms[Math.floor(Math.random() * arms.length)];
      const circle = await this.requestCircleMembership(arm.cid);

      circles.all.push(circle);
      circles.arm = arm;
    }

    this.state.circles = circles;

    return new Promise((resolve) => resolve());
  }



  async parseChallenges(): Promise<void> {

    // Participate in active challenges with private circle if necessary
    const pcid = this.state.circles.private.id;
    const cids = this.state.circles.all.map(c => c.id);

    const gnx: ApiRequest = {
      uri: '/challenges',
      method: 'GET',
      requestParams: [
        { key: 'q', value: `${this.config.campaign.abbr}-ffa-` },
        { key: 'creator', value: this.config.campaign.organizers[0] },
        { key: 'status', value: 'upcoming-active' },
        { key: 'fields', value: ['id', 'name', 'startDate', 'creator.id', 'participations'] },
        { key: 'sort', value: 'startDate' },
      ],
    };
    const pnxs: Challenge[] = await this.api.promise(gnx);
    const nxs = pnxs.filter(x => cids.some(cid => x.name.includes(`c${cid}`)) && !x.participations.find(p => p.circle.id === pcid));

    for (const x of nxs) {
      const pc: ApiRequest = {
        uri: '/challenges/{xid}/participants',
        method: 'POST',
        pathVariables: [
          { key: 'xid', value: x.id },
        ],
        requestParams: [
          { key: 'circles', value: pcid },
        ],
      };
      try {
        await this.api.promise(pc);
      } catch (e) {
        console.warn(`Could not sign up for challenge ${x.name} (${x.id})`);
      }
    }

    // Retrieve participating challenges
    const gxe: ApiRequest = {
      uri: '/players/{pid}/challenges',
      method: 'GET',
      pathVariables: [
        { key: 'pid', value: this.authuser.details?.pid },
      ],
      requestParams: [
        { key: 'q', value: `${this.config.campaign.abbr}-` },
        { key: 'creator', value: this.config.campaign.organizers[0] },
        { key: 'page', value: 0 },
        { key: 'limit', value: 100 },
        { key: 'sort', value: ['-startDate'] },
        { key: 'fields', value: ['-showChallengeRights'] },
      ],
    };
    const xse: Challenge[] = await this.api.promise(gxe);


    const gxp: ApiRequest = {
      uri: '/players/{pid}/challenges',
      method: 'GET',
      pathVariables: [
        { key: 'pid', value: this.authuser.details?.pid },
      ],
      requestParams: [
        { key: 'q', value: `${this.config.campaign.abbr}-tasks:selected-` },
        { key: 'creator', value: this.authuser.details?.uid },
        { key: 'page', value: 0 },
        { key: 'limit', value: 100 },
        { key: 'sort', value: ['-startDate'] },
        { key: 'fields', value: ['-showChallengeRights'] },
      ],
    };
    const xps: Challenge[] = await this.api.promise(gxp);


    const challenges = { active: [], ended: [] };
    const xs = xse.concat(xps);
    const now = moment();
    xs.forEach(x => {
      if (now.isBefore(moment(x.startDate))) {
        // Challenge is upcoming... Store in object?
      } else if (now.isBefore(moment(x.endDate))) {
        challenges.active.push(x);
      } else {
        challenges.ended.push(x);
      }
    });

    this.state.challenges = challenges;



    const tasks = [];
    if (this.state.challenges?.active?.length) {
      const axs = this.state.challenges.active.filter(c => c.name.includes('-tasks:')) as any[];
      if (axs?.length) {
        const rules = axs.map(c => c.challengeRules).reduce((x, y) => x.concat(y), []);
        for (const rule of rules) {
          // Transform rule to task...
          if (rule.description && rule.description.startsWith('{') && rule.description.endsWith('}')) {
            const { id, maxTimesFired, minDaysBetweenFire, numberOfFiresInTimeWindow, conditions, defaultGameDescriptor, restrictedGameDescriptors } = rule;
            const r = { rid: id, maxFired: maxTimesFired, withinPeriod: minDaysBetweenFire, numberOfFiresInTimeWindow, conditions, defaultGameDescriptor, restrictedGameDescriptors };
            const task: Task = { ...JSON.parse(rule.description), ...r };

            tasks.push(task);
          }
        }
      }
    }
    this.state.tasks = tasks;

    return new Promise((resolve) => resolve());
  }



  async parsePreferences(): Promise<void> {
    const preferences: { strategy?: string; circles?: number[]; widgets?: string[] } = { strategy: null, circles: null, widgets: null };

    const gua: ApiRequest = {
      uri: '/players/{pid}/activities',
      method: 'GET',
      pathVariables: [
        { key: 'pid', value: this.authuser.details?.pid },
      ],
      requestParams: [
        { key: 'gds', value: 'VISUALIZATION_STRATEGY' },
        // { key: 'limit', value: 1 },
        { key: 'sort', value: ['-date'] },
      ],
    };
    const activities: Activity[] = await this.api.promise(gua);

    const apref = activities.find(a => a.propertyInstances.find(pi => pi.property.translationKey === 'FOR_CAMPAIGN' && pi.value === this.config.campaign.abbr));

    if (apref) {
      const pm = apref.propertyInstances.find(pi => pi.property.translationKey === 'MOTIVATIONAL_STRATEGY_PREFERENCE');
      if (pm) { preferences.strategy = pm.value; }
      if (preferences.strategy) { preferences.strategy = preferences.strategy.replace('i-', ''); }

      const pc = apref.propertyInstances.find(pi => pi.property.translationKey === 'LEADERBOARD_CIRCLES');
      if (pc) { try { preferences.circles = JSON.parse(pc.value); } catch (e) { } }

      const pw = apref.propertyInstances.find(pi => pi.property.translationKey === 'DASHBOARD_WIDGETS');
      if (pw) { try { preferences.widgets = JSON.parse(pw.value); } catch (e) { } }
    }

    this.state.preferences = preferences;

    return new Promise((resolve) => resolve());
  }





  async parsePages(): Promise<void> {
    const wid = this.state.wave?.id;
    const cids = this.state.circles.all.map(c => c.id);
    const isOrganizer = this.cs.isOrganizer();

    let pages = this.config.pages.filter(page => page.wids.includes(wid) && page.cids.some(cid => cids.includes(cid) && !page.forOrganizer)) as Page[];
    if (isOrganizer) {
      const adminpages = this.config.pages.filter(page => page.forOrganizer);
      pages = pages.concat(adminpages);
    }
    if (pages?.length) {
      this.state.pages = pages.map(p => {
        const route = this.cs.getRoutes().find((r: any) => r.name === p.page);
        const page = { ...route, ...p };
        if (p.config?.tk) { page.tk = p.config.tk; }
        if (p.config?.icon) { page.icon = p.config.icon; }
        if (p.config?.q) { page.q = p.config.q; }
        return page;
      });
    }
  }






  async requestCircleMembership(cid: number, state = 'MEMBERSHIP_REQUESTED'): Promise<Circle> {
    const rcm: ApiRequest = {
      uri: '/circles/{cid}/memberships',
      method: 'POST',
      pathVariables: [
        { key: 'cid', value: cid }
      ],
      requestParams: [
        { key: 'playerIds', value: [this.authuser.details?.pid] },
        { key: 'state', value: state }
      ],
    };

    await this.api.promise(rcm);

    const circle: Circle = await this.getCircle(cid);

    return new Promise((resolve) => resolve(circle));
  }



  async getCircle(cid: number): Promise<Circle> {
    const gc: ApiRequest = {
      uri: '/circles/{cid}',
      method: 'GET',
      pathVariables: [
        { key: 'cid', value: cid },
      ],
    };
    const circle: Circle = await this.api.promise(gc);
    return new Promise((resolve) => resolve(circle));
  }













  async updatePreferences(strategy: string, circles?: number[], widgets?: string[]) {
    const pid = this.authuser.details?.pid;

    const preferences: any = { ...this.state.preferences, strategy, circles, widgets };
    this.state.preferences = preferences;
    preferences.campaign = this.config.campaign.abbr;

    const propertyKey: any = {
      campaign: 'FOR_CAMPAIGN',
      strategy: 'MOTIVATIONAL_STRATEGY_PREFERENCE',
      circles: 'LEADERBOARD_CIRCLES',
      widgets: 'DASHBOARD_WIDGETS',
    };

    const pis = [];
    Object.keys(preferences).forEach(key => {
      const value: string = preferences[key] instanceof Array ? JSON.stringify(preferences[key]) : preferences[key];
      pis.push({ propertyTK: propertyKey[key], value });
    });

    if (!pis?.length) { return; }

    const requestBody = new FormData();
    const form = {
      gameDescriptorTK: 'VISUALIZATION_STRATEGY',
      dataProviderName: this.client.dataprovider,
      propertyInstances: pis,
      players: [pid],
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

    return new Promise(resolve => resolve(this.state.preferences));
  }






  async parseNewsfeed(reset = false): Promise<void> {
    if (!this.state?.newsfeed?.page || reset) {
      this.state.newsfeed = { page: 0, items: [] };
    }

    const gnfi: ApiRequest = {
      uri: '/players/{pid}/circles-activities',
      method: 'GET',
      pathVariables: [
        { key: 'pid', value: this.authuser.details?.pid },
      ],
      requestParams: [
        { key: 'returnPI', value: true },
        {
          key: 'excludedGds', value: ['SCORE_GAMEBUS_POINTS', 'PLAY_LOTTERY', 'FOLLOWEE_CIRCLE_MUTATION', 'FOLLOWEE_CIRCLE_PRIVACY',
            'VISUALIZATION_STRATEGY', 'GENERAL_SURVEY', 'NOTIFICATION(DETAIL)', 'TIZEN(DETAIL)', 'TIZEN_LOG(DETAIL)', 'CONSENT', 'NAVIGATE_APP']
        },
        { key: 'page', value: this.state.newsfeed.page },
        { key: 'limit', value: 25 },
        { key: 'sort', value: ['-date'] },
      ],
    };
    let activities: any[] = await this.api.promise(gnfi);

    activities = activities.filter(a => a.personalPoints?.length && a.personalPoints.find((pp: any) => pp.participation.challenge.name.includes(this.config.campaign.abbr)));

    this.state.newsfeed.items = this.state.newsfeed.items.concat(activities);

    this.state.newsfeed.page++;

    return new Promise(resolve => resolve());
  }






  async parseAlerts(page: number = 0): Promise<void> {
    try {
      const pageMap = {
        activityPage: 'activities',
      };

      const gns: ApiRequest = {
        uri: '/users/{uid}/notifications',
        method: 'GET',
        pathVariables: [
          { key: 'uid', value: this.authuser.details?.uid },
        ],
        requestParams: [
          { key: 'limit', value: Math.max(page, 1) * 30 },
          { key: 'sort', value: ['-date'] },
        ],
      };
      let notifications: any[] = await this.api.promise(gns);

      if (notifications?.length) {
        notifications = notifications.filter((n: any) =>
          ['ACTIVITY_MESSAGE', 'ACTIVITY_SUPPORT'].includes(n.translationKey)
        );

        notifications.forEach(
          (n: any) => {
            n.params = n.params.reduce((res: any, item: any) => {
              let value = item.paramValue;
              if (item.paramKey === 'target') { value = pageMap[item.paramValue]; }
              res[item.paramKey] = value;
              return res;
            }, {});
          }
        );
      }

      const unread: any = {
        notif: notifications.filter((n: any) => n.hasOwnProperty('isRead') && !n.isRead).length,
      };

      unread.all = unread.notif;

      this.state.alerts = { unread, notifications };

      return new Promise((resolve) => resolve());
    } catch (e) {
      return new Promise((error) => error());
    }
  }





}
