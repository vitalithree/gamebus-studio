import { Location } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MenuController, ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Group } from 'src/app/models/airbridge/group.model';
import { StateService } from 'src/app/services/state.service';
import { environment } from 'src/environments/environment';
import { CampaignConfig } from '../../../models/airbridge/campaign-config.model';
import { AuthorizationService } from '../../../services/authorization.service';
import { CampaignService } from '../../../services/campaign.service';

@Component({
  selector: 'app-about',
  templateUrl: './landing.page.html',
  styleUrls: ['./landing.page.scss'],
})
export class LandingPage implements OnInit, OnDestroy {

  uris = environment.uris;

  isReady = false;
  isLocked = false;

  isAuthenticated: boolean;

  queryForm: FormGroup;

  config: CampaignConfig;
  group: Group;

  constructor(
    private translate: TranslateService,
    private route: ActivatedRoute,
    private location: Location,
    private menu: MenuController,
    private toastCtrl: ToastController,
    private fb: FormBuilder,
    private as: AuthorizationService,
    private cs: CampaignService,
    private ss: StateService,
  ) { }

  ngOnDestroy() {
    document.body.classList.remove('hide-tab');
    this.menu.enable(true, 'side');
  }

  async ngOnInit() {
    this.queryForm = this.fb.group({
      chref: [null, Validators.compose([Validators.required, Validators.minLength(2), Validators.maxLength(40)])],
    });

    this.isAuthenticated = this.as.isAuthenticated();

    let chref = this.route.snapshot.paramMap.get('chref');
    // if (!chref) { chref = environment.chref; }

    if (this.isAuthenticated) {
      const cchref = this.as.getAuthUser()?.chref || null;
      if (cchref) {
        chref = cchref;
        this.location.replaceState(`/landing/${chref}`);
      } else {
        this.ss.destroyState();
        this.isAuthenticated = false;
      }
    }

    if (!this.isAuthenticated) {
      document.body.classList.add('hide-tab');
      this.menu.enable(false, 'side');
    }

    if (chref && chref !== '') {
      this.config = await this.cs.parseConfig(chref.toLowerCase());
      if (this.config) {
        const gname = this.route.snapshot.paramMap.get('gname');
        if (gname && gname !== '') {
          const reg = new RegExp(gname, 'i');

          // Match case insensitive, even with spaces replaced by dashes (-)...
          const group = this.config.groups.find(g => g.assignment === 'from-url'
            && ((reg).test(g.name) || (reg).test(g.name.replace(/\s/g, '-'))));

          if (group?.cid) { this.group = group; }
        }
      }
    }

    this.isReady = true;
  }

  async parseConfig() {
    this.isLocked = true;

    let chref = this.queryForm.get('chref').value;

    if (!chref || chref === '') {
      this.isLocked = false;
      return;
    }
    chref = chref.toLowerCase();

    const config = await this.cs.parseConfig(chref);

    if (!config) {
      const toast = await this.toastCtrl.create({
        header: this.translate.instant('p.g.landing.empty-1'),
        message: this.translate.instant('p.g.landing.empty-2'),
        duration: 8000,
        color: 'dark',
        buttons: [{ icon: 'close', role: 'cancel', }]
      });
      toast.present();
    } else {
      this.config = config;
      this.location.replaceState(`/landing/${chref}`);
    }

    this.isLocked = false;
  }


}
