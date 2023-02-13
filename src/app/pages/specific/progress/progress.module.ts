import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { HeaderComponentModule } from 'src/app/components/general/header/header.module';
import { ProgressCardComponentModule } from 'src/app/components/specific/gb-progress-card/gb-progress-card.module';
import { ProgressPage } from './progress.page';


const routes: Routes = [
  {
    path: '',
    component: ProgressPage
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
    ProgressCardComponentModule,
  ],
  declarations: [ProgressPage]
})
export class ProgressPageModule { }
