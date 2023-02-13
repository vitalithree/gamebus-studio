import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { HeaderComponentModule } from 'src/app/components/general/header/header.module';
import { MomentDateFormatPipeModule } from 'src/app/pipes/moment-date-format.module';
import { AdminCirclePage } from './admin-circle.page';

const routes: Routes = [
  {
    path: '',
    component: AdminCirclePage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    RouterModule.forChild(routes),
    HeaderComponentModule,
    MomentDateFormatPipeModule,
  ],
  declarations: [AdminCirclePage],
})
export class AdminCirclePageModule { }
