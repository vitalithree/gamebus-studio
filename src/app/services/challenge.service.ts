import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { environment } from 'src/environments/environment';
import { Task } from '../models/airbridge/task.model';
import { ActivityScheme } from '../models/gamebus/activity-scheme.model';
import { DataProvider } from '../models/gamebus/data-provider.model';
import { ApiRequest } from '../models/general/api-request.model';
import { ApiService } from './api.service';
import { CampaignService } from './campaign.service';


@Injectable({
    providedIn: 'root'
})
export class ChallengeService {

    client = environment.client;


    typeToScheme: any = {
        general: 'GENERAL_ACTIVITY',
        walk: 'WALK',
        bike: 'BIKE',
        run: 'RUN',
        location: 'LOCATION',
        food: 'Nutrition_Diary',
        drink: 'Drinking_Diary',
        dailyAggregateWalk: 'DAY_AGGREGATE_WALK',
        dailyAggregateRun: 'DAY_AGGREGATE_RUN',
        scorePoints: 'SCORE_GAMEBUS_POINTS',
    };
    providerToSource: any = {
        gamebus: '-',
        googlefit: 'Google Fit',
        strava: 'Strava',
        gamebusSystem: 'GameBus System',
    };

    schemes: ActivityScheme[];
    sources: DataProvider[];

    constructor(
        private api: ApiService,
        private cs: CampaignService,
        private toastCtrl: ToastController,
    ) {
        this.providerToSource.gamebus = this.client.dataprovider;
    }

    getKnownTypes(as: string = 'list') {
        if (as === 'map') {
            return this.typeToScheme;
        } else {
            return Object.keys(this.typeToScheme);
        }
    }

    getKnownProviders(as: string = 'list') {
        if (as === 'map') {
            return this.providerToSource;
        } else {
            return Object.keys(this.providerToSource);
        }
    }

    async convertTasksToRules(tasks: Task[]): Promise<any[]> {
        if (!this.schemes?.length) {
            this.schemes = await this.api.promise({ uri: '/activityschemes', method: 'GET' } as ApiRequest);
        }
        if (!this.sources?.length) {
            this.sources = await this.api.promise({ uri: '/data-providers', method: 'GET' } as ApiRequest);
        }

        if (!this.schemes?.length || !this.sources?.length) {
            this.toast('Schemes and/or sources are not set...');
            return;
        }

        const rules = [];

        for (const task of tasks) {
            let types = task.types?.map((type: string) => (
                this.schemes.find(s => s.translationKey === this.typeToScheme[type])?.id ||
                this.schemes.find(s => s.translationKey === 'GENERAL_ACTIVITY').id
            ));
            types = [...new Set(types)];
            if (!types.length) { types = [this.schemes.find(s => s.translationKey === 'GENERAL_ACTIVITY').id]; }

            const ruleschemes = this.schemes.filter((s: any) => types.includes(s.id));

            const ruleconditions = await this.resolveRuleConditions(task, ruleschemes);
            if (!ruleconditions?.length) {
                this.toast(`Could not create challenge because '${task.name}' did not have conditions.`);
                return;
            }


            let providers = task.providers?.map((provider: string) => (
                this.sources.find((s: any) => s.name === this.providerToSource[provider])?.id
            ));
            providers = [...new Set(providers)];

            const rule = {
                name: task.name,
                image: task.image,
                description: JSON.stringify(task),
                imageRequired: false,
                gameDescriptors: types,
                maxTimesFired: task.maxFired,
                minDaysBetweenFire: task.withinPeriod,
                conditions: ruleconditions,
                points: [
                    { dataProviders: providers, role: 1, points: task.points },
                ]
            };

            rules.push(rule);
        }



        return new Promise(resolve => resolve(rules));
    }

