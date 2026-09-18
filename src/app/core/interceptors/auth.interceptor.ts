import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Preparado para anexar um token de autenticação real quando o
 * backend estiver disponível. Hoje os serviços usam dados
 * mockados e não fazem chamadas HTTP reais, então este
 * interceptor é um passthrough.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req);
};
