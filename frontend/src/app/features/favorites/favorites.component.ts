import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Collection, CollectionPrivacy, Experience } from '../../core/models';
import { ExperienceService } from '../../core/services/experience.service';
import { CollectionService } from '../../core/services/collection.service';
import { ToastService } from '../../shared/services/toast.service';
import { ExperienceCardComponent } from '../../shared/components/experience-card/experience-card.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { LoadingStateComponent } from '../../shared/components/loading-state/loading-state.component';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ExperienceCardComponent, EmptyStateComponent, LoadingStateComponent],
  templateUrl: './favorites.component.html',
  styleUrl: './favorites.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FavoritesComponent {
  private readonly experienceService = inject(ExperienceService);
  private readonly collectionService = inject(CollectionService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  protected readonly activeTab = signal<'favorites' | 'collections'>('favorites');
  protected readonly loading = signal(true);
  protected readonly favorites = signal<Experience[]>([]);
  protected readonly collections = signal<Collection[]>([]);
  protected readonly showNewCollectionForm = signal(false);

  protected readonly newCollectionForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    description: [''],
    privacy: ['public' as CollectionPrivacy],
  });

  constructor() {
    this.experienceService.list({ favoritesOnly: true }).subscribe((list) => {
      this.favorites.set(list);
      this.loading.set(false);
    });
    this.loadCollections();
  }

  private loadCollections(): void {
    this.collectionService.list().subscribe((list) => this.collections.set(list));
  }

  protected onToggleFavorite(id: string): void {
    this.experienceService.toggleFavorite(id).subscribe(() => {
      this.favorites.update((list) => list.filter((e) => e.id !== id));
    });
  }

  protected createCollection(): void {
    if (this.newCollectionForm.invalid) {
      this.newCollectionForm.markAllAsTouched();
      return;
    }
    this.collectionService.create(this.newCollectionForm.getRawValue()).subscribe(() => {
      this.toast.success('Coleção criada.');
      this.newCollectionForm.reset({ name: '', description: '', privacy: 'public' });
      this.showNewCollectionForm.set(false);
      this.loadCollections();
    });
  }
}
