import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { LeaderboardComponent } from './gb-leaderboard.component';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MomentDateFormatPipeModule } from 'src/app/pipes/moment-date-format.module';
import { MomentFromNowPipeModule } from 'src/app/pipes/moment-from-now.module';

@NgModule({
    declarations: [LeaderboardComponent],
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        RouterModule,
        TranslateModule,
        MomentDateFormatPipeModule,
        MomentFromNowPipeModule,
    ],
    exports: [LeaderboardComponent],
})
export class LeaderboardComponentModule { }

