import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { HeaderComponentModule } from 'src/app/components/general/header/header.module';
import { ActivityCardComponentModule } from 'src/app/components/specific/gb-activity-card/gb-activity-card.module';
import { AdminNewsfeedPage } from './admin-newsfeed.page';

const routes: Routes = [
  {
    path: '',
    component: AdminNewsfeedPage
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
    ActivityCardComponentModule,
  ],
  declarations: [AdminNewsfeedPage]
})
export class AdminNewsfeedPageModule { }
