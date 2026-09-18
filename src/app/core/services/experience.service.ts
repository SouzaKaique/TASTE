import { Injectable, computed, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Experience, ExperienceDraft } from '../models';
import { MOCK_EXPERIENCES } from '../mock-data/experiences.mock';
import { mockError, mockResponse } from './mock-http.util';

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

@Injectable({ providedIn: 'root' })
export class ExperienceService {
  private readonly experiences = signal<Experience[]>([...MOCK_EXPERIENCES]);
  readonly all = computed(() => this.experiences());

  list(filters: ExperienceFilters = {}): Observable<Experience[]> {
    return mockResponse(this.applyFilters(this.experiences(), filters), 350);
  }

  getById(id: string): Observable<Experience | undefined> {
    return mockResponse(this.experiences().find((e) => e.id === id));
  }

  create(draft: ExperienceDraft): Observable<Experience> {
    const now = new Date().toISOString();
    const created: Experience = {
      ...draft,
      id: `e-${Date.now()}`,
      userId: 'u1',
      createdAt: now,
      updatedAt: now,
    };
    this.experiences.update((list) => [created, ...list]);
    return mockResponse(created);
  }

  update(id: string, changes: Partial<ExperienceDraft>): Observable<Experience> {
    const existing = this.experiences().find((e) => e.id === id);
    if (!existing) {
      return mockError('Experiência não encontrada.');
    }
    const updated: Experience = { ...existing, ...changes, updatedAt: new Date().toISOString() };
    this.experiences.update((list) => list.map((e) => (e.id === id ? updated : e)));
    return mockResponse(updated);
  }

  delete(id: string): Observable<void> {
    this.experiences.update((list) => list.filter((e) => e.id !== id));
    return mockResponse(undefined);
  }

  toggleFavorite(id: string): Observable<Experience | undefined> {
    let toggled: Experience | undefined;
    this.experiences.update((list) =>
      list.map((e) => {
        if (e.id === id) {
          toggled = { ...e, isFavorite: !e.isFavorite };
          return toggled;
        }
        return e;
      }),
    );
    return mockResponse(toggled, 150);
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
