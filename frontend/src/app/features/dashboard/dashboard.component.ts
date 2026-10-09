import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ExperienceService } from '../../core/services/experience.service';
import { Experience } from '../../core/models';
import { ExperienceCardComponent } from '../../shared/components/experience-card/experience-card.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { LoadingStateComponent } from '../../shared/components/loading-state/loading-state.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, ExperienceCardComponent, EmptyStateComponent, LoadingStateComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private readonly auth = inject(AuthService);
  private readonly experienceService = inject(ExperienceService);

  protected readonly user = this.auth.user;
  protected readonly loading = signal(true);
  protected readonly experiences = signal<Experience[]>([]);

  protected readonly stats = computed(() => {
    const list = this.experiences();
    const cities = new Set(list.map((e) => e.city));
    const restaurants = new Set(list.map((e) => e.restaurantId));
    const favorites = list.filter((e) => e.isFavorite).length;
    const avg = list.length ? list.reduce((sum, e) => sum + e.rating, 0) / list.length : 0;

    const cuisineCounts = new Map<string, number>();
    list.forEach((e) => cuisineCounts.set(e.cuisineType, (cuisineCounts.get(e.cuisineType) ?? 0) + 1));
    let topCuisine: string | null = null;
    let topCount = 0;
    cuisineCounts.forEach((count, cuisine) => {
      if (count > topCount) { topCount = count; topCuisine = cuisine; }
    });

    return {
      total: list.length,
      restaurants: restaurants.size,
      cities: cities.size,
      favorites,
      averageRating: Math.round(avg * 10) / 10,
      topCuisine,
    };
  });

  protected readonly recentExperiences = computed(() =>
    [...this.experiences()].sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 4),
  );

  protected readonly bestRecent = computed(() =>
    [...this.experiences()].sort((a, b) => b.rating - a.rating || +new Date(b.date) - +new Date(a.date))[0] ?? null,
  );

  constructor() {
    this.experienceService.list().subscribe((list) => {
      this.experiences.set(list);
      this.loading.set(false);
    });
  }

  protected greeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }
}
