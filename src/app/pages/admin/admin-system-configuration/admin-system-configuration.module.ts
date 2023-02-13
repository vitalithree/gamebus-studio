import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { HeaderComponentModule } from 'src/app/components/general/header/header.module';
import { AdminSystemConfigurationPage } from './admin-system-configuration.page';

const routes: Routes = [
  {
    path: '',
    component: AdminSystemConfigurationPage
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
    TranslateModule,
  ],
  declarations: [
    AdminSystemConfigurationPage,
  ]
})
export class AdminSystemConfigurationPageModule { }
