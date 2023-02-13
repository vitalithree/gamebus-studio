import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';


@Pipe({
  name: 'momentFromNow',
})
export class MomentFromNowPipe implements PipeTransform {

  transform(value: string | number, suffix: boolean = false) {
    value = moment(value).fromNow(suffix);
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
}
