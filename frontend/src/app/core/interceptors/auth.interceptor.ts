import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Injector, inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService, getStoredToken } from '../services/auth.service';

/**
 * Anexa "Authorization: Bearer <token>" nas chamadas ao backend do TASTE
 * e encerra a sessão quando o backend responde 401 (token inválido ou expirado).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  // O AuthService é obtido sob demanda (e não injetado aqui) para evitar
  // dependência circular: ele mesmo usa o HttpClient que passa por este interceptor.
  const injector = inject(Injector);
  const token = getStoredToken();
  const authReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
  const isAuthEndpoint = req.url.startsWith(`${environment.apiUrl}/auth/`);

  return next(authReq).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && !isAuthEndpoint) {
        injector.get(AuthService).handleExpiredSession();
      }
      return throwError(() => error);
    }),
  );
};
