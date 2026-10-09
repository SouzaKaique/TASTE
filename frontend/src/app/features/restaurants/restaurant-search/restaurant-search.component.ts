import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Restaurant } from '../../../core/models';
import { RestaurantService } from '../../../core/services/restaurant.service';
import { RestaurantCardComponent } from '../../../shared/components/restaurant-card/restaurant-card.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';

@Component({
  selector: 'app-restaurant-search',
  standalone: true,
  imports: [FormsModule, RestaurantCardComponent, EmptyStateComponent, LoadingStateComponent],
  templateUrl: './restaurant-search.component.html',
  styleUrl: './restaurant-search.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestaurantSearchComponent {
  private readonly restaurantService = inject(RestaurantService);

  protected readonly loading = signal(true);
  protected readonly term = signal('');
  protected readonly city = signal('');
  protected readonly restaurants = signal<Restaurant[]>([]);
  protected readonly cities = signal<string[]>([]);

  protected readonly filtered = computed(() => {
    const term = this.term().trim().toLowerCase();
    const city = this.city();
    return this.restaurants().filter((r) => {
      const matchesTerm = !term || r.name.toLowerCase().includes(term) || r.city.toLowerCase().includes(term);
      const matchesCity = !city || r.city === city;
      return matchesTerm && matchesCity;
    });
  });

  constructor() {
    this.restaurantService.listAll().subscribe((list) => {
      this.restaurants.set(list);
      this.loading.set(false);
    });
    this.restaurantService.cities().subscribe((cities) => this.cities.set(cities));
  }
}
