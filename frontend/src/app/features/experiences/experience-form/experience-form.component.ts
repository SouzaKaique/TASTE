import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, OnInit, signal } from '@angular/core';
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

type NearbyState = 'idle' | 'locating' | 'loaded' | 'denied' | 'error';

/**
 * Registro rápido: foto, restaurante (perto de você, recentes ou busca), prato e nota.
 * Categoria, culinária, data e o resto ficam em "Mais detalhes", já preenchidos.
 */
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
  protected readonly showDetails = signal(false);

  protected readonly restaurantSearchTerm = signal('');
  protected readonly restaurantResults = signal<Restaurant[]>([]);
  protected readonly searchingRestaurants = signal(false);
  private restaurantSearchTimer: ReturnType<typeof setTimeout> | undefined;
  private restaurantSearchSeq = 0;
  protected readonly selectedRestaurant = signal<Restaurant | null>(null);
  protected readonly showManualRestaurantForm = signal(false);

  protected readonly nearbyState = signal<NearbyState>('idle');
  protected readonly nearbyRestaurants = signal<Restaurant[]>([]);
  /** Lugares onde a pessoa já registrou pratos, do mais recente ao mais antigo. */
  protected readonly recentRestaurants = signal<Restaurant[]>([]);

  protected readonly citySuggestions = signal<{ name: string; state: string }[]>([]);
  private citySearchTimer: ReturnType<typeof setTimeout> | undefined;

  protected readonly photoPreview = signal<string | null>(null);
  protected readonly processingPhoto = signal(false);
  // Relato e tags saíram do formulário (registro rápido); na edição, os valores antigos são mantidos
  private keptTags: string[] = [];
  protected readonly showAdvancedCriteria = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    dishName: ['', [Validators.required, Validators.minLength(2)]],
    category: ['main-course' as ExperienceCategory, Validators.required],
    cuisineType: ['Brasileira', Validators.required],
    city: ['', Validators.required],
    country: ['Brasil'],
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

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.restaurantSearchTimer);
      clearTimeout(this.citySearchTimer);
    });
  }

  ngOnInit(): void {
    // Vindo da página do restaurante: já começa com ele selecionado
    const restaurantId = this.route.snapshot.queryParamMap.get('restaurante');
    if (restaurantId) {
      this.restaurantService.getById(restaurantId).subscribe({
        next: (restaurant) => restaurant && this.selectRestaurant(restaurant),
        error: () => undefined,
      });
    }

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
      return;
    }

    this.loadRecentRestaurants();
    this.locateIfAlreadyAllowed();
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
    this.keptTags = exp.tags;
    this.photoPreview.set(exp.photos[0]?.url ?? null);
    this.showAdvancedCriteria.set(!!exp.optionalCriteria);
  }

  // ---------- Restaurante ----------

  private loadRecentRestaurants(): void {
    this.experienceService.list().subscribe({
      next: (list) => {
        const seen = new Set<string>();
        const recent: Restaurant[] = [];
        for (const exp of [...list].sort((a, b) => b.date.localeCompare(a.date))) {
          // O mesmo lugar pode ter sido salvo com ids diferentes: agrupa por nome + cidade
          const key = `${exp.restaurantName}|${exp.city}`.toLowerCase();
          if (seen.has(key)) continue;
          seen.add(key);
          recent.push({
            id: exp.restaurantId,
            name: exp.restaurantName,
            city: exp.city,
            country: exp.country,
            cuisineTypes: [exp.cuisineType],
            source: exp.restaurantId?.startsWith('manual-') ? 'manual' : 'osm',
          });
          if (recent.length === 6) break;
        }
        this.recentRestaurants.set(recent);
      },
      error: () => undefined,
    });
  }

  /** Se a pessoa já autorizou a localização antes, mostra os lugares perto sem perguntar de novo. */
  private locateIfAlreadyAllowed(): void {
    navigator.permissions
      ?.query({ name: 'geolocation' })
      .then((status) => status.state === 'granted' && this.findNearby())
      .catch(() => undefined);
  }

  protected findNearby(): void {
    if (!('geolocation' in navigator)) {
      this.nearbyState.set('error');
      return;
    }
    this.nearbyState.set('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.restaurantService.nearby(pos.coords.latitude, pos.coords.longitude).subscribe({
          next: (list) => {
            this.nearbyRestaurants.set(list);
            this.nearbyState.set('loaded');
          },
          error: () => this.nearbyState.set('error'),
        });
      },
      (err) => this.nearbyState.set(err.code === err.PERMISSION_DENIED ? 'denied' : 'error'),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 },
    );
  }

  /** Busca local na hora e no Brasil todo (OpenStreetMap) depois de uma pausa na digitação. */
  protected searchRestaurants(): void {
    const term = this.restaurantSearchTerm();
    clearTimeout(this.restaurantSearchTimer);
    if (!term.trim()) {
      this.restaurantResults.set([]);
      this.searchingRestaurants.set(false);
      return;
    }
    this.searchingRestaurants.set(true);
    this.restaurantSearchTimer = setTimeout(() => {
      const seq = ++this.restaurantSearchSeq;
      this.restaurantService.search({ term }).subscribe((results) => {
        if (seq !== this.restaurantSearchSeq) return;
        this.restaurantResults.set(results.slice(0, 12));
        this.searchingRestaurants.set(false);
      });
    }, 400);
  }

  protected selectRestaurant(restaurant: Restaurant): void {
    this.selectedRestaurant.set(restaurant);
    this.restaurantResults.set([]);
    this.restaurantSearchTerm.set('');
    this.form.patchValue({ city: restaurant.city, country: restaurant.country || 'Brasil' });
    // Culinária vem do restaurante quando ela existe na nossa lista
    const cuisine = restaurant.cuisineTypes.find((c) => (CUISINE_TYPES as readonly string[]).includes(c));
    if (cuisine && !this.isEditMode()) {
      this.form.patchValue({ cuisineType: cuisine });
    }
    this.showManualRestaurantForm.set(false);
  }

  protected clearRestaurant(): void {
    this.selectedRestaurant.set(null);
  }

  protected onCityInput(value: string): void {
    this.form.controls.city.setValue(value);
    clearTimeout(this.citySearchTimer);
    this.citySearchTimer = setTimeout(() => {
      this.restaurantService.cities(value).subscribe((list) => this.citySuggestions.set(list));
    }, 250);
  }

  protected pickCity(city: { name: string; state: string }): void {
    this.form.controls.city.setValue(city.name);
    this.citySuggestions.set([]);
  }

  protected confirmManualRestaurant(): void {
    const name = this.form.controls.manualRestaurantName.value.trim();
    const city = this.form.controls.city.value.trim();
    if (!name || !city) {
      this.toast.error('Informe o nome do restaurante e a cidade.');
      return;
    }
    this.restaurantService
      .createManual({
        name,
        city,
        country: this.form.controls.country.value || 'Brasil',
        address: this.form.controls.manualRestaurantAddress.value,
      })
      .subscribe((created) => {
        this.selectRestaurant(created);
        this.citySuggestions.set([]);
      });
  }

  // ---------- Foto ----------

  protected onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    // 1080 px no lado maior: nítida no celular e leve no banco (~150 KB)
    this.processingPhoto.set(true);
    resizeImageToDataUrl(file, 1080, 0.78)
      .then((dataUrl) => this.photoPreview.set(dataUrl))
      .catch((err: Error) => this.toast.error(err.message))
      .finally(() => this.processingPhoto.set(false));
  }

  protected removePhoto(): void {
    this.photoPreview.set(null);
  }

  // ---------- Envio ----------

  protected submit(): void {
    if (!this.selectedRestaurant()) {
      this.toast.error('Escolha onde você comeu.');
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      if (this.form.controls.dishName.invalid) {
        this.toast.error('Diga o nome do prato.');
      } else if (this.form.controls.rating.invalid) {
        this.toast.error('Dê uma nota de 1 a 5 estrelas.');
      } else {
        this.showDetails.set(true);
      }
      return;
    }

    this.submitting.set(true);
    const raw = this.form.getRawValue();
    const restaurant = this.selectedRestaurant()!;

    const photos: ExperiencePhoto[] = this.photoPreview()
      ? [{ id: 'p-' + Date.now(), url: this.photoPreview()!, isPrimary: true }]
      : [];

    const payload = {
      dishName: raw.dishName.trim(),
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
      tags: this.keptTags,
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
        if (id) {
          this.toast.success('Alterações salvas.');
          this.router.navigate(['/app/experiencias', result.id]);
        } else {
          this.toast.success('Prato publicado!');
          this.router.navigate(['/app/social']);
        }
      },
      error: (err: Error) => {
        this.submitting.set(false);
        this.toast.error(err.message || 'Não foi possível salvar.');
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
