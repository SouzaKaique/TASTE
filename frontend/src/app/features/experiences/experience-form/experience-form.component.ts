import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  CUISINE_TYPES,
  EXPERIENCE_CATEGORY_LABELS,
  Experience,
  ExperienceCategory,
  ExperiencePhoto,
  ExperienceVisibility,
} from '../../../core/models';
import { ExperienceService } from '../../../core/services/experience.service';
import { RestaurantService } from '../../../core/services/restaurant.service';
import { Restaurant } from '../../../core/models';
import { ToastService } from '../../../shared/services/toast.service';
import { StarRatingComponent } from '../../../shared/components/star-rating/star-rating.component';
import { resizeImageToDataUrl } from '../../../shared/utils/image-resize.util';

@Component({
  selector: 'app-experience-form',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, RouterLink, StarRatingComponent],
  templateUrl: './experience-form.component.html',
  styleUrl: './experience-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperienceFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly experienceService = inject(ExperienceService);
  private readonly restaurantService = inject(RestaurantService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly categories = Object.entries(EXPERIENCE_CATEGORY_LABELS) as [ExperienceCategory, string][];
  protected readonly cuisineTypes = CUISINE_TYPES;

  protected readonly editingId = signal<string | null>(null);
  protected readonly isEditMode = computed(() => this.editingId() !== null);
  protected readonly submitting = signal(false);

  protected readonly restaurantSearchTerm = signal('');
  protected readonly restaurantResults = signal<Restaurant[]>([]);
  protected readonly selectedRestaurant = signal<Restaurant | null>(null);
  protected readonly showManualRestaurantForm = signal(false);
  protected readonly photoPreview = signal<string | null>(null);
  protected readonly tagsInput = signal('');
  protected readonly showAdvancedCriteria = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    dishName: ['', [Validators.required, Validators.minLength(2)]],
    category: ['main-course' as ExperienceCategory, Validators.required],
    cuisineType: ['Brasileira', Validators.required],
    city: ['', Validators.required],
    country: [''],
    date: [todayLocalIso(), Validators.required],
    rating: [0, [Validators.required, Validators.min(1)]],
    notes: [''],
    isFavorite: [false],
    visibility: ['public' as ExperienceVisibility],
    flavor: [0],
    presentation: [0],
    texture: [0],
    creativity: [0],
    experienceCriteria: [0],
    manualRestaurantName: [''],
    manualRestaurantAddress: [''],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editingId.set(id);
      this.experienceService.getById(id).subscribe((exp) => {
        if (!exp) {
          this.toast.error('Experiência não encontrada.');
          this.router.navigate(['/app/experiencias']);
          return;
        }
        this.prefill(exp);
      });
    }
  }

  private prefill(exp: Experience): void {
    this.form.patchValue({
      dishName: exp.dishName,
      category: exp.category,
      cuisineType: exp.cuisineType,
      city: exp.city,
      country: exp.country,
      date: exp.date.slice(0, 10),
      rating: exp.rating,
      notes: exp.notes,
      isFavorite: exp.isFavorite,
      visibility: exp.visibility,
      flavor: exp.optionalCriteria?.flavor ?? 0,
      presentation: exp.optionalCriteria?.presentation ?? 0,
      texture: exp.optionalCriteria?.texture ?? 0,
      creativity: exp.optionalCriteria?.creativity ?? 0,
      experienceCriteria: exp.optionalCriteria?.experience ?? 0,
    });
    this.selectedRestaurant.set({
      id: exp.restaurantId,
      name: exp.restaurantName,
      city: exp.city,
      country: exp.country,
      cuisineTypes: [exp.cuisineType],
      source: exp.restaurantId.startsWith('manual-') ? 'manual' : 'curated',
    });
    this.tagsInput.set(exp.tags.join(', '));
    this.photoPreview.set(exp.photos[0]?.url ?? null);
  }

  protected searchRestaurants(): void {
    const term = this.restaurantSearchTerm();
    if (!term.trim()) {
      this.restaurantResults.set([]);
      return;
    }
    this.restaurantService.search({ term }).subscribe((results) => this.restaurantResults.set(results));
  }

  protected selectRestaurant(restaurant: Restaurant): void {
    this.selectedRestaurant.set(restaurant);
    this.restaurantResults.set([]);
    this.restaurantSearchTerm.set('');
    this.form.patchValue({ city: restaurant.city, country: restaurant.country });
    this.showManualRestaurantForm.set(false);
  }

  protected clearRestaurant(): void {
    this.selectedRestaurant.set(null);
  }

  protected confirmManualRestaurant(): void {
    const name = this.form.controls.manualRestaurantName.value.trim();
    const city = this.form.controls.city.value.trim();
    if (!name || !city) {
      this.toast.error('Informe ao menos o nome do restaurante e a cidade.');
      return;
    }
    this.restaurantService
      .createManual({
        name,
        city,
        country: this.form.controls.country.value,
        address: this.form.controls.manualRestaurantAddress.value,
      })
      .subscribe((created) => {
        this.selectRestaurant(created);
        this.toast.success('Restaurante cadastrado.');
      });
  }

  protected onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    resizeImageToDataUrl(file, 1280)
      .then((dataUrl) => this.photoPreview.set(dataUrl))
      .catch((err: Error) => this.toast.error(err.message));
  }

  protected removePhoto(): void {
    this.photoPreview.set(null);
  }

  protected submit(): void {
    if (this.form.invalid || !this.selectedRestaurant()) {
      this.form.markAllAsTouched();
      if (!this.selectedRestaurant()) {
        this.toast.error('Selecione ou cadastre um restaurante.');
      }
      return;
    }

    this.submitting.set(true);
    const raw = this.form.getRawValue();
    const restaurant = this.selectedRestaurant()!;
    const tags = this.tagsInput()
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const photos: ExperiencePhoto[] = this.photoPreview()
      ? [{ id: 'p-' + Date.now(), url: this.photoPreview()!, isPrimary: true }]
      : [];

    const payload = {
      dishName: raw.dishName,
      category: raw.category,
      cuisineType: raw.cuisineType,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      city: raw.city,
      country: raw.country,
      date: raw.date,
      rating: raw.rating,
      photos,
      notes: raw.notes,
      tags,
      isFavorite: raw.isFavorite,
      visibility: raw.visibility,
      optionalCriteria: this.showAdvancedCriteria()
        ? {
            flavor: raw.flavor || undefined,
            presentation: raw.presentation || undefined,
            texture: raw.texture || undefined,
            creativity: raw.creativity || undefined,
            experience: raw.experienceCriteria || undefined,
          }
        : undefined,
    };

    const id = this.editingId();
    const request = id ? this.experienceService.update(id, payload) : this.experienceService.create(payload);

    request.subscribe({
      next: (result) => {
        this.submitting.set(false);
        this.toast.success(id ? 'Experiência atualizada.' : 'Experiência registrada com sucesso!');
        this.router.navigate(['/app/experiencias', result.id]);
      },
      error: (err: Error) => {
        this.submitting.set(false);
        this.toast.error(err.message || 'Não foi possível salvar a experiência.');
      },
    });
  }
}

/** Data de hoje no fuso do usuário, no formato do input type="date" (YYYY-MM-DD). */
function todayLocalIso(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
