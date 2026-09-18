import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FeedItem } from '../../../core/models';
import { SocialService } from '../../../core/services/social.service';
import { FeedItemComponent } from '../../../shared/components/feed-item/feed-item.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [RouterLink, FeedItemComponent, EmptyStateComponent, LoadingStateComponent],
  templateUrl: './feed.component.html',
  styleUrl: './feed.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeedComponent {
  private readonly socialService = inject(SocialService);

  protected readonly loading = signal(true);
  protected readonly items = signal<FeedItem[]>([]);

  constructor() {
    this.load();
  }

  private load(): void {
    this.socialService.getFeed().subscribe((feed) => {
      this.items.set(feed);
      this.loading.set(false);
    });
  }

  protected onToggleLike(id: string): void {
    this.socialService.toggleLike(id);
    this.load();
  }

  protected onAddComment({ feedItemId, text }: { feedItemId: string; text: string }): void {
    this.socialService.addComment(feedItemId, text);
    this.load();
  }

  protected onRemoveComment({ feedItemId, commentId }: { feedItemId: string; commentId: string }): void {
    this.socialService.removeComment(feedItemId, commentId);
    this.load();
  }
}
