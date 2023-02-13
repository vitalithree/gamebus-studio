import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { HeaderComponentModule } from 'src/app/components/general/header/header.module';
import { CircleUrlPipeModule } from 'src/app/pipes/circle-url.module';
import { MomentDateFormatPipeModule } from 'src/app/pipes/moment-date-format.module';
import { MomentFromNowPipeModule } from 'src/app/pipes/moment-from-now.module';
import { AdminGroupsPage } from './admin-groups.page';

const routes: Routes = [
  {
    path: '',
    component: AdminGroupsPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    RouterModule.forChild(routes),
    MomentDateFormatPipeModule,
    MomentFromNowPipeModule,
    HeaderComponentModule,
    CircleUrlPipeModule,
  ],
  declarations: [AdminGroupsPage]
})
export class AdminGroupsPageModule { }
