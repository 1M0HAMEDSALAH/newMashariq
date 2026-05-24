import { registerLocaleData } from '@angular/common';
import localeAr from '@angular/common/locales/ar';
import localeArExtra from '@angular/common/locales/extra/ar';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

registerLocaleData(localeAr, 'ar', localeArExtra);

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
