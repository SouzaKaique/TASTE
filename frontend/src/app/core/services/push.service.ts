import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Situação das notificações neste aparelho:
 * - unsupported: navegador sem suporte;
 * - needs-install: iPhone/iPad fora do app instalado (a Apple só permite no app da tela de início);
 * - denied: a pessoa bloqueou as notificações do site;
 * - off / on: pode ativar / já está ativo.
 */
export type PushState = 'unsupported' | 'needs-install' | 'denied' | 'off' | 'on';

/** Notificações no celular (Web Push), mesmo com o app fechado. */
@Injectable({ providedIn: 'root' })
export class PushService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  readonly state = signal<PushState>('unsupported');
  readonly busy = signal(false);

  private get supported(): boolean {
    return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  }

  private get isAppleMobile(): boolean {
    return /iphone|ipad|ipod/i.test(navigator.userAgent);
  }

  private get isInstalled(): boolean {
    return window.matchMedia?.('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;
  }

  /** Descobre a situação atual e, se já estava ativo, reenvia a inscrição (troca de conta, chave renovada). */
  async refresh(): Promise<void> {
    if (!this.supported) {
      this.state.set(this.isAppleMobile && !this.isInstalled ? 'needs-install' : 'unsupported');
      return;
    }
    if (Notification.permission === 'denied') {
      this.state.set('denied');
      return;
    }
    const registration = await navigator.serviceWorker.getRegistration('/');
    const subscription = await registration?.pushManager.getSubscription();
    if (subscription && Notification.permission === 'granted') {
      this.state.set('on');
      this.http.post(`${this.baseUrl}/push/subscriptions`, subscription.toJSON()).subscribe({ error: () => undefined });
    } else {
      this.state.set('off');
    }
  }

  async enable(): Promise<void> {
    if (!this.supported) return;
    this.busy.set(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        this.state.set(permission === 'denied' ? 'denied' : 'off');
        return;
      }
      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      await navigator.serviceWorker.ready;
      const { publicKey } = await firstValueFrom(this.http.get<{ publicKey: string }>(`${this.baseUrl}/push/public-key`));
      const applicationServerKey = base64UrlToBytes(publicKey);

      let subscription = await registration.pushManager.getSubscription();
      // Inscrição antiga feita com outra chave do servidor: refaz
      if (subscription && !sameKey(subscription.options.applicationServerKey, applicationServerKey)) {
        await subscription.unsubscribe();
        subscription = null;
      }
      subscription ??= await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey });

      await firstValueFrom(this.http.post(`${this.baseUrl}/push/subscriptions`, subscription.toJSON()));
      this.state.set('on');
    } finally {
      this.busy.set(false);
    }
  }

  async disable(): Promise<void> {
    this.busy.set(true);
    try {
      const subscription = await this.currentSubscription();
      if (subscription) {
        await firstValueFrom(this.http.post(`${this.baseUrl}/push/subscriptions/remove`, { endpoint: subscription.endpoint })).catch(() => undefined);
        await subscription.unsubscribe();
      }
      this.state.set('off');
    } finally {
      this.busy.set(false);
    }
  }

  /**
   * Ao sair da conta, este aparelho para de receber os avisos dela.
   * Recebe o token porque a sessão já está sendo apagada quando isso roda.
   */
  forgetOnLogout(token: string | null): void {
    if (!this.supported) return;
    this.currentSubscription()
      .then((subscription) => {
        if (!subscription) return;
        if (token) {
          fetch(`${this.baseUrl}/push/subscriptions/remove`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ endpoint: subscription.endpoint }),
            keepalive: true,
          }).catch(() => undefined);
        }
        return subscription.unsubscribe();
      })
      .catch(() => undefined)
      .finally(() => this.state.set(this.supported ? 'off' : 'unsupported'));
  }

  private async currentSubscription(): Promise<PushSubscription | null> {
    if (!this.supported) return null;
    const registration = await navigator.serviceWorker.getRegistration('/');
    return (await registration?.pushManager.getSubscription()) ?? null;
  }
}

function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const base64 = (value + '='.repeat((4 - (value.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function sameKey(current: ArrayBuffer | null, expected: Uint8Array): boolean {
  if (!current) return false;
  const a = new Uint8Array(current);
  return a.length === expected.length && a.every((v, i) => v === expected[i]);
}
