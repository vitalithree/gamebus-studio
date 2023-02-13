import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageSelectComponentModule } from 'src/app/components/general/language-select/language-select.module';
import { OnboardingConsentComponentModule } from 'src/app/components/general/onboarding/consent/consent.module';
import { MomentDateFormatPipeModule } from 'src/app/pipes/moment-date-format.module';
import { HeaderComponentModule } from '../../../components/general/header/header.module';
import { OnboardingAuthenticationComponentModule } from '../../../components/general/onboarding/authentication/authentication.module';
import { OnboardingGroupsComponentModule } from '../../../components/general/onboarding/groups/groups.module';
import { OnboardingPersonalInfoComponentModule } from '../../../components/general/onboarding/personalinfo/personalinfo.module';
import { OnboardingPage } from './onboarding.page';



const routes: Routes = [
  {
    path: '',
    component: OnboardingPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
    TranslateModule,
    HeaderComponentModule,
    LanguageSelectComponentModule,
    MomentDateFormatPipeModule,
    OnboardingAuthenticationComponentModule,
    OnboardingConsentComponentModule,
    OnboardingPersonalInfoComponentModule,
    OnboardingGroupsComponentModule,
  ],
  declarations: [OnboardingPage]
})
export class OnboardingPageModule { }
