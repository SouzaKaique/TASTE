import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FeedComment, FeedItem } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import { ShareService } from '../../services/share.service';
import { AvatarComponent } from '../avatar/avatar.component';
import { StarRatingComponent } from '../star-rating/star-rating.component';

@Component({
  selector: 'app-feed-item',
  standalone: true,
  imports: [DatePipe, RouterLink, FormsModule, AvatarComponent, StarRatingComponent],
  templateUrl: './feed-item.component.html',
  styleUrl: './feed-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeedItemComponent {
  item = input.required<FeedItem>();
  toggleLike = output<string>();
  toggleSave = output<string>();
  addComment = output<{ feedItemId: string; text: string }>();
  removeComment = output<{ feedItemId: string; commentId: string }>();

  private readonly auth = inject(AuthService);
  private readonly shareService = inject(ShareService);

  protected share(): void {
    const item = this.item();
    const where = item.restaurantName ? ` no ${item.restaurantName}` : '';
    const stars = item.rating ? ` e deu nota ${item.rating}` : '';
    this.shareService.share({
      title: item.dishName ?? 'TASTE',
      text: `${item.user.displayName} comeu ${item.dishName}${where}${stars} no TASTE.`,
      path: `/app/experiencias/${item.experienceId}`,
    });
  }

  protected readonly showComments = signal(false);
  protected readonly burst = signal(false);
  private burstTimer?: ReturnType<typeof setTimeout>;

  /** Dois toques na foto: mostra o coração e curte (nunca descurte, como no Instagram). */
  protected likeFromPhoto(): void {
    if (!this.item().likedByMe) this.toggleLike.emit(this.item().id);
    clearTimeout(this.burstTimer);
    this.burst.set(false);
    requestAnimationFrame(() => this.burst.set(true));
    this.burstTimer = setTimeout(() => this.burst.set(false), 800);
  }

  /** Pode apagar quem escreveu o comentário ou o dono da publicação. */
  protected canRemove(comment: FeedComment): boolean {
    const me = this.auth.user()?.id;
    return !!me && (comment.userId === me || this.item().user.id === me);
  }
  protected commentDraft = '';

  protected submitComment(): void {
    const text = this.commentDraft.trim();
    if (!text) return;
    this.addComment.emit({ feedItemId: this.item().id, text });
    this.commentDraft = '';
  }

  protected readonly activityLabel = () => {
    switch (this.item().type) {
      case 'new-experience': return 'registrou uma nova experiência';
      case 'new-favorite': return 'favoritou um prato';
      case 'new-collection': return 'publicou uma coleção';
      case 'retrospective-shared': return 'compartilhou a retrospectiva';
      default: return '';
    }
  };
}
