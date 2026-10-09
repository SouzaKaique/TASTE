import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FeedItem, Restaurant } from '../../core/models';
import { RestaurantService } from '../../core/services/restaurant.service';
import { SocialService } from '../../core/services/social.service';
import { RestaurantCardComponent } from '../../shared/components/restaurant-card/restaurant-card.component';
import { LoadingStateComponent } from '../../shared/components/loading-state/loading-state.component';

@Component({
  selector: 'app-discover',
  standalone: true,
  imports: [RouterLink, RestaurantCardComponent, LoadingStateComponent],
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

  protected readonly visibleRestaurants = computed(() => {
    const city = this.selectedCity();
    const curated = this.restaurants().filter((r) => r.source === 'curated');
    return city ? curated.filter((r) => r.city === city) : curated;
  });

  constructor() {
    this.restaurantService.listAll().subscribe((list) => {
      this.restaurants.set(list);
      this.loading.set(false);
    });
    // Só experiências de amigos (o feed também traz as suas)
    this.socialService.getFeed().subscribe({
      next: (feed) => this.friendsActivity.set(feed.filter((item) => item.user.friendshipStatus === 'friends').slice(0, 3)),
      error: () => undefined,
    });
  }
}
