import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FeedItem } from '../../../core/models';
import { SocialService } from '../../../core/services/social.service';
import { ToastService } from '../../../shared/services/toast.service';
import { ConfirmService } from '../../../shared/services/confirm.service';
import { FeedItemComponent } from '../../../shared/components/feed-item/feed-item.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { InViewDirective } from '../../../shared/directives/in-view.directive';

const PAGE_SIZE = 10;
/** Quanto puxar (em px) para soltar e atualizar. */
const PULL_THRESHOLD = 70;

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [RouterLink, FeedItemComponent, EmptyStateComponent, ErrorStateComponent, LoadingStateComponent, InViewDirective],
  templateUrl: './feed.component.html',
  styleUrl: './feed.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:touchstart)': 'onTouchStart($event)',
    '(window:touchmove)': 'onTouchMove($event)',
    '(window:touchend)': 'onTouchEnd()',
  },
})
export class FeedComponent {
  private readonly socialService = inject(SocialService);
  private readonly toast = inject(ToastService);
  private readonly confirmService = inject(ConfirmService);

  protected readonly loading = signal(true);
  protected readonly error = signal(false);
  protected readonly items = signal<FeedItem[]>([]);

  // Feed infinito: próxima página quando o fim da lista se aproxima
  protected readonly loadingMore = signal(false);
  protected readonly hasMore = signal(true);

  // Puxar para atualizar (celular)
  protected readonly pull = signal(0);
  protected readonly refreshing = signal(false);
  private pullStartY: number | null = null;

  constructor() {
    this.load();
    // Sem o "puxar para recarregar" do navegador competindo com o nosso
    document.documentElement.classList.add('no-overscroll');
    inject(DestroyRef).onDestroy(() => document.documentElement.classList.remove('no-overscroll'));
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.fetchFirstPage(() => this.loading.set(false));
  }

  protected loadMore(): void {
    const last = this.items().at(-1);
    if (!last || this.loadingMore() || !this.hasMore() || this.loading()) return;
    this.loadingMore.set(true);
    this.socialService.getFeed(last, PAGE_SIZE).subscribe({
      next: (page) => {
        // Evita repetidos se um post novo chegou enquanto a pessoa rolava
        const known = new Set(this.items().map((i) => i.id));
        this.items.update((list) => [...list, ...page.filter((i) => !known.has(i.id))]);
        this.hasMore.set(page.length === PAGE_SIZE);
        this.loadingMore.set(false);
      },
      error: () => this.loadingMore.set(false),
    });
  }

  private fetchFirstPage(done: () => void): void {
    this.socialService.getFeed(undefined, PAGE_SIZE).subscribe({
      next: (feed) => {
        this.items.set(feed);
        this.hasMore.set(feed.length === PAGE_SIZE);
        done();
      },
      error: () => {
        this.error.set(true);
        done();
      },
    });
  }

  // ---------- Puxar para atualizar ----------

  protected onTouchStart(event: TouchEvent): void {
    this.pullStartY = window.scrollY <= 0 && !this.refreshing() ? event.touches[0].clientY : null;
  }

  protected onTouchMove(event: TouchEvent): void {
    if (this.pullStartY === null) return;
    const distance = event.touches[0].clientY - this.pullStartY;
    // Resistência: o indicador anda menos que o dedo, como nos apps
    this.pull.set(distance > 0 ? Math.min(110, distance * 0.5) : 0);
  }

  protected onTouchEnd(): void {
    if (this.pullStartY === null) return;
    this.pullStartY = null;
    // O indicador anda metade do dedo: soltar depois de puxar PULL_THRESHOLD px atualiza
    if (this.pull() >= PULL_THRESHOLD / 2) {
      this.refresh();
    } else {
      this.pull.set(0);
    }
  }

  protected refresh(): void {
    this.refreshing.set(true);
    this.pull.set(48);
    this.fetchFirstPage(() => {
      this.refreshing.set(false);
      this.pull.set(0);
    });
  }

  // ---------- Interações ----------

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

  /** "Quero ir" otimista, como a curtida. */
  protected onToggleSave(id: string): void {
    const before = this.items().find((item) => item.id === id);
    if (!before) return;
    this.replace({ ...before, savedByMe: !before.savedByMe });
    this.socialService.toggleSave(id).subscribe({
      next: (updated) => {
        this.replace(updated);
        if (updated.savedByMe) this.toast.success('Salvo em "Quero ir".');
      },
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
