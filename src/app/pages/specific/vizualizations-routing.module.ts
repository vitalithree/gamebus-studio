import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { PageGuardService } from 'src/app/services/page-guard.service';
import { OnboardingGuardService } from '../../services/onboarding-guard.service';



const routes: Routes = [
  {
    path: 'viz',
    canActivate: [OnboardingGuardService, PageGuardService],
    children: [
      {
        path: 'newsfeed',
        loadChildren: () => import('./newsfeed/newsfeed.module').then(m => m.NewsfeedPageModule)
      },
      {
        path: 'leaderboard',
        loadChildren: () => import('./leaderboard/leaderboard.module').then(m => m.LeaderboardPageModule)
      },
      {
        path: 'streak',
        loadChildren: () => import('./streak/streak.module').then(m => m.StreakPageModule)
      },
      {
        path: 'progress',
        loadChildren: () => import('./progress/progress.module').then(m => m.ProgressPageModule)
      },
      {
        path: 'lootbox',
        loadChildren: () => import('./lootbox/lootbox.module').then(m => m.LootboxPageModule)
      },
    ]
  },
];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class VisualizationsRoutingModule { }
