/* eslint-disable max-len */
import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { OnboardingGuardService } from './services/onboarding-guard.service';
import { OrganizerGuardService } from './services/organizer-guard.service';



const routes: Routes = [
  {
    path: '',
    redirectTo: '/tasks',
    pathMatch: 'full',
  },

  {
    path: 'landing',
    children: [
      {
        path: '',
        loadChildren: () => import('./pages/general/landing/landing.module').then(m => m.LandingPageModule)
      },
      {
        path: ':chref',
        children: [
          {
            path: '',
            loadChildren: () => import('./pages/general/landing/landing.module').then(m => m.LandingPageModule)
          },
          {
            path: ':gname',
            loadChildren: () => import('./pages/general/landing/landing.module').then(m => m.LandingPageModule)
          },
        ]
      },
    ]
  },

  {
    path: 'onboarding',
    children: [
      {
        path: '',
        loadChildren: () => import('./pages/general/onboarding/onboarding.module').then(m => m.OnboardingPageModule)
      },
      {
        path: 'recover-password',
        children: [
          {
            path: '',
            loadChildren: () => import('./pages/general/recover-password/recover-password.module').then(m => m.RecoverPasswordPageModule)
          },
          {
            path: ':email/:token',
            loadChildren: () => import('./pages/general/recover-password/recover-password.module').then(m => m.RecoverPasswordPageModule)
          },
        ]
      },
      {
        path: ':segment',
        loadChildren: () => import('./pages/general/onboarding/onboarding.module').then(m => m.OnboardingPageModule)
      },
    ]
  },

  {
    path: 'account',
    canActivate: [OnboardingGuardService],
    children: [
      {
        path: '',
        loadChildren: () => import('./pages/general/activities/activities.module').then(m => m.ActivitiesPageModule)
      },
      {
        path: 'settings',
        loadChildren: () => import('./pages/general/settings/settings.module').then(m => m.SettingsPageModule)
      },
      {
        path: ':pid',
        loadChildren: () => import('./pages/general/activities/activities.module').then(m => m.ActivitiesPageModule)
      },
    ]
  },
  {
    path: 'activities',
    canActivate: [OnboardingGuardService],
    children: [
      {
        path: '',
        loadChildren: () => import('./pages/general/activities/activities.module').then(m => m.ActivitiesPageModule)
      },
      {
        path: 'account/:pid',
        children: [
          {
            path: '',
            loadChildren: () => import('./pages/general/activities/activities.module').then(m => m.ActivitiesPageModule)
          },
        ],
      },
      {
        path: ':aid',
        loadChildren: () => import('./pages/general/activity/activity.module').then(m => m.ActivityPageModule)
      },
    ]
  },


  {
    path: 'tasks',
    canActivate: [OnboardingGuardService],
    children: [
      {
        path: '',
        loadChildren: () => import('./pages/general/activities-cu/activities-cu.module').then(m => m.ActivitiesCUPageModule)
      },
      {
        path: ':rid',
        loadChildren: () => import('./pages/general/activity-cu/activity-cu.module').then(m => m.ActivityCUPageModule)
      },
    ]
  },

  {
    path: 'notifications',
    canActivate: [OnboardingGuardService],
    loadChildren: () => import('./pages/general/notifications/notifications.module').then(m => m.NotificationsPageModule)
  },




  {
    path: 'admin',
    canActivate: [OnboardingGuardService, OrganizerGuardService],
    children: [
      {
        path: '',
        redirectTo: 'dashboards',
        pathMatch: 'full'
      },
      {
        path: 'dashboards',
        children: [
          {
            path: '',
            redirectTo: 'users',
            pathMatch: 'full'
          },
          {
            path: 'users',
            loadChildren: () => import('./pages/admin/admin-user-management/admin-user-management.module').then(m => m.AdminUserManagementPageModule)
          },
          {
            path: 'groups',
            children: [
              {
                path: '',
                loadChildren: () => import('./pages/admin/admin-groups/admin-groups.module').then(m => m.AdminGroupsPageModule)
              },
              {
                path: ':cid',
                loadChildren: () => import('./pages/admin/admin-circle/admin-circle.module').then(m => m.AdminCirclePageModule)
              },
            ]
          },
          {
            path: 'tasks',
            loadChildren: () => import('./pages/admin/admin-tasks/admin-tasks.module').then(m => m.AdminTasksPageModule)
          },
          {
            path: 'challenges',
            children: [
              {
                path: '',
                loadChildren: () => import('./pages/admin/admin-challenges/admin-challenges.module').then(m => m.AdminChallengesPageModule)
              },
              {
                path: 'creator',
                loadChildren: () => import('./pages/admin/admin-challenge-cu/admin-challenge-cu.module').then(m => m.AdminChallengeCuPageModule)
              },
              {
                path: ':xid',
                loadChildren: () => import('./pages/admin/admin-challenge/admin-challenge.module').then(m => m.AdminChallengePageModule)
              },
            ]
          },
        ]
      },

      {
        path: 'newsfeed',
        loadChildren: () => import('./pages/admin/admin-newsfeed/admin-newsfeed.module').then(m => m.AdminNewsfeedPageModule)
      },
    ]
  },

  {
    path: 'system-configuration',
    loadChildren: () => import('./pages/admin/admin-system-configuration/admin-system-configuration.module').then(m => m.AdminSystemConfigurationPageModule)
  },

  // {
  //   path: 'vouchers',
  //   canActivate: [OrganizerGuardService],
  //   loadChildren: () => import('./pages/general/dashboards/admin-voucher-cu/admin-voucher-cu.module').then(m => m.AdminVoucherCuPageModule)
  // },

];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
