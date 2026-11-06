import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { PushService } from '../../core/services/push.service';
import { SessionService } from '../../core/services/session.service';
import { PageStackStrategy, RestorablePage } from '../../core/routing/page-stack.strategy';
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
  private readonly push = inject(PushService);
  private readonly session = inject(SessionService);
  private readonly pageStack = inject(PageStackStrategy);
  private readonly content = viewChild.required<ElementRef<HTMLElement>>('content');

  /** Sem internet: o app segue com o que já estava guardado e avisa discretamente. */
  protected readonly offline = signal(typeof navigator !== 'undefined' && !navigator.onLine);

  protected readonly navItems: NavItem[] = [
    { label: 'Início', icon: 'bi-house', route: '/app/inicio' },
    { label: 'Minhas experiências', icon: 'bi-journal-richtext', route: '/app/experiencias' },
    { label: 'Descobrir', icon: 'bi-compass', route: '/app/descobrir' },
    { label: 'Amigos / Feed', icon: 'bi-people', route: '/app/social' },
    { label: 'Quero ir', icon: 'bi-bookmark', route: '/app/quero-ir' },
    { label: 'Notificações', icon: 'bi-bell', route: '/app/notificacoes', badge: true },
    { label: 'Retrospectiva', icon: 'bi-stars', route: '/app/retrospectiva' },
    { label: 'Favoritos', icon: 'bi-heart', route: '/app/favoritos' },
    { label: 'Perfil', icon: 'bi-person-circle', route: '/app/perfil' },
  ];

  constructor() {
    // A rolagem de cada tela é guardada com ela; o navegador não tenta adivinhar
    history.scrollRestoration = 'manual';

    // Contador de não lidas: ao abrir, a cada navegação e a cada minuto
    this.notifications.refreshUnreadCount();
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe((e) => {
        this.notifications.refreshUnreadCount();
        // Só o feed tem "puxar para atualizar"
        document.documentElement.classList.toggle('no-overscroll', e.urlAfterRedirects.split('?')[0] === '/app/social');
      });
    const timer = setInterval(() => this.notifications.refreshUnreadCount(), UNREAD_POLL_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
    // Notificações no celular: confere a situação e mantém a inscrição em dia
    this.push.refresh().catch(() => undefined);

    const goOffline = () => this.offline.set(true);
    const goOnline = () => this.offline.set(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    inject(DestroyRef).onDestroy(() => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
      document.documentElement.classList.remove('no-overscroll');
    });
  }

  /** Tela nova entrando por um link: desliza de leve. Abas e "voltar" aparecem na hora. */
  protected onPageOpened(outlet: RouterOutlet): void {
    window.scrollTo({ top: 0, behavior: 'instant' });
    const navigation = this.router.getCurrentNavigation();
    if (!navigation?.previousNavigation || navigation.trigger === 'popstate') return;
    if (outlet.activatedRouteData['keep'] === 'tab') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    this.content().nativeElement.animate(
      [
        { opacity: 0, transform: 'translate3d(20px, 0, 0)' },
        { opacity: 1, transform: 'none' },
      ],
      { duration: 220, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
    );
  }

  /** Tela guardada voltou: primeiro a rolagem, porque ela decide como a tela se atualiza. */
  protected onPageRestored(page: object): void {
    window.scrollTo({ top: this.pageStack.takeRestoredScroll() ?? 0, behavior: 'instant' });
    (page as Partial<RestorablePage>).pageRestored?.();
  }

  protected logout(): void {
    this.session.signOut();
  }
}
