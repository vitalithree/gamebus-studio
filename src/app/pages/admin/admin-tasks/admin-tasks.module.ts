import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { HeaderComponentModule } from 'src/app/components/general/header/header.module';
import { MomentDateFormatPipeModule } from 'src/app/pipes/moment-date-format.module';
import { MomentFromNowPipeModule } from 'src/app/pipes/moment-from-now.module';
import { AdminTasksPage } from './admin-tasks.page';

const routes: Routes = [
  {
    path: '',
    component: AdminTasksPage
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
  declarations: [AdminTasksPage]
})
export class AdminTasksPageModule { }
