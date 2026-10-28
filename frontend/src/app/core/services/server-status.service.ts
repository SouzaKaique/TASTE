import { Injectable, signal } from '@angular/core';
import { MonoTypeOperatorFunction, Observable, defer, finalize } from 'rxjs';
import { environment } from '../../../environments/environment';

/** Depois desse tempo sem resposta, avisamos que o servidor está acordando. */
const SLOW_AFTER_MS = 4000;

/**
 * O backend roda no plano gratuito do Render, que "dorme" após inatividade e
 * leva alguns segundos para acordar. Este serviço acorda o servidor assim que o
 * site abre e expõe um sinal para explicar a espera em vez de deixar a tela muda.
 */
@Injectable({ providedIn: 'root' })
export class ServerStatusService {
  /** true enquanto uma requisição observada está demorando além do normal. */
  readonly waking = signal(false);

  private readonly healthUrl = `${environment.apiUrl.replace(/\/api\/?$/, '')}/actuator/health`;
  private pending = 0;

  /** Dispara uma chamada leve e sem login para acordar o servidor cedo. */
  warmUp(): void {
    // 'no-cors': só precisa chegar ao servidor para acordá-lo; a resposta não é lida (evita erro de CORS no console)
    fetch(this.healthUrl, { cache: 'no-store', mode: 'no-cors' }).catch(() => undefined);
  }

  /** Operador RxJS: liga `waking` se a requisição passar do tempo normal. */
  watch<T>(): MonoTypeOperatorFunction<T> {
    return (source: Observable<T>) =>
      defer(() => {
        this.pending++;
        const timer = setTimeout(() => this.waking.set(true), SLOW_AFTER_MS);
        return source.pipe(
          finalize(() => {
            clearTimeout(timer);
            this.pending--;
            if (this.pending === 0) this.waking.set(false);
          }),
        );
      });
  }
}