    async resolveRuleConditions(task: Task, ruleschemes: any[]): Promise<any[]> {
        const ruleconditions = [];

        let providers = task.providers?.map((provider: string) => (
            this.sources.find((s: any) => s.name === this.providerToSource[provider])?.id
        ));
        providers = [...new Set(providers)];

        // TODO: Handle task.requiresImage and task.requiresVideo

        if (task.hasSecret && task.hasSecret !== '') {
            try {
                const prid = await this.resolveRuleConditionProperty(ruleschemes, providers, 'SECRET');
                ruleconditions.push(
                    { property: prid, operator: 'EQUAL', value: task.hasSecret },
                );
            } catch (e) { this.toast(e); return; }
        }

        if (task.requiresDescription) {
            try {
                const prid = await this.resolveRuleConditionProperty(ruleschemes, providers, 'DESCRIPTION');
                ruleconditions.push(
                    { property: prid, operator: 'DIFFERENT', value: '(null)' },
                );
            } catch (e) { this.toast(e); return; }
        }

        if (task.minDuration) {
            try {
                const prid = await this.resolveRuleConditionProperty(ruleschemes, providers, 'DURATION');
                ruleconditions.push(
                    { property: prid, operator: 'STRICTLY_GREATER', value: (task.minDuration - 1).toFixed() },
                );
            } catch (e) { this.toast(e); return; }
        }

        if (task.minSteps) {
            let property = 'STEPS';
            if (task.types.toString().includes('aggregate')) { property = 'STEPS_SUM'; }

            try {
                const prid = await this.resolveRuleConditionProperty(ruleschemes, providers, property);
                ruleconditions.push(
                    { property: prid, operator: 'STRICTLY_GREATER', value: (task.minSteps - 1).toFixed() },
                );
            } catch (e) { this.toast(e); return; }
        }

        if (task.types.includes('scorePoints')) {
            try {
                const config = await this.cs.getConfig();

                const prid1 = await this.resolveRuleConditionProperty(ruleschemes, providers, 'FOR_CHALLENGE');
                ruleconditions.push(
                    { property: prid1, operator: 'NAME_CONTAINS', value: config.campaign.abbr },
                );

                const prid2 = await this.resolveRuleConditionProperty(ruleschemes, providers, 'NUMBER_OF_POINTS');
                ruleconditions.push(
                    { property: prid2, operator: 'STRICTLY_GREATER', value: (0).toFixed() },
                );
            } catch (e) { this.toast(e); return; }
        }

        return new Promise(resolve => resolve(ruleconditions));
    }

    async resolveRuleConditionProperty(ruleschemes: any[], providers: number[], property: string) {
        if (!this.sources?.length) {
            this.sources = await this.api.promise({ uri: '/data-providers', method: 'GET' } as ApiRequest);
        }

        ruleschemes.forEach((rs: any) => {
            providers.forEach(did => {
                const ppps = rs.propertyPermissions.filter((pp: any) => pp.dataProvider.id === did);
                if (!ppps.find((pp: any) => pp.property.translationKey === property)) {
                    const p = this.sources.find((d: any) => d.id === did);
                    throw new Error(`Provider '${p.name}' cannot write an activity '${rs.translationKey}' with property '${property}'.`);
                }
            });
        });

        const prid = ruleschemes[0].propertyPermissions.find((pp: any) => pp.property.translationKey === property).property.id;
        return new Promise(resolve => resolve(prid));
    }


    async deriveRuleFromLottery(lottery: { name: string; cost: number; maxFired: number; withinPeriod: number }): Promise<any> {
        if (!this.schemes?.length) {
            this.schemes = await this.api.promise({ uri: '/activityschemes', method: 'GET' } as ApiRequest);
        }
        if (!this.sources?.length) {
            this.sources = await this.api.promise({ uri: '/data-providers', method: 'GET' } as ApiRequest);
        }

        if (!this.schemes?.length || !this.sources?.length) {
            this.toast('Schemes and/or sources are not set...');
            return;
        }

        const dataprovider = this.sources.find(p => p.name === this.client.dataprovider);
        if (!dataprovider) {
            this.toast(`The data provider ${this.client.dataprovider} does not exist...`);
            return;
        }

        const config = await this.cs.getConfig();

        const atype = this.schemes.find(s => s.translationKey === 'PLAY_LOTTERY');
        if (!atype) { this.toast(`Activity 'PLAY_LOTTERY' does not exist in schemes`); }


        const prid1 = await this.resolveRuleConditionProperty([atype], [dataprovider.id], 'FOR_CHALLENGE');
        const prid2 = await this.resolveRuleConditionProperty([atype], [dataprovider.id], 'LOTTERY');

        const conditions = [
            { property: prid1, operator: 'CREATED_BY', value: config.campaign.organizers[0].toFixed() },
            { property: prid1, operator: 'NAME_CONTAINS', value: config.campaign.abbr },
            { property: prid2, operator: 'NAME_CONTAINS', value: lottery.name },
        ];

        const rule = {
            name: 'Took a gamble...',
            gameDescriptors: [atype.id],
            maxTimesFired: lottery.maxFired,
            minDaysBetweenFire: lottery.withinPeriod,
            conditions,
            points: [
                { dataProviders: [1], role: 1, points: -1 * lottery.cost },
            ]
        };

        return new Promise(resolve => resolve(rule));
    }

    async toast(message: string) {
        console.warn(message);

        const errormsg = await this.toastCtrl.create({
            header: `Something's wrong 😭`,
            message: `${message}`,
            color: 'dark',
            position: 'bottom',
            cssClass: 'atBottom',
            buttons: [{ icon: 'close', role: 'cancel', }]
        });
        errormsg.present();
    }




    async joinChallenge(xid: number, cids: number[]): Promise<void> {
        const joinChallenge: ApiRequest = {
            uri: '/challenges/{xid}/participants',
            method: 'POST',
            pathVariables: [
                { key: 'xid', value: xid },
            ],
            requestParams: [
                { key: 'circles', value: cids },
            ],
        };
        await this.api.promise(joinChallenge);
        return new Promise(resolve => resolve());
    }

}
