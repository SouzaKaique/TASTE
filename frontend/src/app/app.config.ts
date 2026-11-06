import { ApplicationConfig, ErrorHandler, LOCALE_ID, provideZoneChangeDetection } from '@angular/core';
import { ReportingErrorHandler } from './core/services/error-reporting';
import { NavigationError, PreloadAllModules, RouteReuseStrategy, provideRouter, withComponentInputBinding, withNavigationErrorHandler, withPreloading } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { offlineCacheInterceptor } from './core/interceptors/offline-cache.interceptor';
import { PageStackStrategy } from './core/routing/page-stack.strategy';

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
    // Sem View Transitions: elas congelam os toques durante a troca e somam uma segunda animação
    // ao gesto de voltar do iPhone. Pré-carregar deixa todas as telas prontas antes do primeiro toque.
    provideRouter(routes, withComponentInputBinding(), withNavigationErrorHandler(reloadOnStaleChunk), withPreloading(PreloadAllModules)),
    { provide: RouteReuseStrategy, useExisting: PageStackStrategy },
    provideHttpClient(withInterceptors([offlineCacheInterceptor, authInterceptor])),
  ],
};
