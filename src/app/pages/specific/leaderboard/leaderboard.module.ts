import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { HeaderComponentModule } from 'src/app/components/general/header/header.module';
import { LeaderboardComponentModule } from 'src/app/components/specific/gb-leaderboard/gb-leaderboard.module';
import { WinnersCardComponentModule } from 'src/app/components/specific/gb-winners-card/gb-winners-card.module';
import { LeaderboardPage } from './leaderboard.page';



const routes: Routes = [
  {
    path: '',
    component: LeaderboardPage
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
    LeaderboardComponentModule,
    WinnersCardComponentModule,
  ],
  declarations: [LeaderboardPage]
})
export class LeaderboardPageModule { }
