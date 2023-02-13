import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { MdToHtmlPipeModule } from 'src/app/pipes/md-to-html.pipe.module';
import { ProgressCardComponent } from './gb-progress-card.component';

@NgModule({
    declarations: [ProgressCardComponent],
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        RouterModule,
        TranslateModule,
        MdToHtmlPipeModule,
    ],
    exports: [ProgressCardComponent],
})
export class ProgressCardComponentModule { }

