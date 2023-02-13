import { Pipe, PipeTransform } from '@angular/core';
import { environment } from 'src/environments/environment';

@Pipe({
  name: 'circleUrl',
})
export class CircleUrlPipe implements PipeTransform {

  uris = environment.uris;

  transform(value: string, chref: string) {
    if (!chref || !value) {
      return 'error';
    }

    value = value.replace(/\s+/g, '-').toLowerCase();
    return `${this.uris.selfprod}/landing/${chref}/${value}`;
  }
}
