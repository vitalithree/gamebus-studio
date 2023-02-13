import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'displayProperty',
})
export class DisplayPropertyPipe implements PipeTransform {

  transform(value: string, property?: string) {
    switch (property) {
      case 'DURATION':
        const duration = parseFloat(value);
        if (!isNaN(duration)) {
          if (duration >= 3600) {
            value = (duration / 3600).toFixed(2) + ' u';
          } else {
            value = (duration / 60).toFixed(2) + ' min';
          }
        }
        break;
      case 'DISTANCE':
        const distance = parseFloat(value);
        if (!isNaN(distance)) {
          if (distance >= 750) {
            value = (distance / 1000).toFixed(2) + ' km';
          } else {
            value = distance.toFixed(2) + ' m';
          }
        }
        return value;
      case 'STEPS':
        const steps = parseFloat(value);
        if (!isNaN(steps)) {
          value = steps.toFixed(0) + ' stappen';
        }
        break;
      default:
        break;
    }
    return value;
  }
}
