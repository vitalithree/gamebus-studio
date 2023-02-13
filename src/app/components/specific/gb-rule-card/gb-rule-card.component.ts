import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { IonRouterOutlet, ModalController, NavController } from '@ionic/angular';
import { PlyrComponent } from 'ngx-plyr';
import { Task } from 'src/app/models/airbridge/task.model';

@Component({
  selector: 'app-rule-card',
  templateUrl: './gb-rule-card.component.html',
  styleUrls: ['./gb-rule-card.component.scss'],
})
export class RuleCardComponent implements OnInit {

  @Output() public connectedProvider: EventEmitter<boolean> = new EventEmitter();

  @Input() hasProvider = false;

  @Input() task: Task;

  @ViewChild(PlyrComponent, { static: false }) plyr: PlyrComponent;
  plyrOptions = { controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'fullscreen'] };

  constructor(
    public modalCtrl: ModalController,
    public navCtrl: NavController,
    private routerOutlet: IonRouterOutlet,
  ) {
  }

  async ngOnInit() {

  }




  // async presentProvidersModal($event: Event) {
  //   $event.stopPropagation();

  //   const modal = await this.modalCtrl.create({
  //     component: ProvidersPage,
  //     cssClass: 'providers-modal',
  //     swipeToClose: true,
  //     presentingElement: this.routerOutlet.nativeEl
  //   });
  //   await modal.present();

  //   await modal.onWillDismiss();
  //   // this.getProviders();
  // }

}
