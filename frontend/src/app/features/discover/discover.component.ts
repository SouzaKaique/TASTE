import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Restaurant } from '../../core/models';
import { RestaurantService } from '../../core/services/restaurant.service';
import { SocialService } from '../../core/services/social.service';
import { FeedItem } from '../../core/models';
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

  protected readonly loading = signal(true);
  protected readonly featured = signal<Restaurant[]>([]);
  protected readonly newDiscoveries = signal<Restaurant[]>([]);
  protected readonly friendsActivity = signal<FeedItem[]>([]);

  constructor() {
    this.restaurantService.listAll().subscribe((list) => {
      this.featured.set(list.slice(0, 4));
      this.newDiscoveries.set([...list].reverse().slice(0, 4));
      this.loading.set(false);
    });
    this.socialService.getFeed().subscribe((feed) => this.friendsActivity.set(feed.slice(0, 3)));
  }
}
