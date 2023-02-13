import { Component, OnInit, Input, HostBinding, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Platform, ActionSheetController } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-image-input',
  templateUrl: './gb-image-input.component.html',
  styleUrls: ['./gb-image-input.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ImageInputComponent),
      multi: true
    }
  ]
})
export class ImageInputComponent implements OnInit, ControlValueAccessor {

  @Input() uri: string | SafeResourceUrl;
  @Input() disabled = false;

  hasCamera = false;
  isBrowser = true;

  image: File;

  constructor(
    private translate: TranslateService,
    private platform: Platform,
    private sanitizer: DomSanitizer,
    private actionSheetCtrl: ActionSheetController,
  ) {
  }

  @HostBinding('style.opacity')
  get opacity() {
    return this.disabled ? 0.25 : 1;
  }

  onChange = (image: File) => { };
  onTouched = () => { };


  ngOnInit() {
    this.hasCamera = Capacitor.isPluginAvailable('Camera');
    this.isBrowser = this.platform.is('desktop') || this.platform.is('mobileweb');
  }



  writeValue(image: File): void {
    this.image = image;
    this.onChange(this.image);
  }

  registerOnChange(fn: (image: File) => void): void {
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



  imageUploadEvent(image: any) {
    const fd = new FormData();
    fd.append('image', image, 'image.jpg');
  }




  loadPicture($event: any) {
    if ($event.target.files && $event.target.files[0]) {

      // Send back as event
      this.writeValue($event.target.files[0]);

      // Preview the image without uploading
      const reader = new FileReader();
      reader.onload = (event: any) => {
        this.uri = event.target.result;
      };
      reader.readAsDataURL($event.target.files[0]);

    }
  }



  async presentPictureOptions() {
    if (!this.hasCamera) {
      return;
    }

    const options: any = {
      quality: 75,
      allowEditing: this.platform.is('ios') ? true : false,
      resultType: CameraResultType.DataUrl,
    };


    const buttons: { text: string; role?: string; handler?: () => void }[] = [
      {
        text: this.translate.instant('g.cancel'),
        role: 'cancel',
      }
    ];

    if (this.hasCamera) {
      buttons.unshift(
        {
          text: this.translate.instant('c.g.inputs.picture-from-camera'),
          handler: () => {
            options.source = CameraSource.Camera;
            options.saveToGallery = true;
            this.takePicture(options);
          }
        }
      );
    }

    if (this.isBrowser) {
      buttons.unshift(
        {
          text: this.translate.instant('c.g.inputs.from-library'),
          handler: () => {
            const el: HTMLElement = document.getElementById('browse') as HTMLElement;
            el.click();
          },
        }
      );
    } else {
      buttons.unshift(
        {
          text: this.translate.instant('c.g.inputs.from-library'),
          handler: () => {
            options.source = CameraSource.Photos;
            options.saveToGallery = false;
            this.takePicture(options);
          },
        }
      );
    }

    const actionSheet = await this.actionSheetCtrl.create(
      {
        header: this.translate.instant('c.g.inputs.select-picture'),
        buttons,
      }
    );
    await actionSheet.present();
  }



  async takePicture(options: any) {
    try {
      const tmp = await Camera.getPhoto(options);

      if (tmp !== undefined && tmp != null) {
        this.uri = this.sanitizer.bypassSecurityTrustResourceUrl(tmp && (tmp.dataUrl));

        fetch(tmp.dataUrl)
          .then(res => res.blob())
          .then(blob => {
            this.writeValue(blob as File);
          });
      }
    } catch { }
  }

}
