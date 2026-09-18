import { Injectable, computed, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { AuthCredentials, RegisterPayload, User } from '../models';
import { CURRENT_USER_ID, MOCK_USERS } from '../mock-data/users.mock';
import { mockError, mockResponse } from './mock-http.util';

const SESSION_KEY = 'taste.session.userId';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly currentUser = signal<User | null>(this.restoreSession());
  readonly user = computed(() => this.currentUser());
  readonly isAuthenticated = computed(() => this.currentUser() !== null);

  login(credentials: AuthCredentials): Observable<User> {
    const user = MOCK_USERS.find((u) => u.email.toLowerCase() === credentials.email.toLowerCase());

    if (!user || credentials.password.length < 4) {
      return mockError('E-mail ou senha inválidos.');
    }

    return mockResponse(user).pipe(tap((loggedUser) => this.setSession(loggedUser)));
  }

  register(payload: RegisterPayload): Observable<User> {
    const usernameTaken = MOCK_USERS.some((u) => u.username.toLowerCase() === payload.username.toLowerCase());
    if (usernameTaken) {
      return mockError('Este username já está em uso.');
    }

    const newUser: User = {
      id: `demo-${Date.now()}`,
      displayName: payload.displayName,
      username: payload.username,
      email: payload.email,
      avatarUrl: null,
      bio: '',
      createdAt: new Date().toISOString(),
      profileVisibility: 'public',
      stats: { totalExperiences: 0, totalRestaurants: 0, totalCities: 0, totalFavorites: 0, averageRating: 0 },
    };

    return mockResponse(newUser).pipe(tap((createdUser) => this.setSession(createdUser)));
  }

  logout(): void {
    this.currentUser.set(null);
    localStorage.removeItem(SESSION_KEY);
  }

  updateProfile(partial: Partial<User>): void {
    const current = this.currentUser();
    if (!current) return;
    this.currentUser.set({ ...current, ...partial });
  }

  /** Usado apenas para demonstração: entra direto com a persona principal. */
  loginAsDemoUser(): void {
    const demoUser = MOCK_USERS.find((u) => u.id === CURRENT_USER_ID)!;
    this.setSession(demoUser);
  }

  private setSession(user: User): void {
    this.currentUser.set(user);
    localStorage.setItem(SESSION_KEY, user.id);
  }

  private restoreSession(): User | null {
    if (typeof localStorage === 'undefined') return null;
    const storedId = localStorage.getItem(SESSION_KEY);
    if (!storedId) return null;
    return MOCK_USERS.find((u) => u.id === storedId) ?? null;
  }
}
