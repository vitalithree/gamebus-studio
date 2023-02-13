import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { VideoInputComponent } from './gb-video-input.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { PlyrModule } from 'ngx-plyr';
import { VideoInputModalPage } from './gb-video-input-modal/gb-video-input-modal.page';

@NgModule({
    declarations: [
        VideoInputComponent,
        VideoInputModalPage,
    ],
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        ReactiveFormsModule,
        TranslateModule,
        PlyrModule,
    ],
    entryComponents: [VideoInputModalPage],
    exports: [VideoInputComponent]
})
export class VideoInputComponentModule { }
