import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { HeaderComponentModule } from 'src/app/components/general/header/header.module';
import { LeaderboardComponentModule } from 'src/app/components/specific/gb-leaderboard/gb-leaderboard.module';
import { LotteriesCardComponentModule } from 'src/app/components/specific/gb-lotteries-card/gb-lotteries-card.module';
import { RuleListItemComponentModule } from 'src/app/components/specific/gb-rule-list-item/gb-rule-list-item.module';
import { WinnersCardComponentModule } from 'src/app/components/specific/gb-winners-card/gb-winners-card.module';
import { MomentDateFormatPipeModule } from 'src/app/pipes/moment-date-format.module';
import { AdminChallengePage } from './admin-challenge.page';

const routes: Routes = [
  {
    path: '',
    component: AdminChallengePage
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
    LeaderboardComponentModule,
    RuleListItemComponentModule,
    LotteriesCardComponentModule,
    WinnersCardComponentModule,
    MomentDateFormatPipeModule,
  ],
  declarations: [AdminChallengePage],
})
export class AdminChallengePageModule { }
