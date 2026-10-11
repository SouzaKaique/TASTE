import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FeedItem, UserSummary } from '../../../core/models';
import { SocialService } from '../../../core/services/social.service';
import { ToastService } from '../../../shared/services/toast.service';
import { ConfirmService } from '../../../shared/services/confirm.service';
import { FeedItemComponent } from '../../../shared/components/feed-item/feed-item.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';

type FeedFilter = 'todos' | 'amigos' | 'bem-avaliados';

const RECOMMENDATION_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

interface Recommendation {
  key: string;
  restaurant: string;
  city: string;
  friends: number;
  average: number;
}

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [RouterLink, FeedItemComponent, EmptyStateComponent, ErrorStateComponent, LoadingStateComponent, AvatarComponent],
  templateUrl: './feed.component.html',
  styleUrl: './feed.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeedComponent {
  private readonly socialService = inject(SocialService);
  private readonly toast = inject(ToastService);
  private readonly confirmService = inject(ConfirmService);

  protected readonly loading = signal(true);
  protected readonly error = signal(false);
  protected readonly items = signal<FeedItem[]>([]);
  protected readonly pending = signal<UserSummary[]>([]);

  protected readonly filters: { id: FeedFilter; label: string }[] = [
    { id: 'todos', label: 'Todos' },
    { id: 'amigos', label: 'Só amigos' },
    { id: 'bem-avaliados', label: 'Nota 4+' },
  ];
  protected readonly filter = signal<FeedFilter>('todos');

  protected readonly visibleItems = computed(() => {
    const items = this.items();
    switch (this.filter()) {
      case 'amigos': return items.filter((i) => i.user.friendshipStatus === 'friends');
      case 'bem-avaliados': return items.filter((i) => (i.rating ?? 0) >= 4);
      default: return items;
    }
  });

  /**
   * "Indicados pela turma": lugares com nota 4+ de amigos nos últimos 30 dias,
   * ordenados pelo número de amigos diferentes que indicaram (régua única de importância).
   */
  protected readonly recommended = computed<Recommendation[]>(() => {
    const since = Date.now() - RECOMMENDATION_WINDOW_MS;
    const groups = new Map<string, { restaurant: string; city: string; users: Set<string>; ratings: number[] }>();
    for (const item of this.items()) {
      if (item.user.friendshipStatus !== 'friends' || !item.restaurantName || (item.rating ?? 0) < 4) continue;
      if (new Date(item.createdAt).getTime() < since) continue;
      const key = `${item.restaurantName.toLowerCase()}|${(item.city ?? '').toLowerCase()}`;
      const group = groups.get(key) ?? { restaurant: item.restaurantName, city: item.city ?? '', users: new Set<string>(), ratings: [] };
      group.users.add(item.user.id);
      group.ratings.push(item.rating ?? 0);
      groups.set(key, group);
    }
    return [...groups.entries()]
      .map(([key, g]) => ({
        key,
        restaurant: g.restaurant,
        city: g.city,
        friends: g.users.size,
        average: g.ratings.reduce((a, b) => a + b, 0) / g.ratings.length,
      }))
      .sort((a, b) => b.friends - a.friends || b.average - a.average)
      .slice(0, 5);
  });

  constructor() {
    this.load();
    this.loadPending();
  }

  protected accept(userId: string): void {
    this.socialService.acceptFriendRequest(userId).subscribe({
      next: () => {
        this.toast.success('Agora vocês são amigos!');
        this.loadPending();
        this.load();
      },
      error: (err: Error) => this.toast.error(err.message),
    });
  }

  protected decline(userId: string): void {
    this.socialService.removeFriendship(userId).subscribe({
      next: () => {
        this.toast.info('Pedido recusado.');
        this.loadPending();
      },
      error: (err: Error) => this.toast.error(err.message),
    });
  }

  private loadPending(): void {
    this.socialService.pendingRequests().subscribe({ next: (list) => this.pending.set(list), error: () => undefined });
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.socialService.getFeed().subscribe({
      next: (feed) => {
        this.items.set(feed);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  /** Curtida otimista: a tela muda na hora e o servidor confirma depois. */
  protected onToggleLike(id: string): void {
    const before = this.items().find((item) => item.id === id);
    if (!before) return;
    this.replace({
      ...before,
      likedByMe: !before.likedByMe,
      likesCount: before.likesCount + (before.likedByMe ? -1 : 1),
    });
    this.socialService.toggleLike(id).subscribe({
      next: (updated) => this.replace(updated),
      error: (err: Error) => {
        this.replace(before);
        this.toast.error(err.message);
      },
    });
  }

  protected onAddComment({ feedItemId, text }: { feedItemId: string; text: string }): void {
    this.socialService.addComment(feedItemId, text).subscribe({
      next: (updated) => this.replace(updated),
      error: (err: Error) => this.toast.error(err.message),
    });
  }

  protected async onRemoveComment({ feedItemId, commentId }: { feedItemId: string; commentId: string }): Promise<void> {
    const confirmed = await this.confirmService.ask({
      title: 'Excluir comentário',
      message: 'Tem certeza de que deseja excluir este comentário? Essa ação não pode ser desfeita.',
      confirmLabel: 'Excluir',
      danger: true,
    });
    if (!confirmed) return;

    this.socialService.removeComment(feedItemId, commentId).subscribe({
      next: (updated) => {
        this.replace(updated);
        this.toast.success('Comentário excluído.');
      },
      error: (err: Error) => this.toast.error(err.message),
    });
  }

  private replace(updated: FeedItem): void {
    this.items.update((list) => list.map((item) => (item.id === updated.id ? updated : item)));
  }
}
