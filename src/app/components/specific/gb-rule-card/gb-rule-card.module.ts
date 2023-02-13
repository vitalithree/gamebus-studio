import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { PlyrModule } from 'ngx-plyr';
import { MdToHtmlPipeModule } from 'src/app/pipes/md-to-html.pipe.module';
import { RuleCardComponent } from './gb-rule-card.component';

@NgModule({
    declarations: [RuleCardComponent],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        IonicModule,
        RouterModule,
        TranslateModule,
        MdToHtmlPipeModule,
        PlyrModule,
    ],
    exports: [RuleCardComponent],
})
export class RuleCardComponentModule { }
