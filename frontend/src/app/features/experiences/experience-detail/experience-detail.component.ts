import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EXPERIENCE_CATEGORY_LABELS, Experience } from '../../../core/models';
import { ExperienceService } from '../../../core/services/experience.service';
import { ConfirmService } from '../../../shared/services/confirm.service';
import { ToastService } from '../../../shared/services/toast.service';
import { StarRatingComponent } from '../../../shared/components/star-rating/star-rating.component';
import { TagComponent } from '../../../shared/components/tag/tag.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';

const VISIBILITY_LABELS: Record<string, string> = {
  public: 'Pública',
  friends: 'Somente amigos',
  private: 'Privada',
};

@Component({
  selector: 'app-experience-detail',
  standalone: true,
  imports: [DatePipe, RouterLink, StarRatingComponent, TagComponent, LoadingStateComponent, ErrorStateComponent],
  templateUrl: './experience-detail.component.html',
  styleUrl: './experience-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperienceDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly experienceService = inject(ExperienceService);
  private readonly confirmService = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  protected readonly categoryLabels = EXPERIENCE_CATEGORY_LABELS;
  protected readonly visibilityLabels = VISIBILITY_LABELS;

  protected readonly loading = signal(true);
  protected readonly notFound = signal(false);
  protected readonly experience = signal<Experience | null>(null);

  constructor() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.experienceService.getById(id).subscribe((exp) => {
      this.loading.set(false);
      if (!exp) {
        this.notFound.set(true);
        return;
      }
      this.experience.set(exp);
    });
  }

  protected toggleFavorite(): void {
    const exp = this.experience();
    if (!exp) return;
    this.experienceService.toggleFavorite(exp.id).subscribe((updated) => {
      if (updated) this.experience.set(updated);
    });
  }

  protected async onDelete(): Promise<void> {
    const exp = this.experience();
    if (!exp) return;

    const confirmed = await this.confirmService.ask({
      title: 'Excluir experiência',
      message: `Tem certeza de que deseja excluir "${exp.dishName}"? Essa ação não pode ser desfeita.`,
      confirmLabel: 'Excluir',
      danger: true,
    });

    if (!confirmed) return;

    this.experienceService.delete(exp.id).subscribe(() => {
      this.toast.success('Experiência excluída.');
      this.router.navigate(['/app/experiencias']);
    });
  }
}
