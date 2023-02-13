import { Campaign } from './campaign.model';
import { Group } from './group.model';
import { Page } from './page.model';
import { Reward } from './reward.model';
import { Task } from './task.model';
import { Wave } from './wave.model';

export class CampaignConfig {

    campaign: Campaign;
    waves: Wave[];
    groups: Group[];
    tasks: Task[];
    // treatments: {
    //     enforced: Treatment[];
    //     optional: Treatment[];
    // };
    pages: Page[];
    rewards: Reward[];
}
