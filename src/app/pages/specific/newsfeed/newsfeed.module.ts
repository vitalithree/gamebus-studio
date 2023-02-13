import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { HeaderComponentModule } from 'src/app/components/general/header/header.module';
import { ActivityCardComponentModule } from 'src/app/components/specific/gb-activity-card/gb-activity-card.module';
import { NewsfeedPage } from './newsfeed.page';



const routes: Routes = [
  {
    path: '',
    component: NewsfeedPage
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
    ActivityCardComponentModule,
  ],
  declarations: [NewsfeedPage],
})
export class NewsfeedPageModule { }
