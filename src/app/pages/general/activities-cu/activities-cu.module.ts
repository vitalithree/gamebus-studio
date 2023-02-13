import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { HeaderComponentModule } from 'src/app/components/general/header/header.module';
import { RuleCardComponentModule } from 'src/app/components/specific/gb-rule-card/gb-rule-card.module';
import { MomentDateFormatPipeModule } from 'src/app/pipes/moment-date-format.module';
import { ActivitiesCUPage } from './activities-cu.page';

const routes: Routes = [
  {
    path: '',
    component: ActivitiesCUPage
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
    RuleCardComponentModule,
    MomentDateFormatPipeModule,
  ],
  declarations: [ActivitiesCUPage],
})
export class ActivitiesCUPageModule { }
