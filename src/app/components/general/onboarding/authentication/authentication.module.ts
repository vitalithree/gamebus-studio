import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { OnboardingAuthenticationComponent } from './authentication.component';

@NgModule({
    declarations: [OnboardingAuthenticationComponent],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        IonicModule,
        TranslateModule,
        RouterModule,
    ],
    exports: [OnboardingAuthenticationComponent]
})
export class OnboardingAuthenticationComponentModule { }
