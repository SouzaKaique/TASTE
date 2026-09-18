import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FeedItem } from '../../../core/models';
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
  addComment = output<{ feedItemId: string; text: string }>();
  removeComment = output<{ feedItemId: string; commentId: string }>();

  protected readonly showComments = signal(false);
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
