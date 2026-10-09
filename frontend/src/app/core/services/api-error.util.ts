import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

/** Formato de erro devolvido pelo backend (ApiError.java). */
interface ApiErrorBody {
  status: number;
  message: string;
  details?: string[];
}

/**
 * Converte um erro HTTP em um Error com mensagem amigável, para que os
 * componentes possam continuar exibindo `err.message` diretamente.
 */
export function toFriendlyError(error: unknown): Observable<never> {
  return throwError(() => new Error(friendlyMessage(error)));
}

export function friendlyMessage(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return error instanceof Error ? error.message : 'Ocorreu um erro inesperado.';
  }

  if (error.status === 0) {
    return 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.';
  }

  const body = error.error as Partial<ApiErrorBody> | null;
  if (body?.details?.length) {
    return body.details.join(' • ');
  }
  if (body?.message) {
    return body.message;
  }
  if (error.status >= 500) {
    return 'O servidor encontrou um problema. Tente novamente em instantes.';
  }
  return 'Não foi possível concluir a ação.';
}
