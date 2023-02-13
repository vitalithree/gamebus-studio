import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { UserState } from '../models/gamebus/user-state.model';
import { AuthorizationService } from './authorization.service';
import { StateService } from './state.service';

@Injectable()
export class PageGuardService implements CanActivate {

    state: UserState;

    constructor(
        private router: Router,
        private as: AuthorizationService,
        private ss: StateService,
    ) { }

    async canActivate(route: ActivatedRouteSnapshot, rs: RouterStateSnapshot): Promise<boolean> {

        if (this.as.isAdmin()) { return true; }

        const urltree = this.router.parseUrl(rs.url);
        urltree.queryParams = {};
        urltree.fragment = null;

        this.state = await this.ss.getState();
        if (!this.state.pages.find(p => p.route === urltree.toString())) {
            this.router.navigate(['/'], { replaceUrl: true });
            return false;
        }

        return true;
    }
}
