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

  private lastTapAt = 0;
  private lastTapX = 0;
  private lastTapY = 0;
  private lastTouchAt = 0;

  /**
   * Dois toques no celular. O Safari do iPhone não dispara "dblclick" em fotos,
   * então os toques são contados aqui: dois em menos de 300 ms, no mesmo lugar.
   */
  protected onPhotoTap(event: PointerEvent): void {
    if (event.pointerType === 'mouse') return;
    const now = Date.now();
    this.lastTouchAt = now;
    const near = Math.hypot(event.clientX - this.lastTapX, event.clientY - this.lastTapY) < 40;
    if (now - this.lastTapAt < 300 && near) {
      this.lastTapAt = 0;
      this.likeFromPhoto();
    } else {
      this.lastTapAt = now;
      this.lastTapX = event.clientX;
      this.lastTapY = event.clientY;
    }
  }

  private lastTouchEndAt = 0;

  /**
   * No iPhone, dois toques rápidos ampliam a tela. Cancelar o segundo "touchend"
   * impede esse zoom (a pinça com dois dedos continua funcionando normalmente).
   */
  protected onPhotoTouchEnd(event: TouchEvent): void {
    const now = Date.now();
    if (now - this.lastTouchEndAt < 350 && event.cancelable) {
      event.preventDefault();
    }
    this.lastTouchEndAt = now;
  }

  /** Duplo clique com o mouse (computador). Ignorado logo depois de toques, para não curtir duas vezes. */
  protected onPhotoDoubleClick(): void {
    if (Date.now() - this.lastTouchAt < 800) return;
    this.likeFromPhoto();
  }

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
