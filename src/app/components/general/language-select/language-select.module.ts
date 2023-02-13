import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { LanguageSelectComponent } from './language-select.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageOptionsComponent } from './language-options/language-options.component';

@NgModule({
    declarations: [
        LanguageSelectComponent,
        LanguageOptionsComponent,
    ],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        IonicModule,
        RouterModule,
        TranslateModule,
    ],
    entryComponents: [LanguageOptionsComponent],
    exports: [LanguageSelectComponent],
})
export class LanguageSelectComponentModule { }

