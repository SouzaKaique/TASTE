import { HttpErrorResponse, HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { EMPTY, catchError, concat, of, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { offlineCache } from '../services/offline-cache';

/**
 * Telas principais abrem na hora: mostram o que a pessoa viu da última vez e
 * atualizam por trás (feed, diário, "Quero ir", amigos, notificações, Descobrir).
 */
const INSTANT = [
  /^\/feed$/,
  /^\/experiences$/,
  /^\/users\/me$/,
  /^\/saved$/,
  /^\/explore$/,
  /^\/explore\/places$/,
  /^\/notifications$/,
  /^\/friends$/,
  /^\/friends\/requests$/,
];

/** Nunca guardados: mudam a cada instante, dependem de onde a pessoa está ou não servem offline. */
const NEVER = [/^\/auth\//, /^\/places\//, /^\/push\//, /^\/notifications\/unread-count$/, /^\/public\//];

/** Paginação ("carregar mais") sempre vai à rede. */
const PAGING_PARAMS = ['beforeAt', 'beforeId'];

/**
 * - INSTANT: devolve o guardado primeiro e depois a resposta nova (abre instantâneo).
 * - Outros GETs: vão à rede; se a internet cair, usam o último guardado (funciona offline).
 * - Qualquer alteração (POST/PUT/DELETE) limpa o guardado, para nada antigo aparecer depois.
 */
export const offlineCacheInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }
  const path = req.url.slice(environment.apiUrl.length).split('?')[0];

  if (req.method !== 'GET') {
    const affected = affectedBy(path);
    return next(req).pipe(tap((event) => event instanceof HttpResponse && event.ok && affected.length && offlineCache.clearMatching(affected)));
  }
  if (NEVER.some((r) => r.test(path)) || PAGING_PARAMS.some((p) => req.params.has(p))) {
    return next(req);
  }

  const key = cacheKey(req);
  const cached = offlineCache.get(key);
  const network = next(req).pipe(
    tap((event) => event instanceof HttpResponse && event.ok && offlineCache.set(key, event.body)),
  );

  if (INSTANT.some((r) => r.test(path))) {
    if (cached === undefined) return network;
    // Guardado primeiro; se a rede falhar, fica só com ele (sem tela de erro)
    return concat(
      of(new HttpResponse({ status: 200, body: cached, url: req.urlWithParams })),
      network.pipe(catchError((error) => (isOffline(error) ? EMPTY : throwError(() => error)))),
    );
  }

  return network.pipe(
    catchError((error) =>
      isOffline(error) && cached !== undefined
        ? of(new HttpResponse({ status: 200, body: cached, url: req.urlWithParams }))
        : throwError(() => error),
    ),
  );
};

/**
 * O que cada alteração deixa desatualizado (prefixos das respostas guardadas).
 * Ex.: marcar notificações como lidas não apaga o feed guardado.
 */
function affectedBy(path: string): string[] {
  if (path.startsWith('/auth/') || path.startsWith('/push/')) return [];
  if (path.startsWith('/notifications')) return ['/notifications'];
  if (/^\/experiences\/\d+\/save$/.test(path)) return ['/saved', '/feed', '/explore'];
  const interaction = path.match(/^\/experiences\/(\d+)\/(like|comments)/);
  if (interaction) return ['/feed', '/saved', '/explore', `/experiences/${interaction[1]}`];
  if (path.startsWith('/experiences')) return ['/experiences', '/feed', '/saved', '/explore', '/users/'];
  if (path.startsWith('/friends') || path.startsWith('/invites')) return ['/friends', '/feed', '/explore', '/users/'];
  if (path.startsWith('/users/me')) return ['/users/'];
  return ['/'];
}

function cacheKey(req: HttpRequest<unknown>): string {
  return req.urlWithParams.slice(environment.apiUrl.length);
}

/** Sem internet, servidor acordando ou fora do ar (não inclui 401/403/404, que são respostas reais). */
function isOffline(error: unknown): boolean {
  return error instanceof HttpErrorResponse && (error.status === 0 || error.status === 502 || error.status === 503 || error.status === 504);
}
