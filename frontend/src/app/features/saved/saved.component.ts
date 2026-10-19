import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FeedItem } from '../../core/models';
import { SocialService } from '../../core/services/social.service';
import { ToastService } from '../../shared/services/toast.service';
import { FoodArtComponent } from '../../shared/components/food-art/food-art.component';
import { StarRatingComponent } from '../../shared/components/star-rating/star-rating.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../shared/components/loading-state/loading-state.component';

/** Lista "Quero ir": pratos e lugares que a pessoa salvou do feed para visitar depois. */
@Component({
  selector: 'app-saved',
  standalone: true,
  imports: [RouterLink, FoodArtComponent, StarRatingComponent, EmptyStateComponent, ErrorStateComponent, LoadingStateComponent],
  templateUrl: './saved.component.html',
  styleUrl: './saved.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SavedComponent {
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
    this.socialService.saved().subscribe({
      next: (list) => {
        this.items.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  /** Link do Google Maps para chegar ao lugar (só abre a busca, sem custo e sem chave). */
  protected mapsUrl(item: FeedItem): string {
    const query = [item.restaurantName, item.city].filter(Boolean).join(', ');
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }

  protected remove(item: FeedItem): void {
    // Some na hora; se der erro, volta para a lista
    const before = this.items();
    this.items.update((list) => list.filter((i) => i.id !== item.id));
    this.socialService.toggleSave(item.id).subscribe({
      next: (updated) => {
        // Já não estava salvo (outra aba, por exemplo): salva de novo para não perder
        if (updated.savedByMe) this.items.set(before);
        else this.toast.info('Tirado da lista "Quero ir".');
      },
      error: (err: Error) => {
        this.items.set(before);
        this.toast.error(err.message);
      },
    });
  }
}
