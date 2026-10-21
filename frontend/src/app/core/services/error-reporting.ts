import { ErrorHandler, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

type SentryApi = typeof import('@sentry/angular');

let sentry: SentryApi | null = null;

/**
 * Liga o Sentry (monitoramento de erros) só quando há DSN configurado.
 * O pacote é baixado à parte, depois que o app abriu: não pesa na abertura.
 * Não envia dados pessoais: só o erro, a tela e o aparelho/navegador.
 */
export function initErrorReporting(): void {
  if (!environment.sentryDsn) return;
  import('@sentry/angular')
    .then((api) => {
      api.init({
        dsn: environment.sentryDsn,
        environment: environment.production ? 'production' : 'development',
        sendDefaultPii: false,
        tracesSampleRate: 0,
      });
      sentry = api;
    })
    .catch(() => undefined);
}

/** Erros não tratados: continuam no console e vão para o Sentry quando ele está ligado. */
@Injectable()
export class ReportingErrorHandler implements ErrorHandler {
  handleError(error: unknown): void {
    console.error(error);
    sentry?.captureException((error as { rejection?: unknown })?.rejection ?? error);
  }
}
