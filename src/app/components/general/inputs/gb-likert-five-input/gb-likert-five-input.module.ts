import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { LikertFiveInputComponent } from './gb-likert-five-input.component';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
    declarations: [LikertFiveInputComponent],
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        RouterModule,
        TranslateModule,
    ],
    exports: [LikertFiveInputComponent],
})
export class LikertFiveInputComponentModule { }

