import { Component, Input, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Plugins } from '@capacitor/core';
import { ModalController, ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { VideoRecorderCamera, VideoRecorderPreviewFrame } from '@teamhive/capacitor-video-recorder';
import { VideoInputService } from '../video-input-service/video-input.service';

// eslint-disable-next-line @typescript-eslint/naming-convention
const { VideoRecorder } = Plugins;

@Component({
  selector: 'app-video-input-modal',
  templateUrl: './gb-video-input-modal.page.html',
  styleUrls: ['./gb-video-input-modal.page.scss'],
})
export class VideoInputModalPage implements OnInit {

  @Input() uri: { local: string | SafeResourceUrl; external: string } = { local: null, external: null };

  ready = false;
  isRecording = false;
  isUploading = false;

  video: File;

  cameraConfig: VideoRecorderPreviewFrame = {
    id: 'video-record',
    stackPosition: 'back', // 'front' overlays your app', 'back' places behind your app.
    width: 'fill',
    height: 'fill',
    x: 0,
    y: 0,
    borderRadius: 0
  };
  cameraRotation: VideoRecorderCamera = VideoRecorderCamera.FRONT;

  plyrOptions = { controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'fullscreen'] };

  constructor(
    private translate: TranslateService,
    private vis: VideoInputService,
    private toastCtrl: ToastController,
    private modalCtrl: ModalController,
    private sanitizer: DomSanitizer,
  ) {
  }

  async ngOnInit() {
    document.body.classList.add('recording');
    await VideoRecorder.initialize({
      camera: this.cameraRotation,
      previewFrames: [this.cameraConfig],
    });
    document.body.style.backgroundColor = 'transparent';
    this.ready = true;
  }

  closeModal(role: string = 'cancel') {
    this.ready = false;
    document.body.classList.remove('recording');
    document.body.style.backgroundColor = '#000';

    if (this.isRecording) {
      VideoRecorder.stopRecording();
      this.isRecording = false;
    }
    VideoRecorder.destroy();

    let data = null;
    if (role === 'create') {
      data = { uri: this.uri.external };
    }
    this.modalCtrl.dismiss(data, role);
  }


  ionViewWillLeave() {
    this.ready = false;
    document.body.classList.remove('recording');
    document.body.style.backgroundColor = '#000';
    if (this.isRecording) {
      VideoRecorder.stopRecording();
      this.isRecording = false;
    }
    VideoRecorder.destroy();
  }

  async rotate() {
    this.ready = false;

    if (this.isRecording) {
      await VideoRecorder.stopRecording();
      this.isRecording = false;
    }
    await VideoRecorder.destroy();

    if (this.cameraRotation === VideoRecorderCamera.FRONT) {
      this.cameraRotation = VideoRecorderCamera.BACK;
    } else {
      this.cameraRotation = VideoRecorderCamera.FRONT;
    }

    await VideoRecorder.initialize({
      camera: this.cameraRotation,
      previewFrames: [this.cameraConfig],
    });

    this.ready = true;
  }

  record() {
    this.isRecording = true;
    VideoRecorder.startRecording();
  }


  async stop() {
    try {
      const tmp = await VideoRecorder.stopRecording();
      this.isRecording = false;

      if (tmp !== undefined && tmp != null) {
        this.isUploading = true;

        fetch(tmp.videoUrl)
          .then(res => res.blob())
          .then(async blob => {
            await this.vis.upload(blob as File).then((uri: string) => this.uri.external = uri);
            this.isUploading = false;
            this.closeModal('create');
          });
      }
    } catch (error) {
      console.log('FETCH ERROR', error);
      const toast = await this.toastCtrl.create({
        message: this.translate.instant('c.g.inputs.video-error'),
        duration: 8000,
        color: 'dark',
        position: 'bottom',
        buttons: [{ icon: 'close', role: 'cancel', }]
      });
      toast.present();
    }
  }

}
