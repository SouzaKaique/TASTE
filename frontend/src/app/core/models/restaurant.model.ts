export type RestaurantSource = 'demo-database' | 'manual';

export interface Restaurant {
  id: string;
  name: string;
  city: string;
  country: string;
  address?: string;
  cuisineTypes: string[];
  imageUrl?: string;
  description?: string;
  source: RestaurantSource;
  createdByUserId?: string;
}

export interface RestaurantSearchResult extends Restaurant {
  matchedExperiencesCount?: number;
}
