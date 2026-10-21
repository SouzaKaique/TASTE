import { ApplicationConfig, ErrorHandler, LOCALE_ID, provideZoneChangeDetection } from '@angular/core';
import { ReportingErrorHandler } from './core/services/error-reporting';
import { NavigationError, provideRouter, withComponentInputBinding, withNavigationErrorHandler, withViewTransitions } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

/**
 * Depois de uma nova publicação, uma aba aberta antes ainda aponta para os arquivos
 * antigos do site. Ao navegar, o carregamento falha; aqui recarregamos direto no
 * destino (uma vez só) para buscar a versão nova.
 */
function reloadOnStaleChunk(error: NavigationError): void {
  const message = String((error.error as Error)?.message ?? error.error ?? '');
  const stale = /dynamically imported module|Importing a module script failed|Loading chunk|MIME type/i.test(message);
  if (!stale) return;
  try {
    if (sessionStorage.getItem('taste.reloaded') === error.url) return;
    sessionStorage.setItem('taste.reloaded', error.url);
  } catch {
    // sem armazenamento: recarrega mesmo assim
  }
  window.location.assign(error.url);
}

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: LOCALE_ID, useValue: 'pt-BR' },
    { provide: ErrorHandler, useClass: ReportingErrorHandler },
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding(), withNavigationErrorHandler(reloadOnStaleChunk), withViewTransitions({
        skipInitialTransition: true,
        // Navegar rápido cancela a animação anterior: isso é normal, não é erro
        onViewTransitionCreated: ({ transition }) => {
          transition.ready.catch(() => undefined);
          transition.finished.catch(() => undefined);
          transition.updateCallbackDone.catch(() => undefined);
        },
      })),
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
};
