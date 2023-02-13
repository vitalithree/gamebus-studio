import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'state'
})
export class StatePipe implements PipeTransform {

  transform(value: string, ...args: any[]): any {
    switch (value) {
      case 'MEMBERSHIP_REQUESTED':
        return 'MR';
      case 'MEMBERSHIP_APPROVED':
        return 'M';
      case 'MEMBERSHIP_DENIED':
        return 'MD';
      case 'LEADERSHIP_REQUESTED':
        return 'LR';
      case 'LEADERSHIP_APPROVED':
        return 'L';
      case 'LEADERSHIP_DENIED':
        return 'LD';
    }
  }

}
