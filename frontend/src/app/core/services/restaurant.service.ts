import { Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { Restaurant } from '../models';
import { MOCK_RESTAURANTS } from '../mock-data/restaurants.mock';
import { mockResponse } from './mock-http.util';

export interface RestaurantSearchQuery {
  term?: string;
  city?: string;
  country?: string;
}

export interface ManualRestaurantPayload {
  name: string;
  city: string;
  country?: string;
  address?: string;
}

@Injectable({ providedIn: 'root' })
export class RestaurantService {
  private readonly restaurants = signal<Restaurant[]>([...MOCK_RESTAURANTS]);

  search(query: RestaurantSearchQuery): Observable<Restaurant[]> {
    const term = query.term?.trim().toLowerCase();
    const results = this.restaurants().filter((r) => {
      const matchesTerm = !term ||
        r.name.toLowerCase().includes(term) ||
        r.city.toLowerCase().includes(term) ||
        r.country.toLowerCase().includes(term);
      const matchesCity = !query.city || r.city === query.city;
      const matchesCountry = !query.country || r.country === query.country;
      return matchesTerm && matchesCity && matchesCountry;
    });
    return mockResponse(results, 300);
  }

  getById(id: string): Observable<Restaurant | undefined> {
    return mockResponse(this.restaurants().find((r) => r.id === id));
  }

  listAll(): Observable<Restaurant[]> {
    return mockResponse(this.restaurants());
  }

  cities(): Observable<string[]> {
    return mockResponse(Array.from(new Set(this.restaurants().map((r) => r.city))).sort());
  }

  createManual(payload: ManualRestaurantPayload): Observable<Restaurant> {
    const created: Restaurant = {
      id: `manual-${Date.now()}`,
      name: payload.name,
      city: payload.city,
      country: payload.country ?? '',
      address: payload.address,
      cuisineTypes: [],
      source: 'manual',
      createdByUserId: 'u1',
    };
    this.restaurants.update((list) => [created, ...list]);
    return mockResponse(created);
  }
}
