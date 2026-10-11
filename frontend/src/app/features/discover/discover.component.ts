import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FeedItem, Restaurant } from '../../core/models';
import { RestaurantService } from '../../core/services/restaurant.service';
import { SocialService } from '../../core/services/social.service';
import { RestaurantCardComponent } from '../../shared/components/restaurant-card/restaurant-card.component';
import { LoadingStateComponent } from '../../shared/components/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-discover',
  standalone: true,
  imports: [FormsModule, RouterLink, RestaurantCardComponent, LoadingStateComponent, EmptyStateComponent],
  templateUrl: './discover.component.html',
  styleUrl: './discover.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiscoverComponent {
  private readonly restaurantService = inject(RestaurantService);
  private readonly socialService = inject(SocialService);

  protected readonly cities = ['Assis', 'Londrina', 'Curitiba', 'São Paulo'];

  protected readonly loading = signal(true);
  protected readonly restaurants = signal<Restaurant[]>([]);
  protected readonly selectedCity = signal<string | null>(null);
  protected readonly friendsActivity = signal<FeedItem[]>([]);
  protected readonly covers = signal<Record<string, string>>({});
  private readonly coverRequested = new Set<string>();

  // Busca (Brasil todo)
  protected readonly term = signal('');
  protected readonly searching = signal(false);
  protected readonly searchResults = signal<Restaurant[]>([]);
  protected readonly isSearching = computed(() => this.term().trim().length > 0);
  private searchTimer: ReturnType<typeof setTimeout> | undefined;
  private searchSeq = 0;

  protected readonly featured = computed(() => {
    const city = this.selectedCity();
    const curated = this.restaurants().filter((r) => r.source === 'curated');
    return city ? curated.filter((r) => r.city === city) : curated;
  });

  protected readonly visibleRestaurants = computed(() => (this.isSearching() ? this.searchResults() : this.featured()));

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.searchTimer));

    this.restaurantService.listAll().subscribe((list) => {
      this.restaurants.set(list);
      this.loading.set(false);
    });
    // Só experiências de amigos (o feed também traz as suas)
    this.socialService.getFeed().subscribe({
      next: (feed) => this.friendsActivity.set(feed.filter((item) => item.user.friendshipStatus === 'friends').slice(0, 3)),
      error: () => undefined,
    });

    // Capas: busca as fotos da comunidade para restaurantes ainda não consultados
    effect(() => {
      const ids = this.visibleRestaurants().map((r) => r.id).filter((id) => !this.coverRequested.has(id));
      if (!ids.length) return;
      ids.forEach((id) => this.coverRequested.add(id));
      this.restaurantService.covers(ids).subscribe((found) => this.covers.update((current) => ({ ...current, ...found })));
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

  protected selectCity(city: string | null): void {
    this.selectedCity.set(city);
    if (this.isSearching()) {
      this.searching.set(true);
      this.runSearch();
    }
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
