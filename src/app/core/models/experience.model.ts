export type ExperienceCategory =
  | 'main-course'
  | 'starter'
  | 'dessert'
  | 'drink'
  | 'coffee'
  | 'snack'
  | 'street-food'
  | 'experience'
  | 'other';

export type ExperienceVisibility = 'public' | 'friends' | 'private';

export interface ExperienceOptionalCriteria {
  flavor?: number;
  presentation?: number;
  texture?: number;
  creativity?: number;
  experience?: number;
}

export interface ExperiencePhoto {
  id: string;
  url: string;
  isPrimary: boolean;
}

export interface Experience {
  id: string;
  userId: string;
  dishName: string;
  category: ExperienceCategory;
  cuisineType: string;
  restaurantId: string;
  restaurantName: string;
  city: string;
  country: string;
  date: string;
  rating: number;
  photos: ExperiencePhoto[];
  notes: string;
  tags: string[];
  isFavorite: boolean;
  visibility: ExperienceVisibility;
  optionalCriteria?: ExperienceOptionalCriteria;
  createdAt: string;
  updatedAt: string;
}

export interface ExperienceDraft
  extends Omit<Experience, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'photos'> {
  photos: ExperiencePhoto[];
}

export const EXPERIENCE_CATEGORY_LABELS: Record<ExperienceCategory, string> = {
  'main-course': 'Prato principal',
  starter: 'Entrada',
  dessert: 'Sobremesa',
  drink: 'Bebida',
  coffee: 'Café',
  snack: 'Lanche',
  'street-food': 'Comida de rua',
  experience: 'Experiência gastronômica',
  other: 'Outros',
};

export const CUISINE_TYPES = [
  'Brasileira',
  'Italiana',
  'Japonesa',
  'Mexicana',
  'Francesa',
  'Árabe',
  'Indiana',
  'Coreana',
  'Mediterrânea',
  'Americana',
  'Outras',
] as const;

export type CuisineType = (typeof CUISINE_TYPES)[number];
