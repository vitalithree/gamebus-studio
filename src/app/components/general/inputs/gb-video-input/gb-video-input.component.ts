import { Component, forwardRef, HostBinding, Input, OnInit } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { Capacitor } from '@capacitor/core';
import { ActionSheetController, ModalController, Platform } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { AuthorizationService } from 'src/app/services/authorization.service';
import { VideoInputModalPage } from './gb-video-input-modal/gb-video-input-modal.page';
import { VideoInputService } from './video-input-service/video-input.service';

@Component({
  selector: 'app-video-input',
  templateUrl: './gb-video-input.component.html',
  styleUrls: ['./gb-video-input.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => VideoInputComponent),
      multi: true
    }
  ]
})
export class VideoInputComponent implements OnInit {

  @Input() uri: string;
  @Input() disabled = false;

  token: string;

  hasCamera = false;
  isBrowser = true;
  isUploading = false;

  image: File;

  plyrOptions = { controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'fullscreen'] };


  constructor(
    private translate: TranslateService,
    private as: AuthorizationService,
    private modalCtrl: ModalController,
    private platform: Platform,
    private vis: VideoInputService,
    private actionSheetCtrl: ActionSheetController,
  ) { }

  @HostBinding('style.opacity')
  get opacity() {
    return this.disabled ? 0.25 : 1;
  }

  onChange = (uri: string) => { };
  onTouched = () => { };

  ngOnInit() {
    this.hasCamera = Capacitor.isPluginAvailable('Camera');
    this.isBrowser = this.platform.is('desktop') || this.platform.is('mobileweb');

    this.token = this.as.getAccessToken();

    this.vis.uri$.subscribe(
      (uri: string) => {
        this.writeValue(uri);
      }
    );

  }




  writeValue(uri: string): void {
    this.uri = uri;
    this.onChange(this.uri);
  }

  registerOnChange(fn: (uri: string) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  updateValue() {
    if (!this.disabled) {
    }
  }







  async loadVideo($event: any) {
    if ($event.target.files && $event.target.files[0]) {

      this.isUploading = true;
      await this.vis.upload($event.target.files[0]).then((uri: string) => this.writeValue(uri));
      this.isUploading = false;
    }
  }

  async presentVideoOptions() {
    if (this.uri !== undefined && this.uri != null) {
      return;
    }

    let actionSheet: any = null;

    const buttons: { text: string; role?: string; handler?: () => void }[] = [
      {
        text: this.translate.instant('g.cancel'),
        role: 'cancel',
      }
    ];

    if (this.hasCamera && !this.isBrowser) {
      buttons.unshift(
        {
          text: this.translate.instant('c.g.inputs.video-from-camera'),
          handler: async () => {
            const modal = await this.modalCtrl.create({
              component: VideoInputModalPage,
              cssClass: 'video-modal',
            });

            actionSheet.dismiss();

            await modal.present();

            const data = await modal.onWillDismiss();
            if (data.role === 'create' && data.data.uri !== undefined && data.data.uri != null) {
              this.uri = data.data.uri;
            }
          }
        }
      );
    }

    buttons.unshift(
      {
        text: this.translate.instant('c.g.inputs.from-library'),
        handler: () => {
          const el: HTMLElement = document.getElementById('browse') as HTMLElement;
          el.click();
        },
      }
    );

    actionSheet = await this.actionSheetCtrl.create(
      {
        header: this.translate.instant('c.g.inputs.select-video'),
        buttons,
      }
    );
    await actionSheet.present();
  }

}
