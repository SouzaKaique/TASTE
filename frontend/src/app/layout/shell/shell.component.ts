import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { LogoComponent } from '../../shared/components/logo/logo.component';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { BottomNavComponent } from '../bottom-nav/bottom-nav.component';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  /** Mostra o contador de notificações não lidas. */
  badge?: boolean;
}

const UNREAD_POLL_MS = 60_000;

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, LogoComponent, AvatarComponent, BottomNavComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly notifications = inject(NotificationService);

  protected readonly navItems: NavItem[] = [
    { label: 'Início', icon: 'bi-house', route: '/app/inicio' },
    { label: 'Minhas experiências', icon: 'bi-journal-richtext', route: '/app/experiencias' },
    { label: 'Descobrir', icon: 'bi-compass', route: '/app/descobrir' },
    { label: 'Amigos / Feed', icon: 'bi-people', route: '/app/social' },
    { label: 'Notificações', icon: 'bi-bell', route: '/app/notificacoes', badge: true },
    { label: 'Retrospectiva', icon: 'bi-stars', route: '/app/retrospectiva' },
    { label: 'Favoritos', icon: 'bi-heart', route: '/app/favoritos' },
    { label: 'Perfil', icon: 'bi-person-circle', route: '/app/perfil' },
  ];

  constructor() {
    // Contador de não lidas: ao abrir, a cada navegação e a cada minuto
    this.notifications.refreshUnreadCount();
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe(() => this.notifications.refreshUnreadCount());
    const timer = setInterval(() => this.notifications.refreshUnreadCount(), UNREAD_POLL_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  protected logout(): void {
    this.notifications.unreadCount.set(0);
    this.auth.logout();
    this.router.navigate(['/entrar']);
  }
}
