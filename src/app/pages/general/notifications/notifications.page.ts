import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiRequest } from 'src/app/models/general/api-request.model';
import { UserState } from 'src/app/models/gamebus/user-state.model';
import { ApiService } from 'src/app/services/api.service';
import { StateService } from 'src/app/services/state.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.page.html',
  styleUrls: ['./notifications.page.scss'],
})
export class NotificationsPage implements OnInit {

  uris = environment.uris;

  enrolled: { campaign: number[]; organizations: number[]; departments: number[] }
    = { campaign: [], organizations: [], departments: [] };

  isReady = false;
  isLocked = false;

  state: UserState;

  notifications: any[] = [];
  page = 1;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private api: ApiService,
    private ss: StateService,
  ) { }

  async ngOnInit() {
    await this.getNotifications();

    this.isReady = true;
  }



  async getNotifications($event?: CustomEvent) {
    if ($event) {
      if ($event.type === 'ionInfinite') {
        this.page++;
      } else {
        // refresh
        this.page = 0;
      }
    }

    await this.ss.parseAlerts(this.page);
    this.state = await this.ss.getState();

    this.notifications = this.state.alerts.notifications;

    this.notifications = this.notifications.sort((a, b) => b.date - a.date);

    if ($event) {
      ($event.target as any).complete();
    }
  }



  async markAsRead(nids: number[]) {
    const putNotificationRead: ApiRequest = {
      uri: '/notifications',
      method: 'PUT',
      requestParams: [
        { key: 'notificationIds', value: nids },
        { key: 'isRead', value: true },
      ],
    };
    await this.api.promise(putNotificationRead);
    await this.ss.parseAlerts(this.page);
    this.state = await this.ss.getState();
    this.getNotifications();
  }

  markAllAsRead() {
    const nids = this.notifications
      .filter((notification: any) => !notification.isRead)
      .map((notification: any) => notification.id);
    this.markAsRead(nids);
  }

  routeTo(notification: any) {
    let link: string[];
    switch (notification.type.type) {
      case 'ACTIVITY_MESSAGE':
      case 'ACTIVITY_SUPPORT':
        link = ['/activities', notification.params.target_id];
        break;
      default:
        link = null;
        break;
    }

    if (link) {
      this.router.navigate(link, { relativeTo: this.route });
    }

    this.markAsRead([notification.id]);
  }


}
