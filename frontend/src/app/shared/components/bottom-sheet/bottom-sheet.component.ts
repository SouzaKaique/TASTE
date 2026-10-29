import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  effect,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';

let sheetId = 0;

/**
 * Painel que sobe de baixo (como nos apps): comentários, opções, filtros.
 * - arrastar para baixo, tocar fora ou Esc fecham;
 * - trava a rolagem da página por trás e devolve o foco a quem abriu;
 * - no computador aparece centralizado.
 * O painel é movido para o <body>, para nada da página (cards, animações) cortá-lo.
 */
@Component({
  selector: 'app-bottom-sheet',
  standalone: true,
  template: `
    <div #root class="sheet-root" [class.is-open]="visible()" [class.is-closing]="closing()" (keydown.escape)="close()">
      @if (visible()) {
        <div class="sheet-backdrop" [style.opacity]="backdropOpacity()" (click)="close()" aria-hidden="true"></div>
        <section
          #panel
          class="sheet"
          role="dialog"
          aria-modal="true"
          [attr.aria-labelledby]="titleId"
          tabindex="-1"
          [style.transform]="dragY() ? 'translateY(' + dragY() + 'px)' : null"
          [class.is-dragging]="dragging()"
        >
          <!-- Área de arrastar: puxa o painel para baixo para fechar -->
          <div
            class="sheet__grab"
            (pointerdown)="onDragStart($event)"
            (pointermove)="onDragMove($event)"
            (pointerup)="onDragEnd()"
            (pointercancel)="onDragEnd()"
          >
            <span class="sheet__handle" aria-hidden="true"></span>
            <header class="sheet__head">
              <h2 class="sheet__title" [id]="titleId">{{ title() }}</h2>
              <button type="button" class="sheet__close" aria-label="Fechar" (click)="close()">
                <i class="bi bi-x-lg" aria-hidden="true"></i>
              </button>
            </header>
          </div>
          <div class="sheet__body">
            <ng-content></ng-content>
          </div>
        </section>
      }
    </div>
  `,
  styleUrl: './bottom-sheet.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BottomSheetComponent implements AfterViewInit, OnDestroy {
  readonly open = model(false);
  readonly title = input('');

  protected readonly titleId = `sheet-title-${++sheetId}`;
  protected readonly visible = signal(false);
  protected readonly closing = signal(false);
  protected readonly dragY = signal(0);
  protected readonly dragging = signal(false);
  protected readonly backdropOpacity = signal(1);

  private readonly root = viewChild.required<ElementRef<HTMLElement>>('root');
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  private returnFocus: HTMLElement | null = null;
  private startY = 0;
  private lastY = 0;
  private lastT = 0;
  private velocity = 0;
  private closeTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    effect(() => {
      if (this.open()) this.show();
      else if (this.visible()) this.hide();
    });
  }

  ngAfterViewInit(): void {
    document.body.appendChild(this.root().nativeElement);
  }

  ngOnDestroy(): void {
    clearTimeout(this.closeTimer);
    this.unlockScroll();
    this.root().nativeElement.remove();
  }

  close(): void {
    this.open.set(false);
  }

  private show(): void {
    clearTimeout(this.closeTimer);
    this.returnFocus = document.activeElement as HTMLElement | null;
    this.closing.set(false);
    this.dragY.set(0);
    this.backdropOpacity.set(1);
    this.visible.set(true);
    this.lockScroll();
    // Foco no painel, para o leitor de tela e o teclado começarem por ele
    setTimeout(() => this.panel()?.nativeElement.focus(), 30);
  }

  private hide(): void {
    this.closing.set(true);
    this.closeTimer = setTimeout(() => {
      this.visible.set(false);
      this.closing.set(false);
      this.dragY.set(0);
      this.unlockScroll();
      this.returnFocus?.focus?.();
    }, 220);
  }

  // ---------- Arrastar para fechar ----------

  protected onDragStart(event: PointerEvent): void {
    if ((event.target as HTMLElement).closest('button')) return;
    this.dragging.set(true);
    this.startY = this.lastY = event.clientY;
    this.lastT = performance.now();
    this.velocity = 0;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  protected onDragMove(event: PointerEvent): void {
    if (!this.dragging()) return;
    const now = performance.now();
    this.velocity = (event.clientY - this.lastY) / Math.max(1, now - this.lastT);
    this.lastY = event.clientY;
    this.lastT = now;
    // Para cima o painel quase não se mexe (resistência); para baixo acompanha o dedo
    const dy = event.clientY - this.startY;
    const y = dy > 0 ? dy : dy / 6;
    this.dragY.set(y);
    const height = this.panel()?.nativeElement.offsetHeight ?? 400;
    this.backdropOpacity.set(Math.max(0, 1 - Math.max(0, y) / height));
  }

  protected onDragEnd(): void {
    if (!this.dragging()) return;
    this.dragging.set(false);
    const height = this.panel()?.nativeElement.offsetHeight ?? 400;
    // Fecha se arrastou mais de 1/3 ou se "jogou" rápido para baixo
    if (this.dragY() > height / 3 || (this.velocity > 0.6 && this.dragY() > 40)) {
      this.close();
    } else {
      this.dragY.set(0);
      this.backdropOpacity.set(1);
    }
  }

  // ---------- Rolagem da página por trás ----------

  private lockScroll(): void {
    document.documentElement.classList.add('sheet-open');
  }

  private unlockScroll(): void {
    if (!document.querySelector('.sheet-root.is-open:not(.is-closing)')) {
      document.documentElement.classList.remove('sheet-open');
    }
  }
}
