import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FeedItem, Restaurant } from '../../core/models';
import { RestaurantService } from '../../core/services/restaurant.service';
import { PlaceRanking, SocialService } from '../../core/services/social.service';
import { FoodArtComponent } from '../../shared/components/food-art/food-art.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { InViewDirective } from '../../shared/directives/in-view.directive';

const GRID_PAGE = 18;
const MIN_RANKING = 5;

/** Linha do ranking "Lugares em alta": da comunidade ou um destaque do TASTE para completar. */
interface PlaceRow {
  key: string;
  restaurantId: string | null;
  name: string;
  city: string;
  cuisine?: string;
  /** Registros públicos na comunidade (0 nos destaques que completam a lista). */
  count: number;
  averageRating?: number;
  highlight?: string;
}

/**
 * Descobrir, no estilo "Explorar" dos apps de fotos: busca, lugares em alta
 * (ranking compacto, sem depender de capa) e uma grade de fotos reais de pratos.
 */
@Component({
  selector: 'app-discover',
  standalone: true,
  imports: [FormsModule, RouterLink, DecimalPipe, FoodArtComponent, EmptyStateComponent, InViewDirective],
  templateUrl: './discover.component.html',
  styleUrl: './discover.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiscoverComponent {
  private readonly restaurantService = inject(RestaurantService);
  private readonly socialService = inject(SocialService);

  protected readonly cities = ['Assis', 'Londrina', 'Curitiba', 'São Paulo'];
  protected readonly selectedCity = signal<string | null>(null);

  // Lugares em alta
  private readonly curated = signal<Restaurant[]>([]);
  private readonly community = signal<PlaceRanking[]>([]);
  protected readonly placesLoading = signal(true);
  protected readonly places = computed<PlaceRow[]>(() => {
    const city = this.selectedCity();
    // Culinária dos destaques do TASTE ajuda a escolher a ilustração das linhas da comunidade
    const curatedByName = new Map(this.curated().map((r) => [`${r.name}|${r.city}`.toLowerCase(), r]));
    const rows: PlaceRow[] = this.community().map((p) => {
      const known = curatedByName.get(`${p.name}|${p.city}`.toLowerCase());
      return {
        key: `c-${p.restaurantId ?? p.name}-${p.city}`,
        restaurantId: p.restaurantId ?? known?.id ?? null,
        name: p.name,
        city: p.city,
        cuisine: known?.cuisineTypes[0],
        count: p.count,
        averageRating: p.averageRating,
      };
    });
    // Comunidade ainda pequena: completa com os destaques do TASTE
    const known = new Set(rows.map((r) => `${r.name}|${r.city}`.toLowerCase()));
    for (const r of this.curated()) {
      if (rows.length >= MIN_RANKING) break;
      if (city && r.city !== city) continue;
      if (known.has(`${r.name}|${r.city}`.toLowerCase())) continue;
      rows.push({
        key: `t-${r.id}`,
        restaurantId: r.id,
        name: r.name,
        city: r.city,
        cuisine: r.cuisineTypes[0],
        count: 0,
        highlight: r.highlight,
      });
    }
    return rows;
  });

  // Grade de fotos (carrega mais ao rolar)
  protected readonly photos = signal<FeedItem[]>([]);
  protected readonly gridLoading = signal(true);
  protected readonly gridLoadingMore = signal(false);
  protected readonly gridHasMore = signal(true);

  // Busca (Brasil todo)
  protected readonly term = signal('');
  protected readonly searching = signal(false);
  protected readonly searchResults = signal<Restaurant[]>([]);
  protected readonly isSearching = computed(() => this.term().trim().length > 0);
  private searchTimer: ReturnType<typeof setTimeout> | undefined;
  private searchSeq = 0;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.searchTimer));
    this.restaurantService.listAll().subscribe((list) => this.curated.set(list.filter((r) => r.source === 'curated')));
    this.loadPlaces();
    this.socialService.explore(undefined, GRID_PAGE).subscribe({
      next: (items) => {
        this.photos.set(items);
        this.gridHasMore.set(items.length === GRID_PAGE);
        this.gridLoading.set(false);
      },
      error: () => this.gridLoading.set(false),
    });
  }

  /** Foto grande a cada 10, alternando o lado, como a grade do Instagram. */
  protected tileSize(index: number): string {
    if (index % 10 === 0) return 'big-left';
    if (index % 10 === 5) return 'big-right';
    return '';
  }

  protected loadMorePhotos(): void {
    const last = this.photos().at(-1);
    if (!last || this.gridLoadingMore() || !this.gridHasMore()) return;
    this.gridLoadingMore.set(true);
    this.socialService.explore(last, GRID_PAGE).subscribe({
      next: (items) => {
        const known = new Set(this.photos().map((p) => p.id));
        this.photos.update((list) => [...list, ...items.filter((i) => !known.has(i.id))]);
        this.gridHasMore.set(items.length === GRID_PAGE);
        this.gridLoadingMore.set(false);
      },
      error: () => this.gridLoadingMore.set(false),
    });
  }

  protected selectCity(city: string | null): void {
    this.selectedCity.set(city);
    this.loadPlaces();
    if (this.isSearching()) {
      this.searching.set(true);
      this.runSearch();
    }
  }

  private loadPlaces(): void {
    this.placesLoading.set(true);
    this.socialService.topPlaces(this.selectedCity()).subscribe({
      next: (list) => {
        this.community.set(list);
        this.placesLoading.set(false);
      },
      error: () => {
        this.community.set([]);
        this.placesLoading.set(false);
      },
    });
  }

  protected onTermChange(value: string): void {
    this.term.set(value);
    clearTimeout(this.searchTimer);
    if (!value.trim()) {
      this.searchResults.set([]);
      this.searching.set(false);
      return;
    }
    this.searching.set(true);
    this.searchTimer = setTimeout(() => this.runSearch(), 400);
  }

  protected clearSearch(): void {
    this.onTermChange('');
  }

  private runSearch(): void {
    // Ignora respostas antigas que cheguem depois de uma busca mais nova
    const seq = ++this.searchSeq;
    this.restaurantService.search({ term: this.term(), city: this.selectedCity() ?? undefined }).subscribe((results) => {
      if (seq !== this.searchSeq) return;
      this.searchResults.set(results);
      this.searching.set(false);
    });
  }
}
