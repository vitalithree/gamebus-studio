import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { ImageInputComponentModule } from '../../inputs/gb-image-input/gb-image-input.module';
import { OnboardingPersonalInfoComponent } from './personalinfo.component';

@NgModule({
    declarations: [OnboardingPersonalInfoComponent],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        IonicModule,
        TranslateModule,
        RouterModule,
        ImageInputComponentModule,
    ],
    exports: [OnboardingPersonalInfoComponent]
})
export class OnboardingPersonalInfoComponentModule { }
