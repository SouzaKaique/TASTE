import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models';
import { toFriendlyError } from './api-error.util';
import { ApiUser, AuthService } from './auth.service';

export type SocialProvider = 'google' | 'apple';
type Providers = Record<SocialProvider, boolean>;

const PROVIDERS_KEY = 'taste.social.providers';
const FLOW_KEY = 'taste.social.flow';

interface SocialFlow {
  verifier: string;
  state: string;
  back: string | null;
}

interface ApiResult {
  status: 'pending' | 'done' | 'link-required';
  token: string | null;
  user: ApiUser | null;
  newAccount: boolean | null;
  email: string | null;
}

export type SocialResult =
  | { status: 'pending' }
  | { status: 'link-required'; email: string }
  | { status: 'done'; user: User; newAccount: boolean };

/** App instalado na tela inicial: o login abre numa janela separada e o app espera o resultado. */
function isInstalledApp(): boolean {
  return (navigator as { standalone?: boolean }).standalone === true || window.matchMedia('(display-mode: standalone)').matches;
}

function base64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Login com Google e Apple. O caminho completo está explicado em SocialAuthService, no backend. */
@Injectable({ providedIn: 'root' })
export class SocialAuthService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly baseUrl = `${environment.apiUrl}/auth/social`;

  /** Últimos provedores conhecidos: os botões já aparecem antes de o servidor responder. */
  readonly providers = signal<Providers>(this.storedProviders());

  loadProviders(): void {
    this.http.get<Providers>(`${this.baseUrl}/providers`).subscribe({
      next: (providers) => {
        this.providers.set(providers);
        try {
          localStorage.setItem(PROVIDERS_KEY, JSON.stringify(providers));
        } catch {
          // sem armazenamento: busca de novo na próxima vez
        }
      },
      error: () => undefined,
    });
  }

  /**
   * O hash do segredo fica pronto antes do toque: o iPhone só permite abrir outra janela
   * diretamente no toque, e calcular o hash ali dentro quebraria essa ligação.
   */
  async prepare(): Promise<SocialFlow> {
    const verifier = base64Url(crypto.getRandomValues(new Uint8Array(32)));
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
    return { verifier, state: base64Url(new Uint8Array(digest)), back: null };
  }

  start(provider: SocialProvider, flow: SocialFlow, back: string | null): void {
    sessionStorage.setItem(FLOW_KEY, JSON.stringify({ ...flow, back }));
    const params = new URLSearchParams({ state: flow.state, origin: window.location.origin });
    const url = `${this.baseUrl}/${provider}/start?${params}`;

    if (!isInstalledApp()) {
      window.location.assign(url);
      return;
    }
    params.set('janela', 'true');
    const opened = window.open(`${this.baseUrl}/${provider}/start?${params}`, '_blank');
    if (opened) {
      this.router.navigate(['/entrar/social'], { queryParams: { state: flow.state } });
    } else {
      window.location.assign(url);
    }
  }

  /** O login em andamento, se esta tela foi quem o iniciou. */
  currentFlow(state: string | null): SocialFlow | null {
    try {
      const flow = JSON.parse(sessionStorage.getItem(FLOW_KEY) ?? 'null') as SocialFlow | null;
      return flow && flow.state === state ? flow : null;
    } catch {
      return null;
    }
  }

  result(flow: SocialFlow): Observable<SocialResult> {
    return this.http.post<ApiResult>(`${this.baseUrl}/result`, { verifier: flow.verifier }).pipe(
      map((res) => this.toResult(res)),
      catchError(toFriendlyError),
    );
  }

  /** Confirma a senha da conta que já usava este e-mail. */
  link(flow: SocialFlow, password: string): Observable<SocialResult> {
    return this.http.post<ApiResult>(`${this.baseUrl}/link`, { verifier: flow.verifier, password }).pipe(
      map((res) => this.toResult(res)),
      catchError(toFriendlyError),
    );
  }

  clearFlow(): void {
    sessionStorage.removeItem(FLOW_KEY);
  }

  private toResult(res: ApiResult): SocialResult {
    if (res.status === 'pending') return { status: 'pending' };
    if (res.status === 'link-required') return { status: 'link-required', email: res.email ?? '' };
    this.clearFlow();
    const user = this.auth.setSession({ token: res.token ?? '', user: res.user as ApiUser });
    return { status: 'done', user, newAccount: res.newAccount === true };
  }

  private storedProviders(): Providers {
    try {
      return JSON.parse(localStorage.getItem(PROVIDERS_KEY) ?? 'null') ?? { google: false, apple: false };
    } catch {
      return { google: false, apple: false };
    }
  }
}
