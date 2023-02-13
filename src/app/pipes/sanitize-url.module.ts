import { NgModule } from '@angular/core';
import { SanitizeUrlPipe } from './sanitize-url.pipe';
@NgModule({
    declarations: [SanitizeUrlPipe],
    imports: [],
    exports: [SanitizeUrlPipe]
})
export class SanitizeUrlPipeModule { }
