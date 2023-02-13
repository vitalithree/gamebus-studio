import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageSelectComponentModule } from 'src/app/components/general/language-select/language-select.module';
import { HeaderComponentModule } from '../../../components/general/header/header.module';
import { ImageInputComponentModule } from '../../../components/general/inputs/gb-image-input/gb-image-input.module';
import { SettingsPage } from './settings.page';




const routes: Routes = [
  {
    path: '',
    component: SettingsPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    RouterModule.forChild(routes),
    TranslateModule,
    HeaderComponentModule,
    LanguageSelectComponentModule,
    ImageInputComponentModule,
  ],
  declarations: [SettingsPage]
})
export class SettingsPageModule { }
