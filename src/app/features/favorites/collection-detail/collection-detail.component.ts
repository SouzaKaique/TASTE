import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Collection, Experience } from '../../../core/models';
import { CollectionService } from '../../../core/services/collection.service';
import { ExperienceService } from '../../../core/services/experience.service';
import { ExperienceCardComponent } from '../../../shared/components/experience-card/experience-card.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';

@Component({
  selector: 'app-collection-detail',
  standalone: true,
  imports: [RouterLink, ExperienceCardComponent, EmptyStateComponent, LoadingStateComponent, ErrorStateComponent],
  templateUrl: './collection-detail.component.html',
  styleUrl: './collection-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly collectionService = inject(CollectionService);
  private readonly experienceService = inject(ExperienceService);

  protected readonly loading = signal(true);
  protected readonly notFound = signal(false);
  protected readonly collection = signal<Collection | null>(null);
  protected readonly experiences = signal<Experience[]>([]);

  constructor() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.collectionService.getById(id).subscribe((collection) => {
      if (!collection) {
        this.notFound.set(true);
        this.loading.set(false);
        return;
      }
      this.collection.set(collection);

      if (!collection.experienceIds.length) {
        this.loading.set(false);
        return;
      }

      forkJoin(collection.experienceIds.map((expId) => this.experienceService.getById(expId))).subscribe((list) => {
        this.experiences.set(list.filter((e): e is Experience => !!e));
        this.loading.set(false);
      });
    });
  }
}
