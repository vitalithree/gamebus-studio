import { ActivityScheme, Property } from './activity-scheme.model';
import { Circle } from './circle.model';
import { DataProvider } from './data-provider.model';
import { User } from './user.model';


export class Challenge {
    id: number;
    name: string;
    description?: string;
    image: string;
    websiteURL?: string;
    maxCircleSize: number;
    minCircleSize: number;
    availableDate: number;
    startDate: number;
    endDate: number;
    target: number;
    contenders: number;
    isPublic: boolean;
    winnersAssigned: boolean;
    creator: User;
    challengeRules: Rule[];
    participations: Participation[];
    showChallengeRights: ShowChallengeRight[];
    rewards: any[];
    rewardConfig: any[];
    lottery: any[];
    // rewardDescription?: string;
    // rewardInfo?: string;
    // challengeType: string;
    // renewAutomatically: boolean;
    // renewed: boolean;
    // withNudging: boolean;

    duration?: number;
}

export class Participation {
    id: number;
    date: number;
    points: number;
    owned: boolean;
    withNudging: boolean;
    circle?: Circle;
    challenge?: Challenge;

    checked?: boolean; // For front-end purposes
}

export class Rule {
    id: number;
    name: string;
    description: string;
    image?: string;
    imageRequired: boolean;
    videoAllowed?: boolean;
    imageAllowed?: boolean;
    backendOnly: boolean;
    maxTimesFired: number;
    minDaysBetweenFire: number;
    numberOfFiresInTimeWindow: number;
    conditions: Condition[];
    pointMappings: PointMapping[];
    restrictedGameDescriptors: ActivityScheme[];
    defaultGameDescriptor: ActivityScheme;
}

export class Condition {
    id: number;
    rhsValue: string;
    property: Property;
    operator: Operator;
}

export class Operator {
    id: number;
    operator: string;
}

export class PointMapping {
    id: number;
    points: number;
    playerRole: Role;
    dataProviders: DataProvider[];
}

export class Role {
    id: number;
    translationKey: string;
    image: string;
}

export class ShowChallengeRight {
    circle: Circle;
}
