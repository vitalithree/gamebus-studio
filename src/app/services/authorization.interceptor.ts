import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { StateService } from './state.service';

@Injectable()
export class AuthorizationInterceptor implements HttpInterceptor {

    constructor(
        private ss: StateService,
        private router: Router,
        private toastCtrl: ToastController,
    ) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

        return next.handle(request).pipe(
            tap(
                (event: HttpEvent<any>) => {
                    if (event instanceof HttpResponse) {
                    }
                },
                async (error: any) => {
                    if (error instanceof HttpErrorResponse) {
                        console.warn('API REQUEST ERROR!!!', error.status, error.message);
                        if (error.status === 0) {
                            // No connection...
                            const toast = await this.toastCtrl.create({
                                message: 'The server is currently unavailable. Please try again later',
                                // Note: do not translate to avoid cyclic dependency
                                color: 'dark',
                                duration: 8000,
                                buttons: [{ icon: 'close', role: 'cancel', }]
                            });
                            toast.present();
                        }
                        // // Unauthorized...
                        // if (error.status === 401) {
                        //     this.ss.destroyState();
                        //     this.router.navigate(['/landing']);
                        // }
                    }
                }
            )
        );
    }

}
