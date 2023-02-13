/* eslint-disable max-len */
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { AllowedValuesInputComponentModule } from 'src/app/components/general/inputs/gb-allowed-values-input/gb-allowed-values-input.module';
import { LikertFiveInputComponentModule } from 'src/app/components/general/inputs/gb-likert-five-input/gb-likert-five-input.module';
import { VideoInputComponentModule } from 'src/app/components/general/inputs/gb-video-input/gb-video-input.module';
import { ImageInputComponentModule } from 'src/app/components/general/inputs/gb-image-input/gb-image-input.module';
import { HeaderComponentModule } from '../../../components/general/header/header.module';
import { MomentDateFormatPipeModule } from '../../../pipes/moment-date-format.module';
import { ActivityCUPage } from './activity-cu.page';


const routes: Routes = [
  {
    path: '',
    component: ActivityCUPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    RouterModule.forChild(routes),
    TranslateModule,
    HeaderComponentModule,
    ImageInputComponentModule,
    VideoInputComponentModule,
    LikertFiveInputComponentModule,
    AllowedValuesInputComponentModule,
    MomentDateFormatPipeModule,
  ],
  declarations: [ActivityCUPage]
})
export class ActivityCUPageModule { }
