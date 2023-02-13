import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { SanitizeHtmlPipeModule } from 'src/app/pipes/sanitize-html.module';
import { HeaderComponentModule } from '../../../components/general/header/header.module';
import { MdToHtmlPipeModule } from '../../../pipes/md-to-html.pipe.module';
import { LandingPage } from './landing.page';




const routes: Routes = [
  {
    path: '',
    component: LandingPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
    ReactiveFormsModule,
    TranslateModule,
    HeaderComponentModule,
    SanitizeHtmlPipeModule,
    MdToHtmlPipeModule,
  ],
  declarations: [LandingPage]
})
export class LandingPageModule { }
