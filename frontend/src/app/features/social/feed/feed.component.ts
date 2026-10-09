import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FeedItem } from '../../../core/models';
import { SocialService } from '../../../core/services/social.service';
import { ToastService } from '../../../shared/services/toast.service';
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

  protected onRemoveComment({ feedItemId, commentId }: { feedItemId: string; commentId: string }): void {
    this.socialService.removeComment(feedItemId, commentId).subscribe({
      next: (updated) => this.replace(updated),
      error: (err: Error) => this.toast.error(err.message),
    });
  }

  private replace(updated: FeedItem): void {
    this.items.update((list) => list.map((item) => (item.id === updated.id ? updated : item)));
  }
}
