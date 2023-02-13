import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { PlyrModule } from 'ngx-plyr';
import { DisplayPropertyPipeModule } from 'src/app/pipes/display-property.module';
import { MomentFromNowPipeModule } from 'src/app/pipes/moment-from-now.module';
import { ActivityCardPopoverComponent } from './gb-activity-card-popover/gb-activity-card-popover.component';
import { ActivityCardComponent } from './gb-activity-card.component';

@NgModule({
    declarations: [
        ActivityCardComponent,
        ActivityCardPopoverComponent,
    ],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        IonicModule,
        RouterModule,
        TranslateModule,
        MomentFromNowPipeModule,
        PlyrModule,
        DisplayPropertyPipeModule,
    ],
    entryComponents: [ActivityCardPopoverComponent],
    exports: [ActivityCardComponent],
})
export class ActivityCardComponentModule { }
