import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { HeaderComponentModule } from 'src/app/components/general/header/header.module';
import { ActivityCardComponentModule } from 'src/app/components/specific/gb-activity-card/gb-activity-card.module';
import { MomentDateFormatPipeModule } from 'src/app/pipes/moment-date-format.module';
import { ActivitiesPage } from './activities.page';


const routes: Routes = [
  {
    path: '',
    component: ActivitiesPage
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
    ActivityCardComponentModule,
    MomentDateFormatPipeModule,
  ],
  declarations: [ActivitiesPage],
})
export class ActivitiesPageModule { }
