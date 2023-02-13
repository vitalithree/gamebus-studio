import { HttpClient, HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { MissingTranslationHandler, MissingTranslationHandlerParams, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { environment } from 'src/environments/environment';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { VisualizationsRoutingModule } from './pages/specific/vizualizations-routing.module';
import { AppInitService } from './services/app-init.service';
import { AuthorizationInterceptor } from './services/authorization.interceptor';
import { OnboardingGuardService } from './services/onboarding-guard.service';
import { OrganizerGuardService } from './services/organizer-guard.service';
import { PageGuardService } from './services/page-guard.service';
import { ServiceWorkerModule } from '@angular/service-worker';


export class CustomMissingTranslationHandler implements MissingTranslationHandler {
  handle(params: MissingTranslationHandlerParams) {
    if (!environment.production) {
      console.warn(`Missing translation with key: ${params.key}`);
    }
    let sentence = '';
    try {
      const parts = params.key.split('.');
      sentence = parts[parts.length - 1].replace(/([A-Z][a-z]+)/g, ' $1').replace(/([A-Z]{2,})/g, ' $1').replace(/\s{2,}/g, ' ').trim();
      sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1).toLowerCase();
    } catch (e) { }

    return sentence;
  }
}

const customTranslationLoaderFactory = (http: HttpClient): TranslateHttpLoader => {
  const uri = environment.uris.self;
  const hash = environment.hash;
  return new TranslateHttpLoader(http, `${uri}/assets/i18n/`, `.json?cachebust=${hash}`);
};



const initApp = (service: AppInitService) => () => service.init();

@NgModule({
  declarations: [AppComponent],
  entryComponents: [],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    VisualizationsRoutingModule,
    HttpClientModule,
    TranslateModule.forRoot({
      defaultLanguage: 'en',
      missingTranslationHandler: { provide: MissingTranslationHandler, useClass: CustomMissingTranslationHandler },
      loader: {
        provide: TranslateLoader,
        useFactory: customTranslationLoaderFactory,
        deps: [HttpClient]
      }
    }),
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000'
    }),
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    OnboardingGuardService,
    OrganizerGuardService,
    PageGuardService,
    { provide: HTTP_INTERCEPTORS, useClass: AuthorizationInterceptor, multi: true },
    { provide: APP_INITIALIZER, useFactory: initApp, deps: [AppInitService], multi: true }
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
