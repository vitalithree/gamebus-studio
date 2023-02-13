import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CampaignConfig } from '../models/airbridge/campaign-config.model';
import { ApiRequest } from '../models/general/api-request.model';
import { ApiService } from './api.service';
import { AuthorizationService } from './authorization.service';


@Injectable({
    providedIn: 'root'
})
export class CampaignService {

    uris = environment.uris;

    chref: string;
    config: CampaignConfig;

    configSubject = new Subject<CampaignConfig>();
    config$ = this.configSubject.asObservable();

    routes: any[] = [
        { name: 'admin-dashboards', tk: 'a.dashboards', route: '/admin/dashboards', icon: 'analytics-outline' },
        { name: 'admin-newsfeed', tk: 'a.newsfeed', route: '/admin/newsfeed', icon: 'newspaper-outline' },

        { name: 'register-tasks', tk: 'a.score-points', route: '/tasks', icon: 'star-outline' },

        { name: 'dashboard', tk: 'a.my-dashboard', route: '/viz/dashboard', icon: 'pie-chart-outline' },
        { name: 'newsfeed', tk: 'a.my-newsfeed', route: '/viz/newsfeed', icon: 'newspaper-outline' },

        { name: 'leaderboard', tk: 'a.my-leaderboard', route: '/viz/leaderboard', icon: 'podium-outline' },

        { name: 'streak', tk: 'a.my-streak', route: '/viz/streak', icon: 'flame-outline' },

        { name: 'progress', tk: 'a.my-progress', route: '/viz/progress', icon: 'bar-chart-outline' },
        { name: 'lootbox', tk: 'a.my-lootbox', route: '/viz/lootbox', icon: 'dice-outline' },
    ];

    constructor(
        private router: Router,
        private api: ApiService,
        private as: AuthorizationService,
    ) {
    }


    async parseConfig(chref?: string): Promise<CampaignConfig> {

        const authuser = this.as.getAuthUser();
        if (authuser?.chref) { chref = authuser.chref; }

        if (!chref) { return new Promise(resolve => resolve(null)); }

        const rc: ApiRequest = {
            uri: `${this.uris.airbridge}/campaigns/{href}`,
            method: 'GET',
            isAuthorized: false,
            pathVariables: [
                { key: 'href', value: chref },
            ],
        };
        const c = await this.api.promise(rc);

        if (!c) {
            return new Promise(resolve => resolve(null));
        }

        this.chref = chref;
        this.config = c;

        if (this.config?.campaign?.name) {
            document.title = this.config?.campaign?.name;
        }

        if (!this.config?.campaign?.consent) {
            this.config.campaign.consent = environment.consent;
        }

        this.configSubject.next(this.config);

        return new Promise(resolve => resolve(this.config));
    }

    async getConfig(refresh = false): Promise<CampaignConfig> {
        if (refresh || !this.config) {
            await this.parseConfig(this.chref);
        }

        return new Promise(resolve => resolve(this.config));
    }


    async isOrganizer(): Promise<boolean> {
        const authuser = this.as.getAuthUser();
        const c = await this.getConfig();

        if (!authuser || !c) { return; }

        const isOrganizer = c.campaign.organizers.includes(authuser.details?.uid);

        return new Promise(resolve => resolve(isOrganizer));
    }


    getRoutes(): any[] { return this.routes; }
}
