import { NgModule } from '@angular/core';
import { MdToHtmlPipe } from './md-to-html.pipe';

@NgModule({
    declarations: [MdToHtmlPipe],
    imports: [],
    exports: [MdToHtmlPipe]
})
export class MdToHtmlPipeModule { }
