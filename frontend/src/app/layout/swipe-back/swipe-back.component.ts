import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { Location } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/** Começa a contar como "da borda" até esta distância (px) da esquerda. */
const EDGE = 24;
/** Quanto arrastar para voltar. */
const THRESHOLD = 90;

/**
 * Arrastar da borda esquerda volta para a tela anterior, com uma seta que acompanha o dedo.
 * Só no app instalado do iPhone: lá não há botão nem gesto de voltar do sistema.
 * (No Safari e no Android o sistema já tem esse gesto; ligar aqui voltaria duas vezes.)
 */
@Component({
  selector: 'app-swipe-back',
  standalone: true,
  template: `
    @if (progress() > 0) {
      <div
        class="swipe-back"
        [class.is-ready]="progress() >= 1"
        [style.transform]="'translate(' + (progress() * 56 - 44) + 'px, -50%)'"
        [style.opacity]="0.35 + progress() * 0.65"
        aria-hidden="true"
      >
        <i class="bi bi-chevron-left"></i>
      </div>
    }
  `,
  styles: [
    `
      .swipe-back {
        position: fixed;
        top: 50%;
        left: 0;
        z-index: 1200;
        display: grid;
        place-items: center;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: rgba(20, 10, 14, 0.75);
        color: #fff;
        font-size: 1.2rem;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);
        pointer-events: none;
        transition: background-color 150ms ease;
      }
      .swipe-back.is-ready { background: var(--taste-gold-500); color: var(--taste-wine-900); }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SwipeBackComponent {
  private readonly location = inject(Location);
  protected readonly progress = signal(0);

  private readonly enabled = (navigator as { standalone?: boolean }).standalone === true;
  private navigations = 0;
  private startX = 0;
  private startY = 0;
  private tracking = false;

  constructor() {
    // Só volta se houver tela anterior dentro do app
    inject(Router)
      .events.pipe(filter((e) => e instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe(() => this.navigations++);

    if (!this.enabled) return;
    const start = (e: TouchEvent) => this.onStart(e);
    const move = (e: TouchEvent) => this.onMove(e);
    const end = () => this.onEnd();
    window.addEventListener('touchstart', start, { passive: true });
    window.addEventListener('touchmove', move, { passive: true });
    window.addEventListener('touchend', end, { passive: true });
    window.addEventListener('touchcancel', end, { passive: true });
    inject(DestroyRef).onDestroy(() => {
      window.removeEventListener('touchstart', start);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', end);
      window.removeEventListener('touchcancel', end);
    });
  }

  private onStart(event: TouchEvent): void {
    const touch = event.touches[0];
    // Painel aberto ou sem tela anterior: o gesto não vale
    this.tracking =
      event.touches.length === 1 &&
      touch.clientX <= EDGE &&
      this.navigations > 1 &&
      !document.documentElement.classList.contains('sheet-open');
    this.startX = touch.clientX;
    this.startY = touch.clientY;
  }

  private onMove(event: TouchEvent): void {
    if (!this.tracking) return;
    const touch = event.touches[0];
    const dx = touch.clientX - this.startX;
    const dy = Math.abs(touch.clientY - this.startY);
    // Movimento mais vertical que horizontal é rolagem, não "voltar"
    if (dy > Math.max(30, dx)) {
      this.tracking = false;
      this.progress.set(0);
      return;
    }
    this.progress.set(Math.max(0, Math.min(1, dx / THRESHOLD)));
  }

  private onEnd(): void {
    if (this.tracking && this.progress() >= 1) {
      this.navigations = Math.max(0, this.navigations - 2);
      this.location.back();
    }
    this.tracking = false;
    this.progress.set(0);
  }
}
