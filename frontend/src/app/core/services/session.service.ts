import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, getStoredToken } from './auth.service';
import { NotificationService } from './notification.service';
import { PushService } from './push.service';

/** Sair da conta de ponta a ponta. Usado pelo menu do computador e pela aba Perfil. */
@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationService);
  private readonly push = inject(PushService);
  private readonly router = inject(Router);

  signOut(): void {
    this.notifications.unreadCount.set(0);
    // Este aparelho deixa de receber os avisos desta conta
    this.push.forgetOnLogout(getStoredToken());
    this.auth.logout();
    this.router.navigate(['/entrar']);
  }
}
