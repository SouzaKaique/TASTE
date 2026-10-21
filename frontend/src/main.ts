import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { initErrorReporting } from './app/core/services/error-reporting';

registerLocaleData(localePt, 'pt-BR');
initErrorReporting();

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
