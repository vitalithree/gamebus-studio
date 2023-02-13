import { Injectable } from '@angular/core';
import { fromEvent, merge, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class ConnectivityService {

  isOnline$: Observable<boolean>;

  constructor() {
    this.monitorConnection();
  }

  monitorConnection() {

    if (!window || !navigator || !('onLine' in navigator)) {
      return;
    }

    this.isOnline$ = merge(
      of(null),
      fromEvent(window, 'online'),
      fromEvent(window, 'offline')
    ).pipe(map(() => navigator.onLine));

  }

}
