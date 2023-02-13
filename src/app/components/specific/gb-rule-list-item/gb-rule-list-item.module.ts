import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RuleListItemComponent } from './gb-rule-list-item.component';
import { TranslateModule } from '@ngx-translate/core';


@NgModule({
    declarations: [RuleListItemComponent],
    imports: [
        CommonModule,
        IonicModule,
        TranslateModule.forChild(),
    ],
    exports: [RuleListItemComponent]
})
export class RuleListItemComponentModule { }
