# GameBus Studio: The *health goal* app

---

GameBus Studio provides a framework for hosting health promotion campaigns.

Its main strengths are:

* Health promotion campaigns are easily configured, updated, and shared through Airtable
* Per campaign, users' health tasks and performance visualizations can be customized per user group and campaign wave

The software is distributed via [studio.gamebus.eu](https://studio.gamebus.eu).  
(suggestion: use the campaign href '*demo*' to enroll in an exemplar health promotion campaign)

🤾🏻‍♂️🍎🎯

---

## Contents

<!-- * 📚 [Glossary](#glossary) -->
* 📚 [How it works](#how-it-works)
* 🔨 [Getting started](#getting-started)
* 🧱 [Project architecture](#project-architecture)
* 🚀 [Deployment](#deployment)
* 🔥 [Campaign configuration](#campaign-configuration)
* 👥 [Contributing](#contributing)
* 📄 [License](#license)


<!-- <a name="glossary"></a>

---

## 📖 Glossary

* *Health tasks* are healthy suggestions and implemented as GameBus Challenge Rules.
* *User groups* are implemented as GameBus Circles and used to distinguish between users of a certain type (e.g., users who enroll in the campaign in general, users who receive a specific treatment, etc.). Note that a single user can be in multiple user groups at the same time. Typically, a user is in one group per group type.
* *Campaign waves* are time periods in which certain campaign configurations hold. For example, in a given campaign wave, a specific set of health tasks can be made available to a specific user group. -->



<a name="how-it-works"></a>

---

## 📚 How it works
GameBus Studio provides a highly configurable gamification engine for health promotion. The framework can be used to host multiple experimental designs on a single platform. Additionally, it enables researchers to gather health data in a manner compliant to European privacy legislation.

Since GameBus Studio is built of modular components, a web interface with just the components that are relevant for a health promotion campaign can relatively easily be assembled. Moreover, the experience of groups of users can be controlled precisely: **At its core, GameBus Studio provides a framework to customize users' health tasks and performance visualizations per user group and campaign wave**. The assignment of health tasks and performance visualizations to groups of users in a given campaign wave is easily configured through [Airtable](http://airtable.com).


GameBus Studio is designed to support four operations that are typical in a health promotion campaign:

#### 1. Enrolling in a specific health promotion campaign
GameBus Studio can host multiple health promotion campaigns at the same time. Therefore, tools are provided to enrol in a specific campaign. 

The landing page (i.e., `{uri}/landing`) prompts the user for a campaign href. So, users that know the href of an active campaign could enroll in that campaign. 

Alternatively, a single campaign can be selected through a URL path parameter. For example, `{uri}/landing/demo` resolves to the campaign configuration that is specified in the *GBS demo* [Airtable base](https://airtable.com/appGWSj8mEtyYA2uY/).

On enrolling in a campaign, GameBus Studio can automatically assign users to groups. Additionally, users can self-select a group they belong to, see  [campaign configuration](#campaign-configuration) for more information.


#### 2. Suggesting health tasks
After a user enrolls in a campaign, GameBus Studio can suggest a set of health tasks to the user. The suggested activities may be different based on the combination of: (a) the current wave, and (b) the user's groups.

The system distinguishes between three ways of suggesting health tasks:

1. Via a predefined list, which includes the tasks with a checked `enforced` attribute in the tasks Airtable table
2. Via a self-selection from a predefined list of tasks (i.e., the tasks in the tasks Airtable table with a deselected `enforced` attribute)
3. ~~Via autonomous configuration, from scratch (i.e., which is to be implemented)~~


#### 3. Tracking engagement in health tasks
Users can view their health tasks at `{uri}/tasks`. From this overview, users can indicate engaging in their tasks.


#### 4. Visualizing performance
For engaging in a task, a user is awarded virtual points. Of course, user performance (e.g., the total amount of virtual points) can be visualized in many ways. Therefore, GameBus Studio provides the following performance visualizations:

* Leaderboards
	* Options: configurable?, individuals?, group?
* Newsfeeds
	* Options: N.A.
* Streaks
	* Options: N.A.
* ~~Loot boxes (i.e., which are to be implemented)~~
	* ~~Options:~~

Researchers can extend these performance visualizations, or introduce new ones, see [contributing](#contributing) for more information.



<a name="getting-started"></a>

---

## 🔨 Getting started
These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for instructions on how to deploy the project to a live system.

### Prerequisites
1. Install the [Ionic CLI](https://ionicframework.com/getting-started), using `$ npm i -g @ionic/cli`
2. Install [Visual Studio Code](https://code.visualstudio.com), which is the preferred IDE
3. Optionally: Install [Sourcetree](https://www.sourcetreeapp.com), a simple Git GUI
4. Be familiar with the relevant GameBus back-end services (e.g., the router service, user service, and API service)
5. Be familiar with Angular and Ionic development
6. Be familiar with [Airtable](http://airtable.com) and the GameBus Airbridge service that exposes Airtable data through a REST API

### Installation (local environment)
1. Run the relevant GameBus back-end services (e.g., the router service, user service, and API service), locally
2. Ensure you have the credentials of an admin account (see instructions in the [GameBus back-end repository](https://bitbucket.org/vitalithree/gamebus-back-end-3.x/src/develop/))
3. Run the GameBus Airbridge service, locally
4. Clone this repository using Sourcetree, `$ git clone` or download
5. Change your directory to the cloned repository using `$ cd gamebus-studio` (or similar) and run `$ npm i` to install the dependencies
6. Run `$ code .` to open the project with Visual Studio Code
7. Run `$ ionic serve` to run the application locally in a browser: The app starts on [localhost:8100](http://localhost:8100/)
8. Navigate to the `/system-configuration` page, sign-in using an admin account and confirm that the configuration is complete. Follow the instructions if the configuration is NOT complete, OR:
	   * In the MySQL database that is operated by the GameBus back-end services, confirm that the table `oauth_client_details` lists a client where `id` is `gamebus_studio_app` with a `secret` that is known to you (i.e., the secrets in the database are encrypted)
	   * Similarly, confirm that the table `data_provider` includes an entry where `name` is `GameBus Studio` and that is linked to the `gamebus_studio_app` client (i.e., via the `client` attribute)
	   * Then, refresh the `/system-configuration` page, to add the required property permissions
9. Navigate to the app homepage (i.e., `/`) and search for your campaign configuration (or search for '*demo*' to enroll in a demo campaign)



<a name="project-architecture"></a>

---

## 🧱 Project architecture
### Technology stack
The project is based on the following technologies:

* [Ionic Framework](https://ionicframework.com) (v6+)
* [Angular](https://angular.io) (v13+)

The project leverages the following plugins / libraries:

* [ngx-translate](https://ionicframework.com/docs/developer-resources/ng2-translate/) (including ngx-translate/http-loader) is used as translation engine
* [MomentJs](http://momentjs.com/docs/) is used for datetime operations
* [marked](https://marked.js.org) is used to convert markdown to html
* [Plyr](https://plyr.io) (including ngx-plyr) is used as media player
* Different [Capacitor](https://capacitorjs.com) plugins are used for different native functionalities, such as [@capacitor/filesystem](https://capacitorjs.com/docs/apis/filesystem), [@capacitor/camera](https://capacitorjs.com/docs/apis/camera), [@teamhive/capacitor-video-recorder](https://github.com/TeamHive/capacitor-video-recorder)

### Folder structure
In the folder structure listed below, the folders and files that you will likely modify are highlighted.
<pre>
├── src
│	├── index.html
│	├── global.scss
│	├── service-worker.js
│	├── manifest.json
│	├── **app**
│	│	├── app.component.ts
│	│	├── app.html
│	│	├── app.module.ts
│	│	├── **app-routing.module.ts**
│	│	├── app.scss
│	│	├── **pages**
│	│	│	├── admin
│	│	│	├── general
│	│	│	└── **specific**
│	│	│		├── **vizualizations-routing.module.ts**
│	│	│		├── leaderboard
│	│	│		│	├── leaderboard.module.ts
│	│	│		│	├── leaderboard.page.ts
│	│	│		│	├── leaderboard.page.html
│	│	│		│	└── leaderboard.page.scss
│	│	│		└── **...**
│	│	├── **components**
│	│	│	├── general
│	│	│	└── **specific**
│	│	│		├── gb-leaderboard
│	│	│		│	├── gb-leaderboard.module.ts
│	│	│		│	├── gb-leaderboard.component.ts
│	│	│		│	├── gb-leaderboard.component.html
│	│	│		│	└── gb-leaderboard.component.scss
│	│	│		└── **...**
│	│	├── models
│	│	│	├── general
│	│	│	├── airbridge
│	│	│	└── gamebus
│	│	├── pipes
│	│	└── services
│	├── **environments**
│	│	├── **environment.ts**
│	│	└── environment.prod.ts
│	├── assets
│	│	├── email
│	│	├── **i18n**
│	│	│	├── en.yaml
│	│	│	├── en.json
│	│	│	├── nl.yaml
│	│	│	└── nl.json
│	│	├── icons
│	│	└── imgs
│	└── theme
│		└── variables.scss
├── package.json
└── www
</pre>



<a name="deployment"></a>

---

## 🚀 Deployment (external/production environment)
### For the web
1. Run `$ ionic build`.
2. Navigate from the project root to `www`.
3. Duplicate this folder to the desired location, for example at [studio.gamebus.eu](https://studio.gamebus.eu) in `/var/www/studio/app/`.
4. Reassure the external location has a `.htaccess` file with:

```apache
<IfModule mod_rewrite.c>
	RewriteEngine on
	RewriteCond %{HTTPS} !=on
	RewriteRule (.*) https://studio.gamebus.eu.nl%{REQUEST_URI} [R,L]
	
	RewriteCond %{REQUEST_FILENAME} -s [OR]
	RewriteCond %{REQUEST_FILENAME} -l [OR]
	RewriteCond %{REQUEST_FILENAME} -d
	RewriteRule ^.*$ - [NC,L]
	RewriteRule ^(.*) /index.html [NC,L]
</IfModule>
```

5. To access the external location over the Internet, make sure the Apache config is correct.



<a name="campaign-configuration"></a>

---

## 🔥 Campaign configuration
Campaigns are configured through [Airtable](http://airtable.com). The [GameBus Airbridge service](https://bitbucket.org/vitalithree/gamebus-airbridge/) exposes Airtable data through a REST API. Subsequently, this data can be used in the admin dashboards of GameBus Studio to configure the GameBus back-end as desired.

1. Retrieve the credentials of the GameBus Airtable account (i.e., info@gamebus.eu) and login to [Airtable](http://airtable.com).
2. Duplicate the `GBS template` Airtable base and rename it
3. Retrieve the `base id` of your copy of the `GBS template` Airtable base. To do so: (a) navigate to your base, (b) click on the help button near the top-right of your screen, (c) in the help menu click  "<> API documentation" option. Then, your `base id` is printed on the screen (see detailed instructions [here](https://support.airtable.com/docs/understanding-airtable-ids#ids-in-airtable-api)).
4. Open the `campaigns` Airtable base and add a new row. Populate the attribute `base` with the `base id` that you retrieved in the previous step. Also make sure to set a memorizable `href` (i.e., in kebab case), which will be used to index the campaign on the GameBus Studio landing page `/landing`. Moreover, it is important to set the `start` and `end` attributes to specify the time period in which the campaign is available to users. Lastly, to be able to use the Airtable configuration, it is important to add your GameBus user identifier to the `organizers` attribute (i.e., as a comma-separated list).
5. Modify your duplicate of the `GBS template` Airtable base according to your preferences. An overview of the individual Airtable tables in the template is detailed below.


### Table: campaign
This table is used to detail campaign information (i.e., by definition, this table only has one row). For example, here a campaign name, description and logo can be set. Moreover, the contact details can be set.

Lastly, it is important to understand that the `consent` attribute is used to instantiate a set of consent items (i.e., as a JSON array). A valid JSON array would be:

```json
[
    {
        "tk": "name-visible",
        "required": true
    },
    {
        "tk": "participate-study",
        "required": true
    },
    {
        "tk": "voluntary-participation",
        "required": true
    },
    {
        "tk": "fair-play-reward",
        "required": true
    },
    {
        "tk": "terms-conditions",
        "required": true,
        "link": "https://blog.gamebus.eu/?page_id=1066"
    }
]
```

To see which translated options are available, check the YAML/JSON tree of the translation files (i.e., in `/src/assets/i18n/`) at `c > g > onboarding`. If you need to introduce a custom consent item, you can: (a) use a specific translation key (i.e., tk) and update the translation files, or (b) write the consent item in-full as the translation key in a language that all your users will understand (i.e., as then the consent item is not translated).


### Table: waves
Waves are time periods in which certain campaign configurations hold. For example, in a given wave, a specific set of tasks can be made available to a specific group.


### Table: groups
Groups are just GameBus circles, with some additional configuration from Airtable. In particular, through Airtable, the type of group and method of assignment to a group can be specified.

GameBus Studio distinguishes between three group types: (a) *campaign*, which is a group with all users that are enrolled in a given campaign, (b) *studyarm*, which is typically used to distinguish between groups of users that receive a different app variant (i.e., users are typically unaware of their assignment to such a group), and (c) *group* which is used to distinguish between groups of users, of which they are aware.

Additionally, GameBus Studio distinguishes between four assignment strategies: (a) *everybody*, which assigns all users who are enrolled in the campaign to the group (i.e., which is required for groups of type *campaign*), (b) *random*, which assigns users randomly to a group with the given type (i.e., which typically makes sense for groups of type *studyarm*), (c) *select-at-onboarding*, which allows users to select during onboarding a group with the given type (i.e., which typically makes sense for selecting a user's department or organization), and (d) *from-url*, which allows users to be assigned to a group through a URL like `/landing/{chref}?g={cid}` (where `{chref}` is the campaign href and `{cid}` is the GameBus circle identifier of the group).


### Table: tasks
The tasks table is used to define the health tasks specific user groups are suggested to perform in specific waves. In the GameBus database, the tasks will eventually be instantiated as Challenge Rules (i.e., if you have used the admin dashboards of GameBus Studio to instantiate a task challenge). A task has a `name`, `desc` (i.e., description), `image` and/or `video` attribute. Moreover, users can set the task `types` (i.e., GameBus Game Descriptors).

The attributes `maxFired`, `withinPeriod`, `onDays` are used to control when a task is available to a user. For example, a `maxFired` of 1 and `withinPeriod` of 1 means that a task can be performed once per day, whereas a `maxFired` of 7 and `withinPeriod` of 7 means that a task can be performed 7 times per week. The `onDays` attribute can be used to control on which days of a campaign a task is visible to a user (i.e., as a comma-separated list). For example, a value of 0,1 means that a task is only visible to a user on the first and second day of the wave in which the task is suggested.

The attributes `requiresImage`, `requiresVideo`, `requiresDescription`, `minDuration`, `minSteps` and `hasSecret` are used to set the conditions a user has to conform to, in order to be awarded virtual points (i.e., as specified by the `points` attribute).


### Table: pages
The pages table is used to specify which GameBus studio pages a specific user group can see in a specific wave. Typically, dedicated pages are used to display a user's health tasks (i.e., task challenge) and a user's performance (i.e., visualization challenge). To see which visualizations of user performance are available, check the Section [How it works](#how-it-works).


### Table: rewards
Rewards are just GameBus rewards, with some additional configuration from Airtable. Use the admin dashboards of GameBus Studio to create a visualization challenge (i.e., an actual GameBus Challenge) with a certain reward.


### Quirks
* 🚦 If certain data is in Airtable, it does not necessarily mean that that data is synchronized with the GameBus database. Especially, to instantiate groups, and tasks challenges and/or visualization challenges, use the GameBus Studio admin dashboards.
* 🚦 The Airtable tasks table does not check if the task `types` (i.e., GameBus Game Descriptors) have the appropriate GameBus properties to fulfill the condition (i.e., which are set by the attributes `requiresImage`, `requiresVideo`, `requiresDescription`, `minDuration`, `minSteps` and `hasSecret`). Nevertheless, the admin dashboards do confirm the correct permissions exist, whenever you instantiate a (task) challenge.
* 🚦 Groups and circles are linked through the `cid` attribute on the `groups` Airtable table, where `cid` is a GameBus circle identifier. When running a campaign, make sure to use the `/admin/dashboards/groups` page to create GameBus circles for every group that you specified in Airtable. Note that the link between groups and circles is not preserved between different environments. Hence, you may need to clear the `cid` attribute on the `groups` Airtable table whenever you start using a different environment.



<a name="contributing"></a>

---

## Contributing
Please read [contributing](CONTRIBUTING.md) for instructions on how to create new GameBus Studio pages.


### Versioning
We use [SemVer](http://semver.org/) for versioning. For the current version number, see the `package.json` in the root of the project.


### Contributors
* **dr.ir. Raoul Nuijten** -- [personal website](http://www.projectraoul.nl)



<a name="license"></a>

---

## 📄 License
This project is licensed under the CC-BY-SA License, see the [LICENSE.md](LICENSE.md) file for details. In summary, the license allows you to:

* Share — copy and redistribute the material in any medium or format
* Adapt — remix, transform, and build upon the material for any purpose, even commercially.

Under the following terms:

* Attribution — You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
* ShareAlike — If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
* No additional restrictions — You may not apply legal terms or technological measures that legally restrict others from doing anything the license permits.

The licensor cannot revoke these freedoms as long as you follow the license terms. No warranties are given. The license may not give you all of the permissions necessary for your intended use. For example, other rights such as publicity, privacy, or moral rights may limit how you use the material.
