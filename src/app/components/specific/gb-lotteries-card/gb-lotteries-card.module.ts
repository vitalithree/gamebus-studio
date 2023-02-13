import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { MomentDateFormatPipeModule } from 'src/app/pipes/moment-date-format.module';
import { MomentFromNowPipeModule } from 'src/app/pipes/moment-from-now.module';
import { LotteriesCardComponent } from './gb-lotteries-card.component';

@NgModule({
    declarations: [LotteriesCardComponent],
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        RouterModule,
        TranslateModule,
        MomentDateFormatPipeModule,
        MomentFromNowPipeModule,
    ],
    exports: [LotteriesCardComponent],
})
export class LotteriesCardComponentModule { }

