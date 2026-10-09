import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthCredentials, ProfileVisibility, RegisterPayload, User } from '../models';
import { ToastService } from '../../shared/services/toast.service';
import { toFriendlyError } from './api-error.util';

const TOKEN_KEY = 'taste.session.token';
const USER_KEY = 'taste.session.user';

/** Usuário como o backend devolve (id numérico, campos opcionais nulos). */
export interface ApiUser extends Omit<User, 'id' | 'bio'> {
  id: number;
  bio: string | null;
}

interface AuthResponse {
  token: string;
  user: ApiUser;
}

export interface ProfileChanges {
  displayName?: string;
  bio?: string;
  avatarUrl?: string | null;
  profileVisibility?: ProfileVisibility;
}

export function toUser(api: ApiUser): User {
  return { ...api, id: String(api.id), bio: api.bio ?? '', email: api.email ?? '' };
}

/** Lido pelo interceptor para anexar o cabeçalho Authorization. */
export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly baseUrl = environment.apiUrl;

  private readonly currentUser = signal<User | null>(this.restoreSession());
  readonly user = computed(() => this.currentUser());
  readonly isAuthenticated = computed(() => this.currentUser() !== null);

  constructor() {
    // Sessão salva: atualiza os dados do usuário em segundo plano.
    // Se o token tiver expirado, o interceptor faz o logout.
    if (this.currentUser()) {
      this.refreshProfile().subscribe({ error: () => undefined });
    }
  }

  login(credentials: AuthCredentials): Observable<User> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/login`, credentials).pipe(
      map((res) => this.setSession(res)),
      catchError(toFriendlyError),
    );
  }

  register(payload: RegisterPayload): Observable<User> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/register`, payload).pipe(
      map((res) => this.setSession(res)),
      catchError(toFriendlyError),
    );
  }

  logout(): void {
    this.currentUser.set(null);
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {
      // armazenamento indisponível: nada a limpar
    }
  }

  /** Chamado pelo interceptor quando o backend responde 401 (token inválido/expirado). */
  handleExpiredSession(): void {
    if (!this.currentUser()) return;
    this.logout();
    this.toast.info('Sua sessão expirou. Entre novamente para continuar.');
    this.router.navigate(['/entrar']);
  }

  refreshProfile(): Observable<User> {
    return this.http.get<ApiUser>(`${this.baseUrl}/users/me`).pipe(
      map((api) => this.storeUser(toUser(api))),
      catchError(toFriendlyError),
    );
  }

  /** Perfil de outra pessoa (sem e-mail), com a situação da amizade. */
  getPublicProfile(username: string): Observable<User> {
    return this.http.get<ApiUser>(`${this.baseUrl}/users/${encodeURIComponent(username)}`).pipe(
      map(toUser),
      catchError(toFriendlyError),
    );
  }

  updateProfile(changes: ProfileChanges): Observable<User> {
    return this.http.patch<ApiUser>(`${this.baseUrl}/users/me`, changes).pipe(
      map((api) => this.storeUser(toUser(api))),
      catchError(toFriendlyError),
    );
  }

  private setSession(res: AuthResponse): User {
    try {
      localStorage.setItem(TOKEN_KEY, res.token);
    } catch {
      // sem armazenamento: a sessão dura até fechar a aba
    }
    return this.storeUser(toUser(res.user));
  }

  private storeUser(user: User): User {
    this.currentUser.set(user);
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch {
      // ignorado: o usuário continua em memória
    }
    return user;
  }

  private restoreSession(): User | null {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const stored = localStorage.getItem(USER_KEY);
      if (!token || !stored) return null;
      return JSON.parse(stored) as User;
    } catch {
      return null;
    }
  }
}
