import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { HeaderComponentModule } from 'src/app/components/general/header/header.module';
import { LeaderboardComponentModule } from 'src/app/components/specific/gb-leaderboard/gb-leaderboard.module';
import { AdminChallengesPage } from './admin-challenges.page';

const routes: Routes = [
  {
    path: '',
    component: AdminChallengesPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
    HeaderComponentModule,
    LeaderboardComponentModule,
  ],
  declarations: [AdminChallengesPage],
})
export class AdminChallengesPageModule { }
