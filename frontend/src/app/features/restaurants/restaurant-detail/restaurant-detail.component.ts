import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Experience, Restaurant } from '../../../core/models';
import { RestaurantService } from '../../../core/services/restaurant.service';
import { ExperienceService } from '../../../core/services/experience.service';
import { ExperienceCardComponent } from '../../../shared/components/experience-card/experience-card.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { RestaurantCoverComponent } from '../../../shared/components/restaurant-cover/restaurant-cover.component';

@Component({
  selector: 'app-restaurant-detail',
  standalone: true,
  imports: [RouterLink, ExperienceCardComponent, EmptyStateComponent, LoadingStateComponent, ErrorStateComponent, RestaurantCoverComponent],
  templateUrl: './restaurant-detail.component.html',
  styleUrl: './restaurant-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestaurantDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly restaurantService = inject(RestaurantService);
  private readonly experienceService = inject(ExperienceService);

  protected readonly loading = signal(true);
  protected readonly notFound = signal(false);
  protected readonly restaurant = signal<Restaurant | null>(null);
  protected readonly coverUrl = signal<string | null>(null);
  protected readonly myExperiences = signal<Experience[]>([]);

  protected readonly favoriteDishes = computed(() => this.myExperiences().filter((e) => e.isFavorite));

  /** Link externo para rotas/mapa (Google Maps), pelo nome e endereço. */
  protected readonly directionsUrl = computed(() => {
    const r = this.restaurant();
    if (!r) return null;
    // Nome + endereço abre a ficha do lugar no Google Maps; coordenadas só se faltar endereço e cidade
    const query = r.address || r.city
      ? [r.name, r.address, r.district, r.city, r.state].filter(Boolean).join(', ')
      : r.lat != null && r.lon != null
        ? `${r.lat},${r.lon}`
        : r.name;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  });

  /** Garante que o site do restaurante abra com https:// mesmo se vier sem protocolo. */
  protected readonly websiteUrl = computed(() => {
    const site = this.restaurant()?.website;
    if (!site) return null;
    return /^https?:\/\//i.test(site) ? site : `https://${site}`;
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.restaurantService.getById(id).subscribe({
      next: (restaurant) => {
        if (!restaurant) {
          this.notFound.set(true);
          this.loading.set(false);
          return;
        }
        this.restaurant.set(restaurant);
        this.restaurantService.covers([id]).subscribe((covers) => this.coverUrl.set(covers[id] ?? null));
        this.experienceService.list({ restaurantId: id }).subscribe({
          next: (experiences) => {
            this.myExperiences.set(experiences);
            this.loading.set(false);
          },
          error: () => this.loading.set(false),
        });
      },
      error: () => {
        this.notFound.set(true);
        this.loading.set(false);
      },
    });
  }
}
