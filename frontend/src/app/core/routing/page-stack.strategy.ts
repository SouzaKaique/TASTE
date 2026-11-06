import { ComponentRef, Injectable, Injector, inject } from '@angular/core';
import { ActivatedRouteSnapshot, DetachedRouteHandle, RouteReuseStrategy, Router } from '@angular/router';
import { getStoredToken } from '../services/auth.service';

/** Tela guardada viva que quer se atualizar ao reaparecer (sem tela de carregamento). */
export interface RestorablePage {
  pageRestored(): void;
}

interface StoredPage {
  handle: DetachedRouteHandle;
  scrollY: number;
  isTab: boolean;
}

/** Quantas telas internas (prato, restaurante, perfil de alguém...) ficam guardadas para o "voltar". */
const MAX_STACK_PAGES = 8;

/**
 * Faz o app se comportar como um app nativo: sair de uma tela não a destrói.
 * - `data: { keep: 'tab' }`: abas do menu, sempre reabrem como estavam;
 * - `data: { keep: 'stack' }`: telas internas, reabrem só ao voltar;
 * - sem `keep` (formulários, ajustes): nascem do zero toda vez.
 * Voltar não refaz a tela, então o gesto do iPhone termina sem "recarregar" e na mesma rolagem.
 */
@Injectable({ providedIn: 'root' })
export class PageStackStrategy implements RouteReuseStrategy {
  // O Router depende desta classe: é buscado só na hora de usar
  private readonly injector = inject(Injector);
  private readonly pages = new Map<string, StoredPage>();
  private leavingScrollY = 0;
  private restoredScrollY: number | null = null;

  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    // Depois de sair da conta nada é guardado: a próxima pessoa nunca vê a tela da anterior
    const keep = !!route.data['keep'] && getStoredToken() !== null;
    // Lido aqui porque, ao tirar a tela da página, o navegador já encurta a rolagem
    if (keep) this.leavingScrollY = window.scrollY;
    return keep;
  }

  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle | null): void {
    const key = pageKey(route);
    if (!handle) {
      this.pages.delete(key);
      return;
    }
    this.destroy(key);
    this.pages.set(key, { handle, scrollY: this.leavingScrollY, isTab: route.data['keep'] === 'tab' });
    this.trimStack();
  }

  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    if (!this.pages.has(pageKey(route))) return false;
    return route.data['keep'] === 'tab' || this.injector.get(Router).getCurrentNavigation()?.trigger === 'popstate';
  }

  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    const page = this.pages.get(pageKey(route));
    if (!page) return null;
    this.restoredScrollY = page.scrollY;
    return page.handle;
  }

  shouldReuseRoute(future: ActivatedRouteSnapshot, current: ActivatedRouteSnapshot): boolean {
    return future.routeConfig === current.routeConfig;
  }

  /** Rolagem da tela que acabou de reaparecer (null: tela nova, começa do topo). */
  takeRestoredScroll(): number | null {
    const scrollY = this.restoredScrollY;
    this.restoredScrollY = null;
    return scrollY;
  }

  /** Algo mudou no servidor: telas internas guardadas podem estar velhas. As abas se atualizam sozinhas. */
  dropStackPages(): void {
    this.pages.forEach((page, key) => {
      if (!page.isTab) this.destroy(key);
    });
  }

  clear(): void {
    [...this.pages.keys()].forEach((key) => this.destroy(key));
  }

  private trimStack(): void {
    const stack = [...this.pages].filter(([, page]) => !page.isTab);
    stack.slice(0, Math.max(0, stack.length - MAX_STACK_PAGES)).forEach(([key]) => this.destroy(key));
  }

  private destroy(key: string): void {
    const page = this.pages.get(key);
    if (!page) return;
    (page.handle as { componentRef: ComponentRef<unknown> }).componentRef.destroy();
    this.pages.delete(key);
  }
}

function pageKey(route: ActivatedRouteSnapshot): string {
  return route.pathFromRoot.flatMap((r) => r.url.map((segment) => segment.path)).join('/');
}
