import { Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  EXPERIENCE_CATEGORY_LABELS,
  Experience,
  ExperienceCategory,
  HighlightCategory,
  ManualHighlight,
  RetrospectiveData,
  RetrospectiveStats,
} from '../models';
import { ExperienceService } from './experience.service';
import { mockResponse } from './mock-http.util';

const MONTH_LABELS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

@Injectable({ providedIn: 'root' })
export class RetrospectiveService {
  private readonly manualHighlights = signal<ManualHighlight[]>([]);

  constructor(private readonly experienceService: ExperienceService) {}

  getRetrospective(year: number): Observable<RetrospectiveData> {
    return this.experienceService.list({ year }).pipe(
      map((experiences) => ({
        stats: this.buildStats(year, experiences),
        topThree: this.rankTopThree(experiences),
        manualHighlights: this.resolveManualHighlights(experiences, year),
      })),
    );
  }

  setManualHighlight(category: HighlightCategory, experienceId: string): void {
    this.manualHighlights.update((list) => [
      ...list.filter((h) => h.category !== category),
      { category, experienceId },
    ]);
  }

  clearManualHighlight(category: HighlightCategory): void {
    this.manualHighlights.update((list) => list.filter((h) => h.category !== category));
  }

  availableYears(): Observable<number[]> {
    return this.experienceService.years();
  }

  private buildStats(year: number, experiences: Experience[]): RetrospectiveStats {
    const restaurants = new Set(experiences.map((e) => e.restaurantId));
    const cities = new Set(experiences.map((e) => e.city));
    const countries = new Set(experiences.map((e) => e.country));
    const favorites = experiences.filter((e) => e.isFavorite).length;

    const categoryCounts = this.countBy(experiences, (e) => e.category);
    const cuisineCounts = this.countBy(experiences, (e) => e.cuisineType);
    const monthCounts = new Array(12).fill(0);
    experiences.forEach((e) => monthCounts[new Date(e.date).getMonth()]++);

    const busiestMonthIndex = monthCounts.reduce(
      (best, count, index) => (count > monthCounts[best] ? index : best),
      0,
    );

    return {
      year,
      totalExperiences: experiences.length,
      totalRestaurants: restaurants.size,
      totalCities: cities.size,
      totalCountries: countries.size,
      averageRating: experiences.length
        ? Math.round((experiences.reduce((sum, e) => sum + e.rating, 0) / experiences.length) * 10) / 10
        : 0,
      topCategory: this.topCategoryLabel(categoryCounts),
      topCuisine: this.topKey(cuisineCounts),
      busiestMonth: experiences.length ? MONTH_LABELS[busiestMonthIndex] : null,
      totalFavorites: favorites,
      experiencesByMonth: MONTH_LABELS.map((month, index) => ({ month, count: monthCounts[index] })),
    };
  }

  /**
   * Ranking determinístico: nota geral desc, depois quantidade de
   * critérios opcionais preenchidos (proxy de "riqueza" do registro),
   * e por fim a data mais recente — evita empates arbitrários.
   */
  private rankTopThree(experiences: Experience[]): Experience[] {
    return [...experiences]
      .sort((a, b) => {
        if (b.rating !== a.rating) return b.rating - a.rating;
        const aCriteria = Object.keys(a.optionalCriteria ?? {}).length;
        const bCriteria = Object.keys(b.optionalCriteria ?? {}).length;
        if (bCriteria !== aCriteria) return bCriteria - aCriteria;
        return +new Date(b.date) - +new Date(a.date);
      })
      .slice(0, 3);
  }

  private resolveManualHighlights(experiences: Experience[], year: number) {
    const categories: HighlightCategory[] = [
      'best-dessert',
      'best-main-course',
      'best-discovery',
      'best-value',
      'most-memorable',
      'want-to-repeat',
    ];
    return categories.map((category) => {
      const highlight = this.manualHighlights().find((h) => h.category === category);
      const experience = highlight
        ? experiences.find((e) => e.id === highlight.experienceId && new Date(e.date).getFullYear() === year) ?? null
        : null;
      return { category, experience };
    });
  }

  private countBy<T>(items: T[], keyFn: (item: T) => string): Map<string, number> {
    const map = new Map<string, number>();
    items.forEach((item) => {
      const key = keyFn(item);
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return map;
  }

  private topCategoryLabel(counts: Map<string, number>): string | null {
    const key = this.topKey(counts);
    return key ? EXPERIENCE_CATEGORY_LABELS[key as ExperienceCategory] : null;
  }

  private topKey(counts: Map<string, number>): string | null {
    let topKey: string | null = null;
    let topCount = 0;
    counts.forEach((count, key) => {
      if (count > topCount) {
        topCount = count;
        topKey = key;
      }
    });
    return topKey;
  }
}
