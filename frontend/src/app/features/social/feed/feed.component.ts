import { ChangeDetectionStrategy, Component, ElementRef, NgZone, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FeedItem } from '../../../core/models';
import { RestorablePage } from '../../../core/routing/page-stack.strategy';
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
})
export class FeedComponent implements RestorablePage {
  private readonly socialService = inject(SocialService);
  private readonly toast = inject(ToastService);
  private readonly confirmService = inject(ConfirmService);
  private readonly zone = inject(NgZone);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly page = viewChild.required<ElementRef<HTMLElement>>('page');
  private readonly pullIndicator = viewChild.required<ElementRef<HTMLElement>>('pullIndicator');

  protected readonly loading = signal(true);
  protected readonly error = signal(false);
  protected readonly items = signal<FeedItem[]>([]);

  // Feed infinito: próxima página quando o fim da lista se aproxima
  protected readonly loadingMore = signal(false);
  protected readonly hasMore = signal(true);

  // Puxar para atualizar (celular)
  protected readonly refreshing = signal(false);
  private pullStartY: number | null = null;
  private pullDistance = 0;

  constructor() {
    this.load();
    // O toque move a tela direto, fora do Angular: cada movimento do dedo não revisa o app inteiro
    this.zone.runOutsideAngular(() => {
      const passive = { passive: true };
      this.host.addEventListener('touchstart', (event) => this.onTouchStart(event), passive);
      this.host.addEventListener('touchmove', (event) => this.onTouchMove(event), passive);
      this.host.addEventListener('touchend', () => this.onTouchEnd(), passive);
      this.host.addEventListener('touchcancel', () => this.onTouchEnd(), passive);
    });
  }

  /** Voltou para o feed: atualiza por trás, sem mexer na posição de quem estava lendo. */
  pageRestored(): void {
    this.socialService.getFeed(undefined, PAGE_SIZE).subscribe({
      next: (feed) => {
        if (window.scrollY < 40) {
          this.items.set(feed);
          this.hasMore.set(feed.length === PAGE_SIZE);
          return;
        }
        const fresh = new Map(feed.map((item) => [item.id, item]));
        this.items.update((list) => list.map((item) => fresh.get(item.id) ?? item));
      },
      error: () => undefined,
    });
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

  private fetchFirstPage(done: () => void, waitForNetwork = false): void {
    this.socialService.getFeed(undefined, PAGE_SIZE).subscribe({
      next: (feed) => {
        this.items.set(feed);
        this.hasMore.set(feed.length === PAGE_SIZE);
        if (!waitForNetwork) done();
      },
      error: () => {
        this.error.set(true);
        done();
      },
      complete: () => {
        if (waitForNetwork) done();
      },
    });
  }

  // ---------- Puxar para atualizar ----------

  private onTouchStart(event: TouchEvent): void {
    this.pullStartY = window.scrollY <= 0 && !this.refreshing() ? event.touches[0].clientY : null;
  }

  private onTouchMove(event: TouchEvent): void {
    if (this.pullStartY === null) return;
    const distance = event.touches[0].clientY - this.pullStartY;
    // Resistência: o indicador anda menos que o dedo, como nos apps
    this.setPull(distance > 0 ? Math.min(110, distance * 0.5) : 0, false);
  }

  private onTouchEnd(): void {
    if (this.pullStartY === null) return;
    this.pullStartY = null;
    // O indicador anda metade do dedo: soltar depois de puxar PULL_THRESHOLD px atualiza
    if (this.pullDistance >= PULL_THRESHOLD / 2) {
      this.zone.run(() => this.refresh());
    } else {
      this.setPull(0, true);
    }
  }

  protected refresh(): void {
    this.refreshing.set(true);
    this.setPull(48, true);
    // O indicador fica até chegar a resposta nova, não só a guardada no aparelho
    this.fetchFirstPage(() => {
      this.refreshing.set(false);
      this.setPull(0, true);
    }, true);
  }

  /** A tela desce com o dedo só com transform: nada é recalculado na página a cada movimento. */
  private setPull(distance: number, animated: boolean): void {
    this.pullDistance = distance;
    const page = this.page().nativeElement;
    page.style.transition = animated ? 'transform 220ms var(--ease-out-soft)' : 'none';
    page.style.transform = distance ? `translate3d(0, ${distance}px, 0)` : '';
    const indicator = this.pullIndicator().nativeElement;
    indicator.style.opacity = String(Math.min(1, distance / 32));
    indicator.firstElementChild?.setAttribute('style', `transform: rotate(${distance * 4}deg)`);
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
