import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ActivityService {


  getPropertyConf(property: string) {
    switch (property) {
      case 'STEPS':
        return {
          unit: 'stappen',
          min: 500,
          max: 10000,
          step: 250,
          default: 4200,
        };
      case 'DISTANCE':
        return {
          unit: 'meter',
          min: 500,
          max: 10000,
          step: 250,
          default: 1800,
        };
      case 'DURATION':
        return {
          unit: 'minuten',
          min: 5,
          max: 180,
          step: 5,
          default: 15,
        };
        break;
    }
  }

}
