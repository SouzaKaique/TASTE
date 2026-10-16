import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  // Guarda o destino (ex.: um prato compartilhado) para voltar a ele depois do login
  return router.createUrlTree(['/entrar'], { queryParams: { voltar: state.url } });
};

/** Destino seguro depois do login: só caminhos internos do app. */
export function returnUrlFrom(value: string | null): string {
  return value && value.startsWith('/app/') && !value.startsWith('//') ? value : '/app/inicio';
}

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/app/inicio']);
};
