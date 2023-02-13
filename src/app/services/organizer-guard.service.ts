import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { CampaignService } from './campaign.service';

@Injectable()
export class OrganizerGuardService implements CanActivate {


    constructor(
        private router: Router,
        private cs: CampaignService,
    ) { }

    canActivate(): boolean {
        if (!this.cs.isOrganizer()) {
            this.router.navigate(['/'], { replaceUrl: true });
            return false;
        }
        return true;
    }
}
