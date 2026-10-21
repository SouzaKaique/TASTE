import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FeedComment, FeedItem, FriendshipStatus, UserSummary } from '../models';
import { toFriendlyError } from './api-error.util';
import { mediaUrl } from './media-url';

/** Formatos devolvidos pelo backend (ids numéricos). */
interface ApiUserSummary {
  id: number;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  friendshipStatus: FriendshipStatus;
}

interface ApiFeedComment extends Omit<FeedComment, 'id' | 'userId'> {
  id: number;
  userId: number;
}

interface ApiFeedItem {
  id: number;
  type: FeedItem['type'];
  user: ApiUserSummary;
  createdAt: string;
  experienceId: number;
  dishName: string;
  restaurantName: string;
  city: string;
  rating: number;
  photoUrl: string | null;
  text: string | null;
  likesCount: number;
  likedByMe: boolean;
  savedByMe: boolean;
  comments: ApiFeedComment[];
}

/** Lugar do ranking "em alta" do Descobrir. */
export interface PlaceRanking {
  restaurantId: string | null;
  name: string;
  city: string;
  count: number;
  averageRating: number;
}

export function toUserSummary(api: ApiUserSummary): UserSummary {
  return { ...api, id: String(api.id) };
}

function toFeedItem(api: ApiFeedItem): FeedItem {
  return {
    ...api,
    id: String(api.id),
    user: toUserSummary(api.user),
    experienceId: String(api.experienceId),
    photoUrl: mediaUrl(api.photoUrl),
    text: api.text ?? undefined,
    comments: api.comments.map((c) => ({ ...c, id: String(c.id), userId: String(c.userId) })),
  };
}

@Injectable({ providedIn: 'root' })
export class SocialService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  // ---- Feed ----

  /**
   * Feed em páginas. Sem "after" vem a primeira; com o último post recebido, vêm os seguintes.
   */
  getFeed(after?: FeedItem, limit = 10): Observable<FeedItem[]> {
    const params: Record<string, string> = { limit: String(limit) };
    if (after) {
      params['beforeAt'] = after.createdAt;
      params['beforeId'] = after.id;
    }
    return this.http.get<ApiFeedItem[]>(`${this.baseUrl}/feed`, { params }).pipe(
      map((items) => items.map(toFeedItem)),
      catchError(toFriendlyError),
    );
  }

  /** Grade do Descobrir: fotos de pratos dos amigos e públicas, em páginas. */
  explore(after?: FeedItem, limit = 18): Observable<FeedItem[]> {
    const params: Record<string, string> = { limit: String(limit) };
    if (after) {
      params['beforeAt'] = after.createdAt;
      params['beforeId'] = after.id;
    }
    return this.http.get<ApiFeedItem[]>(`${this.baseUrl}/explore`, { params }).pipe(
      map((items) => items.map(toFeedItem)),
      catchError(toFriendlyError),
    );
  }

  /** Lugares em alta na comunidade (opcionalmente de uma cidade). */
  topPlaces(city?: string | null): Observable<PlaceRanking[]> {
    const params: Record<string, string> = city ? { city } : {};
    return this.http.get<PlaceRanking[]>(`${this.baseUrl}/explore/places`, { params }).pipe(catchError(toFriendlyError));
  }

  /** Salva ou tira da lista "Quero ir"; devolve o item atualizado. */
  toggleSave(experienceId: string): Observable<FeedItem> {
    return this.http.post<ApiFeedItem>(`${this.baseUrl}/experiences/${experienceId}/save`, null).pipe(
      map(toFeedItem),
      catchError(toFriendlyError),
    );
  }

  /** Lista "Quero ir": posts salvos, do mais recente ao mais antigo. */
  saved(): Observable<FeedItem[]> {
    return this.http.get<ApiFeedItem[]>(`${this.baseUrl}/saved`).pipe(
      map((items) => items.map(toFeedItem)),
      catchError(toFriendlyError),
    );
  }

  // ---- Convites ----

  /** Meu código de convite (o backend cria na primeira vez). */
  myInviteCode(): Observable<string> {
    return this.http.post<{ code: string }>(`${this.baseUrl}/invites/me`, null).pipe(
      map((r) => r.code),
      catchError(toFriendlyError),
    );
  }

  /** Quem está convidando (funciona sem login). */
  inviter(code: string): Observable<{ displayName: string; username: string; avatarUrl: string | null }> {
    return this.http
      .get<{ displayName: string; username: string; avatarUrl: string | null }>(`${this.baseUrl}/public/invites/${encodeURIComponent(code)}`)
      .pipe(catchError(toFriendlyError));
  }

  acceptInvite(code: string): Observable<UserSummary> {
    return this.http.post<ApiUserSummary>(`${this.baseUrl}/invites/${encodeURIComponent(code)}/accept`, null).pipe(
      map(toUserSummary),
      catchError(toFriendlyError),
    );
  }

  /** Curte ou descurte; devolve o item atualizado. */
  toggleLike(experienceId: string): Observable<FeedItem> {
    return this.http.post<ApiFeedItem>(`${this.baseUrl}/experiences/${experienceId}/like`, null).pipe(
      map(toFeedItem),
      catchError(toFriendlyError),
    );
  }

  addComment(experienceId: string, text: string): Observable<FeedItem> {
    return this.http.post<ApiFeedItem>(`${this.baseUrl}/experiences/${experienceId}/comments`, { text }).pipe(
      map(toFeedItem),
      catchError(toFriendlyError),
    );
  }

  removeComment(experienceId: string, commentId: string): Observable<FeedItem> {
    return this.http.delete<ApiFeedItem>(`${this.baseUrl}/experiences/${experienceId}/comments/${commentId}`).pipe(
      map(toFeedItem),
      catchError(toFriendlyError),
    );
  }

  // ---- Amigos ----

  searchUsers(term: string): Observable<UserSummary[]> {
    return this.http
      .get<ApiUserSummary[]>(`${this.baseUrl}/friends/search`, { params: { q: term.trim() } })
      .pipe(
        map((users) => users.map(toUserSummary)),
        catchError(toFriendlyError),
      );
  }

  friendsList(): Observable<UserSummary[]> {
    return this.http.get<ApiUserSummary[]>(`${this.baseUrl}/friends`).pipe(
      map((users) => users.map(toUserSummary)),
      catchError(toFriendlyError),
    );
  }

  pendingRequests(): Observable<UserSummary[]> {
    return this.http.get<ApiUserSummary[]>(`${this.baseUrl}/friends/requests`).pipe(
      map((users) => users.map(toUserSummary)),
      catchError(toFriendlyError),
    );
  }

  sendFriendRequest(userId: string): Observable<UserSummary> {
    return this.http.post<ApiUserSummary>(`${this.baseUrl}/friends/${userId}`, null).pipe(
      map(toUserSummary),
      catchError(toFriendlyError),
    );
  }

  acceptFriendRequest(userId: string): Observable<UserSummary> {
    return this.http.post<ApiUserSummary>(`${this.baseUrl}/friends/${userId}/accept`, null).pipe(
      map(toUserSummary),
      catchError(toFriendlyError),
    );
  }

  /** Recusa um pedido recebido, cancela um enviado ou desfaz a amizade. */
  removeFriendship(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/friends/${userId}`).pipe(catchError(toFriendlyError));
  }
}
