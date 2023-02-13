import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { CampaignConfig } from '../models/airbridge/campaign-config.model';
import { Group } from '../models/airbridge/group.model';
import { UserState } from '../models/gamebus/user-state.model';
import { ApiService } from './api.service';
import { AuthorizationService } from './authorization.service';
import { CampaignService } from './campaign.service';
import { StateService } from './state.service';

@Injectable()
export class OnboardingGuardService implements CanActivate {

    config: CampaignConfig;
    state: UserState;

    gtypes: { name: string; groups: Group[] }[] = [];

    constructor(
        private router: Router,
        private api: ApiService,
        private as: AuthorizationService,
        private cs: CampaignService,
        private ss: StateService,
    ) { }

    async canActivate(route: ActivatedRouteSnapshot, rs: RouterStateSnapshot): Promise<boolean> {
        if (!this.as.isAuthenticated()) {
            this.router.navigate(['/landing'], { replaceUrl: true });
            return false;
        }

        if (this.as.isAdmin()) { return true; }

        if (!this.as.getAuthUser().chref) {
            this.router.navigate(['/landing'], { replaceUrl: true });
            return false;
        }

        this.config = await this.cs.getConfig();
        this.state = await this.ss.getState();


        // Check consent
        if (!this.state.consent?.passing) {
            this.router.navigate(['/onboarding/consent'], { replaceUrl: true });
            return false;
        }


        // Check enrolmment in groups
        for (const group of this.config.groups.filter(g => g.cid
            && g.type.startsWith('group') && ['select-at-onboarding', 'from-url'].includes(g.assignment))) {
            const gtype = this.gtypes.find(g => g.name === group.type);
            if (!gtype) {
                this.gtypes.push({ name: group.type, groups: [group] });
            } else {
                gtype.groups.push(group);
            }
        }

        const cids = this.state.circles.all.map(c => c.id);
        for (const gtype of this.gtypes) {
            const gcids = gtype.groups.map(g => g.cid);
            if (!gcids.some(gcid => cids.includes(gcid))) {
                this.router.navigate(['/onboarding/groups'], { replaceUrl: true });
                return false;
            }
        }

        return true;
    }
}
