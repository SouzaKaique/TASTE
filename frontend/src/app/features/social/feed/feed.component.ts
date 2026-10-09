import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FeedItem } from '../../../core/models';
import { SocialService } from '../../../core/services/social.service';
import { ToastService } from '../../../shared/services/toast.service';
import { ConfirmService } from '../../../shared/services/confirm.service';
import { FeedItemComponent } from '../../../shared/components/feed-item/feed-item.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [RouterLink, FeedItemComponent, EmptyStateComponent, ErrorStateComponent, LoadingStateComponent],
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

  constructor() {
    this.load();
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

  protected onToggleLike(id: string): void {
    this.socialService.toggleLike(id).subscribe({
      next: (updated) => this.replace(updated),
      error: (err: Error) => this.toast.error(err.message),
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
