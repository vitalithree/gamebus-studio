import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { HeaderComponentModule } from 'src/app/components/general/header/header.module';
import { StreakCardComponentModule } from 'src/app/components/specific/gb-streak-card/gb-streak-card.module';
import { StreakPage } from './streak.page';



const routes: Routes = [
  {
    path: '',
    component: StreakPage
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
    StreakCardComponentModule,
  ],
  declarations: [StreakPage]
})
export class StreakPageModule { }
