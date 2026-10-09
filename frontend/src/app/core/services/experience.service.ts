import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Experience,
  ExperienceCategory,
  ExperienceDraft,
  ExperienceOptionalCriteria,
  ExperiencePhoto,
  ExperienceVisibility,
} from '../models';
import { toFriendlyError } from './api-error.util';

export interface ExperienceFilters {
  year?: number;
  month?: number;
  city?: string;
  country?: string;
  restaurantId?: string;
  category?: string;
  cuisineType?: string;
  minRating?: number;
  favoritesOnly?: boolean;
}

/** Experiência como o backend devolve (ExperienceResponse.java). */
interface ApiExperience {
  id: number;
  userId: number;
  author?: { id: number; displayName: string; username: string; avatarUrl: string | null };
  dishName: string;
  category: ExperienceCategory;
  cuisineType: string;
  restaurantId: string | null;
  restaurantName: string;
  city: string;
  country: string | null;
  date: string;
  rating: number;
  photos: ExperiencePhoto[];
  notes: string | null;
  tags: string[];
  isFavorite: boolean;
  visibility: ExperienceVisibility;
  optionalCriteria: Record<keyof ExperienceOptionalCriteria, number | null> | null;
  createdAt: string;
  updatedAt: string;
}

/** Corpo esperado pelo backend (ExperienceRequest.java): campos planos. */
interface ApiExperienceRequest {
  dishName: string;
  category: string;
  cuisineType: string;
  restaurantId: string | null;
  restaurantName: string;
  city: string;
  country: string | null;
  date: string;
  rating: number;
  photoUrl: string | null;
  notes: string | null;
  tags: string[];
  favorite: boolean;
  visibility: ExperienceVisibility;
  flavor: number | null;
  presentation: number | null;
  texture: number | null;
  creativity: number | null;
  experienceCriteria: number | null;
}

@Injectable({ providedIn: 'root' })
export class ExperienceService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/experiences`;

  list(filters: ExperienceFilters = {}): Observable<Experience[]> {
    return this.http.get<ApiExperience[]>(this.baseUrl).pipe(
      map((list) => this.applyFilters(list.map(toExperience), filters)),
      catchError(toFriendlyError),
    );
  }

  /** Experiências de outra pessoa que o usuário logado tem permissão de ver. */
  listForUser(username: string): Observable<Experience[]> {
    return this.http.get<ApiExperience[]>(`${environment.apiUrl}/users/${encodeURIComponent(username)}/experiences`).pipe(
      map((list) => list.map(toExperience)),
      catchError(toFriendlyError),
    );
  }

  /** Devolve undefined quando a experiência não existe ou o usuário não tem permissão de vê-la. */
  getById(id: string): Observable<Experience | undefined> {
    return this.http.get<ApiExperience>(`${this.baseUrl}/${encodeURIComponent(id)}`).pipe(
      map(toExperience),
      catchError((error: unknown) =>
        error instanceof HttpErrorResponse && (error.status === 404 || error.status === 400)
          ? of(undefined)
          : toFriendlyError(error),
      ),
    );
  }

  create(draft: ExperienceDraft): Observable<Experience> {
    return this.http.post<ApiExperience>(this.baseUrl, toRequest(draft)).pipe(
      map(toExperience),
      catchError(toFriendlyError),
    );
  }

  update(id: string, draft: ExperienceDraft): Observable<Experience> {
    return this.http.put<ApiExperience>(`${this.baseUrl}/${encodeURIComponent(id)}`, toRequest(draft)).pipe(
      map(toExperience),
      catchError(toFriendlyError),
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${encodeURIComponent(id)}`).pipe(catchError(toFriendlyError));
  }

  toggleFavorite(id: string): Observable<Experience | undefined> {
    return this.http.patch<ApiExperience>(`${this.baseUrl}/${encodeURIComponent(id)}/favorite`, null).pipe(
      map(toExperience),
      catchError(toFriendlyError),
    );
  }

  years(): Observable<number[]> {
    return this.list().pipe(
      map((list) => {
        const years = new Set(list.map((e) => new Date(e.date).getFullYear()));
        return Array.from(years).sort((a, b) => b - a);
      }),
    );
  }

  private applyFilters(list: Experience[], filters: ExperienceFilters): Experience[] {
    return list.filter((e) => {
      const date = new Date(e.date);
      if (filters.year && date.getFullYear() !== filters.year) return false;
      if (filters.month !== undefined && date.getMonth() !== filters.month) return false;
      if (filters.city && e.city !== filters.city) return false;
      if (filters.country && e.country !== filters.country) return false;
      if (filters.restaurantId && e.restaurantId !== filters.restaurantId) return false;
      if (filters.category && e.category !== filters.category) return false;
      if (filters.cuisineType && e.cuisineType !== filters.cuisineType) return false;
      if (filters.minRating && e.rating < filters.minRating) return false;
      if (filters.favoritesOnly && !e.isFavorite) return false;
      return true;
    });
  }
}

function toExperience(api: ApiExperience): Experience {
  let optionalCriteria: ExperienceOptionalCriteria | undefined;
  if (api.optionalCriteria) {
    const entries = Object.entries(api.optionalCriteria).filter(([, value]) => value != null);
    optionalCriteria = entries.length ? (Object.fromEntries(entries) as ExperienceOptionalCriteria) : undefined;
  }

  return {
    ...api,
    id: String(api.id),
    userId: String(api.userId),
    author: api.author ? { ...api.author, id: String(api.author.id) } : undefined,
    // "YYYY-MM-DD" seria lido pelo JavaScript como meia-noite UTC (dia anterior no Brasil).
    // Meio-dia no horário local mantém o dia certo em qualquer fuso.
    date: `${api.date.slice(0, 10)}T12:00:00`,
    restaurantId: api.restaurantId ?? '',
    country: api.country ?? '',
    notes: api.notes ?? '',
    tags: api.tags ?? [],
    photos: api.photos ?? [],
    optionalCriteria,
  };
}

function toRequest(draft: ExperienceDraft): ApiExperienceRequest {
  const primaryPhoto = draft.photos.find((p) => p.isPrimary) ?? draft.photos[0];
  const criteria = draft.optionalCriteria ?? {};

  return {
    dishName: draft.dishName,
    category: draft.category,
    cuisineType: draft.cuisineType,
    restaurantId: draft.restaurantId || null,
    restaurantName: draft.restaurantName,
    city: draft.city,
    country: draft.country || null,
    date: draft.date.slice(0, 10),
    rating: draft.rating,
    photoUrl: primaryPhoto?.url ?? null,
    notes: draft.notes || null,
    tags: draft.tags,
    favorite: draft.isFavorite,
    visibility: draft.visibility,
    flavor: criteria.flavor ?? null,
    presentation: criteria.presentation ?? null,
    texture: criteria.texture ?? null,
    creativity: criteria.creativity ?? null,
    experienceCriteria: criteria.experience ?? null,
  };
}
