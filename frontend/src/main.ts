import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { initErrorReporting } from './app/core/services/error-reporting';
import { environment } from './environments/environment';

registerLocaleData(localePt, 'pt-BR');
initErrorReporting();

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));

// Abre sem internet e recebe notificações (só no site publicado; no desenvolvimento atrapalharia)
if (environment.production && 'serviceWorker' in navigator) {
  const register = () => navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => undefined);
  // Se a página já terminou de carregar, registra na hora; senão, espera o fim do carregamento
  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register, { once: true });
}
