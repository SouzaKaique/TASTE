import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Restaurant } from '../models';
import { CURATED_RESTAURANTS } from '../data/restaurants.data';
import { toFriendlyError } from './api-error.util';

export interface RestaurantSearchQuery {
  term?: string;
  /** Cidade da seleção curada: filtra os destaques e prioriza a região na busca online. */
  city?: string;
}

export interface ManualRestaurantPayload {
  name: string;
  city: string;
  country?: string;
  address?: string;
}

/** Restaurante como o backend devolve (OpenStreetMap). */
interface ApiPlace {
  id: string;
  name: string;
  address: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
  country: string;
  cuisineTypes: string[];
  website: string | null;
  phone: string | null;
  openingHours: string | null;
  lat: number | null;
  lon: number | null;
}

const MANUAL_KEY = 'taste.manualRestaurants';
const MIN_ONLINE_TERM = 3;

/** Coordenadas aproximadas para priorizar resultados perto da cidade escolhida. */
const CITY_COORDS: Record<string, [number, number]> = {
  Assis: [-22.66, -50.41],
  Londrina: [-23.31, -51.16],
  Curitiba: [-25.43, -49.27],
  'São Paulo': [-23.55, -46.63],
};

function toRestaurant(p: ApiPlace): Restaurant {
  return {
    id: p.id,
    name: p.name,
    city: p.city ?? '',
    state: p.state ?? undefined,
    district: p.district ?? undefined,
    country: p.country,
    address: p.address ?? undefined,
    cuisineTypes: p.cuisineTypes ?? [],
    website: p.website ?? undefined,
    phone: p.phone ?? undefined,
    openingHours: p.openingHours ?? undefined,
    lat: p.lat ?? undefined,
    lon: p.lon ?? undefined,
    source: 'osm',
  };
}

/** Chave para não mostrar o mesmo lugar duas vezes (ex.: curado e OpenStreetMap). */
function dedupeKey(r: Restaurant): string {
  const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  return `${normalize(r.name)}|${normalize(r.city)}`;
}

@Injectable({ providedIn: 'root' })
export class RestaurantService {
  private readonly http = inject(HttpClient);
  private readonly manual = signal<Restaurant[]>(this.restoreManual());

  /** Seleção curada + cadastros manuais deste navegador. */
  listAll(): Observable<Restaurant[]> {
    return of([...CURATED_RESTAURANTS, ...this.manual()]);
  }

  /**
   * Junta os resultados locais (curados e manuais) com a busca online no
   * OpenStreetMap. Se a busca online falhar, devolve só os locais.
   */
  search(query: RestaurantSearchQuery): Observable<Restaurant[]> {
    const term = query.term?.trim() ?? '';
    const local = this.searchLocal(term, query.city);
    if (term.length < MIN_ONLINE_TERM) {
      return of(local);
    }

    const coords = query.city ? CITY_COORDS[query.city] : undefined;
    const params: Record<string, string> = { q: term };
    if (coords) {
      params['lat'] = String(coords[0]);
      params['lon'] = String(coords[1]);
    }

    return this.http.get<ApiPlace[]>(`${environment.apiUrl}/places/search`, { params }).pipe(
      map((places) => {
        const seen = new Set(local.map(dedupeKey));
        const online = places.map(toRestaurant).filter((r) => !seen.has(dedupeKey(r)));
        return [...local, ...online];
      }),
      catchError(() => of(local)),
    );
  }

  getById(id: string): Observable<Restaurant | undefined> {
    if (id.startsWith('osm-')) {
      return this.http.get<ApiPlace>(`${environment.apiUrl}/places/${encodeURIComponent(id)}`).pipe(
        map(toRestaurant),
        catchError(toFriendlyError),
      );
    }
    return of([...CURATED_RESTAURANTS, ...this.manual()].find((r) => r.id === id));
  }

  /** Para cada restaurante, a URL da foto pública mais recente registrada nele (quando existe). */
  covers(ids: string[]): Observable<Record<string, string>> {
    if (!ids.length) return of({});
    return this.http
      .get<Record<string, number>>(`${environment.apiUrl}/restaurants/covers`, { params: { ids: ids.join(',') } })
      .pipe(
        map((covers) =>
          Object.fromEntries(
            Object.entries(covers).map(([restaurantId, experienceId]) => [
              restaurantId,
              `${environment.apiUrl}/public/experiences/${experienceId}/photo`,
            ]),
          ),
        ),
        catchError(() => of({})),
      );
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
    };
    this.manual.update((list) => [created, ...list]);
    this.persistManual();
    return of(created);
  }

  private searchLocal(term: string, city?: string): Restaurant[] {
    const needle = term.toLowerCase();
    return [...CURATED_RESTAURANTS, ...this.manual()].filter((r) => {
      const matchesTerm =
        !needle ||
        r.name.toLowerCase().includes(needle) ||
        r.city.toLowerCase().includes(needle) ||
        r.cuisineTypes.some((c) => c.toLowerCase().includes(needle));
      return matchesTerm && (!city || r.city === city);
    });
  }

  private restoreManual(): Restaurant[] {
    try {
      const raw = localStorage.getItem(MANUAL_KEY);
      return raw ? (JSON.parse(raw) as Restaurant[]) : [];
    } catch {
      return [];
    }
  }

  private persistManual(): void {
    try {
      localStorage.setItem(MANUAL_KEY, JSON.stringify(this.manual().slice(0, 50)));
    } catch {
      // armazenamento indisponível: o cadastro vale só nesta sessão
    }
  }
}
