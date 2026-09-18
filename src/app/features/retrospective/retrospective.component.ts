import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HIGHLIGHT_CATEGORY_LABELS, HighlightCategory, RetrospectiveData } from '../../core/models';
import { RetrospectiveService } from '../../core/services/retrospective.service';
import { ExperienceService } from '../../core/services/experience.service';
import { Experience } from '../../core/models';
import { StarRatingComponent } from '../../shared/components/star-rating/star-rating.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { LoadingStateComponent } from '../../shared/components/loading-state/loading-state.component';

@Component({
  selector: 'app-retrospective',
  standalone: true,
  imports: [FormsModule, RouterLink, StarRatingComponent, EmptyStateComponent, LoadingStateComponent],
  templateUrl: './retrospective.component.html',
  styleUrl: './retrospective.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RetrospectiveComponent {
  private readonly retrospectiveService = inject(RetrospectiveService);
  private readonly experienceService = inject(ExperienceService);

  protected readonly highlightLabels = HIGHLIGHT_CATEGORY_LABELS;
  protected readonly loading = signal(true);
  protected readonly years = signal<number[]>([]);
  protected readonly selectedYear = signal<number>(new Date().getFullYear());
  protected readonly data = signal<RetrospectiveData | null>(null);
  protected readonly allExperiencesForYear = signal<Experience[]>([]);
  protected readonly editingHighlight = signal<HighlightCategory | null>(null);

  protected readonly maxMonthCount = computed(() =>
    Math.max(1, ...(this.data()?.stats.experiencesByMonth.map((m) => m.count) ?? [1])),
  );

  protected readonly podiumOrder = [1, 0, 2];

  constructor() {
    this.retrospectiveService.availableYears().subscribe((years) => {
      this.years.set(years.length ? years : [this.selectedYear()]);
      if (years.length) this.selectedYear.set(years[0]);
      this.loadYear();
    });
  }

  protected onYearChange(year: number): void {
    this.selectedYear.set(Number(year));
    this.loadYear();
  }

  private loadYear(): void {
    this.loading.set(true);
    this.retrospectiveService.getRetrospective(this.selectedYear()).subscribe((data) => {
      this.data.set(data);
      this.loading.set(false);
    });
    this.experienceService.list({ year: this.selectedYear() }).subscribe((list) => this.allExperiencesForYear.set(list));
  }

  protected startEditingHighlight(category: HighlightCategory): void {
    this.editingHighlight.set(category);
  }

  protected assignHighlight(category: HighlightCategory, experienceId: string): void {
    if (!experienceId) return;
    this.retrospectiveService.setManualHighlight(category, experienceId);
    this.editingHighlight.set(null);
    this.loadYear();
  }

  protected clearHighlight(category: HighlightCategory): void {
    this.retrospectiveService.clearManualHighlight(category);
    this.loadYear();
  }
}
