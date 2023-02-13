import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { MomentDateFormatPipeModule } from 'src/app/pipes/moment-date-format.module';
import { MomentFromNowPipeModule } from 'src/app/pipes/moment-from-now.module';
import { StreakCardComponent } from './gb-streak-card.component';

@NgModule({
    declarations: [StreakCardComponent],
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        RouterModule,
        TranslateModule,
        MomentDateFormatPipeModule,
        MomentFromNowPipeModule,
    ],
    exports: [StreakCardComponent],
})
export class StreakCardComponentModule { }

