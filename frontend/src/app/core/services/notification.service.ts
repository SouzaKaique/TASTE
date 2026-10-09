import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AppNotification } from '../models';
import { toFriendlyError } from './api-error.util';

interface ApiNotification extends Omit<AppNotification, 'id' | 'actor' | 'experienceId'> {
  id: number;
  actor: { id: number; displayName: string; username: string; avatarUrl: string | null };
  experienceId: number | null;
}

function toNotification(api: ApiNotification): AppNotification {
  return {
    ...api,
    id: String(api.id),
    actor: { ...api.actor, id: String(api.actor.id) },
    experienceId: api.experienceId == null ? null : String(api.experienceId),
  };
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/notifications`;

  /** Quantidade de notificações não lidas (badge do sino). */
  readonly unreadCount = signal(0);

  refreshUnreadCount(): void {
    this.http.get<{ count: number }>(`${this.baseUrl}/unread-count`).subscribe({
      next: ({ count }) => this.unreadCount.set(count),
      error: () => undefined, // silencioso: o contador é só um indicador
    });
  }

  list(): Observable<AppNotification[]> {
    return this.http.get<ApiNotification[]>(this.baseUrl).pipe(
      map((items) => items.map(toNotification)),
      catchError(toFriendlyError),
    );
  }

  markAllRead(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/read-all`, null).pipe(
      tap(() => this.unreadCount.set(0)),
      catchError(toFriendlyError),
    );
  }
}
