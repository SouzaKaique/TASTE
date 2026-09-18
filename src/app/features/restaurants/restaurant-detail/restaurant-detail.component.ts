import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Experience, Restaurant } from '../../../core/models';
import { RestaurantService } from '../../../core/services/restaurant.service';
import { ExperienceService } from '../../../core/services/experience.service';
import { ExperienceCardComponent } from '../../../shared/components/experience-card/experience-card.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';

@Component({
  selector: 'app-restaurant-detail',
  standalone: true,
  imports: [RouterLink, ExperienceCardComponent, EmptyStateComponent, LoadingStateComponent, ErrorStateComponent],
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
  protected readonly myExperiences = signal<Experience[]>([]);

  protected readonly favoriteDishes = computed(() => this.myExperiences().filter((e) => e.isFavorite));

  constructor() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.restaurantService.getById(id).subscribe((restaurant) => {
      if (!restaurant) {
        this.notFound.set(true);
        this.loading.set(false);
        return;
      }
      this.restaurant.set(restaurant);
      this.experienceService.list({ restaurantId: id }).subscribe((experiences) => {
        this.myExperiences.set(experiences);
        this.loading.set(false);
      });
    });
  }
}
