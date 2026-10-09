/**
 * curated = seleção real do TASTE; osm = encontrado no OpenStreetMap;
 * manual = cadastrado por quem registrou uma experiência.
 */
export type RestaurantSource = 'curated' | 'osm' | 'manual';

export interface Restaurant {
  id: string;
  name: string;
  city: string;
  country: string;
  state?: string;
  district?: string;
  address?: string;
  cuisineTypes: string[];
  description?: string;
  /** Por que o lugar está em destaque (guia, prêmio ou avaliações públicas). */
  highlight?: string;
  website?: string;
  phone?: string;
  openingHours?: string;
  lat?: number;
  lon?: number;
  source: RestaurantSource;
}

export interface RestaurantSearchResult extends Restaurant {
  matchedExperiencesCount?: number;
}
