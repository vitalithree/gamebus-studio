import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { MdToHtmlPipeModule } from 'src/app/pipes/md-to-html.pipe.module';
import { MomentDateFormatPipeModule } from 'src/app/pipes/moment-date-format.module';
import { MomentFromNowPipeModule } from 'src/app/pipes/moment-from-now.module';
import { WinnersCardComponent } from './gb-winners-card.component';

@NgModule({
    declarations: [WinnersCardComponent],
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        RouterModule,
        TranslateModule,
        MomentDateFormatPipeModule,
        MomentFromNowPipeModule,
        MdToHtmlPipeModule,
    ],
    exports: [WinnersCardComponent],
})
export class WinnersCardComponentModule { }

