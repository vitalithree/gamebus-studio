import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';


@Pipe({
  name: 'momentDateFormat',
})
export class MomentDateFormatPipe implements PipeTransform {

  transform(value: string | number | Date, format?: string, utc = true) {
    if (!format) { format = 'dddd D MMMM YYYY, HH:mm'; }

    let date = moment.utc(value);
    if (!utc) { date = moment(value); }

    return date.format(format);
  }
}
