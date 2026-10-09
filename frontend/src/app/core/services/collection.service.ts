import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { Collection, CollectionPrivacy } from '../models';
import { MOCK_COLLECTIONS } from '../mock-data/collections.mock';
import { mockResponse } from './mock-http.util';
import { AuthService } from './auth.service';

export interface CollectionDraft {
  name: string;
  description?: string;
  privacy: CollectionPrivacy;
  coverImageUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class CollectionService {
  private readonly auth = inject(AuthService);
  private readonly collections = signal<Collection[]>([...MOCK_COLLECTIONS]);

  list(): Observable<Collection[]> {
    return mockResponse(this.collections());
  }

  getById(id: string): Observable<Collection | undefined> {
    return mockResponse(this.collections().find((c) => c.id === id));
  }

  create(draft: CollectionDraft): Observable<Collection> {
    const created: Collection = {
      id: `c-${Date.now()}`,
      userId: this.auth.user()?.id ?? '',
      experienceIds: [],
      createdAt: new Date().toISOString(),
      ...draft,
    };
    this.collections.update((list) => [created, ...list]);
    return mockResponse(created);
  }

  addExperience(collectionId: string, experienceId: string): void {
    this.collections.update((list) =>
      list.map((c) =>
        c.id === collectionId && !c.experienceIds.includes(experienceId)
          ? { ...c, experienceIds: [...c.experienceIds, experienceId] }
          : c,
      ),
    );
  }

  removeExperience(collectionId: string, experienceId: string): void {
    this.collections.update((list) =>
      list.map((c) =>
        c.id === collectionId
          ? { ...c, experienceIds: c.experienceIds.filter((id) => id !== experienceId) }
          : c,
      ),
    );
  }

  delete(id: string): Observable<void> {
    this.collections.update((list) => list.filter((c) => c.id !== id));
    return mockResponse(undefined);
  }
}
