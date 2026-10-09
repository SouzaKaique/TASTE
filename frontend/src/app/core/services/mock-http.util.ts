import { delay, Observable, of, throwError } from 'rxjs';

// Simula a latência de uma API real e mantém as respostas isoladas
// em Observables, para que os serviços possam ser trocados por
// chamadas HTTP reais sem alterar os componentes que os consomem.
export function mockResponse<T>(value: T, ms = 400): Observable<T> {
  return of(value).pipe(delay(ms));
}

export function mockError(message: string, ms = 400): Observable<never> {
  return throwError(() => new Error(message)).pipe(delay(ms));
}
