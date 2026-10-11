import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ExperienceService } from '../../../core/services/experience.service';
import { ConfirmService } from '../../../shared/services/confirm.service';
import { ToastService } from '../../../shared/services/toast.service';
import {
  EXPERIENCE_CATEGORY_LABELS,
  CUISINE_TYPES,
  Experience,
  ExperienceCategory,
} from '../../../core/models';
import { ExperienceCardComponent } from '../../../shared/components/experience-card/experience-card.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { StarRatingComponent } from '../../../shared/components/star-rating/star-rating.component';

type ViewMode = 'grid' | 'list' | 'timeline';

@Component({
  selector: 'app-experience-list',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    DatePipe,
    ExperienceCardComponent,
    EmptyStateComponent,
    LoadingStateComponent,
    StarRatingComponent,
  ],
  templateUrl: './experience-list.component.html',
  styleUrl: './experience-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperienceListComponent {
  private readonly experienceService = inject(ExperienceService);
  private readonly confirmService = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  protected readonly categoryLabels = EXPERIENCE_CATEGORY_LABELS;
  protected readonly cuisineTypes = CUISINE_TYPES;
  protected readonly categories = Object.entries(EXPERIENCE_CATEGORY_LABELS) as [ExperienceCategory, string][];

  protected readonly loading = signal(true);
  protected readonly experiences = signal<Experience[]>([]);
  protected readonly viewMode = signal<ViewMode>('grid');

  protected readonly filters = signal({
    year: '' as string | number,
    city: '',
    category: '' as string,
    cuisineType: '' as string,
    favoritesOnly: false,
  });

  protected readonly cities = computed(() =>
    Array.from(new Set(this.experiences().map((e) => e.city))).sort(),
  );

  protected readonly years = computed(() =>
    Array.from(new Set(this.experiences().map((e) => new Date(e.date).getFullYear()))).sort((a, b) => b - a),
  );

  protected readonly filteredExperiences = computed(() => {
    const f = this.filters();
    return this.experiences()
      .filter((e) => (f.year ? new Date(e.date).getFullYear() === Number(f.year) : true))
      .filter((e) => (f.city ? e.city === f.city : true))
      .filter((e) => (f.category ? e.category === f.category : true))
      .filter((e) => (f.cuisineType ? e.cuisineType === f.cuisineType : true))
      .filter((e) => (f.favoritesOnly ? e.isFavorite : true))
      .sort((a, b) => +new Date(b.date) - +new Date(a.date));
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.experienceService.list().subscribe((list) => {
      this.experiences.set(list);
      this.loading.set(false);
    });
  }

  protected updateFilter<K extends keyof ReturnType<typeof this.filters>>(key: K, value: any): void {
    this.filters.update((current) => ({ ...current, [key]: value }));
  }

  protected clearFilters(): void {
    this.filters.set({ year: '', city: '', category: '', cuisineType: '', favoritesOnly: false });
  }

  protected onToggleFavorite(id: string): void {
    this.experienceService.toggleFavorite(id).subscribe((updated) => {
      if (!updated) return;
      this.experiences.update((list) => list.map((e) => (e.id === id ? updated : e)));
    });
  }

  protected async onDelete(experience: Experience): Promise<void> {
    const confirmed = await this.confirmService.ask({
      title: 'Excluir experiência',
      message: `Tem certeza de que deseja excluir "${experience.dishName}"? Essa ação não pode ser desfeita.`,
      confirmLabel: 'Excluir',
      danger: true,
    });

    if (!confirmed) return;

    this.experienceService.delete(experience.id).subscribe(() => {
      this.experiences.update((list) => list.filter((e) => e.id !== experience.id));
      this.toast.success('Experiência excluída.');
    });
  }
}
