/** curated = seleção real do TASTE; manual = cadastrado por quem registrou uma experiência. */
export type RestaurantSource = 'curated' | 'manual';

export interface Restaurant {
  id: string;
  name: string;
  city: string;
  country: string;
  address?: string;
  cuisineTypes: string[];
  description?: string;
  /** Por que o lugar está em destaque (guia, prêmio ou avaliações públicas). */
  highlight?: string;
  source: RestaurantSource;
  createdByUserId?: string;
}

export interface RestaurantSearchResult extends Restaurant {
  matchedExperiencesCount?: number;
}
