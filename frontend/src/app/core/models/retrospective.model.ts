import { Experience } from './experience.model';

export type HighlightCategory =
  | 'best-dessert'
  | 'best-main-course'
  | 'best-discovery'
  | 'best-value'
  | 'most-memorable'
  | 'want-to-repeat';

export const HIGHLIGHT_CATEGORY_LABELS: Record<HighlightCategory, string> = {
  'best-dessert': 'Melhor sobremesa',
  'best-main-course': 'Melhor prato principal',
  'best-discovery': 'Melhor descoberta',
  'best-value': 'Melhor custo-benefício',
  'most-memorable': 'Experiência mais memorável',
  'want-to-repeat': 'Prato que desejo repetir',
};

export interface ManualHighlight {
  category: HighlightCategory;
  experienceId: string;
}

export interface RetrospectiveStats {
  year: number;
  totalExperiences: number;
  totalRestaurants: number;
  totalCities: number;
  totalCountries: number;
  averageRating: number;
  topCategory: string | null;
  topCuisine: string | null;
  busiestMonth: string | null;
  totalFavorites: number;
  experiencesByMonth: { month: string; count: number }[];
}

export interface RetrospectiveData {
  stats: RetrospectiveStats;
  topThree: Experience[];
  manualHighlights: { category: HighlightCategory; experience: Experience | null }[];
}
