import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { HeaderComponentModule } from 'src/app/components/general/header/header.module';
import { MomentDateFormatPipeModule } from 'src/app/pipes/moment-date-format.module';
import { MomentFromNowPipeModule } from 'src/app/pipes/moment-from-now.module';
import { AdminUserManagementPage } from './admin-user-management.page';
import { StatePipe } from './state.pipe';

const routes: Routes = [
  {
    path: '',
    component: AdminUserManagementPage
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
  ],
  declarations: [
    AdminUserManagementPage,
    StatePipe,
  ]
})
export class AdminUserManagementPageModule { }
