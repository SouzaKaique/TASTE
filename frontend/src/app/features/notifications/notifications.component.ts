import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AppNotification } from '../../core/models';
import { NotificationService } from '../../core/services/notification.service';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../shared/components/loading-state/loading-state.component';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [DatePipe, RouterLink, AvatarComponent, EmptyStateComponent, ErrorStateComponent, LoadingStateComponent],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsComponent {
  private readonly notificationService = inject(NotificationService);

  protected readonly loading = signal(true);
  protected readonly error = signal(false);
  protected readonly items = signal<AppNotification[]>([]);

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.notificationService.list().subscribe({
      next: (items) => {
        // Mostra as não lidas destacadas nesta visita e já marca tudo como lido
        this.items.set(items);
        this.loading.set(false);
        if (items.some((n) => !n.read)) {
          this.notificationService.markAllRead().subscribe({ error: () => undefined });
        }
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  protected message(n: AppNotification): string {
    switch (n.type) {
      case 'friend-request':
        return 'enviou um pedido de amizade.';
      case 'friend-accepted':
        return 'aceitou seu pedido de amizade.';
      case 'like':
        return `curtiu sua experiência${n.dishName ? ` “${n.dishName}”` : ''}.`;
      case 'comment':
        return `comentou em${n.dishName ? ` “${n.dishName}”` : ' sua experiência'}:`;
    }
  }

  protected icon(n: AppNotification): string {
    switch (n.type) {
      case 'friend-request':
        return 'bi-person-plus';
      case 'friend-accepted':
        return 'bi-person-check';
      case 'like':
        return 'bi-heart-fill';
      case 'comment':
        return 'bi-chat-fill';
    }
  }

  /** Para onde o clique leva. */
  protected link(n: AppNotification): string[] {
    if (n.type === 'friend-request') return ['/app/amigos'];
    if (n.type === 'friend-accepted') return ['/app/perfil', n.actor.username];
    return n.experienceId ? ['/app/experiencias', n.experienceId] : ['/app/social'];
  }
}
