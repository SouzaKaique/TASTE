import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Experience } from '../../core/models';
import { ExperienceService } from '../../core/services/experience.service';
import { LoadingStateComponent } from '../../shared/components/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

interface CityGroup {
  city: string;
  country: string;
  count: number;
  experiences: Experience[];
  pin: { top: number; left: number };
}

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [FormsModule, RouterLink, LoadingStateComponent, EmptyStateComponent],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapComponent {
  private readonly experienceService = inject(ExperienceService);

  protected readonly loading = signal(true);
  protected readonly experiences = signal<Experience[]>([]);
  protected readonly viewMode = signal<'map' | 'list'>('map');
  protected readonly selectedCity = signal<string | null>(null);
  protected readonly yearFilter = signal<number | ''>('');

  protected readonly years = computed(() =>
    Array.from(new Set(this.experiences().map((e) => new Date(e.date).getFullYear()))).sort((a, b) => b - a),
  );

  protected readonly cityGroups = computed<CityGroup[]>(() => {
    const year = this.yearFilter();
    const filtered = this.experiences().filter((e) => (year ? new Date(e.date).getFullYear() === year : true));
    const map = new Map<string, CityGroup>();

    filtered.forEach((exp, index) => {
      const key = exp.city;
      if (!map.has(key)) {
        // Posicionamento ilustrativo e determinístico (não geolocalização real).
        const seed = Array.from(key).reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
        map.set(key, {
          city: exp.city,
          country: exp.country,
          count: 0,
          experiences: [],
          pin: { top: 12 + ((seed * 37) % 76), left: 8 + ((seed * 53 + index) % 84) },
        });
      }
      const group = map.get(key)!;
      group.count++;
      group.experiences.push(exp);
    });

    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  });

  protected readonly selectedGroup = computed(() =>
    this.cityGroups().find((g) => g.city === this.selectedCity()) ?? null,
  );

  constructor() {
    this.experienceService.list().subscribe((list) => {
      this.experiences.set(list);
      this.loading.set(false);
    });
  }

  protected selectCity(city: string): void {
    this.selectedCity.set(this.selectedCity() === city ? null : city);
  }
}
