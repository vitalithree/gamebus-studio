import { ConsentItem } from '../airbridge/consent-item.model';
import { Group } from '../airbridge/group.model';
import { Page } from '../airbridge/page.model';
import { Task } from '../airbridge/task.model';
import { Wave } from '../airbridge/wave.model';
import { Activity } from './activity.model';
import { Challenge } from './challenge.model';
import { Circle } from './circle.model';


export class UserState {

    consent: {
        passing: boolean;
        campaign: ConsentItem[];
    };

    wave: Wave;

    circles: {
        private: { id: number; name: string; image?: string };
        campaign?: Circle;
        arm?: Group;
        all: Circle[];
    };

    challenges: {
        active: Challenge[];
        ended: Challenge[];
    };

    preferences?: { strategy?: string; circles?: number[]; widgets?: string[] };

    tasks: Task[];
    pages: Page[];

    newsfeed: { page: number; items: Activity[] };

    alerts?: {
        unread: {
            all?: number;
            notif?: number;
            chats?: number;
        };
        notifications?: any[];
    };

}
