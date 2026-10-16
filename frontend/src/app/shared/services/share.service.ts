import { Injectable, inject } from '@angular/core';
import { ToastService } from './toast.service';

export interface SharePayload {
  title: string;
  text: string;
  /** Caminho dentro do app, ex.: /app/experiencias/12 */
  path: string;
}

/**
 * Compartilhar pelo menu nativo do celular (WhatsApp, Instagram, etc.).
 * Onde o navegador não tem esse menu (a maioria dos computadores), copia o link.
 */
@Injectable({ providedIn: 'root' })
export class ShareService {
  private readonly toast = inject(ToastService);

  async share(payload: SharePayload): Promise<void> {
    const url = new URL(payload.path, window.location.origin).toString();
    const data = { title: payload.title, text: payload.text, url };

    if (navigator.share && (!navigator.canShare || navigator.canShare(data))) {
      try {
        await navigator.share(data);
      } catch (err) {
        // Fechar o menu sem escolher nada não é erro
        if ((err as DOMException)?.name !== 'AbortError') this.copy(url);
      }
      return;
    }
    this.copy(url);
  }

  private copy(url: string): void {
    navigator.clipboard
      ?.writeText(url)
      .then(() => this.toast.success('Link copiado.'))
      .catch(() => this.toast.info(url));
  }
}
