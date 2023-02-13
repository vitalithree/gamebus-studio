import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Activity } from 'src/app/models/gamebus/activity.model';
import { ApiRequest } from 'src/app/models/general/api-request.model';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-activity',
  templateUrl: './activity.page.html',
  styleUrls: ['./activity.page.scss'],
})
export class ActivityPage implements OnInit {

  aid: number;
  activity: Activity;

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
  ) { }

  ngOnInit() {
    const aid = this.route.snapshot.paramMap.get('aid');
    if (aid !== undefined && aid != null) {
      this.aid = Number(aid);
      this.getActivity();
    }
  }


  getActivity($event?: CustomEvent) {

    const getActivity: ApiRequest = {
      uri: '/activities/{aid}',
      method: 'GET',
      pathVariables: [
        { key: 'aid', value: this.aid },
      ],
    };
    this.api.request(getActivity).subscribe(
      (activity: Activity) => {
        this.activity = activity;

        if ($event) {
          ($event.target as any).complete();
        }
      }
    );

  }




}
