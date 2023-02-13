import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { HeaderComponentModule } from 'src/app/components/general/header/header.module';
import { LootboxCardComponentModule } from 'src/app/components/specific/gb-lootbox-card/gb-lootbox-card.module';
import { WinnersCardComponentModule } from 'src/app/components/specific/gb-winners-card/gb-winners-card.module';
import { LootboxPage } from './lootbox.page';


const routes: Routes = [
  {
    path: '',
    component: LootboxPage
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
    LootboxCardComponentModule,
    WinnersCardComponentModule,
  ],
  declarations: [LootboxPage]
})
export class LootboxPageModule { }
