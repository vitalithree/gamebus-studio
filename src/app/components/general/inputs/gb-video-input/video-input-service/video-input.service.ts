import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import { environment } from 'src/environments/environment';
import { ApiRequest } from 'src/app/models/general/api-request.model';
import { ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class VideoInputService {

  uris = environment.uris;

  uri: string;
  uriSubject = new Subject<string>();
  uri$ = this.uriSubject.asObservable();

  constructor(
    private api: ApiService,
    private toastCtrl: ToastController,
    private translate: TranslateService,
  ) {
  }

  public getURI(): string { return this.uri; }
  updateURI(uri: string) { this.uri = uri; this.uriSubject.next(uri); }



  async upload(video: File): Promise<string> {
    const requestBody = new FormData();
    requestBody.append('image', video, 'image.mp4'); // Do not change name and filename to avoid API 500
    const postVideo: ApiRequest = {
      uri: '/uploader/image',
      method: 'POST',
      requestBody,
    };
    return new Promise(
      (resolve, reject) => {
        this.api.request(postVideo).subscribe(
          (data: any) => {
            const uri = this.uris.api + '/' + data.result;
            this.updateURI(uri);
            resolve(uri);
          },
          async (error: any) => {
            console.warn('UPLOAD ERROR', error);
            const toast = await this.toastCtrl.create({
              message: this.translate.instant('c.g.inputs.video-error'),
              duration: 8000,
              color: 'dark',
              position: 'bottom',
              buttons: [{ icon: 'close', role: 'cancel', }]
            });
            toast.present();
            reject();
          }
        );
      }
    );
  }


}
