import { Component, Input, OnInit } from '@angular/core';
import { RouterDirection } from '@ionic/core';
import { AuthorizationService } from 'src/app/services/authorization.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {

  @Input() color = 'primary';
  @Input() title: string;
  @Input() segments: { name: string; route: string | string[]; direction: RouterDirection; badge?: number }[];
  @Input() hidemenu = false;
  @Input() backbutton: string;

  isAdmin = false;

  constructor(
    private as: AuthorizationService,
  ) { }

  async ngOnInit() {
    if (this.as.isAuthenticated()) {
      this.isAdmin = this.as.isAdmin();
    }
  }


}
